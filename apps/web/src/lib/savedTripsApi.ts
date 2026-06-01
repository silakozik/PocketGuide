const API = 'http://localhost:3001';

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
  const res = await fetch(`${API}/api/saved-trips/my`, {
    credentials: 'include',
  });
  if (res.status === 401) throw new Error('LOGIN_REQUIRED');
  if (!res.ok) throw new Error('Seyahatler yüklenemedi');
  const json = await res.json();
  return json.data ?? [];
}

export async function getSavedTrip(id: string): Promise<SavedTrip> {
  const res = await fetch(`${API}/api/saved-trips/${id}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Seyahat bulunamadı');
  const json = await res.json();
  return json.data;
}

export async function saveTrip(payload: {
  title?: string;
  cityName?: string;
  stops: SavedTripStop[];
  routeData?: unknown;
  durationMinutes?: number;
  distanceKm?: number;
}): Promise<SavedTrip> {
  const res = await fetch(`${API}/api/saved-trips`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error('LOGIN_REQUIRED');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Kayıt başarısız');
  }
  const json = await res.json();
  return json.data;
}

export async function deleteSavedTrip(id: string): Promise<void> {
  await fetch(`${API}/api/saved-trips/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}
