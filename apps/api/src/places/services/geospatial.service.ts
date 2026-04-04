import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { sql } from 'drizzle-orm';
import { pois } from '@pocketguide/database';

/**
 * GeospatialService
 * 
 * High-performance PostGIS query layer for the PocketGuide system.
 * Uses ST_DWithin for radius filtering, ST_Distance for precise sorting,
 * and ST_MakeEnvelope for bounding box pre-filtering.
 * 
 * All distances are in meters (geography type).
 */

export interface NearbyQuery {
  lat: number;
  lng: number;
  radiusMeters?: number;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface BoundingBoxQuery {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface PoiWithDistance {
  id: string;
  name: string;
  category: string;
  address: string | null;
  description: string | null;
  rating: number | null;
  priceLevel: number | null;
  lat: number;
  lng: number;
  distanceMeters: number;
}

export interface DistanceMatrixEntry {
  fromIndex: number;
  toIndex: number;
  distanceMeters: number;
}

@Injectable()
export class GeospatialService {
  private readonly logger = new Logger(GeospatialService.name);

  constructor(
    @Inject('DB_CONNECTION') private readonly db: any,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Find nearby POIs using PostGIS ST_DWithin for fast radius filtering
   * with ST_Distance for precise sorting.
   * 
   * Strategy:
   * 1. ST_DWithin provides fast index-accelerated radius check (uses GiST)
   * 2. ST_Distance computes precise geodesic distance for ordering
   * 3. Category filter is applied as an additional WHERE clause
   */
  async findNearby(query: NearbyQuery): Promise<PoiWithDistance[]> {
    const {
      lat,
      lng,
      radiusMeters = 1500,
      category,
      limit = 50,
      offset = 0,
    } = query;

    // Build cache key based on rounded coordinates (to ~11m precision)
    const cacheKey = `nearby:${lat.toFixed(4)}:${lng.toFixed(4)}:${radiusMeters}:${category || 'all'}:${limit}:${offset}`;
    
    const cached = await this.cacheManager.get<PoiWithDistance[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    const userPoint = sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;

    // Build WHERE conditions
    const conditions = [
      sql`ST_DWithin(${pois.location}, ${userPoint}, ${radiusMeters})`,
    ];

    if (category) {
      conditions.push(sql`${pois.category} = ${category}`);
    }

    const whereClause = sql.join(conditions, sql` AND `);

    const result = await this.db.execute(sql`
      SELECT
        ${pois.id} AS id,
        ${pois.name} AS name,
        ${pois.category} AS category,
        ${pois.address} AS address,
        ${pois.description} AS description,
        ${pois.rating} AS rating,
        ${pois.priceLevel} AS "priceLevel",
        ST_Y(${pois.location}::geometry) AS lat,
        ST_X(${pois.location}::geometry) AS lng,
        ST_Distance(${pois.location}, ${userPoint}) AS "distanceMeters"
      FROM ${pois}
      WHERE ${whereClause}
      ORDER BY "distanceMeters" ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    const rows = result.rows as PoiWithDistance[];

    // Cache for 60 seconds
    await this.cacheManager.set(cacheKey, rows, 60);
    this.logger.debug(`Cache SET: ${cacheKey} (${rows.length} results)`);

    return rows;
  }

  /**
   * Find POIs within a bounding box using ST_MakeEnvelope.
   * Optimized for map viewport queries (e.g., when the user drags the map).
   */
  async findInBoundingBox(query: BoundingBoxQuery): Promise<PoiWithDistance[]> {
    const {
      minLat,
      minLng,
      maxLat,
      maxLng,
      category,
      limit = 200,
      offset = 0,
    } = query;

    const cacheKey = `bbox:${minLat.toFixed(4)}:${minLng.toFixed(4)}:${maxLat.toFixed(4)}:${maxLng.toFixed(4)}:${category || 'all'}:${limit}:${offset}`;

    const cached = await this.cacheManager.get<PoiWithDistance[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache HIT: ${cacheKey}`);
      return cached;
    }

    const envelope = sql`ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)::geography`;

    // Center of bounding box for distance calculation
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const centerPoint = sql`ST_SetSRID(ST_MakePoint(${centerLng}, ${centerLat}), 4326)::geography`;

    const conditions = [
      sql`ST_Intersects(${pois.location}, ${envelope})`,
    ];

    if (category) {
      conditions.push(sql`${pois.category} = ${category}`);
    }

    const whereClause = sql.join(conditions, sql` AND `);

    const result = await this.db.execute(sql`
      SELECT
        ${pois.id} AS id,
        ${pois.name} AS name,
        ${pois.category} AS category,
        ${pois.address} AS address,
        ${pois.description} AS description,
        ${pois.rating} AS rating,
        ${pois.priceLevel} AS "priceLevel",
        ST_Y(${pois.location}::geometry) AS lat,
        ST_X(${pois.location}::geometry) AS lng,
        ST_Distance(${pois.location}, ${centerPoint}) AS "distanceMeters"
      FROM ${pois}
      WHERE ${whereClause}
      ORDER BY "distanceMeters" ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    const rows = result.rows as PoiWithDistance[];
    await this.cacheManager.set(cacheKey, rows, 30);

    return rows;
  }

  /**
   * Calculate a distance matrix between a set of points.
   * Uses Haversine formula on the application side for speed,
   * falling back to PostGIS ST_Distance for precision when needed.
   * 
   * Input: array of { lat, lng } coordinate pairs.
   * Output: full NxN distance matrix (in meters).
   */
  calculateDistanceMatrix(
    points: { lat: number; lng: number }[],
  ): DistanceMatrixEntry[] {
    const R = 6371e3; // Earth radius in meters
    const entries: DistanceMatrixEntry[] = [];

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const phi1 = (points[i].lat * Math.PI) / 180;
        const phi2 = (points[j].lat * Math.PI) / 180;
        const deltaPhi = ((points[j].lat - points[i].lat) * Math.PI) / 180;
        const deltaLambda = ((points[j].lng - points[i].lng) * Math.PI) / 180;

        const a =
          Math.sin(deltaPhi / 2) ** 2 +
          Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c;

        entries.push({ fromIndex: i, toIndex: j, distanceMeters: Math.round(d) });
        entries.push({ fromIndex: j, toIndex: i, distanceMeters: Math.round(d) });
      }
    }

    return entries;
  }

  /**
   * Find the K nearest POIs to a given point using PostGIS KNN operator (<->).
   * This is extremely fast for "closest N items" queries as it leverages the GiST index directly.
   */
  async findKNearest(lat: number, lng: number, k: number = 10): Promise<PoiWithDistance[]> {
    const userPoint = sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;

    const result = await this.db.execute(sql`
      SELECT
        ${pois.id} AS id,
        ${pois.name} AS name,
        ${pois.category} AS category,
        ${pois.address} AS address,
        ${pois.description} AS description,
        ${pois.rating} AS rating,
        ${pois.priceLevel} AS "priceLevel",
        ST_Y(${pois.location}::geometry) AS lat,
        ST_X(${pois.location}::geometry) AS lng,
        ST_Distance(${pois.location}, ${userPoint}) AS "distanceMeters"
      FROM ${pois}
      ORDER BY ${pois.location} <-> ${userPoint}
      LIMIT ${k}
    `);

    return result.rows as PoiWithDistance[];
  }

  /**
   * Get clustered POI data for map marker clustering.
   * Groups POIs into clusters based on a grid size at a given zoom level.
   */
  async getClusteredPois(
    minLat: number,
    minLng: number,
    maxLat: number,
    maxLng: number,
    gridSizeDegrees: number = 0.01, // ~1km grid cells
  ) {
    const result = await this.db.execute(sql`
      SELECT
        COUNT(*) AS count,
        AVG(ST_Y(location::geometry)) AS "clusterLat",
        AVG(ST_X(location::geometry)) AS "clusterLng",
        FLOOR(ST_Y(location::geometry) / ${gridSizeDegrees}) AS "gridY",
        FLOOR(ST_X(location::geometry) / ${gridSizeDegrees}) AS "gridX"
      FROM ${pois}
      WHERE ST_Intersects(
        ${pois.location},
        ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)::geography
      )
      GROUP BY "gridY", "gridX"
      ORDER BY count DESC
    `);

    return result.rows;
  }
}
