import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RoutePlanDisplay } from "../components/RoutePlanDisplay";
import { generateRoute } from "@pocketguide/core";
import type { GeneratedRoute, RouteTheme } from "@pocketguide/core";
import { saveTrip } from "../lib/savedTripsApi";
import { useAuth } from "../context/AuthContext";
import { INTERESTS } from "./OnboardingPage";

const CITIES = [
  { nameTr: "İstanbul", nameEn: "Istanbul", slug: "istanbul", emoji: "🕌" },
  { nameTr: "Paris", nameEn: "Paris", slug: "paris", emoji: "🗼" },
  { nameTr: "Tokyo", nameEn: "Tokyo", slug: "tokyo", emoji: "🏯" },
  { nameTr: "Londra", nameEn: "London", slug: "londra", emoji: "🎡" },
  { nameTr: "Roma", nameEn: "Rome", slug: "roma", emoji: "🏛️" },
  { nameTr: "Barcelona", nameEn: "Barcelona", slug: "barcelona", emoji: "🌊" },
  { nameTr: "Dubai", nameEn: "Dubai", slug: "dubai", emoji: "🏙️" },
  { nameTr: "Amsterdam", nameEn: "Amsterdam", slug: "amsterdam", emoji: "🚲" },
  { nameTr: "Sydney", nameEn: "Sydney", slug: "sydney", emoji: "🦘" },
  { nameTr: "New York", nameEn: "New York", slug: "new-york", emoji: "🗽" },
];

const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

const INTERESTS_TO_THEMES: Record<string, RouteTheme> = {
  art: "culture",
  gastronomy: "food",
  history: "culture",
  nature: "nature",
  nightlife: "relaxation",
  shopping: "shopping",
  architecture: "culture",
  music_events: "culture",
  adventure: "adventure",
  relaxation: "relaxation",
  family: "family",
  budget: "budget",
};

const getInitialInterests = (): string[] => {
  try {
    const raw = localStorage.getItem("pg_user_interests");
    if (!raw) return [];
    const interests = JSON.parse(raw);
    return Array.isArray(interests) ? (interests as string[]) : [];
  } catch {
    return [];
  }
};

const themesFromInterests = (interests: string[]): RouteTheme[] => {
  const themes = [
    ...new Set(interests.map((i) => INTERESTS_TO_THEMES[i]).filter(Boolean)),
  ] as RouteTheme[];
  return themes.length > 0 ? themes : ["culture"];
};

function routeToStops(route: GeneratedRoute) {
  return route.plan.flatMap((day) =>
    day.stops.map((stop) => ({
      id: `day${day.day}-stop${stop.order}`,
      name: stop.name,
      lat: 0,
      lng: 0,
      address: stop.address,
    })),
  );
}

