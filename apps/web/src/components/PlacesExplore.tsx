import { useNavigate } from "react-router-dom";
import type { KeyboardEvent } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { PLACE_CATEGORIES } from "../constants/placeCategories";
import {
  DEFAULT_EXPLORE_CITY,
  LAST_CITY_STORAGE_KEY,
  resolveExploreCitySlug,
} from "../constants/homepageCities";

export function PlacesExplore() {
  const ref = useScrollReveal<HTMLElement>();
  const navigate = useNavigate();

  const goToCategory = (slug: string) => {
    const stored =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(LAST_CITY_STORAGE_KEY)
        : null;
    const city = resolveExploreCitySlug(stored ?? DEFAULT_EXPLORE_CITY);
    navigate(`/explore/${slug}?city=${city}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, slug: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToCategory(slug);
    }
  };

  return (
    <section className="places-explore-wrap fu" ref={ref}>
      <div className="places-explore-inner">
        <div className="places-explore-header">
          <h2 className="places-explore-title">Mekanları Keşfet</h2>
          <p className="places-explore-sub">
            Restoranlardan tarihi mekanlara — şehrini seç, listele, haritada gör.
          </p>
        </div>
        <div className="places-grid">
          {PLACE_CATEGORIES.map((cat) => (
            <div
              key={cat.slug}
              className="place-card"
              role="button"
              tabIndex={0}
              onClick={() => goToCategory(cat.slug)}
              onKeyDown={(event) => handleKeyDown(event, cat.slug)}
            >
              <div className="place-card-img" style={{ background: cat.gradient }}>
                <span className="place-card-emoji">{cat.emoji}</span>
              </div>
              <div className="place-card-body">
                <div className="place-card-name">{cat.title}</div>
                <div className="place-card-sub">{cat.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="places-explore-attribution">
          Mekan verileri{" "}
          <a href="https://foursquare.com" target="_blank" rel="noreferrer">
            Foursquare
          </a>{" "}
          üzerinden sağlanır.
        </p>
      </div>
    </section>
  );
}
