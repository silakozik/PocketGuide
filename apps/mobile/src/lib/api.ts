import { Platform } from "react-native";

import { getAccessToken } from "./authToken";

const DEFAULT_PORT = 3001;

/** Android emülatörde localhost = emülatörün kendisi; bilgisayar = 10.0.2.2 */
function defaultHost(): string {
  if (Platform.OS === "android") return "10.0.2.2";
  return "localhost";
}

/**
 * Nest API kökü (path’e /api eklenir).
 * EXPO_PUBLIC_API_BASE_URL=http://localhost:3001 → Android’de otomatik 10.0.2.2’ye çevrilir.
 * Fiziksel cihaz: bilgisayarın LAN IP’si (örn. http://192.168.1.42:3001)
 */
export function apiBaseUrl(): string {
  let base =
    process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    `http://${defaultHost()}:${DEFAULT_PORT}`;

  if (Platform.OS === "android" && /\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(base)) {
    base = base.replace(/\/\/(localhost|127\.0\.0\.1)/, "//10.0.2.2");
  }

  return base;
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const suffix = normalized.startsWith("/api") ? normalized : `/api${normalized}`;
  return `${apiBaseUrl()}${suffix}`;
}

export async function authHeaders(): Promise<HeadersInit> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = await authHeaders();
  const merged: HeadersInit = {
    ...headers,
    ...(init?.headers as Record<string, string> | undefined),
  };
  try {
    return await fetch(apiUrl(path), { ...init, headers: merged });
  } catch (err) {
    const hint =
      Platform.OS === "android"
        ? " Android emülatörde API adresi 10.0.2.2:3001 olmalı; apps/api sunucusunun çalıştığından emin olun."
        : " API sunucusunun (apps/api, port 3001) çalıştığından emin olun.";
    const msg = err instanceof Error ? err.message : "Bağlantı hatası";
    throw new Error(`${msg}.${hint}`);
  }
}

export async function parseApiError(res: Response): Promise<string> {
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