export default function RoutePlannerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCity, setSelectedCity] = useState<(typeof CITIES)[0] | null>(null);
  const [selectedDays, setSelectedDays] = useState(3);
  const [selectedInterests, setSelectedInterests] =
    useState<string[]>(getInitialInterests);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<GeneratedRoute | null>(null);

  const apiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();

  const handleGenerate = async () => {
    if (!selectedCity || !apiKey || selectedInterests.length === 0) {
      if (!apiKey) setError("Groq API anahtarı bulunamadı (VITE_GROQ_API_KEY).");
      else if (selectedInterests.length === 0)
        setError("En az bir ilgi alanı seçmelisin.");
      return;
    }
    setLoading(true);
    setError(null);
    setSaveMessage(null);
    try {
      const result = await generateRoute({
        city: selectedCity.nameTr,
        cityNameEn: selectedCity.nameEn,
        days: selectedDays,
        themes: themesFromInterests(selectedInterests),
        userInterests: selectedInterests,
        groqApiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });
      setRoute(result);
      setStep(3);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Rota oluşturulurken hata oluştu.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!route) return;
    if (!user) {
      setSaveMessage("Kaydetmek için giriş yapmalısın.");
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    try {
      const saved = await saveTrip({
        title: route.title,
        cityName: route.city,
        stops: routeToStops(route),
        routeData: { type: "ai-route-planner", ...route },
      });
      navigate(`/plan/saved/${saved.id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message === "LOGIN_REQUIRED"
          ? "Kaydetmek için giriş yapmalısın."
          : err instanceof Error
            ? err.message
            : "Kayıt başarısız.";
      setSaveMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (!route) return;
    const blob = new Blob([JSON.stringify(route, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${route.city}-${route.days}-gun-rota.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Nav />
      <div className="rp-root">
        <div className="rp-hero">
          <h1 className="rp-hero-title">AI Rota Planlayıcı</h1>
          <p className="rp-hero-sub">
            Şehir ve ilgi alanlarını seç, yapay zeka sana özel gün gün rota oluştursun.
          </p>
        </div>

        <div className="rp-steps">
          {[
            { n: 1, label: "Şehir Seç" },
            { n: 2, label: "Plan Detayları" },
            { n: 3, label: "Rotanı Gör" },
          ].map((s) => (
            <div
              key={s.n}
              className={`rp-step ${step >= s.n ? "active" : ""} ${step > s.n ? "done" : ""}`}
            >
              <div className="rp-step-num">{step > s.n ? "✓" : s.n}</div>
              <span className="rp-step-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="rp-content">
          {step === 1 && (
            <div className="rp-section rp-fade-in">
              <h2 className="rp-section-title">Hangi şehre gidiyorsun?</h2>
              <div className="rp-city-grid">
                {CITIES.map((city) => (
                  <button
                    key={city.slug}
                    type="button"
                    className={`rp-city-card ${selectedCity?.slug === city.slug ? "selected" : ""}`}
                    onClick={() => setSelectedCity(city)}
                  >
                    <span className="rp-city-emoji">{city.emoji}</span>
                    <span className="rp-city-name">{city.nameTr}</span>
                  </button>
                ))}
              </div>
              <div className="rp-action-row">
                <button
                  type="button"
                  className="rp-btn-primary"
                  disabled={!selectedCity}
                  onClick={() => setStep(2)}
                >
                  Devam Et →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="rp-section rp-fade-in">
              <button type="button" className="rp-back-btn" onClick={() => setStep(1)}>
                ← Geri
              </button>
              <h2 className="rp-section-title">
                {selectedCity?.emoji} {selectedCity?.nameTr} için plan detayları
              </h2>

              <div className="rp-field">
                <label className="rp-label">Kaç gün?</label>
                <div className="rp-days-row">
                  {DAYS_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`rp-day-btn ${selectedDays === d ? "selected" : ""}`}
                      onClick={() => setSelectedDays(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rp-field">
                <label className="rp-label">İlgi alanların</label>
                {getInitialInterests().length > 0 && (
                  <p className="rp-personalized-hint">
                    ✨ Profilindeki ilgi alanların otomatik seçildi — istersen
                    değiştirebilirsin.
                  </p>
                )}
                <p className="rp-theme-hint">Birden fazla seçebilirsin (en az 1)</p>
                <div className="rp-theme-grid">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest.id}
                      type="button"
                      className={`rp-theme-card ${selectedInterests.includes(interest.id) ? "selected" : ""}`}
                      onClick={() => toggleInterest(interest.id)}
                    >
                      <span className="rp-theme-emoji">{interest.icon}</span>
                      <span className="rp-theme-label">{interest.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && <div className="rp-error">{error}</div>}

              <div className="rp-action-row">
                <button
                  type="button"
                  className="rp-btn-primary"
                  onClick={handleGenerate}
                  disabled={loading || selectedInterests.length === 0}
                >
                  {loading ? (
                    <>
                      <span className="rp-spinner" />
                      Rota oluşturuluyor...
                    </>
                  ) : (
                    "✨ Rotamı Oluştur"
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && route && (
            <div className="rp-section rp-fade-in">
              <button type="button" className="rp-back-btn" onClick={() => setStep(2)}>
                ← Yeniden Oluştur
              </button>

              <RoutePlanDisplay route={route} />

              {saveMessage && (
                <div className={saveMessage.includes("kaydedildi") ? "rp-save-ok" : "rp-error"}>
                  {saveMessage}
                </div>
              )}

              <div className="rp-action-row">
                <Link
                  to={`/${selectedCity?.slug}/first-day`}
                  className="rp-btn-secondary"
                >
                  💡 İlk Gün Rehberi
                </Link>
                <button type="button" className="rp-btn-secondary" onClick={handleSave} disabled={saving}>
                  {saving ? "Kaydediliyor..." : "💾 Seyahatlerime Kaydet"}
                </button>
                <button type="button" className="rp-btn-primary" onClick={handleDownload}>
                  ⬇️ Rotayı İndir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
