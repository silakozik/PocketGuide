import { apiFetch, parseApiError } from "./api";

export interface SavedTripStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
}

export interface SavedTrip {
  id: string;
  title: string;
  cityName: string | null;
  stops: SavedTripStop[];
  routeData?: unknown;
  durationMinutes: number | null;
  distanceKm: number | null;
  status: string | null;
  createdAt: string;
}

export async function getMySavedTrips(): Promise<SavedTrip[]> {
  const res = await apiFetch("/saved-trips/my");
  if (res.status === 401) throw new Error("LOGIN_REQUIRED");
  if (!res.ok) throw new Error(await parseApiError(res));
  const json = (await res.json()) as { data?: SavedTrip[] };
  return json.data ?? [];
}

export async function deleteSavedTrip(id: string): Promise<void> {
  const res = await apiFetch(`/saved-trips/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    throw new Error(await parseApiError(res));
  }
}
