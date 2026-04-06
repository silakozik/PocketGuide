import { Button } from "@pocketguide/ui";
import { useScrollReveal } from "../hooks/useScrollReveal";

export function Hero() {
  const ref = useScrollReveal<HTMLDivElement>();

  return (
    <section className="hero">
      <div className="hero-bg" />
      <div className="hero-inner fu" ref={ref}>
        <div className="hero-badge">
          <div className="badge-dot" />
          Yapay Zeka Destekli Şehir Asistanı &nbsp;·&nbsp; 120+ şehir aktif
        </div>
        <h1>Gittiğin şehri<br /><em>ilk günden</em> bil.</h1>
        <p className="hero-sub">
          Rota planlaması, metro rehberi, gastronomi önerileri ve anlık etkinlikler — hepsi tek
          yerde, sana özel.
        </p>
        <div className="search-bar">
          <div className="search-icon">🔍</div>
          <input
            className="search-input"
            type="text"
            placeholder="Hangi şehri keşfetmek istiyorsun?"
          />
          <div className="search-divider" />
          <div className="search-date">📅 Tarih ekle</div>
          <Button type="button" className="search-btn">
            Rotanı Oluştur
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
        <div className="hero-hint">
          <span><div className="hero-hint-dot" /> Ücretsiz başla</span>
          <span><div className="hero-hint-dot" /> Kredi kartı gerekmez</span>
          <span><div className="hero-hint-dot" /> Offline çalışır</span>
        </div>
      </div>
    </section>
  );
}
