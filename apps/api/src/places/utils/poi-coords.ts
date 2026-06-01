import { Pool } from 'pg';
import { sql, SQL } from 'drizzle-orm';

export type PoiCoordMode = 'postgis' | 'latlng';

type SqlRunner = {
  execute?: (q: unknown) => Promise<unknown>;
  query?: (text: string, values?: unknown[]) => Promise<unknown>;
};

function rowsFromResult(result: unknown): unknown[] {
  if (Array.isArray(result)) return result;
  if (result && typeof result === 'object' && 'rows' in result) {
    const r = (result as { rows?: unknown }).rows;
    if (Array.isArray(r)) return r;
  }
  return [];
}

async function runSql(dbOrPool: SqlRunner, text: string): Promise<unknown[]> {
  if (typeof dbOrPool.query === 'function') {
    const result = await dbOrPool.query(text);
    return rowsFromResult(result);
  }
  if (typeof dbOrPool.execute === 'function') {
    const result = await dbOrPool.execute(sql.raw(text));
    return rowsFromResult(result);
  }
  throw new Error('Database client has no query or execute method');
}

export async function detectPoiCoordMode(dbOrPool: SqlRunner): Promise<PoiCoordMode> {
  const colRows = await runSql(
    dbOrPool,
    `
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pois'
      AND column_name IN ('location', 'latitude')
    `,
  );
  const cols = new Set(
    colRows.map((r) => (r as { column_name: string }).column_name),
  );

  if (cols.has('latitude')) return 'latlng';
  if (!cols.has('location')) return 'latlng';

  try {
    await runSql(dbOrPool, 'SELECT PostGIS_Version()');
    return 'postgis';
  } catch {
    return 'latlng';
  }
}

export async function ensurePoisTable(pool: Pool): Promise<PoiCoordMode> {
  let mode: PoiCoordMode = 'latlng';
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS postgis');
    mode = 'postgis';
  } catch {
    console.warn(
      'PostGIS yüklü değil — pois tablosu latitude/longitude ile kullanılacak.',
    );
  }

  const tableCheck = await pool.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'pois'
    ) AS exists
  `);

  if (!tableCheck.rows[0]?.exists) {
    if (mode === 'postgis') {
      await pool.query(`
        CREATE TABLE pois (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          source_id VARCHAR(255),
          provider VARCHAR(50),
          name VARCHAR(255) NOT NULL,
          "cityId" UUID REFERENCES cities(id) ON DELETE CASCADE,
          category VARCHAR(50) NOT NULL,
          address TEXT,
          description TEXT,
          rating DOUBLE PRECISION,
          "priceLevel" INTEGER,
          opening_hours TEXT,
          location GEOGRAPHY(Point, 4326) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      await pool.query(
        'CREATE INDEX IF NOT EXISTS pois_spatial_idx ON pois USING gist (location)',
      );
    } else {
      await pool.query(`
        CREATE TABLE pois (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          source_id VARCHAR(255),
          provider VARCHAR(50),
          name VARCHAR(255) NOT NULL,
          "cityId" UUID REFERENCES cities(id) ON DELETE CASCADE,
          category VARCHAR(50) NOT NULL,
          address TEXT,
          description TEXT,
          rating DOUBLE PRECISION,
          "priceLevel" INTEGER,
          opening_hours TEXT,
          latitude DOUBLE PRECISION NOT NULL,
          longitude DOUBLE PRECISION NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
    }
    await pool.query('CREATE INDEX IF NOT EXISTS pois_category_idx ON pois (category)');
    await pool.query('CREATE INDEX IF NOT EXISTS pois_city_idx ON pois ("cityId")');
    await pool.query('CREATE INDEX IF NOT EXISTS pois_source_id_idx ON pois (source_id)');
    console.log(`pois tablosu oluşturuldu (${mode}).`);
    return mode;
  }

  const colCheck = await pool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'pois'
  `);
  const cols = new Set(colCheck.rows.map((r: { column_name: string }) => r.column_name));

  if (mode === 'postgis' && !cols.has('location')) {
    await pool.query(
      'ALTER TABLE pois ADD COLUMN IF NOT EXISTS location GEOGRAPHY(Point, 4326)',
    );
    if (cols.has('latitude') && cols.has('longitude')) {
      await pool.query(`
        UPDATE pois SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
        WHERE location IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL
      `);
    }
    console.log('pois.location kolonu eklendi.');
  }

  if (mode === 'latlng' && !cols.has('latitude')) {
    await pool.query(`
      ALTER TABLE pois ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION
    `);
    console.log('pois.latitude / pois.longitude kolonları eklendi.');
  }

  return cols.has('location') && mode === 'postgis' ? 'postgis' : 'latlng';
}

export function latLngSelectSql(alias: string, mode: PoiCoordMode): SQL {
  if (mode === 'postgis') {
    return sql.raw(
      `ST_Y(${alias}.location::geometry) AS lat, ST_X(${alias}.location::geometry) AS lng`,
    );
  }
  return sql.raw(`${alias}.latitude AS lat, ${alias}.longitude AS lng`);
}
