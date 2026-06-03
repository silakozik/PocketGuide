import { useState } from "react";
import type { GeneratedRoute } from "@pocketguide/core";
import {
  ROUTE_CATEGORY_COLORS,
  ROUTE_CATEGORY_LABELS,
  formatRouteThemes,
} from "../lib/aiRoutePlanner";

interface RoutePlanDisplayProps {
  route: GeneratedRoute;
}

export function RoutePlanDisplay({ route }: RoutePlanDisplayProps) {
  const [activeDay, setActiveDay] = useState(route.plan[0]?.day ?? 1);

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
            <div className="rp-day-theme">{day.theme}</div>
            <div className="rp-stops">
              {day.stops.map((stop, i) => (
                <div key={stop.order} className="rp-stop">
                  <div className="rp-stop-timeline">
                    <div className="rp-stop-time">{stop.time}</div>
                    <div
                      className="rp-stop-dot"
                      style={{
                        backgroundColor: ROUTE_CATEGORY_COLORS[stop.category] ?? "#6b7a99",
                      }}
                    />
                    {i < day.stops.length - 1 && <div className="rp-stop-line" />}
                  </div>

                  <div className="rp-stop-body">
                    <div className="rp-stop-header">
                      <div className="rp-stop-name">{stop.name}</div>
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
                      <div className="rp-stop-address">📍 {stop.address}</div>
                    )}
                    <div className="rp-stop-tip">💡 {stop.tip}</div>
                  </div>
                </div>
              ))}
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
