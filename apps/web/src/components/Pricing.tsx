import { useScrollReveal } from "../hooks/useScrollReveal";

const PLANS = [
  {
    name: "Gezgin",
    price: "Ücretsiz",
    period: "",
    desc: "Tek şehir, temel özellikler",
    features: [
      "1 şehir rehberi",
      "Temel rota planlama",
      "İlk gün rehberi",
      "Offline haritalar",
      "Topluluk desteği",
    ],
    cta: "Ücretsiz Başla",
    highlight: false,
  },
  {
    name: "Kaşif",
    price: "₺79",
    period: "/ ay",
    desc: "Sınırsız şehir, AI destekli",
    features: [
      "Sınırsız şehir erişimi",
      "AI akıllı rota planlama",
      "Gerçek zamanlı etkinlikler",
      "Metro & ulaşım rehberi",
      "Gastronomi önerileri",
      "Öncelikli destek",
    ],
    cta: "14 Gün Ücretsiz Dene",
    highlight: true,
  },
  {
    name: "Profesyonel",
    price: "₺149",
    period: "/ ay",
    desc: "Takım & iş seyahatleri için",
    features: [
      "Kaşif'in tüm özellikleri",
      "Takım rota paylaşımı",
      "API erişimi",
      "Özelleştirilmiş raporlar",
      "Kurumsal faturalama",
      "7/24 destek",
    ],
    cta: "İletişime Geç",
    highlight: false,
  },
];

export function Pricing() {
  const headRef = useScrollReveal<HTMLDivElement>();
  const gridRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="pricing-wrap" id="pricing">
      <div className="fu" ref={headRef}>
        <div className="eyebrow">Fiyatlar</div>
        <div className="headline">
          Her gezgin için<br /><em>uygun plan.</em>
        </div>
      </div>
      <div className="pricing-grid fu" ref={gridRef}>
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`pricing-card ${plan.highlight ? "pricing-highlight" : ""}`}
          >
            {plan.highlight && <div className="pricing-badge">En Popüler</div>}
            <div className="pricing-name">{plan.name}</div>
            <div className="pricing-price">
              {plan.price}
              {plan.period && <span className="pricing-period">{plan.period}</span>}
            </div>
            <p className="pricing-desc">{plan.desc}</p>
            <ul className="pricing-features">
              {plan.features.map((f) => (
                <li key={f}>
                  <span className="pricing-check">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="#cta"
              className={plan.highlight ? "pricing-btn-gold" : "pricing-btn"}
            >
              {plan.cta}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
