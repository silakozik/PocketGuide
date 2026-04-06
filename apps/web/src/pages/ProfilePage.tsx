import { useState } from "react";
import { Link } from "react-router-dom";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";

const UPCOMING_TRIPS = [
  { id: 1, city: "Paris", country: "🇫🇷", date: "15-20 Mayıs 2026", days: 5, status: "Yaklaşan" },
  { id: 2, city: "Roma", country: "🇮🇹", date: "02-08 Eylül 2026", days: 6, status: "Planlanıyor" },
];

const SAVED_PLACES = [
  { id: 101, name: "Louvre Müzesi", type: "Müze · Paris", rating: 4.8, icon: "🏛" },
  { id: 102, name: "Kolezyum", type: "Tarihi · Roma", rating: 4.9, icon: "🏺" },
  { id: 103, name: "Gion Bölgesi", type: "Keşif · Kyoto", rating: 4.7, icon: "🏮" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("trips");

  return (
    <>
      <Nav />
      {/* Profil Header / Kapak Alanı */}
      <div className="profile-cover">
        <div className="profile-cover-bg" />
        <div className="profile-header-content">
          <div className="profile-avatar-large">
            <span>S</span>
          </div>
          <div className="profile-user-info">
            <h1>Sıla Kozik</h1>
            <p>Profesyonel Gezgin · 12 Şehir Keşfedildi</p>
          </div>
          <Link to="/map" className="profile-btn-primary">
            🗺 Yeni Rota Oluştur
          </Link>
        </div>
      </div>

      <div className="profile-layout">
        {/* Sol Menü */}
        <aside className="profile-sidebar">
          <div className="profile-nav">
            <button 
              className={`p-nav-btn ${activeTab === "trips" ? "active" : ""}`}
              onClick={() => setActiveTab("trips")}
            >
              <span className="p-nav-icon">✈️</span> Seyahatlerim
            </button>
            <button 
              className={`p-nav-btn ${activeTab === "saved" ? "active" : ""}`}
              onClick={() => setActiveTab("saved")}
            >
              <span className="p-nav-icon">🔖</span> Kaydedilenler
            </button>
            <button 
              className={`p-nav-btn ${activeTab === "stats" ? "active" : ""}`}
              onClick={() => setActiveTab("stats")}
            >
              <span className="p-nav-icon">📊</span> İstatistikler
            </button>
            <button 
              className={`p-nav-btn ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <span className="p-nav-icon">⚙️</span> Ayarlar
            </button>
          </div>
          
          <div className="profile-badge-box">
            <div className="badge-icon">👑</div>
            <h4>Kaşif Paketi Aktif</h4>
            <p>Sınırsız AI rota önerisi kullanabilirsiniz.</p>
          </div>
        </aside>

        {/* İçerik Alanı */}
        <main className="profile-content">
          
          {activeTab === "trips" && (
            <div className="p-tab-fade-in">
              <h2 className="p-section-title">Yaklaşan Seyahatler</h2>
              <div className="p-grid-2">
                {UPCOMING_TRIPS.map(trip => (
                  <div key={trip.id} className="p-card trip-card">
                    <div className="trip-card-top">
                      <div className="trip-city">{trip.country} {trip.city}</div>
                      <div className="trip-status">{trip.status}</div>
                    </div>
                    <div className="trip-date">📅 {trip.date}</div>
                    <div className="trip-meta">{trip.days} Günlük Plan Hazır</div>
                    <button className="trip-btn">Planı Görüntüle →</button>
                  </div>
                ))}
                
                {/* Yeni Ekle Kartı */}
                <Link to="/map" className="p-card add-new-card">
                  <div className="add-icon">+</div>
                  <div>Yeni Seyahat Ekle</div>
                </Link>
              </div>
            </div>
          )}

          {activeTab === "saved" && (
            <div className="p-tab-fade-in">
              <h2 className="p-section-title">Kaydedilen Mekanlar</h2>
              <div className="p-grid-3">
                {SAVED_PLACES.map(place => (
                  <div key={place.id} className="p-card place-card-mini">
                    <div className="place-mini-icon">{place.icon}</div>
                    <div className="place-mini-name">{place.name}</div>
                    <div className="place-mini-type">{place.type}</div>
                    <div className="place-mini-rating">★ {place.rating}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="p-tab-fade-in">
              <h2 className="p-section-title">Keşif İstatistikleri</h2>
              <div className="p-grid-3">
                <div className="p-card stat-card">
                  <div className="stat-value">12</div>
                  <div className="stat-label">Ziyaret Edilen Şehir</div>
                </div>
                <div className="p-card stat-card">
                  <div className="stat-value">4</div>
                  <div className="stat-label">Farklı Ülke</div>
                </div>
                <div className="p-card stat-card">
                  <div className="stat-value">18</div>
                  <div className="stat-label">Oluşturulan Rota</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="p-tab-fade-in">
              <h2 className="p-section-title">Ayarlar</h2>
              <div className="p-card settings-card">
                <p style={{color: "var(--muted)"}}>Profil ve hesap ayarları burada yer alacak.</p>
              </div>
            </div>
          )}

        </main>
      </div>
      <Footer />
    </>
  );
}
