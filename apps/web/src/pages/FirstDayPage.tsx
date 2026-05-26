import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './first-day.css';

const API = 'http://localhost:3001';

/** URL slug → DB slug (backend ile aynı) */
const SLUG_ALIASES: Record<string, string> = {
  london: 'londra',
  rome: 'roma',
};

function resolveCitySlug(slug: string): string {
  return SLUG_ALIASES[slug.toLowerCase()] ?? slug;
}

/** Şehir merkezi koordinatları — POI yokken harita buraya odaklanır */
const CITY_CENTERS: Record<string, [number, number]> = {
  istanbul: [41.0082, 28.9784],
  paris: [48.8566, 2.3522],
  londra: [51.5074, -0.1278],
  london: [51.5074, -0.1278],
  roma: [41.9028, 12.4964],
  rome: [41.9028, 12.4964],
  barcelona: [41.3874, 2.1686],
  amsterdam: [52.3676, 4.9041],
  tokyo: [35.6762, 139.6503],
  'new-york': [40.7128, -74.006],
  dubai: [25.2048, 55.2708],
  sydney: [-33.8688, 151.2093],
};

interface POI {
  id: string;
  name: string;
  category: string;
  address: string | null;
  lat: number;
  lng: number;
  openingHours?: string;
}

interface City {
  id: string;
  nameEn: string;
  nameTr: string;
  slug: string;
}

interface CityEvent {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string;
}

