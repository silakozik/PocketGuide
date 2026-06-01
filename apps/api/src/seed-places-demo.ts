/**
 * Harici API olmadan demo mekanlar (İstanbul + tüm kategoriler).
 * Kullanım: pnpm seed:places:demo
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { cities } from '@pocketguide/database';
import { eq } from 'drizzle-orm';
import { ensurePoisTable, type PoiCoordMode } from './places/utils/poi-coords';
import type { ExplorePlaceCategory } from './places/constants/explore-categories';

const DEMO: Array<{
  category: ExplorePlaceCategory;
  name: string;
  lat: number;
  lng: number;
  address: string;
  subtype: string;
  rating: number;
}> = [
  { category: 'food', name: 'Mikla', lat: 41.0312, lng: 28.9754, address: 'Beyoğlu', subtype: 'Restaurant', rating: 4.6 },
  { category: 'food', name: 'Çiya Sofrası', lat: 40.997, lng: 29.027, address: 'Kadıköy', subtype: 'Turkish', rating: 4.5 },
  { category: 'food', name: 'Karaköy Güllüoğlu', lat: 41.022, lng: 28.977, address: 'Karaköy', subtype: 'Dessert', rating: 4.4 },
  { category: 'shopping', name: 'İstinye Park', lat: 41.1105, lng: 29.034, address: 'Sarıyer', subtype: 'Shopping mall', rating: 4.5 },
  { category: 'shopping', name: 'Kanyon', lat: 41.078, lng: 29.011, address: 'Levent', subtype: 'Shopping mall', rating: 4.4 },
  { category: 'entertainment', name: 'Babylon', lat: 41.034, lng: 28.985, address: 'Asmalımescit', subtype: 'Live music', rating: 4.5 },
  { category: 'entertainment', name: 'Zorlu PSM', lat: 41.065, lng: 29.014, address: 'Zorlu Center', subtype: 'Concert hall', rating: 4.6 },
  { category: 'culture', name: 'İstanbul Arkeoloji Müzeleri', lat: 41.011, lng: 28.982, address: 'Sultanahmet', subtype: 'Museum', rating: 4.7 },
  { category: 'culture', name: 'İstanbul Modern', lat: 41.026, lng: 28.984, address: 'Karaköy', subtype: 'Art museum', rating: 4.5 },
  { category: 'historic', name: 'Ayasofya', lat: 41.0086, lng: 28.98, address: 'Sultanahmet', subtype: 'Historic site', rating: 4.8 },
  { category: 'historic', name: 'Topkapı Sarayı', lat: 41.0115, lng: 28.983, address: 'Sultanahmet', subtype: 'Palace', rating: 4.7 },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db: any = drizzle(pool);
  const mode = await ensurePoisTable(pool);

  let [city] = await db.select().from(cities).where(eq(cities.slug as any, 'istanbul')).limit(1);
  if (!city) {
    [city] = await db
      .insert(cities)
      .values({
        slug: 'istanbul',
        nameEn: 'Istanbul',
        nameTr: 'İstanbul',
        countryCode: 'TR',
        isActive: true,
      } as any)
      .returning();
  }

  let inserted = 0;
  for (const p of DEMO) {
    const sourceId = `demo-${p.category}-${p.name.replace(/\s+/g, '-').toLowerCase()}`;
    const dup = await pool.query(`SELECT 1 FROM pois WHERE source_id = $1`, [sourceId]);
    if (dup.rowCount) {
      await pool.query(
        `UPDATE pois SET name = $2, category = $3, address = $4, description = $5, rating = $6
         WHERE source_id = $1`,
        [sourceId, p.name, p.category, p.address, p.subtype, p.rating],
      );
      continue;
    }

    if (mode === 'postgis') {
      await pool.query(
        `INSERT INTO pois (source_id, provider, name, "cityId", category, address, description, rating, location)
         VALUES ($1,'demo',$2,$3::uuid,$4,$5,$6,$7, ST_SetSRID(ST_MakePoint($8,$9),4326)::geography)`,
        [sourceId, p.name, city.id, p.category, p.address, p.subtype, p.rating, p.lng, p.lat],
      );
    } else {
      await pool.query(
        `INSERT INTO pois (source_id, provider, name, "cityId", category, address, description, rating, latitude, longitude)
         VALUES ($1,'demo',$2,$3::uuid,$4,$5,$6,$7,$8,$9)`,
        [sourceId, p.name, city.id, p.category, p.address, p.subtype, p.rating, p.lat, p.lng],
      );
    }
    inserted += 1;
  }

  await pool.end();
  console.log(`✅ ${inserted} demo mekan eklendi (İstanbul).`);
  console.log('Sayfa: http://localhost:5173/explore/shopping?city=istanbul');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
