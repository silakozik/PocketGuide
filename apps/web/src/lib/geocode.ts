/** OpenStreetMap Nominatim + isteğe bağlı Mapbox Geocoding */

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
  placeId?: string;
}

export interface NominatimPlace {
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

export interface GeocodeVenueOptions {
  countrycodes?: string;
}

/** Tek mekan / adres — harita pin için */
export async function geocodeVenue(
  query: string,
  options?: GeocodeVenueOptions,
): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (!q) return null;

  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  if (mapboxToken) {
    const fromMapbox = await geocodePlaceWithMapbox(q, mapboxToken, options?.countrycodes);
    if (fromMapbox) return fromMapbox;
  }

  const places = await searchPlaces(q, {
    countrycodes: options?.countrycodes,
    limit: 8,
  });
  if (!places.length) return null;

  const sorted = [...places].sort((a, b) => {
    const aCity = CITY_TYPES.has(a.type) ? 0 : 1;
    const bCity = CITY_TYPES.has(b.type) ? 0 : 1;
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
}

/** Harita araması — birden fazla sonuç */
export async function searchPlaces(
  query: string,
  options?: { countrycodes?: string; limit?: number },
): Promise<NominatimPlace[]> {
  if (!query.trim() || query.length < 2) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query.trim());
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(options?.limit ?? 5));
  url.searchParams.set("accept-language", "tr");
  url.searchParams.set("addressdetails", "1");
  if (options?.countrycodes) {
    url.searchParams.set("countrycodes", options.countrycodes);
  }

  try {
    const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS });
    return res.ok ? ((await res.json()) as NominatimPlace[]) : [];
  } catch {
    return [];
  }
}

/** Ana sayfa / rota — tek en iyi şehir konumu (dünya geneli) */
export async function geocodeCity(query: string): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (!q) return null;

  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
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
  countryCode?: string,
): Promise<GeocodeResult | null> {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "1");
  url.searchParams.set("types", "poi,address,place,locality");
  url.searchParams.set("language", "tr");
  if (countryCode) {
    url.searchParams.set("country", countryCode);
  }

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
