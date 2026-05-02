import { useCallback, useEffect, useMemo, useState } from "react";
import { useOfflineStorage } from "@pocketguide/hooks";
import type { OfflineRoute } from "@pocketguide/types";
import { useRoute } from "../../context/RouteContext";
import { useSyncManagerContext } from "../../context/SyncManagerContext";
import {
  DEFAULT_ROUTE_CITY_ID,
  OFFLINE_SYNC_TOKEN,
} from "../../constants/syncConfig";
import { compositeRouteIdFromRouteData } from "../../lib/routeOffline";
import styles from "./DirectionsPanel.module.css";

export function DirectionsPanel() {
  const {
    isActive,
    routeData,
    activeLegIndex,
    activeStepIndex,
    nextStep,
    prevStep,
  } = useRoute();

  const { getRoute } = useOfflineStorage();
  const {
    downloadProgress,
    downloadError,
    isDownloading,
    deadLetterPending,
    isSyncing,
    downloadRouteForOffline,
    refreshDeadLetters,
  } = useSyncManagerContext();

  const routeCompositeId = useMemo(
    () => (routeData ? compositeRouteIdFromRouteData(routeData) : ""),
    [routeData],
  );

  const [offlineMeta, setOfflineMeta] = useState<OfflineRoute | null>(null);

  useEffect(() => {
    if (!routeCompositeId) return;
    let cancelled = false;
    void getRoute(routeCompositeId).then((r) => {
      if (!cancelled) setOfflineMeta(r ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [routeCompositeId, getRoute]);

  /** Cache güncellenince yenile (download sonrası) */
  const reloadOfflineMeta = useCallback(async () => {
    if (!routeCompositeId) return;
    const r = await getRoute(routeCompositeId);
    setOfflineMeta(r ?? null);
    void refreshDeadLetters();
  }, [routeCompositeId, getRoute, refreshDeadLetters]);

  const onDownloadOffline = async () => {
    if (!routeCompositeId) return;
    try {
      await downloadRouteForOffline(routeCompositeId, DEFAULT_ROUTE_CITY_ID);
      await reloadOfflineMeta();
    } catch {
      /* downloadError hook'ta */
    }
  };

  if (!isActive || !routeData) {
    return null;
  }

  const activeLeg = routeData.legs[activeLegIndex];
  const activeStep = activeLeg.steps[activeStepIndex];

  const totalSteps = routeData.legs.reduce((acc, leg) => acc + leg.steps.length, 0);
  let currentStepAbsolute = 0;
  for (let i = 0; i < activeLegIndex; i++) {
    currentStepAbsolute += routeData.legs[i].steps.length;
  }
  currentStepAbsolute += activeStepIndex + 1;

  const getStepIcon = (type: number) => {
    switch (type) {
      case 0:
        return "⬆️";
      case 1:
        return "➡️";
      case 2:
        return "⬅️";
      case 3:
        return "↗️";
      case 4:
        return "↖️";
      case 11:
        return "🔄";
      case 12:
        return "🏁";
      default:
        return "➡️";
    }
  };

  return (
    <div className={styles.panelContainer}>
      <div className={styles.panelHeader}>
        <div className={styles.summary}>
          <span className={styles.duration}>{routeData.total_duration_min} dk</span>
          <span className={styles.distance}>
            ({routeData.total_distance_km.toFixed(1)} km)
          </span>
        </div>
        <div className={styles.stepProgress}>
          Adım {currentStepAbsolute} / {totalSteps}
        </div>
      </div>

      <div className={styles.activeStepCard}>
        <div className={styles.stepIcon}>{getStepIcon(activeStep.type)}</div>
        <div className={styles.stepDetails}>
          <h3 className={styles.instruction}>{activeStep.instruction}</h3>
          <p className={styles.stepMetrics}>
            Kalan mesafe:{" "}
            <strong>
              {activeStep.distance < 1000
                ? `${activeStep.distance} m`
                : `${(activeStep.distance / 1000).toFixed(1)} km`}
            </strong>
          </p>
        </div>
      </div>

      <div className={styles.panelControls}>
        <button
          type="button"
          className={styles.controlBtn}
          onClick={prevStep}
          disabled={activeLegIndex === 0 && activeStepIndex === 0}
        >
          Önceki
        </button>
        <button
          type="button"
          className={styles.controlBtnPrimary}
          onClick={nextStep}
          disabled={
            activeLegIndex === routeData.legs.length - 1 &&
            activeStepIndex ===
              routeData.legs[routeData.legs.length - 1].steps.length - 1
          }
        >
          Sonraki
        </button>
      </div>

      <div className={styles.offlineSection}>
        <p className={styles.offlineTitle}>Çevrimdışı kullanım</p>
        {offlineMeta?.offlineReady ? (
          <span style={{ color: "#059669", fontWeight: 600, fontSize: "0.9rem" }}>
            ✓ Offline kullanıma hazır
          </span>
        ) : (
          <button
            type="button"
            className={styles.controlBtnPrimary}
            onClick={() => void onDownloadOffline()}
            disabled={isDownloading}
            style={{ width: "100%" }}
          >
            {isDownloading
              ? "İndiriliyor…"
              : "Offline kullanım için indir"}
          </button>
        )}
        {!OFFLINE_SYNC_TOKEN && (
          <p style={{ fontSize: "0.72rem", color: "#6b7280", margin: 0 }}>
            Favori senkronu için `VITE_OFFLINE_SYNC_SECRET` (API ile aynı) tanımlayın.
          </p>
        )}
        {isDownloading && (
          <>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.min(100, downloadProgress)}%` }}
              />
            </div>
            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
              %{Math.round(downloadProgress)}
            </span>
          </>
        )}
        {downloadError && (
          <p style={{ fontSize: "0.75rem", color: "#b91c1c", margin: 0 }}>
            {downloadError}
          </p>
        )}
        {isSyncing && (
          <p className={styles.syncSpinner}>Senkronize ediliyor…</p>
        )}
        {deadLetterPending.length > 0 && (
          <p className={styles.deadLetter}>
            Senkronize edilemeyen {deadLetterPending.length} değişiklik var
            (3 denemeden fazla). Giriş / kullanıcı id kontrol edin.
          </p>
        )}
      </div>
    </div>
  );
}
