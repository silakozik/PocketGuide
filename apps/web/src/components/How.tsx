import { useScrollReveal } from "../hooks/useScrollReveal";

const STEPS = [
  { n: "1", title: "Şehrini Seç", text: "Ziyaret edeceğin şehri ve tarihleri gir. PocketGuide o şehri otomatik yükler." },
  { n: "2", title: "İlgi Alanlarını Belirle", text: "Tarih, sanat, yeme-içme, doğa... tercihlerini söyle, AI kişiselleştirsin." },
  { n: "3", title: "Rotanı Al", text: "Optimize edilmiş günlük planın hazır. Düzenle, değiştir veya direkt kullan." },
  { n: "4", title: "Keşfe Çık", text: "Offline çalışır, internet olmasa da rehberin yanında. Sadece git ve keşfet." },
];

export function How() {
  const headlineRef = useScrollReveal<HTMLDivElement>();
  const rowRef = useScrollReveal<HTMLDivElement>();

  return (
    <section className="how-wrap" id="how">
      <div className="eyebrow">Nasıl Çalışır</div>
      <div className="headline fu" ref={headlineRef}>
        Dört adımda<br /><em>hazırsın.</em>
      </div>
      <div className="steps-row fu" ref={rowRef}>
        {STEPS.map((s) => (
          <div key={s.n} className="step">
            <div className="step-circle">{s.n}</div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
