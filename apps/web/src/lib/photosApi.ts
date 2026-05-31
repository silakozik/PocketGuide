const API = 'http://localhost:3001';

export interface TravelPhoto {
  id: string;
  imageUrl: string;
  caption: string | null;
  cityName: string | null;
  locationName: string | null;
  isPublic: boolean;
  createdAt: string;
  userId: string;
  userName?: string;
}

export async function getFeed(limit = 20): Promise<TravelPhoto[]> {
  const res = await fetch(`${API}/api/photos/feed?limit=${limit}`);
  const json = await res.json();
  return json.data ?? [];
}

export async function getUserPhotos(userId: string): Promise<TravelPhoto[]> {
  const res = await fetch(`${API}/api/photos/user/${userId}`);
  const json = await res.json();
  return json.data ?? [];
}

export async function getMyPhotos(): Promise<TravelPhoto[]> {
  const res = await fetch(`${API}/api/photos/my`, { credentials: 'include' });
  const json = await res.json();
  return json.data ?? [];
}

export async function uploadPhoto(payload: {
  imageUrl: string;
  caption?: string;
  cityName?: string;
  locationName?: string;
  isPublic?: boolean;
}): Promise<TravelPhoto> {
  const res = await fetch(`${API}/api/photos`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Yükleme başarısız');
  }
  const json = await res.json();
  return json.data;
}

export async function deletePhoto(id: string): Promise<void> {
  await fetch(`${API}/api/photos/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}
