import type {
  AuthResponseDTO,
  LoginRequestDTO,
  RegisterRequestDTO,
  UserDTO,
} from "@pocketguide/types";

import { apiFetch, apiUrl, parseApiError } from "./api";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "./authToken";

export { apiBaseUrl } from "./api";

export async function fetchCurrentUser(): Promise<UserDTO | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const res = await apiFetch("/auth/me");
  if (res.status === 401) {
    await clearAccessToken();
    return null;
  }
  if (!res.ok) throw new Error(await parseApiError(res));
  const data = (await res.json()) as AuthResponseDTO;
  return data.user;
}

export async function login(body: LoginRequestDTO): Promise<UserDTO> {
  const res = await fetch(apiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((err) => {
    const msg = err instanceof Error ? err.message : "Bağlantı hatası";
    throw new Error(msg);
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  const data = (await res.json()) as AuthResponseDTO;
  if (!data.accessToken) {
    throw new Error("Sunucu oturum anahtarı döndürmedi");
  }
  await setAccessToken(data.accessToken);
  return data.user;
}

export async function register(body: RegisterRequestDTO): Promise<UserDTO> {
  const res = await fetch(apiUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((err) => {
    const msg = err instanceof Error ? err.message : "Bağlantı hatası";
    throw new Error(msg);
  });
  if (!res.ok) throw new Error(await parseApiError(res));
  const data = (await res.json()) as AuthResponseDTO;
  if (!data.accessToken) {
    throw new Error("Sunucu oturum anahtarı döndürmedi");
  }
  await setAccessToken(data.accessToken);
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } finally {
    await clearAccessToken();
  }
}
