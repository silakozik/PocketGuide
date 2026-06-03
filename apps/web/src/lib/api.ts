/**
 * Oturum çerezi için aynı origin kullan (/api → Vite dev proxy).
 * Doğrudan localhost:3001 çerez göndermez; yenilemede /photos/my 401 olur.
 */
export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized.startsWith('/api') ? normalized : `/api${normalized}`;
}
