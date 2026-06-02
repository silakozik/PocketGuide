import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { useAIAssistant } from "../context/AIAssistantContext";
import {
  askGroqTravelAssistant,
  fetchTravelRecommendationsFromGroq,
  type TravelRecommendation,
} from "../lib/groqRecommendations";
import { geocodeCity } from "../lib/geocode";

/**
 * Gezi Asistanı paneli — Nav üzerinden açılır.
 * Yakındaki POI'lar `/api/pois/nearby`; metin Groq ile üretilir (`VITE_GROQ_API_KEY`).
 */
export function AIAssistantPanel() {
  const { isOpen, close, coords } = useAIAssistant();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<TravelRecommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const [assistantReply, setAssistantReply] = useState<string | null>(null);
  const [effectiveCoords, setEffectiveCoords] = useState(coords);

  const normalizeTurkishChars = (value: string) =>
    value
      .toLowerCase()
      .replace(/ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ş/g, "s")
      .replace(/ü/g, "u");

  const inferCityFromQuestion = (askedQuestion?: string): string | null => {
    const text = askedQuestion?.trim();
    if (!text) return null;
    const normalized = normalizeTurkishChars(text);
    const match = normalized.match(/\b([a-z]{3,})(?:d[ae]|t[ae])\b/);
    if (match?.[1]) return match[1];
    return null;
  };

  const buildAnswerText = (recs: TravelRecommendation[], askedQuestion: string | null) => {
    if (!recs.length) return "";
    const top = recs.slice(0, 3);
    const lines = top.map(
      (rec, idx) =>
        `${idx + 1}. ${rec.name} (${rec.category}) - ${rec.reason} [${Math.round(rec.walkingDistanceMeters)}m]`,
    );
    if (askedQuestion?.trim()) {
      return `Soruna gore en uygun oneriler:\n${lines.join("\n")}`;
    }
    return `Bulundugun konuma gore en uygun oneriler:\n${lines.join("\n")}`;
  };

  const fetchRecommendations = async (askedQuestion?: string) => {
    setLoading(true);
    setError(null);
    try {
      const normalizedQuestion = askedQuestion?.trim() || undefined;
      let targetCoords = effectiveCoords;
      if (normalizedQuestion) {
        const inferredCity = inferCityFromQuestion(normalizedQuestion);
        const geocodedFromCity = inferredCity ? await geocodeCity(inferredCity) : null;
        const geocodedFromQuestion = geocodedFromCity ? null : await geocodeCity(normalizedQuestion);
        const resolvedGeocode = geocodedFromCity ?? geocodedFromQuestion;
        if (resolvedGeocode) {
          targetCoords = { lat: resolvedGeocode.lat, lng: resolvedGeocode.lng };
          setEffectiveCoords(targetCoords);
        }
        const reply = await askGroqTravelAssistant(normalizedQuestion, targetCoords);
        setAssistantReply(reply || null);
      } else {
        setAssistantReply(null);
      }
      const data = await fetchTravelRecommendationsFromGroq(
        targetCoords.lat,
        targetCoords.lng,
        normalizedQuestion,
      );
      setRecommendations(data);
      setLastQuestion(normalizedQuestion ?? null);
    } catch (err: unknown) {
      console.error("Failed to fetch AI recommendations", err);
      const rawMessage = err instanceof Error ? err.message : "Öneriler getirilirken bir hata oluştu.";
      if (rawMessage.includes("HTTP 429") || rawMessage.toLowerCase().includes("too many requests")) {
        setError("Cok hizli istek gonderildi. 8-10 saniye bekleyip tekrar deneyin.");
      } else {
        setError(rawMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const isMapPage = location.pathname.startsWith("/map");
    if (isMapPage) {
      setEffectiveCoords(coords);
    }
  }, [location.pathname, coords]);

  useEffect(() => {
    if (!isOpen) return;

    const isMapPage = location.pathname.startsWith("/map");
    if (!isMapPage && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nextCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setEffectiveCoords(nextCoords);
          void fetchTravelRecommendationsFromGroq(
            nextCoords.lat,
            nextCoords.lng,
            question.trim() || undefined,
          )
            .then((data) => {
              setRecommendations(data);
              setLastQuestion(question.trim() || null);
              setAssistantReply(null);
              setError(null);
            })
            .catch((err: unknown) => {
              const rawMessage =
                err instanceof Error ? err.message : "Öneriler getirilirken bir hata oluştu.";
              if (rawMessage.includes("HTTP 429") || rawMessage.toLowerCase().includes("too many requests")) {
                setError("Cok hizli istek gonderildi. 8-10 saniye bekleyip tekrar deneyin.");
              } else {
                setError(rawMessage);
              }
            })
            .finally(() => setLoading(false));
        },
        () => {
          // Keep fallback coords from context if user blocks location.
        },
        { enableHighAccuracy: true, timeout: 6000 },
      );
    }

    void fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- panel her açıldığında bir kez yükle
  }, [isOpen]);

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
            <button type="button" className="ai-btn-primary" onClick={() => void fetchRecommendations(question)}>
              Tekrar Dene
            </button>
          </div>
        ) : assistantReply ? (
          <div className="ai-recs-list">
            {lastQuestion ? <p className="ai-question-chip">Soru: {lastQuestion}</p> : null}
            <p className="ai-answer-text">{assistantReply}</p>
            {Array.isArray(recommendations) && recommendations.length > 0 ? (
              recommendations.slice(0, 3).map((rec) => (
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
                </div>
              ))
            ) : null}
            <button
              type="button"
              className="ai-btn-primary"
              style={{ marginTop: "16px", width: "100%" }}
              onClick={() => void fetchRecommendations(question)}
            >
              Yeniden Sor
            </button>
          </div>
        ) : Array.isArray(recommendations) && recommendations.length > 0 ? (
          <div className="ai-recs-list">
            {lastQuestion ? <p className="ai-question-chip">Soru: {lastQuestion}</p> : null}
            <p className="ai-answer-text">{buildAnswerText(recommendations, lastQuestion)}</p>
            {recommendations.map((rec) => (
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
              onClick={() => void fetchRecommendations(question)}
            >
              Önerileri Yenile
            </button>
          </div>
        ) : recommendations && recommendations.length === 0 ? (
          <div className="ai-empty-state">
            <span className="ai-empty-icon">🏜️</span>
            <p>
              {lastQuestion
                ? "Sorun alindi ancak bu bolgede uygun mekan bulunamadi. Haritayi merkez/kalabalik bir bolgeye kaydirip tekrar sor."
                : "Bu harita merkezinin yakininda uygun yer bulunamadi veya asistan oneri uretemedi. Haritayi pinlerin yogun oldugu bir alana kaydirip yeniden deneyin."}
            </p>
            <button type="button" className="ai-btn-primary" onClick={() => void fetchRecommendations(question)}>
              Yenile
            </button>
          </div>
        ) : (
          <div className="ai-empty-state">
            <span className="ai-empty-icon">📍</span>
            <p>Çevrendeki en iyi deneyimler için hazır mısın?</p>
            <button type="button" className="ai-btn-primary" onClick={() => void fetchRecommendations(question)}>
              Bana Öneriler Getir
            </button>
          </div>
        )}
      </div>

      <form
        className="ai-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          void fetchRecommendations(question);
        }}
      >
        <input
          className="ai-question-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ornek: Romantik bir kahve + gun batimi oner"
        />
        <button type="submit" className="ai-btn-primary" disabled={loading}>
          Sor
        </button>
      </form>
    </div>
  );
}
