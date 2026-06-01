import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  HOMEPAGE_CITIES,
  LAST_CITY_STORAGE_KEY,
  resolveExploreCitySlug,
} from "../constants/homepageCities";
import { getPlaceCategory, isExplorePlaceCategory } from "../constants/placeCategories";
import { fetchExplorePlaces, type ExplorePlaceItem } from "../lib/placesExploreApi";
import "./places-explore-page.css";

const PAGE_SIZE = 30;

function formatRating(rating: number | null): string {
  if (rating == null) return "";
  return rating.toFixed(1);
}

function priceLabel(level: number | null): string {
  if (level == null) return "";
  return "$".repeat(Math.min(4, Math.max(1, Math.round(level))));
}

export default function PlacesExplorePage() {
  const navigate = useNavigate();
  const { placeCategory: categoryParam } = useParams<{ placeCategory: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryMeta = categoryParam ? getPlaceCategory(categoryParam) : undefined;

  const citySlug = useMemo(
    () => resolveExploreCitySlug(searchParams.get("city")),
    [searchParams],
  );

  const [places, setPlaces] = useState<ExplorePlaceItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cityLabel =
    HOMEPAGE_CITIES.find((c) => c.slug === citySlug)?.nameTr ?? citySlug;

  const loadPage = useCallback(
    async (nextOffset: number, append: boolean) => {
      if (!categoryParam || !isExplorePlaceCategory(categoryParam)) return;

      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await fetchExplorePlaces(citySlug, categoryParam, {
          limit: PAGE_SIZE,
          offset: nextOffset,
        });
        setTotal(res.meta.total);
        setOffset(nextOffset + res.data.length);
        setPlaces((prev) => (append ? [...prev, ...res.data] : res.data));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Mekanlar yüklenemedi.");
        if (!append) {
          setPlaces([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [categoryParam, citySlug],
  );

  useEffect(() => {
    if (!categoryParam || !isExplorePlaceCategory(categoryParam)) return;
    setPlaces([]);
    setOffset(0);
    void loadPage(0, false);
  }, [categoryParam, citySlug, loadPage]);

  useEffect(() => {
    if (citySlug) {
      localStorage.setItem(LAST_CITY_STORAGE_KEY, citySlug);
    }
  }, [citySlug]);

  if (!categoryMeta) {
    return <Navigate to="/" replace />;
  }

  const handleCityChange = (slug: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("city", slug);
    setSearchParams(next, { replace: true });
  };

  const hasMore = places.length < total;

  return (
    <div className="places-list-root">
      <div className="places-list-hero" style={{ background: categoryMeta.gradient }}>
        <div className="places-list-hero-overlay" />
        <button
          type="button"
          className="places-list-back"
          onClick={() => navigate(-1)}
          aria-label="Geri"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="places-list-hero-emoji">{categoryMeta.emoji}</div>
        <div className="places-list-hero-info">
          <h1 className="places-list-hero-title">{categoryMeta.title}</h1>
          <p className="places-list-hero-meta">
            {cityLabel}
            {loading ? "" : ` · ${total} mekan`}
          </p>
          <label className="places-list-city-picker">
            <span className="sr-only">Şehir seç</span>
            <select
              value={citySlug}
              onChange={(e) => handleCityChange(e.target.value)}
              className="places-list-city-select"
            >
              {HOMEPAGE_CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nameTr}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="places-list-content">
        {loading && (
          <div className="places-list-status">Mekanlar yükleniyor…</div>
        )}

        {!loading && error && (
          <div className="places-list-error">
            <p>{error}</p>
            <p className="places-list-error-hint">
              API çalışıyor mu? Veri yoksa <code>pnpm seed:places:osm</code> veya geçerli Foursquare key ile{" "}
              <code>pnpm seed:places</code> çalıştırın.
            </p>
            <button type="button" className="places-list-retry" onClick={() => void loadPage(0, false)}>
              Tekrar dene
            </button>
          </div>
        )}

        {!loading && !error && places.length === 0 && (
          <div className="places-list-empty">
            <p>Bu şehirde henüz {categoryMeta.title.toLowerCase()} kaydı yok.</p>
            <Link to={`/map?city=${encodeURIComponent(citySlug)}`} className="places-list-map-link">
              Haritada keşfet
            </Link>
          </div>
        )}

        {!loading && !error && places.length > 0 && (
          <ul className="places-list-rows">
            {places.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  className="places-list-row"
                  onClick={() =>
                    navigate(
                      `/map?city=${encodeURIComponent(citySlug)}&lat=${place.lat}&lng=${place.lng}&name=${encodeURIComponent(place.name)}`,
                    )
                  }
                >
                  <span className="places-list-row-icon">{categoryMeta.emoji}</span>
                  <span className="places-list-row-body">
                    <span className="places-list-row-name">{place.name}</span>
                    <span className="places-list-row-meta">
                      {place.description || categoryMeta.subtitle}
                      {place.address ? ` · ${place.address}` : ""}
                    </span>
                  </span>
                  <span className="places-list-row-side">
                    {place.rating != null && (
                      <span className="places-list-rating">{formatRating(place.rating)} ★</span>
                    )}
                    {place.priceLevel != null && (
                      <span className="places-list-price">{priceLabel(place.priceLevel)}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!loading && !error && hasMore && (
          <button
            type="button"
            className="places-list-more"
            disabled={loadingMore}
            onClick={() => void loadPage(offset, true)}
          >
            {loadingMore ? "Yükleniyor…" : "Daha fazla göster"}
          </button>
        )}

        <div className="places-list-footer">
          <Link
            to={`/map?city=${encodeURIComponent(citySlug)}`}
            className="places-list-map-cta"
          >
            Haritada gör
          </Link>
          <p className="places-list-attribution">
            Powered by{" "}
            <a href="https://foursquare.com" target="_blank" rel="noreferrer">
              Foursquare
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
