import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from "react";
import {
  type UseSyncManagerResult,
  useSyncManager,
} from "@pocketguide/hooks";
import { API_BASE, OFFLINE_SYNC_TOKEN } from "../constants/syncConfig";

const SyncManagerContext = createContext<UseSyncManagerResult | null>(null);

export function SyncManagerProvider({ children }: { children: ReactNode }) {
  const sync = useSyncManager(
    useMemo(
      () => ({
        apiBaseUrl: API_BASE,
        getAuthHeaders: () =>
          OFFLINE_SYNC_TOKEN
            ? { Authorization: `Bearer ${OFFLINE_SYNC_TOKEN}` }
            : {},
      }),
      [],
    ),
  );

  return (
    <SyncManagerContext.Provider value={sync}>
      {children}
    </SyncManagerContext.Provider>
  );
}

export function useSyncManagerContext(): UseSyncManagerResult {
  const ctx = useContext(SyncManagerContext);
  if (!ctx) {
    throw new Error("useSyncManagerContext requires SyncManagerProvider");
  }
  return ctx;
}
