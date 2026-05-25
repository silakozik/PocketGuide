import { useScrollReveal } from "../hooks/useScrollReveal";

type City = {
  name: string;
  country: string;
  emoji: string;
  gradient: string;
};

const CITIES: City[] = [
  {
    name: "Paris",
    country: "Fransa",
    emoji: "🗼",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    name: "Tokyo",
    country: "Japonya",
    emoji: "🏯",
    gradient: "linear-gradient(135deg, #f5576c 0%, #c0392b 100%)",
  },
  {
    name: "New York",
    country: "ABD",
    emoji: "🗽",
    gradient: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
  },
  {
    name: "Londra",
    country: "İngiltere",
    emoji: "🎡",
    gradient: "linear-gradient(135deg, #536976 0%, #292e49 100%)",
  },
  {
    name: "Roma",
    country: "İtalya",
    emoji: "🏛️",
    gradient: "linear-gradient(135deg, #c79081 0%, #dfa579 100%)",
  },
  {
    name: "Barcelona",
    country: "İspanya",
    emoji: "🌊",
    gradient: "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
  },
  {
    name: "Dubai",
    country: "BAE",
    emoji: "🏙️",
    gradient: "linear-gradient(135deg, #d4a574 0%, #c9956c 100%)",
  },
  {
    name: "Amsterdam",
    country: "Hollanda",
    emoji: "🚲",
    gradient: "linear-gradient(135deg, #f46b45 0%, #eea849 100%)",
  },
  {
    name: "Sydney",
    country: "Avustralya",
    emoji: "🦘",
    gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  },
  {
    name: "İstanbul",
    country: "Türkiye",
    emoji: "🕌",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },
];

export function CitiesExplore() {
  const ref = useScrollReveal<HTMLElement>();

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
            <div key={city.name} className="city-card">
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
