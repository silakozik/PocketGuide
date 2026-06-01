/**
 * Foursquare çalışmıyorsa: OpenStreetMap (Overpass) ile mekan ingest.
 * Kullanım: pnpm seed:places:osm
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { cities } from '@pocketguide/database';
import { eq } from 'drizzle-orm';
import { HOMEPAGE_CITIES } from './places/constants/homepage-cities';
import type { ExplorePlaceCategory } from './places/constants/explore-categories';
import { ensurePoisTable, type PoiCoordMode } from './places/utils/poi-coords';
import type { NormalizedPOI } from '@pocketguide/types';
import { filterDuplicates } from './places/normalization/deduplicator';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const CATEGORY_FILTERS: Record<ExplorePlaceCategory, string[]> = {
  food: ['node["amenity"="restaurant"]', 'node["amenity"="cafe"]', 'node["amenity"="fast_food"]'],
  shopping: ['node["shop"="mall"]', 'way["shop"="mall"]', 'node["shop"="department_store"]'],
  entertainment: ['node["amenity"="cinema"]', 'node["amenity"="nightclub"]', 'node["amenity"="theatre"]'],
  culture: ['node["tourism"="museum"]', 'node["amenity"="arts_centre"]', 'node["tourism"="gallery"]'],
  historic: ['node["historic"]', 'node["tourism"="attraction"]', 'way["historic"]'],
};

const EXPLORE_CATS: ExplorePlaceCategory[] = [
  'food',
  'shopping',
  'entertainment',
  'culture',
  'historic',
];

const CITY_BBOX: Record<string, [number, number, number, number]> = {
  paris: [48.80, 2.25, 48.90, 2.42],
  tokyo: [35.60, 139.60, 35.75, 139.85],
  'new-york': [40.68, -74.05, 40.82, -73.9],
  londra: [51.28, -0.51, 51.69, 0.33],
  roma: [41.85, 12.45, 42.0, 12.55],
  barcelona: [41.35, 2.05, 41.45, 2.25],
  dubai: [25.0, 55.0, 25.3, 55.5],
  amsterdam: [52.33, 4.75, 52.4, 5.0],
  sydney: [-33.95, 151.05, -33.75, 151.3],
  istanbul: [40.85, 28.5, 41.35, 29.5],
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchOverpass(
  bbox: [number, number, number, number],
  filters: string[],
): Promise<NormalizedPOI[]> {
  const [south, west, north, east] = bbox;
  const body = filters.map((f) => `${f}(${south},${west},${north},${east});`).join('\n');
  const query = `[out:json][timeout:90];(\n${body}\n);out center 80;`;

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) return [];

  const json = (await res.json()) as { elements?: Array<Record<string, unknown>> };
  const pois: NormalizedPOI[] = [];

  for (const el of json.elements ?? []) {
    const tags = (el.tags as Record<string, string>) ?? {};
    const name = tags.name;
    if (!name) continue;

    const lat = Number(el.lat ?? (el.center as { lat?: number })?.lat);
    const lng = Number(el.lon ?? (el.center as { lon?: number })?.lon);
    if (!lat || !lng) continue;

    pois.push({
      sourceId: `osm-${el.type}-${el.id}`,
      provider: 'osm',
      name,
      category: 'other',
      address: [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ') || null,
      lat,
      lng,
      subtype: tags.amenity ?? tags.shop ?? tags.tourism ?? tags.historic ?? null,
    });
  }

  return pois;
}

async function loadExisting(pool: Pool, cityId: string, mode: PoiCoordMode) {
  const coordSelect =
    mode === 'postgis'
      ? 'ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng'
      : 'latitude AS lat, longitude AS lng';
  const r = await pool.query(
    `SELECT source_id, name, category, ${coordSelect} FROM pois WHERE "cityId" = $1::uuid AND source_id IS NOT NULL`,
    [cityId],
  );
  return r.rows.map((row: { source_id: string; name: string; category: string; lat: number; lng: number }) => ({
    sourceId: row.source_id,
    provider: 'osm' as const,
    name: row.name,
    category: row.category,
    address: null,
    lat: Number(row.lat),
    lng: Number(row.lng),
  }));
}

async function bulkInsert(
  pool: Pool,
  items: NormalizedPOI[],
  cityId: string,
  category: ExplorePlaceCategory,
  mode: PoiCoordMode,
): Promise<number> {
  let n = 0;
  for (const p of items) {
    const dup = await pool.query(`SELECT 1 FROM pois WHERE source_id = $1 LIMIT 1`, [p.sourceId]);
    if (dup.rowCount) continue;

    if (mode === 'postgis') {
      await pool.query(
        `INSERT INTO pois (source_id, provider, name, "cityId", category, address, description, location)
         VALUES ($1,'osm',$2,$3::uuid,$4,$5,$6, ST_SetSRID(ST_MakePoint($7,$8),4326)::geography)`,
        [p.sourceId, p.name, cityId, category, p.address, p.subtype, p.lng, p.lat],
      );
    } else {
      await pool.query(
        `INSERT INTO pois (source_id, provider, name, "cityId", category, address, description, latitude, longitude)
         VALUES ($1,'osm',$2,$3::uuid,$4,$5,$6,$7,$8)`,
        [p.sourceId, p.name, cityId, category, p.address, p.subtype, p.lat, p.lng],
      );
    }
    n += 1;
  }
  return n;
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db: any = drizzle(pool);
  const mode = await ensurePoisTable(pool);

  console.log('OSM (Overpass) ile mekan ingest — Foursquare gerekmez.\n');
  let total = 0;

  for (const city of HOMEPAGE_CITIES) {
    const bbox = CITY_BBOX[city.slug];
    if (!bbox) continue;

    console.log(`🏙️  ${city.nameTr}`);
    let [row] = await db.select().from(cities).where(eq(cities.slug as any, city.slug)).limit(1);
    if (!row) {
      [row] = await db
        .insert(cities)
        .values({
          slug: city.slug,
          nameEn: city.nameEn,
          nameTr: city.nameTr,
          countryCode: city.countryCode,
          isActive: true,
        } as any)
        .returning();
    }

    let existing = await loadExisting(pool, row.id, mode);

    for (const cat of EXPLORE_CATS) {
      process.stdout.write(`  📍 ${cat}... `);
      try {
        const raw = await fetchOverpass(bbox, CATEGORY_FILTERS[cat]);
        const mapped = raw.map((p) => ({ ...p, category: cat }));
        const unique = filterDuplicates(mapped, existing);
        const inserted = await bulkInsert(pool, unique, row.id, cat, mode);
        total += inserted;
        existing = [...existing, ...unique];
        console.log(`${raw.length} bulundu, ${inserted} yeni`);
      } catch (e) {
        console.log('HATA', e);
      }
      await wait(2000);
    }
  }

  await pool.end();
  console.log(`\n🎉 OSM ingest bitti. Toplam ${total} kayıt.`);
  if (total === 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
