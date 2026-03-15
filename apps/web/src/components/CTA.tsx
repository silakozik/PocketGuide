import { useScrollReveal } from "../hooks/useScrollReveal";

export function CTA() {
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <div className="cta-outer" id="cta">
      <div className="cta-box fu" ref={ref}>
        <h2 className="cta-title">
          Bir sonraki şehrin<br />seni <em>bekliyor.</em>
        </h2>
        <p className="cta-sub">İlk şehrin tamamen ücretsiz. Kredi kartı gerekmez.</p>
        <div className="cta-btns">
          <a href="#" className="btn-gold">🚀 Ücretsiz Başla</a>
          <a href="#features" className="btn-outline">Daha Fazla Keşfet →</a>
        </div>
      </div>
    </div>
  );
}
