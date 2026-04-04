import { Injectable, Logger } from '@nestjs/common';
import { GeospatialService, PoiWithDistance, DistanceMatrixEntry } from '../../places/services/geospatial.service';

/**
 * RoutingService
 * 
 * Provides multi-stop route optimization using a nearest-neighbor heuristic
 * with geospatial distance calculations. Designed to work with the Gemini AI
 * for intelligent route generation, and GTFS data for public transport fallback.
 */

export interface RouteStop {
  poiId: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  stayMinutes: number;
  distanceFromPrevious: number; // meters
  walkingTimeMinutes: number;   // approximate
}

export interface SmartRouteRequest {
  startLat: number;
  startLng: number;
  interests: string[];      // e.g. ['restaurant', 'attraction', 'cafe']
  maxStops?: number;
  maxDurationMinutes?: number;
  radiusMeters?: number;
}

export interface SmartRouteResult {
  stops: RouteStop[];
  totalDistanceMeters: number;
  totalDurationMinutes: number;
  totalWalkingMinutes: number;
}

// Estimated stay durations by category (minutes)
const DEFAULT_STAY_MINUTES: Record<string, number> = {
  restaurant: 60,
  cafe: 30,
  attraction: 90,
  shopping: 45,
  transport_stop: 5,
  accommodation: 0,
  other: 30,
};

// Average walking speed: ~80 meters/minute (~4.8 km/h)
const WALKING_SPEED_MPM = 80;

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);

  constructor(private readonly geospatialService: GeospatialService) {}

  /**
   * Generate an optimized multi-stop route based on user interests and constraints.
   * 
   * Algorithm:
   * 1. Find nearby POIs matching user interests
   * 2. Build distance matrix between candidate POIs
   * 3. Apply nearest-neighbor heuristic for ordering
   * 4. Enforce time budget constraints
   */
  async generateSmartRoute(request: SmartRouteRequest): Promise<SmartRouteResult> {
    const {
      startLat,
      startLng,
      interests,
      maxStops = 6,
      maxDurationMinutes = 480, // 8 hours default
      radiusMeters = 5000,
    } = request;

    this.logger.log(`Generating smart route from (${startLat}, ${startLng}) with interests: ${interests.join(', ')}`);

    // Step 1: Gather candidate POIs for each interest category
    const candidatesByCategory = await Promise.all(
      interests.map((category) =>
        this.geospatialService.findNearby({
          lat: startLat,
          lng: startLng,
          radiusMeters,
          category,
          limit: 10,
        }),
      ),
    );

    // Flatten and deduplicate candidates
    const seenIds = new Set<string>();
    const allCandidates: PoiWithDistance[] = [];

    for (const categoryPois of candidatesByCategory) {
      for (const poi of categoryPois) {
        if (!seenIds.has(poi.id)) {
          seenIds.add(poi.id);
          allCandidates.push(poi);
        }
      }
    }

    if (allCandidates.length === 0) {
      this.logger.warn('No candidate POIs found for route generation');
      return {
        stops: [],
        totalDistanceMeters: 0,
        totalDurationMinutes: 0,
        totalWalkingMinutes: 0,
      };
    }

    // Step 2: Build distance matrix
    const points = [
      { lat: startLat, lng: startLng }, // index 0 = user start position
      ...allCandidates.map((p) => ({ lat: p.lat, lng: p.lng })),
    ];

    const distanceMatrix = this.geospatialService.calculateDistanceMatrix(points);

    // Convert to easy lookup: distMap[fromIdx][toIdx] = meters
    const distMap = new Map<string, number>();
    for (const entry of distanceMatrix) {
      distMap.set(`${entry.fromIndex}-${entry.toIndex}`, entry.distanceMeters);
    }

    const getDist = (from: number, to: number): number =>
      distMap.get(`${from}-${to}`) ?? Infinity;

    // Step 3: Nearest-neighbor route construction with time budget
    const visited = new Set<number>();
    const orderedStops: RouteStop[] = [];
    let currentIdx = 0; // start position
    let totalDistance = 0;
    let totalDuration = 0;
    let totalWalking = 0;

    while (orderedStops.length < maxStops && orderedStops.length < allCandidates.length) {
      let bestIdx = -1;
      let bestDist = Infinity;

      // Find nearest unvisited candidate
      for (let i = 0; i < allCandidates.length; i++) {
        const poiIdx = i + 1; // offset by 1 because index 0 is start position
        if (!visited.has(poiIdx)) {
          const dist = getDist(currentIdx, poiIdx);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = poiIdx;
          }
        }
      }

      if (bestIdx === -1) break;

      const candidate = allCandidates[bestIdx - 1];
      const walkingTime = Math.ceil(bestDist / WALKING_SPEED_MPM);
      const stayTime = DEFAULT_STAY_MINUTES[candidate.category] || 30;

      // Check if adding this stop would exceed time budget
      if (totalDuration + walkingTime + stayTime > maxDurationMinutes) {
        break;
      }

      visited.add(bestIdx);
      totalDistance += bestDist;
      totalWalking += walkingTime;
      totalDuration += walkingTime + stayTime;

      orderedStops.push({
        poiId: candidate.id,
        name: candidate.name,
        lat: candidate.lat,
        lng: candidate.lng,
        category: candidate.category,
        stayMinutes: stayTime,
        distanceFromPrevious: Math.round(bestDist),
        walkingTimeMinutes: walkingTime,
      });

      currentIdx = bestIdx;
    }

    this.logger.log(`Generated route with ${orderedStops.length} stops, ${Math.round(totalDistance)}m total distance`);

    return {
      stops: orderedStops,
      totalDistanceMeters: Math.round(totalDistance),
      totalDurationMinutes: totalDuration,
      totalWalkingMinutes: totalWalking,
    };
  }

  /**
   * Prepare route data for Gemini AI context (prompt-ready format).
   * Strips unnecessary fields, keeps spatial + contextual data compact.
   */
  formatForAIContext(route: SmartRouteResult): string {
    if (route.stops.length === 0) return 'No route available.';

    const lines = [
      `Route Summary: ${route.stops.length} stops, ${route.totalDistanceMeters}m total, ~${route.totalDurationMinutes} min`,
      '',
      ...route.stops.map((stop, i) => 
        `${i + 1}. ${stop.name} [${stop.category}] @ (${stop.lat.toFixed(5)}, ${stop.lng.toFixed(5)}) — stay ${stop.stayMinutes}min, walk ${stop.walkingTimeMinutes}min / ${stop.distanceFromPrevious}m from prev`
      ),
    ];

    return lines.join('\n');
  }
}
