import { useState } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

const STOPS = [
  { time: "09:00", name: "Ayasofya", chip: "chip-culture", chipLabel: "Kültür", active: true, hasLine: true },
  { time: "11:30", name: "Topkapı Sarayı", chip: "chip-culture", chipLabel: "Kültür", active: false, hasLine: true },
  { time: "13:30", name: "Karaköy'de Öğle", chip: "chip-food", chipLabel: "Yemek", active: false, hasLine: true },
  { time: "15:00", name: "Galata Kulesi", chip: "chip-explore", chipLabel: "Keşif", active: false, hasLine: true },
  { time: "17:00", name: "T1 Tramvayı · Beyoğlu", chip: "chip-transit", chipLabel: "Ulaşım", active: false, hasLine: true },
  { time: "19:30", name: "İstiklal'de Akşam", chip: "chip-food", chipLabel: "Yemek", active: false, hasLine: false },
] as const;

const RTABS = ["Detay", "Yakınlar", "AI Öneri"] as const;
const LAYERS = ["Harita", "Metro", "Yeme-İçme"] as const;

export function DashboardPreview() {
  const ref = useScrollReveal<HTMLDivElement>();
  const [dayIndex, setDayIndex] = useState(0);
  const [rtabIndex, setRtabIndex] = useState(0);
  const [layerIndex, setLayerIndex] = useState(0);

  return (
    <div className="preview-section fu" ref={ref}>
      <div className="dashboard">
        <div className="browser-bar">
          <div className="browser-dots">
            <span className="dot-r" /><span className="dot-y" /><span className="dot-g" />
          </div>
          <div className="browser-url">app.pocketguide.co — İstanbul · Gün 1 / 4</div>
        </div>
        <div className="app-layout">
          <div className="sidebar">
            <div className="sidebar-top">
              <div className="sidebar-city-row">
                <div className="city-flag">🇹🇷</div>
                <div>
                  <div className="city-name">İstanbul</div>
                  <div className="city-meta">14–17 Mar · 4 gün · 2 kişi</div>
                </div>
              </div>
              <div className="day-tabs">
                {["G1", "G2", "G3", "G4"].map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    className={`day-tab ${i === dayIndex ? "active" : ""}`}
                    onClick={() => setDayIndex(i)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="itinerary">
              {STOPS.map((s) => (
                <div key={s.name} className={`stop ${s.active ? "active-stop" : ""}`}>
                  <div className="stop-timeline">
                    <div className={`s-dot ${s.active ? "on" : ""}`} />
                    {s.hasLine && <div className="s-line" />}
                  </div>
                  <div className="stop-body">
                    <div className="stop-time">{s.time}</div>
                    <div className="stop-name">{s.name}</div>
                    <div className={`stop-chip ${s.chip}`}>{s.chipLabel}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="sidebar-stats">
              <div className="stats-row">
                <div className="stat"><div className="stat-num">6</div><div className="stat-lbl">Durak</div></div>
                <div className="stat"><div className="stat-num">8.2</div><div className="stat-lbl">km</div></div>
                <div className="stat"><div className="stat-num">11s</div><div className="stat-lbl">Süre</div></div>
              </div>
            </div>
          </div>

          <div className="map-area">
            <div className="map-bg" />
            <div className="map-water w1" />
            <div className="map-water w2" />
            <div className="road-mh" style={{ top: "37%" }} />
            <div className="road-mh" style={{ top: "61%" }} />
            <div className="road-mv" style={{ left: "39%" }} />
            {[24, 50, 74].map((t) => <div key={t} className="road-h" style={{ top: `${t}%` }} />)}
            {[22, 57, 74].map((l) => <div key={l} className="road-v" style={{ left: `${l}%` }} />)}
            <div className="blk" style={{ width: 75, height: 48, top: "17%", left: "25%" }} />
            <div className="blk" style={{ width: 58, height: 38, top: "43%", left: "43%" }} />
            <div className="blk" style={{ width: 68, height: 52, top: "64%", left: "17%" }} />
            <svg className="route-svg" viewBox="0 0 700 620" preserveAspectRatio="none">
              <path d="M 210 195 Q 255 228 285 268 Q 315 305 335 352 Q 352 398 302 428 Q 262 448 232 478" fill="none" stroke="#c9a82a" strokeWidth={2.5} strokeDasharray="7 4" opacity={0.75} />
            </svg>
            <div className="pin-wrap" style={{ top: "27%", left: "26%" }}>
              <div className="pin-label gold">📍 Ayasofya</div>
              <div className="pin-tri gold" />
            </div>
            <div className="pin-wrap" style={{ top: "39%", left: "41%" }}>
              <div className="pin-label">Topkapı</div>
              <div className="pin-tri" />
            </div>
            <div className="pin-wrap" style={{ top: "53%", left: "37%" }}>
              <div className="pin-label">Karaköy</div>
              <div className="pin-tri" />
            </div>
            <div className="pin-wrap" style={{ top: "65%", left: "27%" }}>
              <div className="pin-label">Galata</div>
              <div className="pin-tri" />
            </div>
            <div className="map-controls">
              <div className="map-btn">+</div>
              <div className="map-btn">−</div>
              <div className="map-btn">⊕</div>
            </div>
            <div className="layers">
              {LAYERS.map((label, i) => (
                <button key={label} type="button" className={`layer ${i === layerIndex ? "on" : ""}`} onClick={() => setLayerIndex(i)}>{label}</button>
              ))}
            </div>
          </div>

          <div className="rpanel">
            <div className="rtabs">
              {RTABS.map((label, i) => (
                <button key={label} type="button" className={`rtab ${i === rtabIndex ? "on" : ""}`} onClick={() => setRtabIndex(i)}>{label}</button>
              ))}
            </div>
            <div className="rcontent">
              <div className="ai-card">
                <div className="ai-label">AI Asistan</div>
                <div className="ai-text">
                  Ayasofya kuyruğunu sabah 9'dan önce ziyaret ederek atlayabilirsin. Topkapı'ya yürüyerek geçmek (12 dk) hem keyifli hem verimli olur.
                </div>
                <div className="ai-action">Rotaya Ekle →</div>
              </div>
              <div className="place-card">
                <div className="place-img" style={{ background: "linear-gradient(135deg, #c8b8a4, #a89878)" }}>🕌</div>
                <div className="place-body">
                  <div className="place-row">
                    <div>
                      <div className="place-nm">Ayasofya</div>
                      <div className="place-type">Tarihi Yapı · Fatih</div>
                    </div>
                    <div className="place-star">★ 4.9</div>
                  </div>
                  <div className="place-meta">
                    <div className="pmeta">🕐 1.5–2 saat</div>
                    <div className="pmeta">🎫 Ücretsiz</div>
                    <div className="pmeta">🚶 Merkez</div>
                  </div>
                </div>
              </div>
              <div className="place-card">
                <div className="place-img" style={{ background: "linear-gradient(135deg, #b4c4d4, #8aaac0)" }}>🏛</div>
                <div className="place-body">
                  <div className="place-row">
                    <div>
                      <div className="place-nm">Topkapı Sarayı</div>
                      <div className="place-type">Müze · Sarayburnu</div>
                    </div>
                    <div className="place-star">★ 4.7</div>
                  </div>
                  <div className="place-meta">
                    <div className="pmeta">🕐 2–3 saat</div>
                    <div className="pmeta">🎫 450₺</div>
                    <div className="pmeta">🚶 12 dk</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
