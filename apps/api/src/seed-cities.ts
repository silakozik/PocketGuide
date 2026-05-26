import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { cities, adaptationPoints } from '@pocketguide/database';
import { eq } from 'drizzle-orm';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const FALLBACK_URL = 'https://overpass.kumi.systems/api/interpreter';

const CITIES = [
  { slug: 'istanbul',  nameEn: 'Istanbul',  nameTr: 'İstanbul',  countryCode: 'TR' },
  { slug: 'paris',     nameEn: 'Paris',     nameTr: 'Paris',     countryCode: 'FR' },
  { slug: 'londra',    nameEn: 'London',    nameTr: 'Londra',    countryCode: 'GB' },
  { slug: 'roma',      nameEn: 'Rome',      nameTr: 'Roma',      countryCode: 'IT' },
  { slug: 'barcelona', nameEn: 'Barcelona', nameTr: 'Barcelona', countryCode: 'ES' },
  { slug: 'amsterdam', nameEn: 'Amsterdam', nameTr: 'Amsterdam', countryCode: 'NL' },
  { slug: 'tokyo',     nameEn: 'Tokyo',     nameTr: 'Tokyo',     countryCode: 'JP' },
  { slug: 'new-york',  nameEn: 'New York',  nameTr: 'New York',  countryCode: 'US' },
  { slug: 'dubai',     nameEn: 'Dubai',     nameTr: 'Dubai',     countryCode: 'AE' },
  { slug: 'sydney',    nameEn: 'Sydney',    nameTr: 'Sydney',    countryCode: 'AU' },
];

const CATEGORY_QUERIES: Record<string, string[]> = {
  sim: ['node["shop"="mobile_phone"]', 'node["shop"="telecommunication"]'],
  transport: ['node["vending"="public_transport_tickets"]'],
  exchange: ['node["amenity"="bureau_de_change"]'],
};

async function fetchFromOverpass(cityName: string, category: string): Promise<any[]> {
  const filters = CATEGORY_QUERIES[category];
  if (!filters) return [];

  const filterString = filters.map(f => `${f}(area.searchArea);`).join('\n');
  const query = `
    [out:json][timeout:60];
    area[name="${cityName}"]->.searchArea;
    (
      ${filterString}
    );
    out body;
  `;

  for (const url of [OVERPASS_URL, FALLBACK_URL]) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) continue;
      const json = await res.json();
      return (json.elements || []).filter((el: any) => el.tags?.name).map((el: any) => ({
        name: el.tags.name,
        address: [el.tags['addr:street'], el.tags['addr:housenumber']].filter(Boolean).join(' ') || null,
        latitude: el.lat,
        longitude: el.lon,
        opening_hours: el.tags.opening_hours || null,
      }));
    } catch {
      continue;
    }
  }
  return [];
}

function mapCategory(cat: string): string {
  const map: Record<string, string> = { sim: 'sim', transport: 'transport_card', exchange: 'exchange' };
  return map[cat] || cat;
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db: any = drizzle(pool);

  for (const city of CITIES) {
    console.log(`\n🏙️  ${city.nameTr} (${city.slug}) işleniyor...`);

    let [existing] = await db.select().from(cities).where(eq(cities.slug as any, city.slug)).limit(1);
    if (!existing) {
      [existing] = await db.insert(cities).values({
        slug: city.slug,
        nameEn: city.nameEn,
        nameTr: city.nameTr,
        countryCode: city.countryCode,
        isActive: true,
      } as any).returning();
      console.log(`  ✅ Şehir oluşturuldu: ${city.nameTr}`);
    } else {
      await db.update(cities).set({
        nameEn: city.nameEn,
        nameTr: city.nameTr,
        countryCode: city.countryCode,
      } as any).where(eq(cities.slug as any, city.slug));
      console.log(`  ℹ️  Şehir zaten var, nameTr güncellendi`);
    }

    const cityId = existing.id;

    for (const category of ['sim', 'transport', 'exchange']) {
      console.log(`  📡 ${category.toUpperCase()} verileri çekiliyor (${city.nameEn})...`);
      try {
        const points = await fetchFromOverpass(city.nameEn, category);
        console.log(`     ${points.length} nokta bulundu`);

        if (points.length > 0) {
          const values = points.map(p => ({
            cityId,
            category: mapCategory(category),
            name: p.name,
            address: p.address,
            latitude: p.latitude,
            longitude: p.longitude,
            source: 'openstreetmap',
            openingHours: p.opening_hours,
            isActive: true,
          }));
          await db.insert(adaptationPoints).values(values as any).onConflictDoNothing();
        }
      } catch (err) {
        console.error(`     ❌ Hata:`, err);
      }

      await wait(1500);
    }

    await db.update(cities).set({ lastSyncedAt: new Date() } as any).where(eq(cities.slug as any, city.slug));
    console.log(`  ✅ ${city.nameTr} tamamlandı`);

    await wait(2000);
  }

  await pool.end();
  console.log('\n🎉 Tüm şehirler başarıyla yüklendi!');
}

main().catch(err => { console.error(err); process.exit(1); });
