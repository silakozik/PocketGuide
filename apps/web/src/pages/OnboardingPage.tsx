import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./onboarding.css";

export const INTERESTS = [
  { id: "art", label: "Sanat", icon: "🎨" },
  { id: "gastronomy", label: "Gastronomi", icon: "🍽️" },
  { id: "history", label: "Tarih", icon: "🏛️" },
  { id: "nature", label: "Doğa", icon: "🌲" },
  { id: "nightlife", label: "Gece Hayatı", icon: "🍸" },
  { id: "shopping", label: "Alışveriş", icon: "🛍️" },
  { id: "architecture", label: "Mimari", icon: "🏢" }
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // If they somehow land here but already onboarded, maybe let them be or redirect.
    // Actually if they are here manually they might want to see it, but let's just 
    // leave it as is.
  }, []);

  const toggleInterest = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleComplete = () => {
    localStorage.setItem("pg_has_onboarded", "true");
    localStorage.setItem("pg_user_interests", JSON.stringify(selected));
    navigate("/");
  };

  return (
    <div className="onboarding-viewport">
      <div className="onboarding-container">
        <h1 className="onboarding-title">Nelerden Hoşlanırsın?</h1>
        <p className="onboarding-subtitle">
          Sana en uygun deneyimleri sunabilmemiz için ilgi alanlarını seç. (En az 1 tane seçmelisin)
        </p>

        <div className="interests-grid">
          {INTERESTS.map(interest => {
            const isSelected = selected.includes(interest.id);
            return (
              <button 
                key={interest.id}
                className={`interest-card ${isSelected ? "selected" : ""}`}
                onClick={() => toggleInterest(interest.id)}
              >
                <span className="interest-icon">{interest.icon}</span>
                <span className="interest-label">{interest.label}</span>
              </button>
            );
          })}
        </div>

        <button 
          className="onboarding-submit-btn" 
          disabled={selected.length === 0}
          onClick={handleComplete}
        >
          Keşfetmeye Başla
        </button>
      </div>
    </div>
  );
}
