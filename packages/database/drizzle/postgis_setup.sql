-- ============================================================
-- PocketGuide: PostGIS Setup & Migration
-- ============================================================
-- Run this against your PostgreSQL database to enable PostGIS
-- and create the geospatial schema.
-- ============================================================

-- 1. Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create the POIs table with geography column
CREATE TABLE IF NOT EXISTS pois (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id VARCHAR(255),
    provider VARCHAR(50),               -- google, foursquare, gtfs, osm
    name VARCHAR(255) NOT NULL,
    "cityId" UUID REFERENCES cities(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    address TEXT,
    description TEXT,
    rating DOUBLE PRECISION,
    "priceLevel" INTEGER,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 3. GiST spatial index for fast geospatial queries
CREATE INDEX IF NOT EXISTS pois_spatial_idx ON pois USING gist (location);

-- 4. Additional indexes for common query patterns
CREATE INDEX IF NOT EXISTS pois_category_idx ON pois (category);
CREATE INDEX IF NOT EXISTS pois_city_idx ON pois ("cityId");
CREATE INDEX IF NOT EXISTS pois_provider_idx ON pois (provider);
CREATE INDEX IF NOT EXISTS pois_source_id_idx ON pois (source_id);

-- 5. Composite index for category + spatial queries
-- (PostgreSQL can combine indexes, but an explicit composite can help)
CREATE INDEX IF NOT EXISTS pois_category_location_idx ON pois (category) INCLUDE (location);

-- ============================================================
-- EXAMPLE OPTIMIZED QUERIES
-- ============================================================

-- A) Nearby Search (radius-based with distance sorting)
-- Find restaurants within 1.5km of a point, sorted by distance
-- Uses: GiST index → ST_DWithin → ST_Distance
EXPLAIN ANALYZE
SELECT
    id, name, category, address, rating,
    ST_Y(location::geometry) AS lat,
    ST_X(location::geometry) AS lng,
    ST_Distance(
        location,
        ST_SetSRID(ST_MakePoint(28.9784, 41.0082), 4326)::geography
    ) AS distance_meters
FROM pois
WHERE
    ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(28.9784, 41.0082), 4326)::geography,
        1500  -- 1.5 km radius
    )
    AND category = 'restaurant'
ORDER BY distance_meters ASC
LIMIT 20;

-- B) Bounding Box Query (map viewport)
-- Fast pre-filter for visible map area
SELECT
    id, name, category,
    ST_Y(location::geometry) AS lat,
    ST_X(location::geometry) AS lng
FROM pois
WHERE ST_Intersects(
    location,
    ST_MakeEnvelope(28.9, 41.0, 29.1, 41.1, 4326)::geography
)
LIMIT 200;

-- C) K-Nearest Neighbor (KNN) using <-> operator
-- Finds the 10 closest POIs to a point using index-supported KNN
SELECT
    id, name, category,
    ST_Y(location::geometry) AS lat,
    ST_X(location::geometry) AS lng,
    ST_Distance(
        location,
        ST_SetSRID(ST_MakePoint(28.9784, 41.0082), 4326)::geography
    ) AS distance_meters
FROM pois
ORDER BY location <-> ST_SetSRID(ST_MakePoint(28.9784, 41.0082), 4326)::geography
LIMIT 10;

-- D) Server-side Marker Clustering
-- Groups POIs into grid cells for efficient map rendering
SELECT
    COUNT(*) AS poi_count,
    AVG(ST_Y(location::geometry)) AS cluster_lat,
    AVG(ST_X(location::geometry)) AS cluster_lng,
    FLOOR(ST_Y(location::geometry) / 0.01) AS grid_y,
    FLOOR(ST_X(location::geometry) / 0.01) AS grid_x
FROM pois
WHERE ST_Intersects(
    location,
    ST_MakeEnvelope(28.5, 40.8, 29.5, 41.3, 4326)::geography
)
GROUP BY grid_y, grid_x
ORDER BY poi_count DESC;

-- E) Distance Matrix between specific POIs
-- Calculate distances between a set of POIs
SELECT
    a.id AS from_id,
    a.name AS from_name,
    b.id AS to_id,
    b.name AS to_name,
    ST_Distance(a.location, b.location) AS distance_meters
FROM pois a
CROSS JOIN pois b
WHERE a.id != b.id
    AND a.id IN ('uuid-1', 'uuid-2', 'uuid-3')
    AND b.id IN ('uuid-1', 'uuid-2', 'uuid-3')
ORDER BY a.id, distance_meters;

-- F) Time-Aware POI Query (context-aware suggestions)
-- Find appropriate POIs based on time of day
SELECT
    id, name, category, rating,
    ST_Distance(
        location,
        ST_SetSRID(ST_MakePoint(28.9784, 41.0082), 4326)::geography
    ) AS distance_meters
FROM pois
WHERE
    ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(28.9784, 41.0082), 4326)::geography,
        2000
    )
    AND category IN (
        -- Dynamic category list based on time of day
        CASE
            WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 7 AND 10 THEN 'cafe'
            WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 11 AND 14 THEN 'restaurant'
            WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 15 AND 18 THEN 'attraction'
            WHEN EXTRACT(HOUR FROM NOW()) BETWEEN 19 AND 22 THEN 'restaurant'
            ELSE 'accommodation'
        END
    )
ORDER BY rating DESC NULLS LAST, distance_meters ASC
LIMIT 10;
