import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { saveTrip, getSavedTrip, type SavedTripStop } from "../lib/savedTripsApi";
import { getCityStaticData } from "../data/cityStaticData";
import { Nav } from "../components/Nav";
import { PocketGuideMap } from "../components/map/PocketGuideMap";
import { useAIAssistant } from "../context/AIAssistantContext";
import { useRoute } from "../context/RouteContext";
import { SyncManagerProvider } from "../context/SyncManagerContext";
import { DirectionsPanel } from "../components/navigation/DirectionsPanel";
import { useNetworkStatus } from "@pocketguide/hooks";
import { MAP_INITIAL_LAT, MAP_INITIAL_LNG } from "../components/map/MapView";
import { searchPlaces, geocodeVenue, type NominatimPlace } from "../lib/geocode";
import {
  loadAiRouteMapDraft,
  clearAiRouteMapDraft,
  loadAiRouteMapPois,
  clearAiRouteMapPois,
  geocodeDraftStopsToPois,
} from "../lib/aiRouteMap";
import type { POI, POICategory } from "../types/poi";

type NominatimResult = NominatimPlace;

interface RouteStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
}

function readMapLocationFromParams(params: URLSearchParams): {
  center?: { lat: number; lng: number };
  label?: string;
} {
  const latParam = params.get("lat");
  const lngParam = params.get("lng");
  if (latParam && lngParam) {
    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return {
        center: { lat, lng },
        label: params.get("name") ?? undefined,
      };
    }
  }

  const city = params.get("city");
  if (city) {
    const data = getCityStaticData(city);
    if (data) {
      const [lat, lng] = data.center;
      return { center: { lat, lng }, label: data.nameTr };
    }
  }

  return {};
}

function mapNominatimTypeToCategory(type: string): POICategory {
  const normalized = type.toLowerCase();
  if (["restaurant", "cafe", "fast_food", "bar", "pub"].includes(normalized)) return "restaurant";
  if (["museum", "gallery", "memorial", "attraction"].includes(normalized)) return "museum";
  if (["station", "bus_station", "subway_entrance", "airport"].includes(normalized)) return "transport";
  if (["hotel", "hostel", "guest_house", "motel"].includes(normalized)) return "hotel";
  if (["park", "garden"].includes(normalized)) return "park";
  return "event";
}

function MapPageContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saveTripMsg, setSaveTripMsg] = useState<string | null>(null);
  const [savingTrip, setSavingTrip] = useState(false);

  // Arama
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<NominatimResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [searchParams] = useSearchParams();
  const urlMapLocation = readMapLocationFromParams(searchParams);

  // Harita merkezi (AI asistan) — flyTarget yalnızca arama/konumda flyTo tetikler
  const [mapCenter, setMapCenter] = useState(
    () => urlMapLocation.center ?? { lat: MAP_INITIAL_LAT, lng: MAP_INITIAL_LNG },
  );
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | undefined>(
    () => urlMapLocation.center,
  );

  const navigateMapTo = (lat: number, lng: number) => {
    setMapCenter({ lat, lng });
    setFlyTarget({ lat, lng });
  };

  // Rota durumu
  const [activeSheet, setActiveSheet] = useState<"route" | "nearby" | "firstday">("route");
  const {
    draftPOIs,
    addToRouteDraft,
    removeFromRouteDraft,
    setRouteDraft,
    startRoute,
    isFetching,
    error,
    routeData,
  } = useRoute();

  const routeStops = useMemo<RouteStop[]>(
    () =>
      draftPOIs.map((poi) => ({
        id: poi.id,
        name: poi.name,
        lat: poi.coordinate.lat,
        lng: poi.coordinate.lng,
        address: poi.description,
      })),
    [draftPOIs],
  );
  const { setCoords: setAssistantCoords, recommendationPins } = useAIAssistant();

  const { isOnline } = useNetworkStatus();
  const params = useParams<{ citySlug?: string }>();
  const citySlug = params.citySlug ?? "istanbul";

  const [deepLinkMarker, setDeepLinkMarker] = useState<{ lat: number; lng: number } | undefined>(
    () =>
      searchParams.get("lat") && searchParams.get("lng")
        ? urlMapLocation.center
        : undefined,
  );
  const [searchQuery, setSearchQuery] = useState(() => urlMapLocation.label ?? "");
  const [aiRouteLoading, setAiRouteLoading] = useState(false);
  const aiRouteLoadRef = useRef(false);

  const applyAiRoutePois = useCallback(
    (pois: POI[], label: string) => {
      setRouteDraft(pois);
      setActiveSheet("route");
      setSearchQuery(label);
      setShowResults(false);
      navigateMapTo(pois[0].coordinate.lat, pois[0].coordinate.lng);
      if (pois.length >= 2) void startRoute();
    },
    [setRouteDraft, startRoute],
  );

  // ?lat=&lng=&name= (mekan) öncelikli; yalnızca ?city= ise şehir merkezi
  useEffect(() => {
    const { center, label } = readMapLocationFromParams(searchParams);
    if (!center) return;

    navigateMapTo(center.lat, center.lng);
    setDeepLinkMarker(
      searchParams.get("lat") && searchParams.get("lng") ? center : undefined,
    );
    if (label) setSearchQuery(label);
  }, [searchParams]);

  // AI rota planlayıcı — günlük rota haritada (POI listesi plan sayfasında hazırlanır)
  useEffect(() => {
    if (searchParams.get("loadAiRoute") !== "1") {
      aiRouteLoadRef.current = false;
      return;
    }
    if (aiRouteLoadRef.current) return;
    aiRouteLoadRef.current = true;

    const draft = loadAiRouteMapDraft();
    const preloaded = loadAiRouteMapPois();

    if (preloaded?.length) {
      const label = draft
        ? `${draft.city} · ${draft.day}. Gün (${preloaded.length} durak)`
        : `AI Rota (${preloaded.length} durak)`;
      applyAiRoutePois(preloaded, label);
      clearAiRouteMapDraft();
      clearAiRouteMapPois();
      return;
    }

    if (!draft?.stops.length) {
      setSaveTripMsg("Günlük rota verisi bulunamadı. Plan sayfasından tekrar deneyin.");
      return;
    }

    let cancelled = false;
    setAiRouteLoading(true);
    setSaveTripMsg(null);

    void geocodeDraftStopsToPois(
      draft.stops,
      draft.city,
      draft.day,
      draft.cityNameEn,
    )
      .then((pois) => {
        if (cancelled) return;
        if (pois.length === 0) {
          setSaveTripMsg("Mekanlar haritada bulunamadı.");
          return;
        }
        applyAiRoutePois(
          pois,
          `${draft.city} · ${draft.day}. Gün (${pois.length}/${draft.stops.length} durak)`,
        );
        clearAiRouteMapDraft();
        clearAiRouteMapPois();
      })
      .catch(() => {
        if (!cancelled) setSaveTripMsg("Günlük rota haritaya yüklenemedi.");
      })
      .finally(() => {
        if (!cancelled) setAiRouteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, applyAiRoutePois]);

  // Tek mekan — ?q= arama
  useEffect(() => {
    const q = searchParams.get("q");
    if (!q?.trim() || searchParams.get("loadAiRoute") === "1") return;

    let cancelled = false;
    void geocodeVenue(q.trim()).then((geo) => {
      if (cancelled || !geo) return;
      navigateMapTo(geo.lat, geo.lng);
      setDeepLinkMarker({ lat: geo.lat, lng: geo.lng });
      setSearchQuery(geo.displayName);
    });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  // Profilden kayıtlı seyahat aç
  useEffect(() => {
    const tripId = searchParams.get("savedTrip");
    if (!tripId) return;

    let cancelled = false;
    void getSavedTrip(tripId)
      .then((trip) => {
        if (cancelled) return;
        const stops = trip.stops as SavedTripStop[];
        setRouteDraft(
          stops.map((stop) => ({
            id: stop.id,
            name: stop.name,
            category: "event",
            coordinate: { lat: stop.lat, lng: stop.lng },
            description: stop.address,
          })),
        );
        if (trip.cityName) setSearchQuery(trip.cityName);
        setActiveSheet("route");
      })
      .catch(() => {
        if (!cancelled) setSaveTripMsg("Seyahat yüklenemedi");
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, setRouteDraft]);

  const handleSaveToTrips = async () => {
    if (routeStops.length < 2) return;

    if (!user) {
      navigate("/login?redirect=/map");
      return;
    }

    setSavingTrip(true);
    setSaveTripMsg(null);

    const cityLabel =
      searchParams.get("name") ||
      searchQuery.trim() ||
      routeStops[0]?.name ||
      undefined;

    try {
      await saveTrip({
        title: cityLabel ? `${cityLabel} Rotası` : undefined,
        cityName: cityLabel,
        stops: routeStops,
        routeData: routeData ?? undefined,
        durationMinutes: routeData?.total_duration_min,
        distanceKm: routeData?.total_distance_km,
      });
      setSaveTripMsg("Seyahatlerime kaydedildi ✓");
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "LOGIN_REQUIRED") {
        navigate("/login?redirect=/map");
        return;
      }
      setSaveTripMsg(err instanceof Error ? err.message : "Kayıt başarısız");
    } finally {
      setSavingTrip(false);
    }
  };

  // Arama debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      const results = await searchPlaces(searchQuery);
      setSearchResults(results);
      setShowResults(true);
      setSearchLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setAssistantCoords(mapCenter.lat, mapCenter.lng);
  }, [mapCenter.lat, mapCenter.lng, setAssistantCoords]);

  // Dışarı tıklayınca sonuçları kapat
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelectResult = (result: NominatimResult) => {
    setSearchQuery(result.display_name.split(",")[0]);
    setSelectedResult(result);
    setDeepLinkMarker(undefined);
    setShowResults(false);
    navigateMapTo(parseFloat(result.lat), parseFloat(result.lon));
  };

  const addToRoute = (result: NominatimResult) => {
    const stopId = `nm_${result.place_id}`;
    if (routeStops.some((stop) => stop.id === stopId)) {
      setShowResults(false);
      setSelectedResult(null);
      setSearchQuery("");
      setActiveSheet("route");
      return;
    }

    const stop: RouteStop = {
      id: stopId,
      name: result.display_name.split(",")[0],
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name.split(",").slice(1, 3).join(",").trim(),
    };
    const poiDraft: POI = {
      id: stop.id,
      name: stop.name,
      category: mapNominatimTypeToCategory(result.type),
      coordinate: {
        lat: stop.lat,
        lng: stop.lng,
      },
      description: stop.address,
    };
    addToRouteDraft(poiDraft);
    setShowResults(false);
    setSelectedResult(null);
    setSearchQuery("");
    setActiveSheet("route");
  };

  const removeFromRoute = (id: string) => {
    removeFromRouteDraft(id);
  };

  return (
    <div className="mapPageRoot">
      <Nav />
      <div className="mapPageMain">
          {!isOnline && (
            <div className="map-offline-banner">
              Çevrimdışı mod — kayıtlı veriler gösteriliyor
            </div>
          )}

          <div className="map-top-bar">
            <Link to={`/${citySlug}`} className="map-back-btn" aria-label="Geri dön">
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            <div className="map-search-wrap" ref={searchRef}>
              <div className="map-search-input-row">
                <svg
                  className="map-search-icon"
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  className="map-search-input"
                  placeholder="Yer, mekan, adres ara..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedResult(null);
                  }}
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                />
                {searchLoading && <div className="map-search-spinner" />}
                {searchQuery && !searchLoading && (
                  <button
                    type="button"
                    className="map-search-clear"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedResult(null);
                      setShowResults(false);
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              {showResults && searchResults.length > 0 && (
                <div className="map-search-results">
                  {searchResults.map((r) => (
                    <div key={r.place_id} className="map-search-result-item">
                      <button
                        type="button"
                        className="map-result-main"
                        onClick={() => handleSelectResult(r)}
                      >
                        <span className="map-result-icon">📍</span>
                        <span className="map-result-text">
                          <span className="map-result-name">
                            {r.display_name.split(",")[0]}
                          </span>
                          <span className="map-result-addr">
                            {r.display_name.split(",").slice(1, 3).join(",")}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        className="map-result-add-route"
                        onClick={() => addToRoute(r)}
                        title="Rotaya Ekle"
                      >
                        + Rotaya Ekle
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {selectedResult && !showResults && (
                <div className="map-selected-result-actions">
                  <div className="map-selected-result-name">
                    {selectedResult.display_name.split(",")[0]}
                  </div>
                  <button
                    type="button"
                    className="map-selected-add-route-btn"
                    onClick={() => addToRoute(selectedResult)}
                  >
                    + Rotaya Ekle
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="map-locate-btn"
              aria-label="Konumuma git"
              onClick={() =>
                navigator.geolocation?.getCurrentPosition(
                  (p) => navigateMapTo(p.coords.latitude, p.coords.longitude),
                  () => {},
                )
              }
            >
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06z"
                />
              </svg>
            </button>
          </div>

          <div className="map-container-wrapper">
            <PocketGuideMap
              categoryFilter="all"
              searchQuery=""
              showPins={false}
              showLayerToggle={false}
              aiRecommendationPins={recommendationPins}
              forcedCenter={flyTarget}
              searchMarker={
                selectedResult
                  ? {
                      lat: parseFloat(selectedResult.lat),
                      lng: parseFloat(selectedResult.lon),
                    }
                  : deepLinkMarker
              }
              onMapCenterChange={(lat, lng) => setMapCenter({ lat, lng })}
            />
          </div>

          <div className="map-bottom-sheet">
            <div className="map-sheet-handle" />

            <div className="map-sheet-tabs">
              <button
                type="button"
                className={`map-sheet-tab ${activeSheet === "route" ? "active" : ""}`}
                onClick={() => setActiveSheet("route")}
              >
                Rota Planla {routeStops.length > 0 && `(${routeStops.length})`}
              </button>
              <button
                type="button"
                className={`map-sheet-tab ${activeSheet === "nearby" ? "active" : ""}`}
                onClick={() => setActiveSheet("nearby")}
              >
                Yakınımda
              </button>
              <button
                type="button"
                className={`map-sheet-tab ${activeSheet === "firstday" ? "active" : ""}`}
                onClick={() => setActiveSheet("firstday")}
              >
                💡 İlk Gün
              </button>
            </div>

            {activeSheet === "route" && (
              <div className="map-route-panel">
                {routeStops.length === 0 ? (
                  <div className="map-route-empty">
                    <p>Aramadan yer seçerek rotana ekleyebilirsin.</p>
                    <p className="map-route-hint">En az 2 nokta ekle, sonra rotayı başlat.</p>
                  </div>
                ) : (
                  <>
                    <div className="map-route-stops">
                      {routeStops.map((stop, i) => (
                        <div key={stop.id} className="map-route-stop">
                          <div className="map-stop-num">{i + 1}</div>
                          <div className="map-stop-info">
                            <div className="map-stop-name">{stop.name}</div>
                            {stop.address && (
                              <div className="map-stop-addr">{stop.address}</div>
                            )}
                          </div>
                          <button
                            type="button"
                            className="map-stop-remove"
                            onClick={() => removeFromRoute(stop.id)}
                            aria-label="Kaldır"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    {routeStops.length >= 2 && (
                      <div className="map-route-actions">
                        <button
                          type="button"
                          className="map-route-start-btn"
                          onClick={() => void startRoute()}
                          disabled={isFetching}
                        >
                          {isFetching ? "Rota Hesaplanıyor..." : "Rotayı Başlat →"}
                        </button>
                        <button
                          type="button"
                          className="map-route-save-btn"
                          onClick={() => void handleSaveToTrips()}
                          disabled={savingTrip}
                        >
                          {savingTrip ? "Kaydediliyor…" : "Seyahatlerime Kaydet"}
                        </button>
                      </div>
                    )}
                    {aiRouteLoading && (
                      <p className="map-route-hint" style={{ color: "var(--muted)" }}>
                        Günlük rota haritaya yükleniyor…
                      </p>
                    )}
                    {saveTripMsg && !aiRouteLoading && (
                      <p
                        className="map-route-hint"
                        style={{
                          color: saveTripMsg.includes("✓") ? "#059669" : "#dc2626",
                        }}
                      >
                        {saveTripMsg}
                      </p>
                    )}
                    {error && (
                      <p className="map-route-hint" style={{ color: "#dc2626" }}>
                        {error}
                      </p>
                    )}
                    {routeStops.length < 2 && (
                      <p className="map-route-hint">
                        Rotayı başlatmak için en az 2 nokta ekle.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {activeSheet === "nearby" && (
              <div className="map-nearby-panel">
                <p className="map-nearby-hint">
                  Yakınındaki mekanları görmek için konum iznine ihtiyaç var.
                </p>
                <button
                  type="button"
                  className="map-nearby-allow-btn"
                  onClick={() =>
                    navigator.geolocation?.getCurrentPosition(
                      (p) => navigateMapTo(p.coords.latitude, p.coords.longitude),
                      () => {},
                    )
                  }
                >
                  Konumuma Git
                </button>
              </div>
            )}

            {activeSheet === "firstday" && (
              <div className="map-firstday-panel">
                <Link to={`/${citySlug}/first-day`} className="map-firstday-link">
                  <span>💡</span>
                  <span>İlk Gün Rehberini Aç</span>
                  <span>→</span>
                </Link>
              </div>
            )}
          </div>

          <DirectionsPanel
            onSaveToTrips={() => void handleSaveToTrips()}
            savingTrip={savingTrip}
            saveTripMsg={saveTripMsg}
          />
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <SyncManagerProvider>
      <MapPageContent />
    </SyncManagerProvider>
  );
}
