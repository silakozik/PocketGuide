/**
 * Yanlış explore kategorisine yazılmış mekanları isim/açıklamaya göre düzeltir.
 * Kullanım: pnpm reclassify:poi-categories
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { classifyExploreCategoryFromLabels } from './places/utils/explore-category-classifier';
import type { ExplorePlaceCategory } from './places/constants/explore-categories';

const EXPLORE_CATS: ExplorePlaceCategory[] = [
  'food',
  'shopping',
  'entertainment',
  'culture',
  'historic',
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const res = await pool.query<{
    id: string;
    name: string;
    category: string;
    description: string | null;
  }>(`SELECT id, name, category, description FROM pois`);

  let updated = 0;
  for (const row of res.rows) {
    if (!EXPLORE_CATS.includes(row.category as ExplorePlaceCategory)) continue;

    const next = classifyExploreCategoryFromLabels([row.name, row.description ?? ''].filter(Boolean));
    if (!next || next === row.category) continue;

    await pool.query(`UPDATE pois SET category = $2 WHERE id = $1::uuid`, [row.id, next]);
    updated += 1;
  }

  await pool.end();
  console.log(`✅ ${updated} mekan kategorisi güncellendi (culture ↔ entertainment ayrımı).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
