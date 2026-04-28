import { POI } from '../types/poi';
import { RouteData } from '../types/route';
import polyline from '@mapbox/polyline';

const ORS_API_KEY = import.meta.env.VITE_ORS_API_KEY || '';

export async function fetchDirections(orderedPois: POI[]): Promise<RouteData> {
  if (orderedPois.length < 2) {
    throw new Error("Rotasyon için en az 2 mekan seçilmelidir.");
  }

  // OpenRouteService expects coordinates as [lng, lat]
  const coordinates = orderedPois.map(poi => [poi.coordinate.lng, poi.coordinate.lat]);

  const body = {
    coordinates: coordinates,
    instructions: true,
    language: 'tr',
    preference: 'recommended',
    units: 'km'
  };

  const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': ORS_API_KEY
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`ORS API Error: ${response.status} - ${errorData.error?.message || 'Bilinmeyen hata'}`);
  }

  const data = await response.json();
  const route = data.routes[0];

  // geometry (encoded polyline) to [lat, lng][]
  const decodedGeometry = polyline.decode(route.geometry);

  return {
    ordered_pois: orderedPois,
    total_duration_min: Math.round(route.summary.duration / 60),
    total_distance_km: route.summary.distance, // expected km because of units: 'km' (actually ORS v2 sometimes returns meters for km if not careful, we will check)
    geometry: decodedGeometry,
    legs: route.segments.map((seg: any) => ({
      distance: seg.distance,
      duration: seg.duration,
      steps: seg.steps.map((st: any) => ({
        distance: st.distance,
        duration: st.duration,
        type: st.type,
        instruction: st.instruction,
        name: st.name,
        way_points: st.way_points
      }))
    })),
    summary: route.summary
  };
}
