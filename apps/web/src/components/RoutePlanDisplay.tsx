import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { GeneratedRoute } from "@pocketguide/core";
import {
  ROUTE_CATEGORY_COLORS,
  ROUTE_CATEGORY_LABELS,
  formatRouteThemes,
} from "../lib/aiRoutePlanner";
import { navigateToDayOnMap, navigateToStopOnMap } from "../lib/aiRouteMap";

interface RoutePlanDisplayProps {
  route: GeneratedRoute;
  tripId?: string;
}

export function RoutePlanDisplay({ route, tripId }: RoutePlanDisplayProps) {
  const navigate = useNavigate();
  const [activeDay, setActiveDay] = useState(route.plan[0]?.day ?? 1);
  const [mapLoadingDay, setMapLoadingDay] = useState<number | null>(null);
  const [mapLoadingStop, setMapLoadingStop] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const openDayOnMap = async (dayNumber: number) => {
    setMapError(null);
    setMapLoadingDay(dayNumber);
    try {
      const result = await navigateToDayOnMap(navigate, route, dayNumber, tripId);
      if (!result.ok) {
        setMapError("Bu günün mekanları haritada bulunamadı.");
        return;
      }
      if (result.found < result.total) {
        setMapError(
          `${result.found}/${result.total} mekan haritaya eklendi. Eksik adresler için mekan adına tıklayabilirsin.`,
        );
      }
    } catch {
      setMapError("Harita yüklenirken hata oluştu.");
    } finally {
      setMapLoadingDay(null);
    }
  };

  const openStopOnMap = async (stopKey: string, stop: GeneratedRoute["plan"][0]["stops"][0]) => {
    setMapError(null);
    setMapLoadingStop(stopKey);
    try {
      const ok = await navigateToStopOnMap(
        navigate,
        stop,
        route.city,
        route.cityNameEn,
      );
      if (!ok) setMapError("Mekan haritada bulunamadı. Adresi kontrol edin.");
    } catch {
      setMapError("Harita yüklenirken hata oluştu.");
    } finally {
      setMapLoadingStop(null);
    }
  };

  return (
    <>
      <div className="rp-route-header">
        <h2 className="rp-route-title">{route.title}</h2>
        <p className="rp-route-summary">{route.summary}</p>
        <div className="rp-route-meta">
          <span>📍 {route.city}</span>
          <span>📅 {route.days} Gün</span>
          <span>{formatRouteThemes(route)}</span>
        </div>
      </div>

      {mapError && <div className="rp-error">{mapError}</div>}

      <div className="rp-day-tabs">
        {route.plan.map((day) => (
          <button
            key={day.day}
            type="button"
            className={`rp-day-tab ${activeDay === day.day ? "active" : ""}`}
            onClick={() => setActiveDay(day.day)}
          >
            <span className="rp-day-tab-num">{day.day}. Gün</span>
            <span className="rp-day-tab-title">{day.title}</span>
          </button>
        ))}
      </div>

      {route.plan
        .filter((d) => d.day === activeDay)
        .map((day) => (
          <div key={day.day} className="rp-day-plan">
            <div className="rp-day-plan-head">
              <div className="rp-day-theme">{day.theme}</div>
              <button
                type="button"
                className="rp-day-map-btn"
                disabled={mapLoadingDay === day.day}
                onClick={() => void openDayOnMap(day.day)}
              >
                {mapLoadingDay === day.day ? (
                  <>
                    <span className="rp-spinner rp-spinner--dark" />
                    Mekanlar aranıyor ({day.stops.length})…
                  </>
                ) : (
                  <>🗺 {day.day}. Günü Haritada Gör</>
                )}
              </button>
            </div>

            <div className="rp-stops">
              {day.stops.map((stop, i) => {
                const stopKey = `day${day.day}-stop${stop.order}`;
                const loading = mapLoadingStop === stopKey;

                return (
                  <div key={stop.order} className="rp-stop">
                    <div className="rp-stop-timeline">
                      <div className="rp-stop-time">{stop.time}</div>
                      <div
                        className="rp-stop-dot"
                        style={{
                          backgroundColor:
                            ROUTE_CATEGORY_COLORS[stop.category] ?? "#6b7a99",
                        }}
                      />
                      {i < day.stops.length - 1 && <div className="rp-stop-line" />}
                    </div>

                    <div className="rp-stop-body">
                      <div className="rp-stop-header">
                        <button
                          type="button"
                          className="rp-stop-name rp-stop-link"
                          disabled={loading}
                          onClick={() => void openStopOnMap(stopKey, stop)}
                        >
                          {loading ? "…" : stop.name}
                        </button>
                        <span
                          className="rp-stop-cat"
                          style={{
                            background:
                              (ROUTE_CATEGORY_COLORS[stop.category] ?? "#6b7a99") + "18",
                            color: ROUTE_CATEGORY_COLORS[stop.category] ?? "#6b7a99",
                          }}
                        >
                          {ROUTE_CATEGORY_LABELS[stop.category] ?? "📍 Diğer"}
                        </span>
                      </div>
                      <div className="rp-stop-type">
                        {stop.type} · {stop.duration}
                      </div>
                      <p className="rp-stop-desc">{stop.description}</p>
                      {stop.address && (
                        <button
                          type="button"
                          className="rp-stop-address rp-stop-link"
                          disabled={loading}
                          onClick={() => void openStopOnMap(stopKey, stop)}
                        >
                          📍 {stop.address}
                        </button>
                      )}
                      {!stop.address && (
                        <button
                          type="button"
                          className="rp-stop-map-link"
                          disabled={loading}
                          onClick={() => void openStopOnMap(stopKey, stop)}
                        >
                          🗺 Haritada göster
                        </button>
                      )}
                      <div className="rp-stop-tip">💡 {stop.tip}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

      {route.tips.length > 0 && (
        <div className="rp-tips-section">
          <h3 className="rp-tips-title">✈️ Genel Seyahat İpuçları</h3>
          <ul className="rp-tips-list">
            {route.tips.map((tip, i) => (
              <li key={i} className="rp-tip-item">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
