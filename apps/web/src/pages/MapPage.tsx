import { useState } from "react";
import { Link } from "react-router-dom";
import { PocketGuideMap } from "../components/map/PocketGuideMap";

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

  return (
    <div className="mapPageRoot">
      {/* Harita Üstü Yüzen Arayüz (Floating UI) */}
      <div className="map-floating-header">
        
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
    </div>
  );
}
