import { useState, useMemo } from "react";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { TRANSPORT_CARDS, TRANSFER_ROUTES } from "../data/transfers";
import { TransferType, TransferMode } from "../types/transfer";
import "./transfers.css";

export default function TransfersPage() {
  const [selectedCity, setSelectedCity] = useState("İstanbul");
  const [activeType, setActiveType] = useState<TransferType>("all");
  const [activeMode, setActiveMode] = useState<TransferMode | "all">("all");
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());

  // Filter logic
  const filteredRoutes = useMemo(() => {
    return TRANSFER_ROUTES.filter((route) => {
      const cityMatch = route.city === selectedCity;
      const typeMatch = activeType === "all" || route.type === activeType;
      const modeMatch = activeMode === "all" || route.mode === activeMode;
      const fromMatch = route.from.toLowerCase().includes(fromQuery.toLowerCase());
      const toMatch = route.to.toLowerCase().includes(toQuery.toLowerCase());
      return cityMatch && typeMatch && modeMatch && fromMatch && toMatch;
    });
  }, [selectedCity, activeType, activeMode, fromQuery, toQuery]);

  // Find fastest route among filtered
  const fastestRouteId = useMemo(() => {
    if (filteredRoutes.length === 0) return null;
    return [...filteredRoutes].sort((a, b) => a.duration - b.duration)[0].id;
  }, [filteredRoutes]);

  const transportCard = TRANSPORT_CARDS.find((c) => c.city === selectedCity);

  const toggleRoute = (id: string) => {
    const next = new Set(expandedRoutes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRoutes(next);
  };

  const modeIcons: Record<TransferMode, string> = {
    metro: "🚇",
    bus: "🚌",
    train: "🚆",
    ferry: "⛴️",
    taxi: "🚕",
    tram: "🚃"
  };

  return (
    <div className="transfers-page">
      <Nav />
      
      <main className="transfers-container">
        <header className="transfers-header">
          <h1>Şehir içi Ulaşım Rehberi</h1>
          <p>Havalimanından merkeze, kıtalar arası geçişten gece seferlerine kadar en iyi rotalar.</p>
        </header>

        {/* Filter Panel */}
        <section className="filter-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">Şehir Seçin</label>
              <select 
                className="city-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <option value="İstanbul">İstanbul</option>
                <option value="London">London</option>
              </select>
            </div>

            <div className="filter-group" style={{ flex: 2 }}>
              <label className="filter-label">Rota Tipi</label>
              <div className="type-filters">
                {(["all", "airport", "intercity", "city"] as TransferType[]).map((t) => (
                  <button
                    key={t}
                    className={`filter-btn ${activeType === t ? "active" : ""}`}
                    onClick={() => setActiveType(t)}
                  >
                    {t === "all" ? "Tümü" : t === "airport" ? "Havalimanı" : t === "intercity" ? "Şehirlerarası" : "Şehir İçi"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group" style={{ flex: 2 }}>
              <label className="filter-label">Ulaşım Modu</label>
              <div className="mode-filters">
                <button
                  className={`filter-btn ${activeMode === "all" ? "active" : ""}`}
                  onClick={() => setActiveMode("all")}
                >
                  Tümü
                </button>
                {(["metro", "bus", "train", "ferry", "taxi", "tram"] as TransferMode[]).map((m) => (
                  <button
                    key={m}
                    className={`filter-btn ${activeMode === m ? "active" : ""}`}
                    onClick={() => setActiveMode(m)}
                  >
                    <span>{modeIcons[m]}</span> {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="search-inputs">
              <div className="search-field">
                <span className="search-icon-abs">📍</span>
                <input 
                  type="text" 
                  placeholder="Nereden..." 
                  value={fromQuery}
                  onChange={(e) => setFromQuery(e.target.value)}
                />
              </div>
              <div className="search-field">
                <span className="search-icon-abs">🏁</span>
                <input 
                  type="text" 
                  placeholder="Nereye..." 
                  value={toQuery}
                  onChange={(e) => setToQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Transport Card Info */}
        {transportCard && (
          <section className="transport-card-info">
            <div className="card-icon-large">💳</div>
            <div className="card-details">
              <h3>{transportCard.name}</h3>
              <div className="card-grid">
                <div className="card-item">
                  <div className="card-item-label">Nereden Alınır?</div>
                  <div className="card-item-value">{transportCard.whereToBuy}</div>
                </div>
                <div className="card-item">
                  <div className="card-item-label">Nasıl Doldurulur?</div>
                  <div className="card-item-value">{transportCard.howToTopUp}</div>
                </div>
                <div className="card-item">
                  <div className="card-item-label">İlk Maliyet</div>
                  <div className="card-item-value">{transportCard.initialCost}</div>
                </div>
              </div>
              {transportCard.depositWarning && (
                <div className="deposit-alert">
                  <span>⚠️</span> {transportCard.depositWarning}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Route Cards */}
        <section className="routes-grid">
          {filteredRoutes.map((route) => (
            <div key={route.id} className="route-card">
              {route.id === fastestRouteId && (
                <div className="route-badge-fastest">⚡ En Hızlı</div>
              )}
              
              <div className="route-top">
                <div className="route-mode-icon">
                  {modeIcons[route.mode]}
                </div>
                <div className="route-tags">
                  {route.duration < 40 && <span className="tag tag-speed">Hızlı</span>}
                  {route.fee.includes("₺22") && <span className="tag tag-economy">Ekonomik</span>}
                  {route.hours.includes("24") && <span className="tag tag-night">Gece Seferi</span>}
                </div>
              </div>

              <h2 className="route-name">{route.name}</h2>
              
              <div className="route-path">
                <span>{route.from}</span>
                <span className="arrow-divider">→</span>
                <span>{route.to}</span>
              </div>

              <div className="route-meta-grid">
                <div className="meta-item">
                  <span className="meta-label">Süre</span>
                  <span className="meta-value">{route.duration} dk</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Ücret</span>
                  <span className="meta-value">{route.fee}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Sıklık</span>
                  <span className="meta-value">{route.frequency}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Çalışma Saatleri</span>
                  <span className="meta-value">{route.hours}</span>
                </div>
              </div>

              <button 
                className="step-toggle-btn"
                onClick={() => toggleRoute(route.id)}
              >
                {expandedRoutes.has(route.id) ? "Adımları Gizle" : "Adım Adım Göster"}
                <span>{expandedRoutes.has(route.id) ? "▲" : "▼"}</span>
              </button>

              {expandedRoutes.has(route.id) && (
                <div className="steps-list">
                  {route.steps.map((step, idx) => (
                    <div key={idx} className="step-item">
                      <div className="step-number">{idx + 1}</div>
                      <div className="step-content">
                        <div className="step-main">{step.instruction}</div>
                        {step.subInstruction && (
                          <div className="step-sub">{step.subInstruction}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        {filteredRoutes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <p>Aradığınız kriterlere uygun rota bulunamadı.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
