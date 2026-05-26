import { useNavigate, useParams, Navigate } from "react-router-dom";
import type { CSSProperties } from "react";
import "./city-hub.css";

interface Highlight {
  icon: string;
  name: string;
  type: string;
  badge: string;
  badgeColor: string;
}

interface CityMeta {
  name: string;
  country: string;
  region: string;
  emoji: string;
  gradient: string;
  tags: string[];
  highlights: Highlight[];
}

type FeatureKey = "first-day" | "transfer" | "map" | "assistant";

interface Feature {
  key: FeatureKey;
  emoji: string;
  title: string;
  desc: string;
  accentColor: string;
  bgColor: string;
  className: string;
}

const CITY_META: Record<string, CityMeta> = {
  paris: {
    name: "Paris",
    country: "Fransa",
    region: "Avrupa",
    emoji: "🗼",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    tags: ["Metro Haritası", "120+ POI", "AI Rehber"],
    highlights: [
      { icon: "🗼", name: "Eyfel Kulesi", type: "Anıt", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "🎨", name: "Louvre Müzesi", type: "Müze", badge: "Ücretli", badgeColor: "#dbeafe" },
      { icon: "⛪", name: "Notre-Dame", type: "Tarih", badge: "Ücretsiz", badgeColor: "#dcfce7" },
    ],
  },
  tokyo: {
    name: "Tokyo",
    country: "Japonya",
    region: "Asya",
    emoji: "🏯",
    gradient: "linear-gradient(135deg, #f5576c 0%, #c0392b 100%)",
    tags: ["JR Pass", "200+ POI", "AI Rehber"],
    highlights: [
      { icon: "⛩️", name: "Senso-ji", type: "Tapınak", badge: "Ücretsiz", badgeColor: "#dcfce7" },
      { icon: "🚦", name: "Shibuya Kavşağı", type: "Keşif", badge: "Ücretsiz", badgeColor: "#dcfce7" },
      { icon: "🗼", name: "Tokyo Skytree", type: "Manzara", badge: "Ücretli", badgeColor: "#fef3c7" },
    ],
  },
  "new-york": {
    name: "New York",
    country: "ABD",
    region: "Kuzey Amerika",
    emoji: "🗽",
    gradient: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
    tags: ["Metro Haritası", "150+ POI", "AI Rehber"],
    highlights: [
      { icon: "🗽", name: "Özgürlük Heykeli", type: "Anıt", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "🌳", name: "Central Park", type: "Park", badge: "Ücretsiz", badgeColor: "#dcfce7" },
      { icon: "🌃", name: "Times Square", type: "Keşif", badge: "Ücretsiz", badgeColor: "#dcfce7" },
    ],
  },
  londra: {
    name: "Londra",
    country: "İngiltere",
    region: "Avrupa",
    emoji: "🎡",
    gradient: "linear-gradient(135deg, #536976 0%, #292e49 100%)",
    tags: ["Tube Haritası", "130+ POI", "AI Rehber"],
    highlights: [
      { icon: "🕰️", name: "Big Ben", type: "Anıt", badge: "Ücretsiz", badgeColor: "#dcfce7" },
      { icon: "🏛️", name: "British Museum", type: "Müze", badge: "Ücretsiz", badgeColor: "#dcfce7" },
      { icon: "🌉", name: "Tower Bridge", type: "Tarih", badge: "Ücretli", badgeColor: "#fef3c7" },
    ],
  },
  roma: {
    name: "Roma",
    country: "İtalya",
    region: "Avrupa",
    emoji: "🏛️",
    gradient: "linear-gradient(135deg, #c79081 0%, #dfa579 100%)",
    tags: ["Metro A/B/C", "110+ POI", "AI Rehber"],
    highlights: [
      { icon: "🏟️", name: "Colosseum", type: "Tarih", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "⛪", name: "Vatikan", type: "Dini", badge: "Ücretsiz", badgeColor: "#dcfce7" },
      { icon: "⛲", name: "Trevi Çeşmesi", type: "Anıt", badge: "Ücretsiz", badgeColor: "#dcfce7" },
    ],
  },
  barcelona: {
    name: "Barcelona",
    country: "İspanya",
    region: "Avrupa",
    emoji: "🌊",
    gradient: "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
    tags: ["Metro L1–L5", "100+ POI", "AI Rehber"],
    highlights: [
      { icon: "⛪", name: "Sagrada Familia", type: "Mimari", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "🎨", name: "Park Güell", type: "Park", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "🚶", name: "La Rambla", type: "Keşif", badge: "Ücretsiz", badgeColor: "#dcfce7" },
    ],
  },
  dubai: {
    name: "Dubai",
    country: "BAE",
    region: "Orta Doğu",
    emoji: "🏙️",
    gradient: "linear-gradient(135deg, #d4a574 0%, #c9956c 100%)",
    tags: ["Metro Red", "90+ POI", "AI Rehber"],
    highlights: [
      { icon: "🏗️", name: "Burj Khalifa", type: "Manzara", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "🌴", name: "Palm Jumeirah", type: "Keşif", badge: "Ücretsiz", badgeColor: "#dcfce7" },
      { icon: "🛍️", name: "Dubai Mall", type: "Alışveriş", badge: "Ücretsiz", badgeColor: "#dcfce7" },
    ],
  },
  amsterdam: {
    name: "Amsterdam",
    country: "Hollanda",
    region: "Avrupa",
    emoji: "🚲",
    gradient: "linear-gradient(135deg, #f46b45 0%, #eea849 100%)",
    tags: ["Tram & Metro", "95+ POI", "AI Rehber"],
    highlights: [
      { icon: "🎨", name: "Rijksmuseum", type: "Müze", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "📖", name: "Anne Frank Evi", type: "Tarih", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "🌿", name: "Vondelpark", type: "Park", badge: "Ücretsiz", badgeColor: "#dcfce7" },
    ],
  },
  sydney: {
    name: "Sydney",
    country: "Avustralya",
    region: "Okyanusya",
    emoji: "🦘",
    gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    tags: ["Opal Card", "85+ POI", "AI Rehber"],
    highlights: [
      { icon: "🎭", name: "Opera House", type: "Mimari", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "🌉", name: "Harbour Bridge", type: "Anıt", badge: "Ücretsiz", badgeColor: "#dcfce7" },
      { icon: "🏖️", name: "Bondi Beach", type: "Plaj", badge: "Ücretsiz", badgeColor: "#dcfce7" },
    ],
  },
  istanbul: {
    name: "İstanbul",
    country: "Türkiye",
    region: "Avrupa & Asya",
    emoji: "🕌",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    tags: ["Metro & Tram", "140+ POI", "AI Rehber"],
    highlights: [
      { icon: "🕌", name: "Ayasofya", type: "Tarih", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "🏰", name: "Topkapı Sarayı", type: "Müze", badge: "Ücretli", badgeColor: "#fef3c7" },
      { icon: "🗼", name: "Galata Kulesi", type: "Manzara", badge: "Ücretli", badgeColor: "#fef3c7" },
    ],
  },
};

