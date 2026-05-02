import { useState } from "react";
import { Link } from "react-router-dom";
import { PocketGuideMap } from "../components/map/PocketGuideMap";
import { AIAssistant } from "../components/AIAssistant";
import { RouteProvider } from "../context/RouteContext";
import { SyncManagerProvider } from "../context/SyncManagerContext";
import { DirectionsPanel } from "../components/navigation/DirectionsPanel";
import { RouteControls } from "../components/navigation/RouteControls";
import { useNetworkStatus } from "@pocketguide/hooks";

const CATEGORIES = [
  { id: "all", label: "Tümü", icon: "✨" },
  { id: "culture", label: "Kültür", icon: "🏛" },
  { id: "food", label: "Yeme-İçme", icon: "🍔" },
  { id: "transit", label: "Ulaşım", icon: "🚇" },
  { id: "accommodation", label: "Konaklama", icon: "🏨" },
];

export default function MapPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { isOnline } = useNetworkStatus();

  return (
    <RouteProvider>
      <SyncManagerProvider>
      <div className="mapPageRoot">
        {/* Harita Üstü Yüzen Arayüz (Floating UI) */}
        <div className="map-floating-header">
          {!isOnline && (
            <div
              style={{
                position: "absolute",
                top: "72px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1200,
                background: "#f59e0b",
                color: "#1f2937",
                fontWeight: 600,
                padding: "8px 12px",
                borderRadius: "999px",
                fontSize: "0.82rem",
                boxShadow: "0 4px 18px rgba(0,0,0,0.15)",
              }}
            >
              Cevrimdisi moddasiniz — kayitli veriler gosteriliyor
            </div>
          )}
          
          {/* Sol: Geri Butonu */}
          <Link to="/" className="mapBackBtn">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Geri
          </Link>
          
          <Link to="/istanbul/first-day" className="first-day-guide-badge">
            <span className="icon">💡</span>
            <span className="text">İlk Gün Rehberi</span>
          </Link>
          
          {/* Orta: Arama ve Filtreler */}
          <div className="map-search-container">
            <div className="map-search-bar">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Mekan, müze, restoran ara..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="map-filters">
              {CATEGORIES.map(c => (
                <button 
                  key={c.id}
                  type="button" 
                  className={`map-filter-chip ${activeCategory === c.id ? "active" : ""}`}
                  onClick={() => setActiveCategory(c.id)}
                >
                  <span>{c.icon}</span> {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sağ: Profil Linki */}
          <Link to="/profile" className="map-profile-btn">
            <div className="profile-avatar">S</div>
          </Link>
        </div>

        {/* Harita Bileşeni */}
        <div className="map-container-wrapper">
          <PocketGuideMap categoryFilter={activeCategory} searchQuery={searchQuery} />
        </div>

        <RouteControls />
        <DirectionsPanel />

        {/* AI Asistan Paneli */}
        <AIAssistant />
      </div>
      </SyncManagerProvider>
    </RouteProvider>
  );
}
