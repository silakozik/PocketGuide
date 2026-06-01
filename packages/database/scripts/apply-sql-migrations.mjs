/**
 * Bekleyen drizzle/*.sql dosyalarını DATABASE_URL üzerinde çalıştırır.
 * Kullanım: node scripts/apply-sql-migrations.mjs
 */
import pg from "pg";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL tanımlı değil (packages/database/.env)");
  process.exit(1);
}

const drizzleDir = join(__dirname, "../drizzle");
/** Yalnızca incremental migration'lar (0000 tam şema zaten uygulanmış olmalı) */
const files = readdirSync(drizzleDir)
  .filter((f) => /^000[1-9].*\.sql$/.test(f))
  .sort();

const client = new pg.Client({ connectionString });

try {
  await client.connect();
  for (const file of files) {
    const raw = readFileSync(join(drizzleDir, file), "utf8");
    const statements = raw
      .split(/--> statement-breakpoint\n?/)
      .map((s) => s.trim())
      .filter(Boolean);

    console.log(`Applying ${file} (${statements.length} statement(s))...`);
    for (const sql of statements) {
      await client.query(sql);
    }
  }
  console.log("Migrations applied successfully.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
