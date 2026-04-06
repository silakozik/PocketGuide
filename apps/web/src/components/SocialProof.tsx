import { useScrollReveal } from "../hooks/useScrollReveal";

const STATS = [
  { value: "120+", label: "Aktif Şehir", icon: "🌍" },
  { value: "500K+", label: "Kullanıcı", icon: "👤" },
  { value: "2.1M", label: "Planlanan Rota", icon: "🗺" },
  { value: "4.9", label: "App Store", icon: "⭐" },
];

const TESTIMONIALS = [
  {
    name: "Zeynep K.",
    location: "İstanbul → Tokyo",
    text: "Tokyo metrosunda kaybolmadan gezdim. İlk günü SIM kart, Suica kartı ve en yakın kombini bulmakla geçirmek yerine 3 saat önce tapınaktaydım.",
    avatar: "🧑‍💻",
  },
  {
    name: "Emre T.",
    location: "Berlin → Barselona",
    text: "Barselona'da AI rota önerisine güvendim — turistik tuzaklardan kaçıp yerel pazarda tapas yedim. En iyi seyahat kararımdı.",
    avatar: "🎒",
  },
  {
    name: "Lina M.",
    location: "Amsterdam → Atina",
    text: "Atina'yı 3 günde bir yerli gibi keşfettim. Offline haritalar hayat kurtardı. Artık seyahatte Google'a bağımlı değilim.",
    avatar: "✈️",
  },
];

export function SocialProof() {
  const statsRef = useScrollReveal<HTMLDivElement>();
  const headRef = useScrollReveal<HTMLDivElement>();
  const gridRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="social-proof-wrap" id="proof">
      {/* Stats row */}
      <div className="sp-stats fu" ref={statsRef}>
        {STATS.map((s) => (
          <div key={s.label} className="sp-stat">
            <div className="sp-stat-icon">{s.icon}</div>
            <div className="sp-stat-value">{s.value}</div>
            <div className="sp-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <div className="sp-head fu" ref={headRef}>
        <div className="eyebrow">Kullanıcılarımız</div>
        <div className="headline">
          Gerçek gezginler,<br /><em>gerçek deneyimler.</em>
        </div>
      </div>
      <div className="sp-grid fu" ref={gridRef}>
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="sp-card">
            <div className="sp-card-top">
              <div className="sp-avatar">{t.avatar}</div>
              <div>
                <div className="sp-name">{t.name}</div>
                <div className="sp-location">{t.location}</div>
              </div>
            </div>
            <p className="sp-text">"{t.text}"</p>
            <div className="sp-stars">★★★★★</div>
          </div>
        ))}
      </div>
    </section>
  );
}
