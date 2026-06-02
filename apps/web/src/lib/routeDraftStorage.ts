import type { POI } from "../types/poi";

const STORAGE_KEY = "pg_route_draft";

function isValidPoi(value: unknown): value is POI {
  if (!value || typeof value !== "object") return false;
  const poi = value as POI;
  return (
    typeof poi.id === "string" &&
    typeof poi.name === "string" &&
    typeof poi.category === "string" &&
    poi.coordinate != null &&
    typeof poi.coordinate.lat === "number" &&
    typeof poi.coordinate.lng === "number"
  );
}

export function loadRouteDraftFromSession(): POI[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidPoi);
  } catch {
    return [];
  }
}

export function saveRouteDraftToSession(pois: POI[]): void {
  try {
    if (pois.length === 0) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pois));
  } catch {
    // private mode / quota
  }
}

export function clearRouteDraftSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
