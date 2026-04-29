import type { POI } from "@/src/types/poi";
import type { RouteData } from "@/src/types/route";

const ORS_API_KEY = process.env.EXPO_PUBLIC_ORS_API_KEY ?? "";

function decodePolyline(encoded: string, precision = 5): [number, number][] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];
  const factor = Math.pow(10, precision);

  while (index < encoded.length) {
    let result = 1;
    let shift = 0;
    let b: number;

    do {
      b = encoded.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 1;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
}

export async function fetchDirections(orderedPois: POI[]): Promise<RouteData> {
  if (orderedPois.length < 2) {
    throw new Error("Rotasyon için en az 2 mekan seçilmelidir.");
  }
  if (!ORS_API_KEY) {
    throw new Error("ORS API key eksik. EXPO_PUBLIC_ORS_API_KEY ayarlayın.");
  }

  const coordinates = orderedPois.map((poi) => [
    poi.coordinate.longitude,
    poi.coordinate.latitude,
  ]);

  const body = {
    coordinates,
    instructions: true,
    language: "tr",
    preference: "recommended",
    units: "km",
  };

  const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: ORS_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as any));
    throw new Error(`ORS API Error: ${response.status} - ${errorData?.error?.message ?? "Bilinmeyen hata"}`);
  }

  const data = await response.json();
  const route = data.routes[0];
  const geometry = decodePolyline(route.geometry);

  return {
    ordered_pois: orderedPois,
    total_duration_min: Math.round(route.summary.duration / 60),
    total_distance_km: route.summary.distance,
    geometry,
    legs: route.segments.map((seg: any) => ({
      distance: seg.distance,
      duration: seg.duration,
      steps: seg.steps.map((st: any) => ({
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

