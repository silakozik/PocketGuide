import type { GeneratedRoute, RouteDay, RouteDayStop } from "@pocketguide/core";
import type { Router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { geocodeVenue } from "./geocode";
import type { POI } from "@/src/types/poi";

export const AI_ROUTE_MAP_STORAGE_KEY = "pg_ai_route_map_draft";
export const AI_ROUTE_MAP_POIS_KEY = "pg_ai_route_map_pois";

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
): Promise<{ lat: number; lng: number } | null> {
  const cc = countryCodeFor(city, cityNameEn);
  const queries = stopSearchQueries(stop, city, cityNameEn);
  for (let i = 0; i < queries.length; i++) {
    const geo = await geocodeVenue(queries[i], { countrycodes: cc });
    if (geo) return { lat: geo.lat, lng: geo.lng };
    if (i < queries.length - 1) await delay(GEOCODE_DELAY_MS);
  }
  return null;
}

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
        coordinate: { latitude: geo.lat, longitude: geo.lng },
        description: stop.address,
      });
    }
    if (i < day.stops.length - 1) await delay(GEOCODE_DELAY_MS);
  }
  return pois;
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

export async function saveAiRouteMapPois(pois: POI[]): Promise<void> {
  await AsyncStorage.setItem(AI_ROUTE_MAP_POIS_KEY, JSON.stringify(pois));
}

export async function openStopOnMap(
  router: Router,
  stop: RouteDayStop,
  city: string,
  cityNameEn?: string,
): Promise<boolean> {
  const geo = await geocodeStop(stop, city, cityNameEn);
  if (!geo) return false;
  router.push({
    pathname: "/(tabs)/map",
    params: {
      lat: String(geo.lat),
      lng: String(geo.lng),
      name: stop.name,
    },
  } as never);
  return true;
}

export async function openDayOnMap(
  router: Router,
  route: GeneratedRoute,
  dayNumber: number,
  tripId?: string,
): Promise<DayMapNavigateResult> {
  const day = route.plan.find((d) => d.day === dayNumber);
  if (!day) return { ok: false, found: 0, total: 0 };

  const pois = await geocodeDayStopsToPois(day, route.city, route.cityNameEn);
  if (pois.length === 0) {
    return { ok: false, found: 0, total: day.stops.length };
  }

  await saveAiRouteMapPois(pois);
  const draft = dayToMapDraft(route, dayNumber, tripId);
  if (draft) {
    await AsyncStorage.setItem(AI_ROUTE_MAP_STORAGE_KEY, JSON.stringify(draft));
  }

  router.push({
    pathname: "/(tabs)/map",
    params: { loadAiRoute: "1", q: route.city },
  } as never);

  return { ok: true, found: pois.length, total: day.stops.length };
}
