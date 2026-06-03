import { useRef, useState, useEffect } from "react";
import { INTERESTS } from "./OnboardingPage";
import { Link, useNavigate } from "react-router-dom";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { getMyProfile, updateAvatar } from "../lib/profileApi";
import {
  getMyPhotos,
  uploadPhoto,
  deletePhoto,
  type TravelPhoto,
} from "../lib/photosApi";
import {
  PhotoDetailModal,
  type PhotoDetailInitial,
} from "../components/PhotoDetailModal";
import {
  getMySavedTrips,
  deleteSavedTrip,
  type SavedTrip,
} from "../lib/savedTripsApi";
import { isAiPlannerTrip } from "../lib/aiRoutePlanner";

const SAVED_PLACES = [
  { id: 101, name: "Louvre Müzesi", type: "Müze · Paris", rating: 4.8, icon: "🏛" },
  { id: 102, name: "Kolezyum", type: "Tarihi · Roma", rating: 4.9, icon: "🏺" },
  { id: 103, name: "Gion Bölgesi", type: "Keşif · Kyoto", rating: 4.7, icon: "🏮" },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("trips");
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<TravelPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadCity, setUploadCity] = useState("");
  const [uploadLocation, setUploadLocation] = useState("");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadIsPublic, setUploadIsPublic] = useState(true);
  const photoFileRef = useRef<HTMLInputElement>(null);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoDetailInitial | null>(
    null,
  );

  const displayName = user?.userName ?? "Gezgin";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  useEffect(() => {
    getMyProfile()
      .then((p) => {
        if (p?.avatarUrl) setAvatarUrl(p.avatarUrl);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("pg_user_interests");
    if (saved) {
      try {
        setUserInterests(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "trips" || !user) return;
    setTripsLoading(true);
    getMySavedTrips()
      .then(setSavedTrips)
      .catch(() => setSavedTrips([]))
      .finally(() => setTripsLoading(false));
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab !== "photos") return;
    setPhotosLoading(true);
    getMyPhotos()
      .then(setPhotos)
      .catch(() => {})
      .finally(() => setPhotosLoading(false));
  }, [activeTab]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Fotoğraf 2MB'dan küçük olmalı");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setAvatarLoading(true);
      setAvatarError(null);
      try {
        await updateAvatar(base64);
        setAvatarUrl(base64);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Yükleme başarısız";
        setAvatarError(message);
      } finally {
        setAvatarLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleInterest = (id: string) => {
    setUserInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const saveInterests = () => {
    localStorage.setItem("pg_user_interests", JSON.stringify(userInterests));
    setIsEditingInterests(false);
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Fotoğraf 5MB'dan küçük olmalı");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadPreview(ev.target?.result as string);
      setShowUploadModal(true);
      setPhotoError(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handlePhotoUpload = async () => {
    if (!uploadPreview) return;
    setPhotoUploading(true);
    setPhotoError(null);
    try {
      const newPhoto = await uploadPhoto({
        imageUrl: uploadPreview,
        caption: uploadCaption || undefined,
        cityName: uploadCity || undefined,
        locationName: uploadLocation || undefined,
        isPublic: uploadIsPublic,
      });
      setPhotos((prev) => [newPhoto, ...prev]);
      setShowUploadModal(false);
      setUploadPreview(null);
      setUploadCaption("");
      setUploadCity("");
      setUploadLocation("");
      setUploadIsPublic(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Yükleme başarısız";
      setPhotoError(message);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoDelete = async (id: string) => {
    if (!window.confirm('Bu fotoğrafı silmek istediğine emin misin?')) return;
    try {
      await deletePhoto(id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      window.dispatchEvent(new CustomEvent('pg-photos-changed'));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Fotoğraf silinemedi';
      setPhotoError(message);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    await deleteSavedTrip(id);
    setSavedTrips((prev) => prev.filter((t) => t.id !== id));
  };

  const formatTripDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <>
      <Nav />
      {/* Profil Header / Kapak Alanı */}
      <div className="profile-cover">
        <div className="profile-cover-bg" />
        <div className="profile-header-content">
          <div className="profile-avatar-wrap">
            <div
              className="profile-avatar-large profile-avatar-clickable"
              onClick={() => fileInputRef.current?.click()}
              title="Fotoğraf değiştir"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profil fotoğrafı"
                  className="profile-avatar-img"
                />
              ) : (
                <span>{avatarLetter}</span>
              )}
              {avatarLoading && (
                <div className="profile-avatar-overlay">
                  <span className="profile-avatar-spinner" />
                </div>
              )}
              {!avatarLoading && (
                <div className="profile-avatar-overlay profile-avatar-hover-overlay">
                  <span>📷</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />

            {avatarError && (
              <div className="profile-avatar-error">{avatarError}</div>
            )}
          </div>
          <div className="profile-user-info">
            <h1>{displayName}</h1>
            <p>{user?.email}</p>
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
              className={`p-nav-btn ${activeTab === "photos" ? "active" : ""}`}
              onClick={() => setActiveTab("photos")}
            >
              <span className="p-nav-icon">📸</span> Fotoğraflarım
            </button>
            <button 
              className={`p-nav-btn ${activeTab === "interests" ? "active" : ""}`}
              onClick={() => setActiveTab("interests")}
            >
              <span className="p-nav-icon">🎯</span> İlgi Alanları
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
              <h2 className="p-section-title">Seyahatlerim</h2>
              {tripsLoading ? (
                <div className="p-loading">Yükleniyor...</div>
              ) : (
                <div className="p-grid-2">
                  {savedTrips.map((trip) => (
                    <div key={trip.id} className="p-card trip-card">
                      <div className="trip-card-top">
                        <div className="trip-city">
                          {trip.cityName || trip.title}
                        </div>
                        <div className="trip-status">
                          {trip.status === "planned" ? "Planlandı" : trip.status}
                        </div>
                      </div>
                      <div className="trip-date">
                        📅 {formatTripDate(trip.createdAt)}
                      </div>
                      <div className="trip-meta">
                        {trip.stops.length} durak
                        {trip.durationMinutes != null &&
                          ` · ${trip.durationMinutes} dk`}
                        {trip.distanceKm != null &&
                          ` · ${trip.distanceKm.toFixed(1)} km`}
                      </div>
                      <div className="trip-card-actions">
                        <Link
                          to={
                            isAiPlannerTrip(trip)
                              ? `/plan/saved/${trip.id}`
                              : `/map?savedTrip=${trip.id}`
                          }
                          className="trip-btn"
                        >
                          Planı Görüntüle →
                        </Link>
                        <button
                          type="button"
                          className="trip-btn trip-btn-delete"
                          onClick={() => void handleDeleteTrip(trip.id)}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}

                  {savedTrips.length === 0 && (
                    <div className="p-empty-state" style={{ gridColumn: "1 / -1" }}>
                      <span>✈️</span>
                      <p>
                        Henüz kayıtlı rota yok. Haritada rota oluşturup
                        &quot;Seyahatlerime Kaydet&quot; ile ekleyebilirsin.
                      </p>
                    </div>
                  )}

                  <Link to="/map" className="p-card add-new-card">
                    <div className="add-icon">+</div>
                    <div>Yeni Rota Oluştur</div>
                  </Link>
                </div>
              )}
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

          {activeTab === "interests" && (
            <div className="p-tab-fade-in">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 className="p-section-title" style={{ margin: 0 }}>İlgi Alanlarım</h2>
                <button 
                  className="profile-btn-primary" 
                  style={{ padding: "0.5rem 1rem", fontSize: "0.9rem", border: "none", cursor: "pointer", borderRadius: "8px", background: "var(--ink)", color: "var(--gold)" }}
                  onClick={() => {
                    if (isEditingInterests) {
                      saveInterests();
                    } else {
                      setIsEditingInterests(true);
                    }
                  }}
                >
                  {isEditingInterests ? "Kaydet" : "Düzenle"}
                </button>
              </div>
              
              <div className="interests-grid" style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: "1rem"
              }}>
                {INTERESTS.map(interest => {
                  const isSelected = userInterests.includes(interest.id);
                  if (!isEditingInterests && !isSelected) return null; // Hide non-selected if not editing
                  
                  return (
                    <div 
                      key={interest.id}
                      className={`interest-card ${isSelected ? "selected" : ""}`}
                      onClick={() => isEditingInterests && toggleInterest(interest.id)}
                      style={{ 
                        cursor: isEditingInterests ? "pointer" : "default",
                        opacity: !isEditingInterests && !isSelected ? 0.5 : 1,
                        background: isSelected ? "var(--ink)" : "var(--white)",
                        color: isSelected ? "var(--gold)" : "var(--ink)",
                        border: "1px solid var(--border)",
                        borderRadius: "16px",
                        padding: "1.5rem 1rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}
                    >
                      <span className="interest-icon" style={{ fontSize: "2rem" }}>{interest.icon}</span>
                      <span className="interest-label" style={{ fontWeight: 500 }}>{interest.label}</span>
                    </div>
                  );
                })}
                {!isEditingInterests && userInterests.length === 0 && (
                  <p style={{ color: "var(--muted)", gridColumn: "1 / -1" }}>Henüz ilgi alanı seçilmemiş.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "photos" && (
            <div className="p-tab-fade-in">
              <div className="p-section-header">
                <h2 className="p-section-title">Seyahat Fotoğraflarım</h2>
                <button
                  type="button"
                  className="profile-btn-primary"
                  onClick={() => photoFileRef.current?.click()}
                >
                  + Fotoğraf Ekle
                </button>
              </div>

              <input
                ref={photoFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={handlePhotoFileChange}
              />

              {photosLoading ? (
                <div className="p-loading">Yükleniyor...</div>
              ) : photos.length === 0 ? (
                <div className="p-empty-state">
                  <span>📸</span>
                  <p>Henüz fotoğraf yok. İlk fotoğrafını ekle!</p>
                </div>
              ) : (
                <div className="photos-grid">
                  {photos.map((photo) => (
                    <div key={photo.id} className="photo-card">
                      <div
                        className="photo-card-img-wrap photo-card-open"
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          setSelectedPhoto({
                            id: photo.id,
                            imageUrl: photo.imageUrl,
                            caption: photo.caption,
                            cityName: photo.cityName,
                            locationName: photo.locationName,
                            createdAt: photo.createdAt,
                            userId: photo.userId,
                            userName: displayName,
                            isPublic: photo.isPublic,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedPhoto({
                              id: photo.id,
                              imageUrl: photo.imageUrl,
                              caption: photo.caption,
                              cityName: photo.cityName,
                              locationName: photo.locationName,
                              createdAt: photo.createdAt,
                              userId: photo.userId,
                              userName: displayName,
                              isPublic: photo.isPublic,
                            });
                          }
                        }}
                      >
                        <img
                          src={photo.imageUrl}
                          alt={photo.caption ?? "Seyahat fotoğrafı"}
                          className="photo-card-img"
                        />
                        <button
                          type="button"
                          className="photo-card-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePhotoDelete(photo.id);
                          }}
                          title="Sil"
                        >
                          ×
                        </button>
                        {!photo.isPublic && (
                          <span className="photo-card-private">🔒 Gizli</span>
                        )}
                      </div>
                      {(photo.caption || photo.cityName) && (
                        <div className="photo-card-info">
                          {photo.cityName && (
                            <div className="photo-card-city">
                              📍 {photo.cityName}
                              {photo.locationName ? ` · ${photo.locationName}` : ""}
                            </div>
                          )}
                          {photo.caption && (
                            <div className="photo-card-caption">{photo.caption}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {showUploadModal && uploadPreview && (
                <div
                  className="photo-modal-overlay"
                  onClick={() => setShowUploadModal(false)}
                >
                  <div
                    className="photo-modal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="photo-modal-title">Fotoğraf Paylaş</h3>
                    <img
                      src={uploadPreview}
                      alt="Önizleme"
                      className="photo-modal-preview"
                    />
                    <div className="photo-modal-fields">
                      <input
                        type="text"
                        placeholder="Açıklama ekle..."
                        value={uploadCaption}
                        onChange={(e) => setUploadCaption(e.target.value)}
                        className="photo-modal-input"
                      />
                      <input
                        type="text"
                        placeholder="Şehir (örn. İstanbul)"
                        value={uploadCity}
                        onChange={(e) => setUploadCity(e.target.value)}
                        className="photo-modal-input"
                      />
                      <input
                        type="text"
                        placeholder="Mekan adı (opsiyonel)"
                        value={uploadLocation}
                        onChange={(e) => setUploadLocation(e.target.value)}
                        className="photo-modal-input"
                      />
                      <label className="photo-modal-toggle">
                        <input
                          type="checkbox"
                          checked={uploadIsPublic}
                          onChange={(e) => setUploadIsPublic(e.target.checked)}
                        />
                        Herkese açık paylaş
                      </label>
                    </div>
                    {photoError && (
                      <p className="photo-modal-error">{photoError}</p>
                    )}
                    <div className="photo-modal-actions">
                      <button
                        type="button"
                        className="photo-modal-cancel"
                        onClick={() => setShowUploadModal(false)}
                      >
                        İptal
                      </button>
                      <button
                        type="button"
                        className="photo-modal-submit"
                        onClick={handlePhotoUpload}
                        disabled={photoUploading}
                      >
                        {photoUploading ? "Yükleniyor..." : "Paylaş"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="p-tab-fade-in">
              <h2 className="p-section-title">Ayarlar</h2>
              <div className="p-card settings-card">
                <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>
                  Hesap: {user?.email}
                </p>
                <button
                  type="button"
                  className="profile-btn-primary"
                  style={{
                    background: "transparent",
                    color: "#b42318",
                    border: "1px solid rgba(180, 35, 24, 0.35)",
                  }}
                  onClick={handleLogout}
                >
                  Çıkış yap
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
      <Footer />
      {selectedPhoto && (
        <PhotoDetailModal
          photoId={selectedPhoto.id}
          initialPhoto={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
        />
      )}
    </>
  );
}
