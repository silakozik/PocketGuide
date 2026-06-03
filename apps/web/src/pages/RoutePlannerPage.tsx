import { useState } from "react";
import { Link } from "react-router-dom";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { generateRoute } from "@pocketguide/core";
import type { GeneratedRoute, RouteTheme } from "@pocketguide/core";
import { saveTrip } from "../lib/savedTripsApi";
import { useAuth } from "../context/AuthContext";

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

const THEMES: { id: RouteTheme; label: string; emoji: string; desc: string }[] = [
  { id: "culture", label: "Kültür & Tarih", emoji: "🏛️", desc: "Müzeler, tarihi yapılar" },
  { id: "food", label: "Yeme & İçme", emoji: "🍽️", desc: "Restoranlar, pazarlar" },
  { id: "nature", label: "Doğa", emoji: "🌿", desc: "Parklar, yürüyüş" },
  { id: "adventure", label: "Macera", emoji: "🧗", desc: "Aktif & heyecanlı" },
  { id: "shopping", label: "Alışveriş", emoji: "🛍️", desc: "Çarşılar, AVM'ler" },
  { id: "relaxation", label: "Dinlenme", emoji: "🧘", desc: "Spa, yavaş tempo" },
  { id: "family", label: "Aile", emoji: "👨‍👩‍👧", desc: "Çocuk dostu" },
  { id: "budget", label: "Bütçe Dostu", emoji: "💰", desc: "Ucuz & değerli" },
];

const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

const CATEGORY_COLORS: Record<string, string> = {
  culture: "#8b5cf6",
  food: "#10b981",
  transport: "#3b82f6",
  other: "#f59e0b",
};

const CATEGORY_LABELS: Record<string, string> = {
  culture: "🏛️ Kültür",
  food: "🍽️ Yemek",
  transport: "🚇 Ulaşım",
  other: "📍 Diğer",
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
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCity, setSelectedCity] = useState<(typeof CITIES)[0] | null>(null);
  const [selectedDays, setSelectedDays] = useState(3);
  const [selectedThemes, setSelectedThemes] = useState<RouteTheme[]>(["culture"]);

  const toggleTheme = (id: RouteTheme) => {
    setSelectedThemes((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== id);
      }
      return [...prev, id];
    });
  };

  const formatRouteThemes = (r: GeneratedRoute) => {
    const ids = r.themes?.length ? r.themes : r.theme ? [r.theme] : [];
    return ids
      .map((id) => {
        const t = THEMES.find((x) => x.id === id);
        return t ? `${t.emoji} ${t.label}` : id;
      })
      .join(" · ");
  };
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<GeneratedRoute | null>(null);
  const [activeDay, setActiveDay] = useState(1);

  const apiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();

  const handleGenerate = async () => {
    if (!selectedCity || !apiKey || selectedThemes.length === 0) {
      if (!apiKey) setError("Groq API anahtarı bulunamadı (VITE_GROQ_API_KEY).");
      else if (selectedThemes.length === 0) setError("En az bir seyahat teması seçmelisin.");
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
        themes: selectedThemes,
        groqApiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });
      setRoute(result);
      setActiveDay(1);
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
      await saveTrip({
        title: route.title,
        cityName: route.city,
        stops: routeToStops(route),
        routeData: { type: "ai-route-planner", ...route },
      });
      setSaveMessage("Rota seyahatlerine kaydedildi.");
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
                <label className="rp-label">Seyahat temaları</label>
                <p className="rp-theme-hint">Birden fazla tema seçebilirsin (en az 1)</p>
                <div className="rp-theme-grid">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      className={`rp-theme-card ${selectedThemes.includes(theme.id) ? "selected" : ""}`}
                      onClick={() => toggleTheme(theme.id)}
                    >
                      <span className="rp-theme-emoji">{theme.emoji}</span>
                      <span className="rp-theme-label">{theme.label}</span>
                      <span className="rp-theme-desc">{theme.desc}</span>
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
                  disabled={loading || selectedThemes.length === 0}
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

              <div className="rp-route-header">
                <h2 className="rp-route-title">{route.title}</h2>
                <p className="rp-route-summary">{route.summary}</p>
                <div className="rp-route-meta">
                  <span>📍 {route.city}</span>
                  <span>📅 {route.days} Gün</span>
                  <span>{formatRouteThemes(route)}</span>
                </div>
              </div>

              <div className="rp-day-tabs">
                {route.plan.map((day) => (
                  <button
                    key={day.day}
                    type="button"
                    className={`rp-day-tab ${activeDay === day.day ? "active" : ""}`}
                    onClick={() => setActiveDay(day.day)}
                  >
                    <span className="rp-day-tab-num">{day.day}. Gün</span>
                    <span className="rp-day-tab-title">{day.title}</span>
                  </button>
                ))}
              </div>

              {route.plan
                .filter((d) => d.day === activeDay)
                .map((day) => (
                  <div key={day.day} className="rp-day-plan">
                    <div className="rp-day-theme">{day.theme}</div>
                    <div className="rp-stops">
                      {day.stops.map((stop, i) => (
                        <div key={stop.order} className="rp-stop">
                          <div className="rp-stop-timeline">
                            <div className="rp-stop-time">{stop.time}</div>
                            <div
                              className="rp-stop-dot"
                              style={{
                                backgroundColor:
                                  CATEGORY_COLORS[stop.category] ?? "#6b7a99",
                              }}
                            />
                            {i < day.stops.length - 1 && <div className="rp-stop-line" />}
                          </div>

                          <div className="rp-stop-body">
                            <div className="rp-stop-header">
                              <div className="rp-stop-name">{stop.name}</div>
                              <span
                                className="rp-stop-cat"
                                style={{
                                  background:
                                    (CATEGORY_COLORS[stop.category] ?? "#6b7a99") + "18",
                                  color: CATEGORY_COLORS[stop.category] ?? "#6b7a99",
                                }}
                              >
                                {CATEGORY_LABELS[stop.category] ?? "📍 Diğer"}
                              </span>
                            </div>
                            <div className="rp-stop-type">
                              {stop.type} · {stop.duration}
                            </div>
                            <p className="rp-stop-desc">{stop.description}</p>
                            {stop.address && (
                              <div className="rp-stop-address">📍 {stop.address}</div>
                            )}
                            <div className="rp-stop-tip">💡 {stop.tip}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

              {route.tips.length > 0 && (
                <div className="rp-tips-section">
                  <h3 className="rp-tips-title">✈️ Genel Seyahat İpuçları</h3>
                  <ul className="rp-tips-list">
                    {route.tips.map((tip, i) => (
                      <li key={i} className="rp-tip-item">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