const FEATURES: Feature[] = [
  {
    key: "first-day",
    emoji: "💡",
    title: "İlk Gün Rehberi",
    desc: "SIM kart, ulaşım kartı ve şehre adaptasyon adımları.",
    accentColor: "#e8c547",
    bgColor: "#fffbe6",
    className: "city-hub-feat--first-day",
  },
  {
    key: "transfer",
    emoji: "🚇",
    title: "Transfer Guide",
    desc: "Havalimanından şehir merkezine ulaşım seçenekleri.",
    accentColor: "#3b82f6",
    bgColor: "#eff6ff",
    className: "city-hub-feat--transfer",
  },
  {
    key: "map",
    emoji: "🗺️",
    title: "Şehir Haritası",
    desc: "POI'ler, rotalar ve katmanlarla interaktif harita.",
    accentColor: "#10b981",
    bgColor: "#ecfdf5",
    className: "city-hub-feat--map",
  },
  {
    key: "assistant",
    emoji: "✨",
    title: "Gezi Asistanı",
    desc: "AI destekli öneriler ve kişiselleştirilmiş rota planlama.",
    accentColor: "#8b5cf6",
    bgColor: "#f5f3ff",
    className: "city-hub-feat--assistant",
  },
];

export default function CityHubPage() {
  const navigate = useNavigate();
  const { citySlug } = useParams<{ citySlug: string }>();
  const meta = citySlug ? CITY_META[citySlug] : undefined;

  if (!meta) {
    return <Navigate to="/" replace />;
  }

  const handleFeature = (key: FeatureKey) => {
    switch (key) {
      case "first-day":
        navigate(`/${citySlug}/first-day`);
        break;
      case "transfer":
        navigate("/transfer");
        break;
      case "map":
      case "assistant":
        navigate("/map");
        break;
    }
  };

  return (
    <div className="city-hub-root">
        <div className="city-hub-hero" style={{ background: meta.gradient }}>
          <div className="city-hub-hero-overlay" />
          <button
            type="button"
            className="city-hub-back-btn-hero"
            onClick={() => navigate(-1)}
            aria-label="Geri"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="city-hub-hero-emoji">{meta.emoji}</div>
          <div className="city-hub-hero-info">
            <h1 className="city-hub-hero-name">{meta.name}</h1>
            <p className="city-hub-hero-country">
              {meta.country} · {meta.region}
            </p>
            <div className="city-hub-hero-tags">
              {meta.tags.map((tag) => (
                <span key={tag} className="city-hub-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="city-hub-content">
          <div className="city-hub-section-label">Ne yapmak istersin?</div>
          <div className="city-hub-features">
            {FEATURES.map((feat) => (
              <button
                key={feat.key}
                type="button"
                className={`city-hub-feat ${feat.className}`}
                style={
                  {
                    "--feat-accent": feat.accentColor,
                    "--feat-bg": feat.bgColor,
                  } as CSSProperties
                }
                onClick={() => handleFeature(feat.key)}
              >
                <div className="city-hub-feat-accent" />
                <div className="city-hub-feat-icon">
                  <span>{feat.emoji}</span>
                </div>
                <div className="city-hub-feat-body">
                  <div className="city-hub-feat-title">{feat.title}</div>
                  <div className="city-hub-feat-desc">{feat.desc}</div>
                </div>
                <div className="city-hub-feat-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          <div className="city-hub-highlights">
            <div className="city-hub-highlights-title">{meta.name}&apos;da Öne Çıkanlar</div>
            {meta.highlights.map((hl) => (
              <div key={hl.name} className="city-hub-hl-row">
                <div className="city-hub-hl-icon">{hl.icon}</div>
                <div className="city-hub-hl-info">
                  <div className="city-hub-hl-name">{hl.name}</div>
                  <div className="city-hub-hl-type">{hl.type}</div>
                </div>
                <span
                  className="city-hub-hl-badge"
                  style={{ background: hl.badgeColor }}
                >
                  {hl.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
