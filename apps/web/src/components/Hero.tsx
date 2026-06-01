import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@pocketguide/ui";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { geocodeCity } from "../lib/geocode";
import { resolveCitySlug } from "../lib/citySlug";

export function Hero() {
  const ref = useScrollReveal<HTMLDivElement>();
  const navigate = useNavigate();
  const [cityQuery, setCityQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e?: FormEvent) => {
    e?.preventDefault();
    const q = cityQuery.trim();
    if (!q) {
      setSearchError("Lütfen bir şehir girin.");
      return;
    }

    setSearching(true);
    setSearchError(null);

    try {
      const slug = resolveCitySlug(q);
      if (slug) {
        navigate(`/map?city=${encodeURIComponent(slug)}`);
        return;
      }

      const place = await geocodeCity(q);
      if (!place) {
        setSearchError("Şehir bulunamadı. Yazımı kontrol edip tekrar deneyin.");
        return;
      }

      const params = new URLSearchParams({
        lat: String(place.lat),
        lng: String(place.lng),
        name: place.displayName,
      });
      navigate(`/map?${params.toString()}`);
    } finally {
      setSearching(false);
    }
  };

  return (
    <section className="hero">
      <div className="hero-bg" />
      <div className="hero-inner fu" ref={ref}>
        <div className="hero-badge">
          <div className="badge-dot" />
          Yapay Zeka Destekli Şehir Asistanı &nbsp;·&nbsp; Dünya genelinde şehirler
        </div>
        <h1>Gittiğin şehri<br /><em>ilk günden</em> bil.</h1>
        <p className="hero-sub">
          Rota planlaması, metro rehberi, gastronomi önerileri ve anlık etkinlikler — hepsi tek
          yerde, sana özel.
        </p>
        <form className="search-bar" onSubmit={handleSearch}>
          <div className="search-icon">🔍</div>
          <input
            className="search-input"
            type="text"
            placeholder="Hangi şehri keşfetmek istiyorsun? (örn. Adana, Tokyo)"
            value={cityQuery}
            onChange={(e) => {
              setCityQuery(e.target.value);
              if (searchError) setSearchError(null);
            }}
            aria-label="Şehir ara"
            disabled={searching}
          />
          <div className="search-divider" />
          <div className="search-date" role="presentation">
            📅 Tarih ekle
          </div>
          <Button type="submit" className="search-btn" disabled={searching}>
            {searching ? "Aranıyor…" : "Rotanı Oluştur"}
            {!searching && (
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </Button>
        </form>
        {searchError && (
          <p className="hero-search-error" role="alert">
            {searchError}
          </p>
        )}
        <div className="hero-hint">
          <span><div className="hero-hint-dot" /> Ücretsiz başla</span>
          <span><div className="hero-hint-dot" /> Kredi kartı gerekmez</span>
          <span><div className="hero-hint-dot" /> Offline çalışır</span>
        </div>
      </div>
    </section>
  );
}
