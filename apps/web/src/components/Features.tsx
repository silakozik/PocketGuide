import { useScrollReveal } from "../hooks/useScrollReveal";

const FEATURES = [
  { icon: "🗺", title: "Akıllı Rota Planlama", desc: "İlgi alanlarına göre AI tarafından optimize edilmiş günlük rotalar. Yürüyüş süresi, yorgunluk ve kalabalık faktörü hesaba katılır." },
  { icon: "🚇", title: "Metro & Ulaşım Rehberi", desc: "Dünyanın en karmaşık toplu taşıma ağlarını sade şemalara dönüştürür. Tokyo metrosunda bile kaybolmazsın." },
  { icon: "🍜", title: "Gastronomi Önerileri", desc: "Turistik tuzaklardan kaçın. Yerel favori mekanlar, kalabalıktan uzak köşeler ve konumuna en yakın lezzetler." },
  { icon: "📋", title: "İlk Gün Rehberi", desc: "SIM kart, ulaşım kartı, ATM ücretleri... Şehre adaptasyonun ilk adımlarını sıfır araştırmayla geç." },
  { icon: "⚡", title: "Anlık Etkinlik Takibi", desc: "Konser, pazar, festival, pop-up — bulunduğun bölgede şu an ne var? Konum bazlı gerçek zamanlı güncelleme." },
  { icon: "📡", title: "Offline Erişim", desc: "İnternet olmasa da rotanı takip edebilir, haritayı görebilir, önerilere ulaşabilirsin. Seyahatte veri harcanmaz." },
];

export function Features() {
  const headlineRef = useScrollReveal<HTMLDivElement>();
  const gridRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="features-wrap" id="features">
      <div className="eyebrow">Özellikler</div>
      <div className="headline fu" ref={headlineRef}>
        Tek uygulama,<br /><em>sonsuz keşif.</em>
      </div>
      <div className="feat-grid fu" ref={gridRef}>
        {FEATURES.map((f) => (
          <div key={f.title} className="feat-card">
            <div className="feat-ico">{f.icon}</div>
            <div className="feat-title">{f.title}</div>
            <p className="feat-desc">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
