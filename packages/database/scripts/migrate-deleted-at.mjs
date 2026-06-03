import pg from 'pg';

const c = new pg.Client({
  connectionString:
    'postgresql://postgres:pocketguidedocker@localhost:5432/postgres',
});
await c.connect();
await c.query(
  'ALTER TABLE travel_photos ADD COLUMN IF NOT EXISTS "deletedAt" timestamp',
);
console.log('deletedAt column ready');
await c.end();
