/**
 * Foursquare'den ana sayfadaki 10 şehir × 5 mekan kategorisi POI ingest.
 *
 * Kullanım (apps/api dizininde):
 *   pnpm seed:places
 *
 * Gerekli: DATABASE_URL, FOURSQUARE_API_KEY
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { cities } from '@pocketguide/database';
import { eq } from 'drizzle-orm';
import { HOMEPAGE_CITIES } from './places/constants/homepage-cities';
import { EXPLORE_CATEGORIES } from './places/constants/explore-categories';
import { mapFoursquareToPOI } from './places/normalization/mappers';
import { filterDuplicates } from './places/normalization/deduplicator';
import type { NormalizedPOI } from '@pocketguide/types';
import { ensurePoisTable, type PoiCoordMode } from './places/utils/poi-coords';
import { searchFoursquarePlaces, verifyFoursquareApiKey } from './places/utils/foursquare-client';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function loadExistingForCity(
  pool: Pool,
  cityId: string,
  mode: PoiCoordMode,
): Promise<NormalizedPOI[]> {
  const coordFilter =
    mode === 'postgis'
      ? 'location IS NOT NULL'
      : 'latitude IS NOT NULL AND longitude IS NOT NULL';
  const coordSelect =
    mode === 'postgis'
      ? 'ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng'
      : 'latitude AS lat, longitude AS lng';

  const result = await pool.query(
    `
    SELECT source_id, name, category, ${coordSelect}
    FROM pois
    WHERE "cityId" = $1::uuid AND source_id IS NOT NULL AND ${coordFilter}
    `,
    [cityId],
  );

  return result.rows.map(
    (r: { source_id: string; name: string; category: string; lat: number; lng: number }) => ({
      sourceId: r.source_id,
      provider: 'foursquare' as const,
      name: r.name,
      category: r.category,
      address: null,
      lat: Number(r.lat) || 0,
      lng: Number(r.lng) || 0,
    }),
  );
}

async function bulkInsert(
  pool: Pool,
  uniquePois: NormalizedPOI[],
  cityId: string,
  mode: PoiCoordMode,
): Promise<number> {
  if (uniquePois.length === 0) return 0;

  let inserted = 0;
  for (const p of uniquePois) {
    const dup = await pool.query(
      `SELECT 1 FROM pois WHERE source_id = $1 LIMIT 1`,
      [p.sourceId],
    );
    if (dup.rowCount && dup.rowCount > 0) continue;

    if (mode === 'postgis') {
      await pool.query(
        `
        INSERT INTO pois (
          source_id, provider, name, "cityId", category,
          address, description, rating, "priceLevel", location
        ) VALUES (
          $1, $2, $3, $4::uuid, $5,
          $6, $7, $8, $9,
          ST_SetSRID(ST_MakePoint($10, $11), 4326)::geography
        )
        `,
        [
          p.sourceId,
          p.provider,
          p.name,
          cityId,
          String(p.category),
          p.address,
          p.subtype ?? null,
          p.rating ?? null,
          p.priceLevel ?? null,
          p.lng,
          p.lat,
        ],
      );
    } else {
      await pool.query(
        `
        INSERT INTO pois (
          source_id, provider, name, "cityId", category,
          address, description, rating, "priceLevel", latitude, longitude
        ) VALUES ($1, $2, $3, $4::uuid, $5, $6, $7, $8, $9, $10, $11)
        `,
        [
          p.sourceId,
          p.provider,
          p.name,
          cityId,
          String(p.category),
          p.address,
          p.subtype ?? null,
          p.rating ?? null,
          p.priceLevel ?? null,
          p.lat,
          p.lng,
        ],
      );
    }
    inserted += 1;
  }

  return inserted;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db: any = drizzle(pool);

  const coordMode = await ensurePoisTable(pool);

  console.log('Foursquare API anahtarı test ediliyor...');
  await verifyFoursquareApiKey();
  console.log('✅ Foursquare bağlantısı OK\n');

  console.log(`Mekan ingest başlıyor (10 şehir × 5 kategori, ${coordMode})...\n`);
  let totalInserted = 0;

  for (const city of HOMEPAGE_CITIES) {
    console.log(`\n🏙️  ${city.nameTr} (${city.slug})`);

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
      console.log('  ✅ Şehir oluşturuldu');
    }

    const cityId = row.id;
    let existing = await loadExistingForCity(pool, cityId, coordMode);

    for (const cat of EXPLORE_CATEGORIES) {
      process.stdout.write(`  📍 ${cat.titleTr}... `);
      try {
        const raw = await searchFoursquarePlaces({
          lat: city.lat,
          lng: city.lng,
          radius: 8000,
          limit: 50,
          categoryIds: cat.foursquareCategoryIds,
        });
        const mapped = raw.map((r) => mapFoursquareToPOI(r, cat.dbCategory));
        const unique = filterDuplicates(mapped, existing);
        const inserted = await bulkInsert(pool, unique, cityId, coordMode);
        totalInserted += inserted;
        existing = [...existing, ...unique];
        console.log(`${raw.length} bulundu, ${inserted} yeni kayıt`);
      } catch (err) {
        console.log('HATA');
        console.error(err);
      }
      await wait(1200);
    }

    await db
      .update(cities)
      .set({ lastSyncedAt: new Date() } as any)
      .where(eq(cities.id as any, cityId));
  }

  await pool.end();
  if (totalInserted === 0) {
    console.error('\n⚠️ Hiç mekan kaydedilmedi. Foursquare anahtarını ve API erişimini kontrol et.');
    process.exit(1);
  }
  console.log(`\n🎉 Mekan ingest tamamlandı! Toplam ${totalInserted} yeni kayıt.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
