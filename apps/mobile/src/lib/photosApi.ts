import { apiFetch, parseApiError } from "./api";

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

export async function getMyPhotos(): Promise<TravelPhoto[]> {
  const res = await apiFetch("/photos/my");
  if (!res.ok) throw new Error(await parseApiError(res));
  const json = (await res.json()) as { data?: TravelPhoto[] };
  return json.data ?? [];
}

export async function uploadPhoto(payload: {
  imageUrl: string;
  caption?: string;
  cityName?: string;
  locationName?: string;
  isPublic?: boolean;
}): Promise<TravelPhoto> {
  const res = await apiFetch("/photos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  const json = (await res.json()) as { data: TravelPhoto };
  return json.data;
}

export async function deletePhoto(id: string): Promise<void> {
  const res = await apiFetch(`/photos/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await parseApiError(res));
}
