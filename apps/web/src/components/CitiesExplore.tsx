import { useNavigate } from "react-router-dom";
import type { KeyboardEvent } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";

type City = {
  name: string;
  country: string;
  slug: string;
  emoji: string;
  gradient: string;
};

const CITIES: City[] = [
  {
    name: "Paris",
    country: "Fransa",
    slug: "paris",
    emoji: "🗼",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    name: "Tokyo",
    country: "Japonya",
    slug: "tokyo",
    emoji: "🏯",
    gradient: "linear-gradient(135deg, #f5576c 0%, #c0392b 100%)",
  },
  {
    name: "New York",
    country: "ABD",
    slug: "new-york",
    emoji: "🗽",
    gradient: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
  },
  {
    name: "Londra",
    country: "İngiltere",
    slug: "londra",
    emoji: "🎡",
    gradient: "linear-gradient(135deg, #536976 0%, #292e49 100%)",
  },
  {
    name: "Roma",
    country: "İtalya",
    slug: "roma",
    emoji: "🏛️",
    gradient: "linear-gradient(135deg, #c79081 0%, #dfa579 100%)",
  },
  {
    name: "Barcelona",
    country: "İspanya",
    slug: "barcelona",
    emoji: "🌊",
    gradient: "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
  },
  {
    name: "Dubai",
    country: "BAE",
    slug: "dubai",
    emoji: "🏙️",
    gradient: "linear-gradient(135deg, #d4a574 0%, #c9956c 100%)",
  },
  {
    name: "Amsterdam",
    country: "Hollanda",
    slug: "amsterdam",
    emoji: "🚲",
    gradient: "linear-gradient(135deg, #f46b45 0%, #eea849 100%)",
  },
  {
    name: "Sydney",
    country: "Avustralya",
    slug: "sydney",
    emoji: "🦘",
    gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  },
  {
    name: "İstanbul",
    country: "Türkiye",
    slug: "istanbul",
    emoji: "🕌",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },
];

export function CitiesExplore() {
  const ref = useScrollReveal<HTMLElement>();
  const navigate = useNavigate();

  const goToCity = (slug: string) => {
    navigate(`/${slug}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, slug: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToCity(slug);
    }
  };

  return (
    <section className="cities-explore-wrap fu" ref={ref}>
      <div className="cities-explore-inner">
        <div className="cities-explore-header">
          <h2 className="cities-explore-title">Şehirleri Keşfet</h2>
          <p className="cities-explore-sub">
            Dünyanın en ikonik şehirlerine göz at — rotanı planlamaya hazır ol.
          </p>
        </div>
        <div className="cities-grid">
          {CITIES.map((city) => (
            <div
              key={city.name}
              className="city-card"
              role="button"
              tabIndex={0}
              onClick={() => goToCity(city.slug)}
              onKeyDown={(event) => handleKeyDown(event, city.slug)}
            >
              <div
                className="city-card-img"
                style={{ background: city.gradient }}
              >
                <span className="city-card-emoji">{city.emoji}</span>
              </div>
              <div className="city-card-body">
                <div className="city-card-name">{city.name}</div>
                <div className="city-card-country">{city.country}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
