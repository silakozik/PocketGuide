import type { GeneratedRoute, RouteDay, RouteDayStop } from "@pocketguide/core";
import type { NavigateFunction } from "react-router-dom";
import { geocodeVenue, type GeocodeResult } from "./geocode";
import type { POI } from "../types/poi";

export const AI_ROUTE_MAP_STORAGE_KEY = "pg_ai_route_map_draft";
export const AI_ROUTE_MAP_POIS_KEY = "pg_ai_route_map_pois";

/** Nominatim: en fazla 1 istek/saniye */
const GEOCODE_DELAY_MS = 1100;

const CITY_COUNTRY_CODES: Record<string, string> = {
  İstanbul: "tr",
  Istanbul: "tr",
  Paris: "fr",
  Tokyo: "jp",
  Londra: "gb",
  London: "gb",
  Roma: "it",
  Rome: "it",
  Barcelona: "es",
  Dubai: "ae",
  Amsterdam: "nl",
  Sydney: "au",
  "New York": "us",
};

export interface AiRouteMapDraft {
  city: string;
  cityNameEn?: string;
  day: number;
  tripId?: string;
  stops: { id: string; name: string; address?: string }[];
}

export interface DayMapNavigateResult {
  ok: boolean;
  found: number;
  total: number;
}

function countryCodeFor(city: string, cityNameEn?: string): string | undefined {
  return CITY_COUNTRY_CODES[city] ?? (cityNameEn ? CITY_COUNTRY_CODES[cityNameEn] : undefined);
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function buildStopSearchQuery(stop: RouteDayStop, city: string): string {
  if (stop.address?.trim()) return `${stop.name}, ${stop.address}`;
  return `${stop.name}, ${city}`;
}

export function saveAiRouteMapDraft(draft: AiRouteMapDraft): void {
  sessionStorage.setItem(AI_ROUTE_MAP_STORAGE_KEY, JSON.stringify(draft));
}

export function loadAiRouteMapDraft(): AiRouteMapDraft | null {
  try {
    const raw = sessionStorage.getItem(AI_ROUTE_MAP_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AiRouteMapDraft;
  } catch {
    return null;
  }
}

export function clearAiRouteMapDraft(): void {
  sessionStorage.removeItem(AI_ROUTE_MAP_STORAGE_KEY);
}

export function saveAiRouteMapPois(pois: POI[]): void {
  sessionStorage.setItem(AI_ROUTE_MAP_POIS_KEY, JSON.stringify(pois));
}

export function loadAiRouteMapPois(): POI[] | null {
  try {
    const raw = sessionStorage.getItem(AI_ROUTE_MAP_POIS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as POI[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearAiRouteMapPois(): void {
  sessionStorage.removeItem(AI_ROUTE_MAP_POIS_KEY);
}

function stopSearchQueries(
  stop: RouteDayStop,
  city: string,
  cityNameEn?: string,
): string[] {
  const cityEn = cityNameEn?.trim() || city;
  const queries: string[] = [];
  if (stop.address?.trim()) {
    queries.push(`${stop.name}, ${stop.address}`);
    queries.push(`${stop.address}, ${cityEn}`);
  }
  queries.push(`${stop.name}, ${cityEn}`);
  queries.push(`${stop.name}, ${city}`);
  return [...new Set(queries)];
}

export async function geocodeStop(
  stop: RouteDayStop,
  city: string,
  cityNameEn?: string,
): Promise<GeocodeResult | null> {
  const cc = countryCodeFor(city, cityNameEn);
  const queries = stopSearchQueries(stop, city, cityNameEn);

  for (let i = 0; i < queries.length; i++) {
    const geo = await geocodeVenue(queries[i], { countrycodes: cc });
    if (geo) return geo;
    if (i < queries.length - 1) await delay(GEOCODE_DELAY_MS);
  }
  return null;
}

/** Nominatim rate limit — sıralı istek */
export async function geocodeDayStopsToPois(
  day: RouteDay,
  city: string,
  cityNameEn?: string,
): Promise<POI[]> {
  const pois: POI[] = [];

  for (let i = 0; i < day.stops.length; i++) {
    const stop = day.stops[i];
    const geo = await geocodeStop(stop, city, cityNameEn);
    if (geo) {
      pois.push({
        id: `day${day.day}-stop${stop.order}`,
        name: stop.name,
        category: "event",
        coordinate: { lat: geo.lat, lng: geo.lng },
        description: stop.address,
      });
    }
    if (i < day.stops.length - 1) await delay(GEOCODE_DELAY_MS);
  }

  return pois;
}

export async function geocodeDraftStopsToPois(
  stops: AiRouteMapDraft["stops"],
  city: string,
  dayNumber: number,
  cityNameEn?: string,
): Promise<POI[]> {
  const fakeDay: RouteDay = {
    day: dayNumber,
    title: "",
    theme: "",
    stops: stops.map((s, i) => ({
      order: i + 1,
      time: "",
      name: s.name,
      type: "",
      description: "",
      duration: "",
      tip: "",
      category: "other",
      address: s.address,
    })),
  };
  return geocodeDayStopsToPois(fakeDay, city, cityNameEn);
}

export function dayToMapDraft(
  route: GeneratedRoute,
  dayNumber: number,
  tripId?: string,
): AiRouteMapDraft | null {
  const day = route.plan.find((d) => d.day === dayNumber);
  if (!day?.stops.length) return null;

  return {
    city: route.city,
    cityNameEn: route.cityNameEn,
    day: dayNumber,
    tripId,
    stops: day.stops.map((s) => ({
      id: `day${day.day}-stop${s.order}`,
      name: s.name,
      address: s.address,
    })),
  };
}

export async function navigateToStopOnMap(
  navigate: NavigateFunction,
  stop: RouteDayStop,
  city: string,
  cityNameEn?: string,
): Promise<boolean> {
  const geo = await geocodeStop(stop, city, cityNameEn);
  if (!geo) return false;

  const params = new URLSearchParams({
    lat: String(geo.lat),
    lng: String(geo.lng),
    name: stop.name,
  });
  navigate(`/map?${params.toString()}`);
  return true;
}

/** Tüm durakları geocode edip hazır POI listesiyle haritaya gider */
export async function navigateToDayOnMap(
  navigate: NavigateFunction,
  route: GeneratedRoute,
  dayNumber: number,
  tripId?: string,
): Promise<DayMapNavigateResult> {
  const draft = dayToMapDraft(route, dayNumber, tripId);
  if (!draft) return { ok: false, found: 0, total: 0 };

  const pois = await geocodeDraftStopsToPois(
    draft.stops,
    draft.city,
    draft.day,
    draft.cityNameEn,
  );

  if (pois.length === 0) {
    return { ok: false, found: 0, total: draft.stops.length };
  }

  saveAiRouteMapDraft(draft);
  saveAiRouteMapPois(pois);
  navigate("/map?loadAiRoute=1");

  return {
    ok: true,
    found: pois.length,
    total: draft.stops.length,
  };
}
