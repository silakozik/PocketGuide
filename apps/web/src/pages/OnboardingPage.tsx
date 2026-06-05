import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import "./onboarding.css";

export const INTERESTS = [
  { id: "art", label: "Sanat", icon: "🎨", accent: "#8b5cf6" },
  { id: "gastronomy", label: "Gastronomi", icon: "🍽️", accent: "#f97316" },
  { id: "history", label: "Tarih", icon: "🏛️", accent: "#d97706" },
  { id: "nature", label: "Doğa", icon: "🌲", accent: "#16a34a" },
  { id: "nightlife", label: "Gece Hayatı", icon: "🍸", accent: "#6366f1" },
  { id: "shopping", label: "Alışveriş", icon: "🛍️", accent: "#ec4899" },
  { id: "architecture", label: "Mimari", icon: "🏢", accent: "#0ea5e9" },
  { id: "music_events", label: "Müzik & Etkinlik", icon: "🎵", accent: "#e11d48" },
  { id: "adventure", label: "Macera", icon: "🧗", accent: "#f59e0b" },
  { id: "relaxation", label: "Dinlenme", icon: "🧘", accent: "#06b6d4" },
  { id: "family", label: "Aile", icon: "👨‍👩‍👧", accent: "#84cc16" },
  { id: "budget", label: "Bütçe Dostu", icon: "💰", accent: "#10b981" },
] as const;

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();

  const toggleInterest = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleComplete = () => {
    localStorage.setItem("pg_has_onboarded", "true");
    localStorage.setItem("pg_user_interests", JSON.stringify(selected));
    navigate("/");
  };

  const canSubmit = selected.length > 0;

  useEffect(() => {
    document.documentElement.classList.add("onboarding-active");
    document.body.classList.add("onboarding-active");
    return () => {
      document.documentElement.classList.remove("onboarding-active");
      document.body.classList.remove("onboarding-active");
    };
  }, []);

  return (
    <div className="onboarding-viewport">
      <div className="onboarding-bg" aria-hidden>
        <span className="onboarding-blob onboarding-blob--1" />
        <span className="onboarding-blob onboarding-blob--2" />
        <span className="onboarding-blob onboarding-blob--3" />
        <span className="onboarding-grid-overlay" />
      </div>

      <div className="onboarding-shell">
        <header className="onboarding-header">
          <div className="onboarding-brand">
            <span className="onboarding-brand-dot" />
            <span className="onboarding-brand-name">PocketGuide</span>
          </div>
        </header>

        <div className="onboarding-hero">
          <h1 className="onboarding-title">Nelerden hoşlanırsın?</h1>
          <p className="onboarding-subtitle">
            İlgi alanlarını seç; sana özel rotalar ve öneriler hazırlayalım.
          </p>
        </div>

        <div className="onboarding-meta">
          <span
            className={`onboarding-counter ${canSubmit ? "onboarding-counter--ready" : ""}`}
          >
            {selected.length === 0
              ? "En az 1 kategori seç"
              : `${selected.length} kategori seçildi`}
          </span>
        </div>

        <div className="interests-grid" role="group" aria-label="İlgi alanları">
          {INTERESTS.map((interest, index) => {
            const isSelected = selected.includes(interest.id);
            return (
              <button
                key={interest.id}
                type="button"
                className={`interest-card ${isSelected ? "selected" : ""}`}
                style={
                  {
                    "--accent": interest.accent,
                    "--delay": `${index * 45}ms`,
                  } as CSSProperties
                }
                onClick={() => toggleInterest(interest.id)}
                aria-pressed={isSelected}
              >
                <span className="interest-check" aria-hidden>
                  <svg viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3.5 8.5L6.5 11.5L12.5 4.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="interest-icon-wrap">
                  <span className="interest-icon">{interest.icon}</span>
                </span>
                <span className="interest-label">{interest.label}</span>
              </button>
            );
          })}
        </div>

        <footer className="onboarding-footer">
          <button
            type="button"
            className="onboarding-submit-btn"
            disabled={!canSubmit}
            onClick={handleComplete}
          >
            <span>Keşfetmeye başla</span>
            <svg
              className="onboarding-submit-arrow"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 10h12m0 0l-4-4m4 4l-4 4"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </footer>
      </div>
    </div>
  );
}
