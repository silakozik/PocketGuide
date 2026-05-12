/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_OFFLINE_SYNC_SECRET?: string;
  /** Mapbox GL public token (client-side; read-only scope). */
  readonly VITE_MAPBOX_ACCESS_TOKEN?: string;
  /** Groq API key (client-side — bundle’a gömülür; üretimde backend proxy tercih edin). */
  readonly VITE_GROQ_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
