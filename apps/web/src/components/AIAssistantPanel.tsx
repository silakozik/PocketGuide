import { useEffect, useState } from "react";

import { useAIAssistant } from "../context/AIAssistantContext";
import { fetchTravelRecommendationsFromGroq } from "../lib/groqRecommendations";

/**
 * Gezi Asistanı paneli — Nav üzerinden açılır.
 * Yakındaki POI'lar `/api/pois/nearby`; metin Groq ile üretilir (`VITE_GROQ_API_KEY`).
 */
export function AIAssistantPanel() {
  const { isOpen, close, coords } = useAIAssistant();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTravelRecommendationsFromGroq(coords.lat, coords.lng);
      setRecommendations(data);
    } catch (err: unknown) {
      console.error("Failed to fetch AI recommendations", err);
      setError(err instanceof Error ? err.message : "Öneriler getirilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    void fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- panel açılışı / konum değişimi
  }, [isOpen, coords.lat, coords.lng]);

  if (!isOpen) return null;

  return (
    <div className="ai-assistant-panel">
      <div className="ai-header">
        <div className="ai-header-title">
          <span className="ai-sparkle">✨</span>
          <h3>Gezi Asistanı</h3>
        </div>
        <button type="button" className="ai-close-btn" onClick={close} aria-label="Kapat">
          ×
        </button>
      </div>

      <div className="ai-content">
        {loading ? (
          <div className="ai-loading-wrap">
            <div className="ai-spinner" />
            <p>Öneriler hazırlanıyor...</p>
          </div>
        ) : error ? (
          <div className="ai-empty-state">
            <span className="ai-empty-icon" style={{ filter: "grayscale(1)" }}>
              ⚠️
            </span>
            <p>{error}</p>
            <button type="button" className="ai-btn-primary" onClick={() => void fetchRecommendations()}>
              Tekrar Dene
            </button>
          </div>
        ) : Array.isArray(recommendations) && recommendations.length > 0 ? (
          <div className="ai-recs-list">
            {recommendations.map((rec: any) => (
              <div key={rec.placeId} className="ai-rec-card">
                <div className="ai-rec-header">
                  <span className="ai-rec-name">{rec.name}</span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                    <span className="ai-rec-category">{rec.category}</span>
                    <span className="ai-rec-badge">{rec.badge}</span>
                  </div>
                </div>
                <p className="ai-rec-reason">{rec.reason}</p>
                <div className="ai-rec-meta">
                  <span className="ai-meta-item">📍 {rec.walkingDistanceMeters}m</span>
                  <span className="ai-meta-item">🕒 {rec.estimatedVisitMinutes} dk</span>
                </div>
                <div className="ai-rec-action">Rotayı Başlat →</div>
              </div>
            ))}

            <button
              type="button"
              className="ai-btn-primary"
              style={{ marginTop: "16px", width: "100%" }}
              onClick={() => void fetchRecommendations()}
            >
              Önerileri Yenile
            </button>
          </div>
        ) : recommendations && recommendations.length === 0 ? (
          <div className="ai-empty-state">
            <span className="ai-empty-icon">🏜️</span>
            <p>
              Bu harita merkezinin yakınında (yaklaşık 2 km) yer bulunamadı veya asistan öneri üretemedi.
              Haritayı pinlerin yoğun olduğu bir alana kaydırıp yenileyin.
            </p>
            <button type="button" className="ai-btn-primary" onClick={() => void fetchRecommendations()}>
              Yenile
            </button>
          </div>
        ) : (
          <div className="ai-empty-state">
            <span className="ai-empty-icon">📍</span>
            <p>Çevrendeki en iyi deneyimler için hazır mısın?</p>
            <button type="button" className="ai-btn-primary" onClick={() => void fetchRecommendations()}>
              Bana Öneriler Getir
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
