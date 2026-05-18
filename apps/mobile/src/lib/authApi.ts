import type {
  AuthResponseDTO,
  LoginRequestDTO,
  RegisterRequestDTO,
  UserDTO,
} from "@pocketguide/types";

import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "./authToken";

export function apiBaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3001"
  ).replace(/\/$/, "");
}

async function authHeaders(): Promise<HeadersInit> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (Array.isArray(data.message)) return data.message.join(", ");
    if (typeof data.message === "string") return data.message;
  } catch {
    /* ignore */
  }
  return res.status === 401
    ? "E-posta veya şifre hatalı"
    : "İstek başarısız oldu";
}

export async function fetchCurrentUser(): Promise<UserDTO | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const res = await fetch(`${apiBaseUrl()}/api/auth/me`, {
    headers: await authHeaders(),
  });
  if (res.status === 401) {
    await clearAccessToken();
    return null;
  }
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as AuthResponseDTO;
  return data.user;
}

export async function login(body: LoginRequestDTO): Promise<UserDTO> {
  const res = await fetch(`${apiBaseUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as AuthResponseDTO;
  if (!data.accessToken) {
    throw new Error("Sunucu oturum anahtarı döndürmedi");
  }
  await setAccessToken(data.accessToken);
  return data.user;
}

export async function register(body: RegisterRequestDTO): Promise<UserDTO> {
  const res = await fetch(`${apiBaseUrl()}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = (await res.json()) as AuthResponseDTO;
  if (!data.accessToken) {
    throw new Error("Sunucu oturum anahtarı döndürmedi");
  }
  await setAccessToken(data.accessToken);
  return data.user;
}

export async function logout(): Promise<void> {
  const headers = await authHeaders();
  try {
    await fetch(`${apiBaseUrl()}/api/auth/logout`, {
      method: "POST",
      headers,
    });
  } finally {
    await clearAccessToken();
  }
}
