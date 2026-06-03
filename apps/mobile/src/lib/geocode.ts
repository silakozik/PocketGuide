/** Web geocode.ts — Expo ortamı için uyarlanmış */

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  placeId?: string;
}

interface NominatimPlace {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

const NOMINATIM_HEADERS = { "User-Agent": "PocketGuide/1.0 (https://pocketguide.app)" };

const CITY_TYPES = new Set([
  "city",
  "town",
  "village",
  "municipality",
  "administrative",
  "county",
]);

export async function geocodeCity(query: string): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (!q) return null;

  const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (mapboxToken) {
    const fromMapbox = await geocodePlaceWithMapbox(q, mapboxToken);
    if (fromMapbox) return fromMapbox;
  }

  return geocodeWithNominatim(q);
}

async function geocodeWithNominatim(query: string): Promise<GeocodeResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "8");
  url.searchParams.set("accept-language", "tr");
  url.searchParams.set("addressdetails", "1");

  try {
    const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS });
    if (!res.ok) return null;
    const rows = (await res.json()) as NominatimPlace[];
    if (!rows.length) return null;

    const sorted = [...rows].sort((a, b) => {
      const aCity = CITY_TYPES.has(a.type) ? 1 : 0;
      const bCity = CITY_TYPES.has(b.type) ? 1 : 0;
      if (bCity !== aCity) return bCity - aCity;
      return (b.importance ?? 0) - (a.importance ?? 0);
    });

    const best = sorted[0];
    return {
      lat: parseFloat(best.lat),
      lng: parseFloat(best.lon),
      displayName: best.display_name.split(",")[0]?.trim() || query,
      placeId: String(best.place_id),
    };
  } catch {
    return null;
  }
}

async function geocodePlaceWithMapbox(
  query: string,
  token: string,
): Promise<GeocodeResult | null> {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "1");
  url.searchParams.set("types", "place,locality");
  url.searchParams.set("language", "tr");

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: Array<{
        id: string;
        place_name: string;
        center: [number, number];
        text: string;
      }>;
    };
    const feature = data.features?.[0];
    if (!feature?.center) return null;
    const [lng, lat] = feature.center;
    return {
      lat,
      lng,
      displayName: feature.text || feature.place_name.split(",")[0],
      placeId: feature.id,
    };
  } catch {
    return null;
  }
}
