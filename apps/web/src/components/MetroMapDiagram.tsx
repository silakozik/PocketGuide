import { useMemo, useState } from "react";
import type { CityMetroMap } from "../data/transfers/metroMaps";

interface MetroMapDiagramProps {
  map: CityMetroMap;
  compact?: boolean;
}

export function MetroMapDiagram({ map, compact = false }: MetroMapDiagramProps) {
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const uid = map.cityId;

  const visibleStations = useMemo(() => {
    if (!activeLineId) return map.stations;
    return map.stations.filter((s) => s.lineIds.includes(activeLineId));
  }, [map.stations, activeLineId]);

  return (
    <section className={`metro-diagram ${compact ? "metro-diagram--compact" : ""}`}>
      <div className="metro-diagram-topbar">
        <div>
          <div className="metro-diagram-title">{map.systemName}</div>
          <div className="metro-diagram-sub">{map.cityName} · şematik hat haritası</div>
        </div>
        <div className="metro-diagram-live">Rehber</div>
      </div>

      <div className="metro-diagram-canvas">
        <svg
          className="metro-diagram-svg"
          viewBox={map.viewBox}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label={`${map.cityName} metro hatları`}
        >
          <rect width="400" height="250" fill="#0d1829" rx="10" />
          <defs>
            <pattern
              id={`mg-${uid}`}
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M20 0L0 0 0 20"
                fill="none"
                stroke="rgba(255,255,255,0.025)"
                strokeWidth={1}
              />
            </pattern>
          </defs>
          <rect width="400" height="250" fill={`url(#mg-${uid})`} />

          {map.lines.map((line) => {
            const dimmed = activeLineId != null && activeLineId !== line.id;
            const stroke = line.color;
            const opacity = dimmed ? 0.2 : 1;
            const sw = activeLineId === line.id ? 6 : 4;

            if (line.geometry.type === "line") {
              const { x1, y1, x2, y2 } = line.geometry;
              return (
                <line
                  key={line.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={stroke}
                  strokeWidth={sw}
                  strokeLinecap="round"
                  opacity={opacity}
                />
              );
            }
            return (
              <path
                key={line.id}
                d={line.geometry.d}
                fill="none"
                stroke={stroke}
                strokeWidth={sw}
                strokeLinecap="round"
                opacity={opacity}
              />
            );
          })}

          {visibleStations.map((st) => {
            const primaryLine = st.lineIds[0];
            const lineColor =
              map.lines.find((l) => l.id === primaryLine)?.color ?? "#fff";
            const isHub = st.hub;
            return (
              <g key={`${st.name}-${st.x}-${st.y}`}>
                {isHub && (
                  <circle
                    cx={st.x}
                    cy={st.y}
                    r={12}
                    fill="none"
                    stroke={lineColor}
                    strokeWidth={1.5}
                    opacity={0.35}
                  />
                )}
                <circle
                  cx={st.x}
                  cy={st.y}
                  r={isHub ? 7 : 5}
                  fill="#0d1829"
                  stroke={lineColor}
                  strokeWidth={2}
                />
                <text
                  x={st.x}
                  y={st.y - (isHub ? 14 : 10)}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.85)"
                  fontSize={isHub ? 8 : 7}
                  fontFamily="DM Sans, sans-serif"
                  fontWeight={isHub ? 600 : 500}
                >
                  {st.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="metro-diagram-legend">
        <span className="metro-diagram-legend-label">Hatlar:</span>
        <button
          type="button"
          className={`metro-legend-btn ${activeLineId === null ? "active" : ""}`}
          onClick={() => setActiveLineId(null)}
        >
          Tümü
        </button>
        {map.lines.map((line) => (
          <button
            key={line.id}
            type="button"
            className={`metro-legend-btn ${activeLineId === line.id ? "active" : ""}`}
            onClick={() => setActiveLineId(activeLineId === line.id ? null : line.id)}
          >
            <span className="metro-legend-swatch" style={{ background: line.color }} />
            {line.name}
          </button>
        ))}
      </div>

      <div className="metro-diagram-tip">
        <span className="metro-diagram-tip-icon">💡</span>
        <p>{map.tip}</p>
      </div>
    </section>
  );
}
