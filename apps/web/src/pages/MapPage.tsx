import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Nav } from "../components/Nav";
import { PocketGuideMap } from "../components/map/PocketGuideMap";
import { RouteProvider } from "../context/RouteContext";
import { useAIAssistant } from "../context/AIAssistantContext";
import { useRoute } from "../context/RouteContext";
import { SyncManagerProvider } from "../context/SyncManagerContext";
import { DirectionsPanel } from "../components/navigation/DirectionsPanel";
import { useNetworkStatus } from "@pocketguide/hooks";
import { MAP_INITIAL_LAT, MAP_INITIAL_LNG } from "../components/map/MapView";
import type { POI, POICategory } from "../types/poi";

// Nominatim geocoding — ücretsiz, OpenStreetMap tabanlı
async function searchPlaces(query: string): Promise<NominatimResult[]> {
  if (!query.trim() || query.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=tr`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "PocketGuide/1.0" } });
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

interface RouteStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
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
  // Arama
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<NominatimResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Harita merkezi (AI asistan) — flyTarget yalnızca arama/konumda flyTo tetikler
  const [mapCenter, setMapCenter] = useState({ lat: MAP_INITIAL_LAT, lng: MAP_INITIAL_LNG });
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | undefined>(
    undefined,
  );

  const navigateMapTo = (lat: number, lng: number) => {
    setMapCenter({ lat, lng });
    setFlyTarget({ lat, lng });
  };

  // Rota durumu
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [activeSheet, setActiveSheet] = useState<"route" | "nearby" | "firstday">("route");
  const { addToRouteDraft, removeFromRouteDraft, startRoute, isFetching, error } = useRoute();
  const { setCoords: setAssistantCoords } = useAIAssistant();

  const { isOnline } = useNetworkStatus();
  const params = useParams<{ citySlug?: string }>();
  const citySlug = params.citySlug ?? "istanbul";

  // Arama debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
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
    setRouteStops((prev) => [...prev, stop]);
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
    setRouteStops((prev) => prev.filter((s) => s.id !== id));
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
              forcedCenter={flyTarget}
              searchMarker={
                selectedResult
                  ? {
                      lat: parseFloat(selectedResult.lat),
                      lng: parseFloat(selectedResult.lon),
                    }
                  : undefined
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
                      <button
                        type="button"
                        className="map-route-start-btn"
                        onClick={() => void startRoute()}
                        disabled={isFetching}
                      >
                        {isFetching ? "Rota Hesaplanıyor..." : "Rotayı Başlat →"}
                      </button>
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

          <DirectionsPanel />
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <RouteProvider>
      <SyncManagerProvider>
        <MapPageContent />
      </SyncManagerProvider>
    </RouteProvider>
  );
}
