import { apiFetch, parseApiError } from "./api";

export async function getMyProfile(): Promise<{ avatarUrl?: string | null } | null> {
  const res = await apiFetch("/profile/me");
  if (!res.ok) return null;
  return res.json();
}

export async function updateAvatar(avatarUrl: string): Promise<void> {
  const res = await apiFetch("/profile/avatar", {
    method: "PUT",
    body: JSON.stringify({ avatarUrl }),
  });
  if (!res.ok) throw new Error(await parseApiError(res));
}
