import { apiUrl } from './api';

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

export async function getFeed(limit = 20): Promise<TravelPhoto[]> {
  const res = await fetch(apiUrl(`/photos/feed?limit=${limit}`));
  const json = await res.json();
  return json.data ?? [];
}

export async function getUserPhotos(userId: string): Promise<TravelPhoto[]> {
  const res = await fetch(apiUrl(`/photos/user/${userId}`));
  const json = await res.json();
  return json.data ?? [];
}

export async function getMyPhotos(): Promise<TravelPhoto[]> {
  const res = await fetch(apiUrl('/photos/my'), { credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? 'Fotoğraflar yüklenemedi',
    );
  }
  const json = await res.json();
  return json.data ?? [];
}

export async function getPhotoDetail(id: string): Promise<{ data: PhotoDetail }> {
  const res = await fetch(apiUrl(`/photos/${id}`));
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Fotoğraf bulunamadı');
  }
  return res.json();
}

export async function getPhotoComments(id: string): Promise<{ data: PhotoComment[] }> {
  const res = await fetch(apiUrl(`/photos/${id}/comments`));
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Yorumlar yüklenemedi');
  }
  return res.json();
}

export async function likePhoto(id: string): Promise<{ likeCount: number }> {
  const res = await fetch(apiUrl(`/photos/${id}/like`), {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Beğeni eklenemedi');
  }
  const json = await res.json();
  return { likeCount: json.likeCount ?? 0 };
}

export async function addPhotoComment(
  id: string,
  body: string,
): Promise<{ data: PhotoComment }> {
  const res = await fetch(apiUrl(`/photos/${id}/comments`), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Yorum eklenemedi');
  }
  return res.json();
}

export async function uploadPhoto(payload: {
  imageUrl: string;
  caption?: string;
  cityName?: string;
  locationName?: string;
  isPublic?: boolean;
}): Promise<TravelPhoto> {
  const res = await fetch(apiUrl('/photos'), {
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
  const res = await fetch(apiUrl(`/photos/${id}`), {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? 'Fotoğraf silinemedi',
    );
  }
}
