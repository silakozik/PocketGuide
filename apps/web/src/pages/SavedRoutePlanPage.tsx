import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { GeneratedRoute } from "@pocketguide/core";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { RoutePlanDisplay } from "../components/RoutePlanDisplay";
import { getSavedTrip } from "../lib/savedTripsApi";
import { citySlugForRoute, parseAiRouteFromSavedTrip } from "../lib/aiRoutePlanner";

export default function SavedRoutePlanPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<GeneratedRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) {
      setError("Seyahat bulunamadı.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    void getSavedTrip(tripId)
      .then((trip) => {
        if (cancelled) return;
        const parsed = parseAiRouteFromSavedTrip(trip);
        if (!parsed) {
          setError("Bu kayıt AI rota planı formatında değil.");
          return;
        }
        setRoute(parsed);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error && err.message === "LOGIN_REQUIRED"
            ? "Bu rotayı görmek için giriş yapmalısın."
            : "Seyahat yüklenemedi.";
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const handleDownload = () => {
    if (!route) return;
    const blob = new Blob([JSON.stringify(route, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${route.city}-${route.days}-gun-rota.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const citySlug = route ? citySlugForRoute(route) : null;

  return (
    <>
      <Nav />
      <div className="rp-root">
        <div className="rp-content" style={{ paddingTop: 32 }}>
          <Link to="/profile" className="rp-back-btn">
            ← Seyahatlerim
          </Link>

          {loading && <div className="p-loading">Rota yükleniyor...</div>}

          {error && (
            <div className="rp-error" style={{ marginTop: 16 }}>
              {error}
              <div style={{ marginTop: 12 }}>
                <button type="button" className="rp-btn-secondary" onClick={() => navigate("/profile")}>
                  Profile dön
                </button>
              </div>
            </div>
          )}

          {route && (
            <div className="rp-section rp-fade-in">
              <RoutePlanDisplay route={route} />
              <div className="rp-action-row">
                {citySlug && (
                  <Link to={`/${citySlug}/first-day`} className="rp-btn-secondary">
                    💡 İlk Gün Rehberi
                  </Link>
                )}
                <Link to="/plan" className="rp-btn-secondary">
                  ✨ Yeni Rota Oluştur
                </Link>
                <button type="button" className="rp-btn-primary" onClick={handleDownload}>
                  ⬇️ Rotayı İndir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
