import { useScrollReveal } from "../hooks/useScrollReveal";

export function Transit() {
  const leftRef = useScrollReveal<HTMLDivElement>();
  const boxRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="transit-wrap" id="transit">
      <div className="transit-glow" />
      <div className="transit-inner">
        <div className="fu" ref={leftRef}>
          <div className="eyebrow" style={{ color: "var(--gold)" }}>Ulaşım</div>
          <h2 className="transit-headline">
            Metro kaotik<br />olmak <em>zorunda değil.</em>
          </h2>
          <p className="transit-desc">
            Dünyanın en karmaşık toplu taşıma ağlarını birkaç adıma indiriyoruz. Tokyo, Londra veya İstanbul — adım adım rehberlik.
          </p>
          <div className="tfeats">
            <div className="tfeat">
              <div className="tfeat-ico">🗺</div>
              <div className="tfeat-text"><strong>Sade Görsel Harita</strong>Karmaşık hatları anlaşılır diyagramlara dönüştürür.</div>
            </div>
            <div className="tfeat">
              <div className="tfeat-ico">🔄</div>
              <div className="tfeat-text"><strong>Aktarma Noktaları</strong>Nerede inmeli, nereye geçmeli — açık talimatlar.</div>
            </div>
            <div className="tfeat">
              <div className="tfeat-ico">💳</div>
              <div className="tfeat-text"><strong>Bilet & Kart Bilgisi</strong>Hangi kartı al, nasıl yükle, ne kadar koymalısın.</div>
            </div>
          </div>
        </div>
        <div className="metro-box fu" ref={boxRef}>
          <div className="metro-topbar">
            <div className="metro-city">İstanbul Metro</div>
            <div className="metro-live">Canlı · Güncellendi</div>
          </div>
          <svg className="metro-svg" viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="250" fill="#0d1829" rx="10" />
            <defs>
              <pattern id="mg" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0L0 0 0 20" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth={1} />
              </pattern>
            </defs>
            <rect width="400" height="250" fill="url(#mg)" />
            <line x1={28} y1={68} x2={372} y2={68} stroke="#e8c547" strokeWidth={4} strokeLinecap="round" />
            <line x1={28} y1={128} x2={372} y2={128} stroke="#4a8fd4" strokeWidth={4} strokeLinecap="round" />
            <line x1={200} y1={18} x2={200} y2={232} stroke="#2ecc8a" strokeWidth={4} strokeLinecap="round" />
            <path d="M 38 196 Q 200 176 362 196" fill="none" stroke="#a078d4" strokeWidth={4} strokeLinecap="round" />
            {[78, 138, 200, 268, 330].map((cx) => <circle key={`m1-${cx}`} cx={cx} cy={68} r={cx === 200 ? 8 : 5} fill="#0d1829" stroke="#e8c547" strokeWidth={2} />)}
            {[78, 138, 200, 268, 330].map((cx) => <circle key={`m2-${cx}`} cx={cx} cy={128} r={cx === 200 ? 8 : 5} fill="#0d1829" stroke="#4a8fd4" strokeWidth={2} />)}
            {[48, 98, 158].map((cy) => <circle key={`m3-${cy}`} cx={200} cy={cy} r={5} fill="#0d1829" stroke="#2ecc8a" strokeWidth={2} />)}
            <circle cx={200} cy={210} r={5} fill="#0d1829" stroke="#a078d4" strokeWidth={2} />
            <circle cx={138} cy={68} r={4} fill="#e8c547" />
            <circle cx={138} cy={68} r={11} fill="none" stroke="#e8c547" strokeWidth={1.5} opacity={0.3}>
              <animate attributeName="r" values="8;18;8" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <text x={200} y={57} textAnchor="middle" fill="white" fontSize={8} fontFamily="DM Sans,sans-serif" fontWeight={500}>Taksim</text>
            <text x={200} y={117} textAnchor="middle" fill="white" fontSize={8} fontFamily="DM Sans,sans-serif" fontWeight={500}>Şişhane</text>
            <text x={138} y={57} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize={7.5} fontFamily="DM Sans,sans-serif">Osmanbey</text>
            <text x={78} y={57} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={7} fontFamily="DM Sans,sans-serif">Levent</text>
            <rect x={16} y={60} width={20} height={14} rx={4} fill="#e8c547" />
            <text x={26} y={71} textAnchor="middle" fill="#0f1f3d" fontSize={7} fontWeight={700} fontFamily="DM Sans,sans-serif">M1</text>
            <rect x={16} y={120} width={20} height={14} rx={4} fill="#4a8fd4" />
            <text x={26} y={131} textAnchor="middle" fill="white" fontSize={7} fontWeight={700} fontFamily="DM Sans,sans-serif">M2</text>
            <rect x={192} y={10} width={20} height={14} rx={4} fill="#2ecc8a" />
            <text x={202} y={21} textAnchor="middle" fill="#0d1829" fontSize={7} fontWeight={700} fontFamily="DM Sans,sans-serif">M3</text>
          </svg>
          <div className="metro-step">
            <div className="step-badge">1</div>
            <div className="step-txt"><strong>Osmanbey → Taksim</strong> M1 hattıyla 2 durak, 4 dakika · Ardından M2'ye aktarma</div>
          </div>
        </div>
      </div>
    </section>
  );
}
