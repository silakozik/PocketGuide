const STORAGE_KEY = "pocketguide_client_user_uuid";

/** Geçiş sürecinde favori sync için anon/local kullanıcı id (sunucuda users kaydı olmalı). */
export function getOrCreateLocalUserId(): string {
  try {
    let id = window.localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `u-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}
