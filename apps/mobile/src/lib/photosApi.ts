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

export interface PhotoDetail {
  id: string;
  imageUrl: string;
  caption: string | null;
  cityName: string | null;
  locationName: string | null;
  createdAt: string;
  userId: string;
  userName: string;
  likeCount: number;
}

export interface PhotoComment {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  userName: string;
}

export async function getPhotoDetail(id: string): Promise<{ data: PhotoDetail }> {
  const res = await apiFetch(`/photos/${id}`);
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}

export async function getPhotoComments(id: string): Promise<{ data: PhotoComment[] }> {
  const res = await apiFetch(`/photos/${id}/comments`);
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}

export async function likePhoto(id: string): Promise<{ likeCount: number }> {
  const res = await apiFetch(`/photos/${id}/like`, { method: "POST" });
  if (!res.ok) throw new Error(await parseApiError(res));
  const json = (await res.json()) as { likeCount?: number };
  return { likeCount: json.likeCount ?? 0 };
}

export async function addPhotoComment(
  id: string,
  body: string,
): Promise<{ data: PhotoComment }> {
  const res = await apiFetch(`/photos/${id}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  return res.json();
}
