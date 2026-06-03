import { apiUrl } from './api';

export async function getMyProfile() {
  const res = await fetch(apiUrl('/profile/me'), { credentials: 'include' });
  if (!res.ok) throw new Error('Profile fetch failed');
  return res.json();
}

export async function updateAvatar(avatarUrl: string) {
  const res = await fetch(apiUrl('/profile/avatar'), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatarUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? 'Avatar update failed');
  }
  return res.json();
}