const TABS = [
  { id: 'sim', label: 'SIM Kart', emoji: '📱', color: '#3b82f6', adaptCategory: 'sim' },
  { id: 'transport', label: 'Ulaşım Kartı', emoji: '🚇', color: '#10b981', adaptCategory: 'transport_card' },
  { id: 'exchange', label: 'Döviz', emoji: '💱', color: '#f59e0b', adaptCategory: 'exchange' },
  { id: 'route', label: 'İlk Gün Rotası', emoji: '🗺️', color: '#8b5cf6', adaptCategory: null },
  { id: 'events', label: 'Bugünkü Etkinlikler', emoji: '🎭', color: '#e8c547', adaptCategory: null },
];

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function FirstDayPage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [activeTab, setActiveTab] = useState('sim');
  const [city, setCity] = useState<City | null>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const [routePois, setRoutePois] = useState<POI[]>([]);
  const [cityEvents, setCityEvents] = useState<CityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
    );
  }, []);

  useEffect(() => {
    if (!citySlug) return;
    const slug = resolveCitySlug(citySlug);
    setLoading(true);
    setFetchError('');
    Promise.all([
      fetch(`${API}/api/adaptation/${slug}`).then(async (r) => {
        if (!r.ok) throw new Error('Şehir bulunamadı');
        return r.json();
      }),
      fetch(`${API}/api/pois/city/${slug}?category=culture`).then(r => r.ok ? r.json() : { data: [] }),
      fetch(`${API}/api/pois/city/${slug}?category=food`).then(r => r.ok ? r.json() : { data: [] }),
      fetch(`${API}/api/events/city/${slug}`).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
    ]).then(([adapt, culture, food, evts]) => {
      if (adapt.city) {
        setCity({
          id: adapt.city.id,
          nameEn: adapt.city.nameEn,
          nameTr: adapt.city.nameTr ?? adapt.city.name,
          slug: adapt.city.slug,
        });
      } else {
        setCity(null);
        setFetchError('Bu şehir için henüz veri yüklenmemiş. Admin panelinden import edin veya seed scriptini çalıştırın.');
      }
      setPois(adapt.data || []);
      const cultureList = (culture.data || []).slice(0, 3).map((p: POI) => ({ ...p, category: 'culture' }));
      const foodList = (food.data || []).slice(0, 2).map((p: POI) => ({ ...p, category: 'food' }));
      setRoutePois([...cultureList, ...foodList]);
      setCityEvents(evts.data || []);
    }).catch(() => {
      setFetchError('Veri yüklenemedi. API çalışıyor mu? Şehir veritabanında kayıtlı mı?');
      setCity(null);
      setPois([]);
      setRoutePois([]);
      setCityEvents([]);
    })
      .finally(() => setLoading(false));
  }, [citySlug]);

  const activeAdaptCategory = TABS.find(t => t.id === activeTab)?.adaptCategory;

  const filteredPois = useMemo(() => {
    if (!activeAdaptCategory) return [];
    return pois
      .filter(p => p.category === activeAdaptCategory)
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(p => ({
        ...p,
        distance: userLocation
          ? getDistance(userLocation.lat, userLocation.lng, p.lat, p.lng)
          : null,
      }))
      .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
  }, [pois, activeAdaptCategory, searchQuery, userLocation]);

  const activeMarkers = useMemo(() => {
    if (activeTab === 'route') return routePois;
    if (!activeAdaptCategory) return [];
    return pois.filter(p => p.category === activeAdaptCategory);
  }, [pois, routePois, activeTab, activeAdaptCategory]);

  const mapCenter = useMemo((): [number, number] => {
    if (activeMarkers.length > 0) return [activeMarkers[0].lat, activeMarkers[0].lng];
    const slug = resolveCitySlug(citySlug ?? '');
    return CITY_CENTERS[slug] ?? CITY_CENTERS[citySlug ?? ''] ?? [41.0082, 28.9784];
  }, [activeMarkers, citySlug]);

  const activeTabMeta = TABS.find(t => t.id === activeTab);

  if (loading && !city) {
    return (
      <div className="fd-loading">
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="fd-root">
      <header className="fd-header">
        <Link to={`/${citySlug}`} className="fd-back-btn">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="fd-header-info">
          <h1>{city?.nameTr || city?.nameEn || 'Şehir Rehberi'}</h1>
          <p>Şehre ilk adımın için her şey burada</p>
        </div>
      </header>

      <div className="fd-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`fd-tab ${activeTab === tab.id ? 'active' : ''}`}
            style={{ '--tab-color': tab.color } as React.CSSProperties}
            onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
          >
            <span className="fd-tab-dot" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== 'events' && (
        <div className="fd-map-container">
          <MapContainer center={mapCenter} zoom={14} className="fd-map" zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ChangeView center={mapCenter} />

            {activeTab !== 'route' && activeMarkers.map(p => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={L.divIcon({
                  className: 'leaflet-custom-marker',
                  html: `<div class="fd-pin" style="background:${activeTabMeta?.color}">
                           ${activeTabMeta?.emoji}
                         </div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 32],
                })}
              >
                <Popup><strong>{p.name}</strong><br />{p.address}</Popup>
              </Marker>
            ))}

            {activeTab === 'route' && routePois.map((p, i) => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={L.divIcon({
                  className: 'leaflet-custom-marker',
                  html: `<div class="fd-pin fd-pin-route">${i + 1}</div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 32],
                })}
              >
                <Popup><strong>{p.name}</strong></Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      <div className="fd-content">
        {fetchError && (
          <div className="fd-empty" style={{ padding: '20px', marginBottom: 16 }}>
            <span>⚠️</span>
            <p>{fetchError}</p>
          </div>
        )}
        {(activeTab === 'sim' || activeTab === 'transport' || activeTab === 'exchange') && (
          <>
            <div className="fd-search">
              <svg className="fd-search-icon" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="İsime göre ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="fd-poi-list">
              {filteredPois.length > 0 ? filteredPois.map(p => (
                <div key={p.id} className="fd-poi-card">
                  <div
                    className="fd-poi-icon"
                    style={{ background: (activeTabMeta?.color ?? '#3b82f6') + '1a' }}
                  >
                    {activeTabMeta?.emoji}
                  </div>
                  <div className="fd-poi-body">
                    <div className="fd-poi-name">{p.name}</div>
                    <div className="fd-poi-addr">📍 {p.address || 'Adres bilgisi yok'}</div>
                    <div className="fd-poi-tags">
                      {p.distance !== null && p.distance !== undefined && (
                        <span className="fd-tag fd-tag-dist">
                          {p.distance < 1
                            ? `${Math.round(p.distance * 1000)} m`
                            : `${p.distance.toFixed(1)} km`}
                        </span>
                      )}
                      {p.openingHours
                        ? <span className="fd-tag">{p.openingHours}</span>
                        : <span className="fd-tag">Hergün Açık</span>
                      }
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fd-maps-btn"
                  >
                    📍
                  </a>
                </div>
              )) : (
                <div className="fd-empty">
                  <span>🔍</span>
                  <p>{pois.length === 0 && !fetchError
                    ? 'Bu şehir için SIM kart noktası henüz yüklenmemiş. Admin panelinden import edin.'
                    : 'Sonuç bulunamadı.'}</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'route' && (
          <div className="fd-route-section">
            <div className="fd-section-label">Önerilen İlk Gün Rotası</div>
            <p className="fd-route-desc">
              Şehri tanımak için hazırlanmış temel rota — kültür noktaları ve yemek durakları.
            </p>

            {routePois.length === 0 ? (
              <div className="fd-empty"><span>🗺️</span><p>Rota verisi yükleniyor...</p></div>
            ) : (
              <div className="fd-stops">
                {routePois.map((p, i) => (
                  <div key={p.id} className="fd-stop">
                    <div className="fd-stop-line">
                      <div className={`fd-stop-num ${p.category === 'food' ? 'food' : 'culture'}`}>
                        {i + 1}
                      </div>
                      {i < routePois.length - 1 && <div className="fd-stop-seg" />}
                    </div>
                    <div className="fd-stop-body">
                      <div className="fd-stop-name">{p.name}</div>
                      {p.address && <div className="fd-stop-addr">📍 {p.address}</div>}
                      <span className={`fd-stop-chip ${p.category === 'food' ? 'food' : 'culture'}`}>
                        {p.category === 'food' ? '🍽️ Yemek' : '🏛️ Kültür'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="fd-events-section">
            <div className="fd-section-label">
              Bugün · {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            {cityEvents.length === 0 ? (
              <div className="fd-empty">
                <span>🎭</span>
                <p>Bugün için kayıtlı etkinlik bulunamadı.</p>
              </div>
            ) : (
              cityEvents.map(ev => {
                const start = new Date(ev.startDate);
                return (
                  <div key={ev.id} className="fd-event-card">
                    <div className="fd-event-date">
                      <span className="fd-event-day">{start.getDate()}</span>
                      <span className="fd-event-mon">
                        {start.toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase()}
                      </span>
                    </div>
                    <div className="fd-event-body">
                      <div className="fd-event-name">{ev.name}</div>
                      {ev.location && <div className="fd-event-meta">📍 {ev.location}</div>}
                      <div className="fd-event-meta">
                        🕐 {start.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {ev.description && (
                        <div className="fd-event-desc">{ev.description}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
