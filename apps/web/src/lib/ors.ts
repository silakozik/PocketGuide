import { POI } from '../types/poi';
import { RouteData } from '../types/route';
import polyline from '@mapbox/polyline';

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY || '';
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');

interface OrsDirectionsResponse {
  routes: Array<{
    geometry: string;
    summary: { duration: number; distance: number };
    segments: Array<{
      distance: number;
      duration: number;
      steps: Array<{
        distance: number;
        duration: number;
        type: number;
        instruction: string;
        name: string;
        way_points: number[];
      }>;
    }>;
  }>;
  error?: { message?: string };
}

function parseOrsDirections(data: OrsDirectionsResponse, orderedPois: POI[]): RouteData {
  const route = data.routes?.[0];
  if (!route) {
    throw new Error('ORS yanıtında rota bulunamadı.');
  }

  const decodedGeometry = polyline.decode(route.geometry);

  return {
    ordered_pois: orderedPois,
    total_duration_min: Math.round(route.summary.duration / 60),
    total_distance_km: route.summary.distance,
    geometry: decodedGeometry,
    legs: route.segments.map((seg) => ({
      distance: seg.distance,
      duration: seg.duration,
      steps: seg.steps.map((st) => ({
        distance: st.distance,
        duration: st.duration,
        type: st.type,
        instruction: st.instruction,
        name: st.name,
        way_points: st.way_points,
      })),
    })),
    summary: route.summary,
  };
}

export async function fetchDirections(orderedPois: POI[]): Promise<RouteData> {
  if (orderedPois.length < 2) {
    throw new Error('Rotasyon için en az 2 mekan seçilmelidir.');
  }

  const coordinates = orderedPois.map((poi) => [
    poi.coordinate.lng,
    poi.coordinate.lat,
  ]) as [number, number][];

  let data: OrsDirectionsResponse;

  if (API_BASE) {
    const response = await fetch(`${API_BASE}/route/directions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      throw new Error(
        errorData.message ||
          errorData.error ||
          `Rota API hatası (${response.status})`,
      );
    }

    data = (await response.json()) as OrsDirectionsResponse;
  } else if (ORS_API_KEY) {
    const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: ORS_API_KEY,
      },
      body: JSON.stringify({
        coordinates,
        instructions: true,
        language: 'tr',
        preference: 'recommended',
        units: 'km',
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as OrsDirectionsResponse;
      throw new Error(
        `ORS API Error: ${response.status} - ${errorData.error?.message || 'Bilinmeyen hata'}`,
      );
    }

    data = (await response.json()) as OrsDirectionsResponse;
  } else {
    throw new Error(
      'Rota hesaplanamıyor: VITE_API_BASE_URL veya VITE_ORS_API_KEY yapılandırın.',
    );
  }

  return parseOrsDirections(data, orderedPois);
}
