/** Şehir slug / offline bundle için (RouteContext ile aynı). */
export const DEFAULT_ROUTE_CITY_ID = "elazig";

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

/** API `OFFLINE_SYNC_SECRET` ile aynı Bearer değeri (web `.env`). */
export const OFFLINE_SYNC_TOKEN =
  import.meta.env.VITE_OFFLINE_SYNC_SECRET ?? "";
