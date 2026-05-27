import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './first-day.css';
import {
  getCityStaticData,
  type StaticPOI,
  type CityStaticData,
} from '../data/cityStaticData';

const API = 'http://localhost:3001';

const TABS = [
  { id: 'sim', label: 'SIM Kart', emoji: '📱', color: '#3b82f6' },
  { id: 'transport', label: 'Ulaşım Kartı', emoji: '🚇', color: '#10b981' },
  { id: 'exchange', label: 'Döviz', emoji: '💱', color: '#f59e0b' },
  { id: 'route', label: 'İlk Gün Rotası', emoji: '🗺️', color: '#8b5cf6' },
  { id: 'events', label: 'Bugünkü Etkinlikler', emoji: '🎭', color: '#e8b84b' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const TAB_TO_CATEGORY: Record<string, string> = {
  sim: 'sim',
  transport: 'transport_card',
  exchange: 'exchange',
};

interface ApiPOI {
  id: string;
  name: string;
  category: string;
  address: string | null;
  lat: number;
  lng: number;
  openingHours?: string;
}

interface CityEvent {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  address: string | null;
  startDate: string;
  endDate: string;
  category: string;
  imageUrl: string | null;
  ticketUrl: string | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string | null;
  source: 'ticketmaster' | 'manual';
  eventDate?: string;
}

interface EventDayGroup {
  date: string;
  events: CityEvent[];
}

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

function getDaySectionTitle(dateKey: string): string {
  const todayKey = toLocalDateKey(new Date());
  const tomorrowKey = toLocalDateKey(addDays(new Date(), 1));
  const d = new Date(`${dateKey}T12:00:00`);
  const formatted = d.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  if (dateKey === todayKey) return `Bugün · ${formatted}`;
  if (dateKey === tomorrowKey) return `Yarın · ${formatted}`;
  return formatted;
}

function EventCard({ ev }: { ev: CityEvent }) {
  const [imgFailed, setImgFailed] = useState(false);
  const start = new Date(ev.startDate);
  const onImgError = useCallback(() => setImgFailed(true), []);

  return (
    <div className="fd-event-card">
      {ev.imageUrl && !imgFailed && (
        <img
          src={ev.imageUrl}
          alt=""
          className="fd-event-img"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={onImgError}
        />
      )}
      <div className="fd-event-date">
        <span className="fd-event-day">{start.getDate()}</span>
        <span className="fd-event-mon">
          {start.toLocaleDateString('tr-TR', { month: 'short' }).toUpperCase()}
        </span>
      </div>
      <div className="fd-event-body">
        <div className="fd-event-header">
          <div className="fd-event-name">{ev.name}</div>
          {ev.source === 'ticketmaster' && (
            <span className="fd-tm-badge">TM</span>
          )}
        </div>
        {ev.location && (
          <div className="fd-event-meta">📍 {ev.location}</div>
        )}
        <div className="fd-event-meta">
          🕐 {start.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
        {ev.category && (
          <span className="fd-event-cat">{ev.category}</span>
        )}
        {ev.priceMin != null && (
          <div className="fd-event-price">
            🎟️ {ev.priceMin === ev.priceMax
              ? `${ev.priceMin} ${ev.currency ?? ''}`
              : `${ev.priceMin}–${ev.priceMax} ${ev.currency ?? ''}`}
          </div>
        )}
        {ev.ticketUrl && (
          <a
            href={ev.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fd-ticket-btn"
          >
            Bilet Al →
          </a>
        )}
        {ev.description && (
          <div className="fd-event-desc">{ev.description}</div>
        )}
      </div>
    </div>
  );
}

interface NormalizedPOI {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  openingHours?: string;
  tip?: string;
  distance?: number | null;
}

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

function normalizeStaticPOI(p: StaticPOI): NormalizedPOI {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    address: p.address,
    lat: p.lat,
    lng: p.lng,
    openingHours: p.openingHours,
    tip: p.tip,
  };
}

function normalizeApiPOI(p: ApiPOI): NormalizedPOI {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    address: p.address ?? '',
    lat: p.lat,
    lng: p.lng,
    openingHours: p.openingHours,
  };
}

const ADAPT_CATEGORIES = ['sim', 'transport_card', 'exchange'] as const;

/** API'de boş kalan kategoriler için statik POI'ları tamamlar */
function mergeApiAndStatic(
  apiPois: ApiPOI[],
  staticPois: StaticPOI[],
): { merged: NormalizedPOI[]; fallbackCategories: string[] } {
  const normalizedApi = apiPois.map(normalizeApiPOI);
  const normalizedStatic = staticPois.map(normalizeStaticPOI);
  const merged: NormalizedPOI[] = [];
  const fallbackCategories: string[] = [];

  for (const cat of ADAPT_CATEGORIES) {
    const apiForCat = normalizedApi.filter(p => p.category === cat);
    if (apiForCat.length > 0) {
      merged.push(...apiForCat);
    } else {
      const staticForCat = normalizedStatic.filter(p => p.category === cat);
      if (staticForCat.length > 0) {
        merged.push(...staticForCat);
        fallbackCategories.push(cat);
      }
    }
  }

  return { merged, fallbackCategories };
}

export default function FirstDayPage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [activeTab, setActiveTab] = useState<TabId>('sim');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [fallbackCategories, setFallbackCategories] = useState<string[]>([]);
  const [cityName, setCityName] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.0082, 28.9784]);
  const [poisNorm, setPoisNorm] = useState<NormalizedPOI[]>([]);
  const [staticData, setStaticData] = useState<CityStaticData | null>(null);
  const [eventDays, setEventDays] = useState<EventDayGroup[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
    );
  }, []);

  useEffect(() => {
    if (!citySlug) return;
    setLoading(true);

    const sd = getCityStaticData(citySlug);
    setStaticData(sd);
    if (sd) {
      setCityName(sd.nameTr);
      setMapCenter(sd.center);
    }

    Promise.all([
      fetch(`${API}/api/adaptation/${citySlug}`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      fetch(`${API}/api/events/city/${citySlug}?days=2`)
        .then(r => r.json())
        .catch(() => ({ days: [] })),
    ])
      .then(([adaptResult, eventsResult]) => {
        const apiPois = (adaptResult.data ?? []) as ApiPOI[];
        const staticPois = sd?.pois ?? [];
        if (apiPois.length > 0) {
          const { merged, fallbackCategories: fb } = mergeApiAndStatic(apiPois, staticPois);
          setPoisNorm(merged);
          setFallbackCategories(fb);
          setUsingFallback(fb.length > 0);
        } else if (sd) {
          setPoisNorm(staticPois.map(normalizeStaticPOI));
          setFallbackCategories([...ADAPT_CATEGORIES]);
          setUsingFallback(true);
        } else {
          setPoisNorm([]);
          setFallbackCategories([]);
          setUsingFallback(false);
        }
        if (adaptResult.city?.nameTr || adaptResult.city?.nameEn) {
          setCityName(adaptResult.city.nameTr ?? adaptResult.city.nameEn);
        }
        const days = (eventsResult.days ?? []) as { date: string; data: CityEvent[] }[];
        setEventDays(
          days.map(d => ({ date: d.date, events: d.data ?? [] })),
        );
      })
      .catch(() => {
        if (sd) {
          setPoisNorm(sd.pois.map(normalizeStaticPOI));
          setFallbackCategories([...ADAPT_CATEGORIES]);
        } else {
          setPoisNorm([]);
          setFallbackCategories([]);
        }
        setUsingFallback(true);
        setEventDays([]);
      })
      .finally(() => setLoading(false));
  }, [citySlug]);

  const activeCategory = TAB_TO_CATEGORY[activeTab] ?? null;

  const activeMarkers = useMemo(() => {
    if (activeTab === 'route') return staticData?.route ?? [];
    if (!activeCategory) return [];
    return poisNorm.filter(p => p.category === activeCategory);
  }, [poisNorm, activeTab, activeCategory, staticData]);

  const computedCenter = useMemo((): [number, number] => {
    if (activeMarkers.length > 0) {
      const first = activeMarkers[0] as { lat: number; lng: number };
      return [first.lat, first.lng];
    }
    return mapCenter;
  }, [activeMarkers, mapCenter]);

  const filteredPois = useMemo(() => {
    if (!activeCategory) return [];
    return poisNorm
      .filter(p => p.category === activeCategory)
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(p => ({
        ...p,
        distance: userLocation
          ? getDistance(userLocation.lat, userLocation.lng, p.lat, p.lng)
          : null,
      }))
      .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
  }, [poisNorm, activeCategory, searchQuery, userLocation]);

  const activeTabMeta = TABS.find(t => t.id === activeTab);
  const activeCategoryUsesFallback = Boolean(
    activeCategory && fallbackCategories.includes(activeCategory),
  );

  if (loading && !staticData && !cityName) {
    return (
      <div className="firstDayRoot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="firstDayRoot">
      <header className="firstDayHeader">
        <Link to={`/${citySlug}`} className="backBtn">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="headerTitle">
          <h1>{cityName || citySlug} · İlk Gün Rehberi</h1>
          <p>Şehre ilk adımın için her şey burada</p>
        </div>
      </header>

      {(usingFallback && (activeCategoryUsesFallback || !activeCategory)) && (
        <div className="fd-fallback-banner">
          📋 {activeCategoryUsesFallback
            ? 'Bu sekme için öneri verisi gösteriliyor — canlı veri henüz yüklenmedi.'
            : 'Şu an öneri verisi gösteriliyor — canlı veri için internet bağlantısını kontrol et.'}
        </div>
      )}

      <div className="tabsContainer">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tabBtn ${activeTab === tab.id ? 'active' : ''}`}
            style={{ '--tab-color': tab.color } as React.CSSProperties}
            onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
          >
            <span className="icon">{tab.emoji}</span>
            <span className="label">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab !== 'events' && (
        <div className="miniMapContainer">
          <MapContainer center={computedCenter} zoom={14} className="miniMap" zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ChangeView center={computedCenter} />

            {activeTab !== 'route' && (activeMarkers as NormalizedPOI[]).map(p => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={L.divIcon({
                  className: 'leaflet-custom-marker',
                  html: `<div class="custom-marker" style="background:${activeTabMeta?.color}">
                           ${activeTabMeta?.emoji}
                         </div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 32],
                })}
              >
                <Popup><strong>{p.name}</strong><br />{p.address}</Popup>
              </Marker>
            ))}

            {activeTab === 'route' && (staticData?.route ?? []).map((stop, i) => (
              <Marker
                key={stop.order}
                position={[stop.lat, stop.lng]}
                icon={L.divIcon({
                  className: 'leaflet-custom-marker',
                  html: `<div class="custom-marker route-marker">${i + 1}</div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 32],
                })}
              >
                <Popup><strong>{stop.name}</strong><br />{stop.address}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      <div className="listSection">
        {(activeTab === 'sim' || activeTab === 'transport' || activeTab === 'exchange') && (
          <>
            {activeTab === 'transport' && staticData?.transportCard && (
              <div className="fd-transport-card">
                <div className="fd-tc-header">
                  <span className="fd-tc-name">🚇 {staticData.transportCard.name}</span>
                  <span className="fd-tc-cost">{staticData.transportCard.cost}</span>
                </div>
                <div className="fd-tc-row">
                  <span className="fd-tc-label">Nereden alınır</span>
                  <span className="fd-tc-val">{staticData.transportCard.whereToBuy}</span>
                </div>
                <div className="fd-tc-row">
                  <span className="fd-tc-label">Nasıl yüklenir</span>
                  <span className="fd-tc-val">{staticData.transportCard.howToLoad}</span>
                </div>
                <div className="fd-tc-tip">💡 {staticData.transportCard.tip}</div>
              </div>
            )}

            <div className="searchBar">
              <svg style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="İsime göre ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="poiList">
              {filteredPois.length > 0 ? filteredPois.map(p => (
                <div key={p.id} className="poiCard">
                  <div className="poiInfo">
                    <h3>{p.name}</h3>
                    <div className="poiAddress">
                      <span>📍</span>
                      <span>{p.address || 'Adres bilgisi yok'}</span>
                    </div>
                    {p.tip && (
                      <div className="fd-poi-tip">💡 {p.tip}</div>
                    )}
                    <div className="poiMeta">
                      {p.distance != null && (
                        <div className="metaItem distance">
                          {p.distance < 1
                            ? `${Math.round(p.distance * 1000)} m`
                            : `${p.distance.toFixed(1)} km`}
                        </div>
                      )}
                      <div className="metaItem">
                        {p.openingHours ?? 'Hergün Açık'}
                      </div>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="googleMapsBtn"
                  >
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </a>
                </div>
              )) : (
                <div className="emptyState">
                  <span className="icon">🔍</span>
                  <p>Sonuç bulunamadı.</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'route' && (
          <div className="fd-route-section">
            <p className="fd-route-desc">
              Şehri ilk günde tanımak için önerilen temel rota.
            </p>
            {(staticData?.route ?? []).length === 0 ? (
              <div className="emptyState">
                <span className="icon">🗺️</span>
                <p>Bu şehir için henüz rota eklenmemiş.</p>
              </div>
            ) : (
              <div className="fd-stops">
                {(staticData?.route ?? []).map((stop, i) => (
                  <div key={stop.order} className="fd-stop">
                    <div className="fd-stop-line">
                      <div className={`fd-stop-num ${stop.category}`}>
                        {i + 1}
                      </div>
                      {i < (staticData?.route.length ?? 0) - 1 && (
                        <div className="fd-stop-seg" />
                      )}
                    </div>
                    <div className="fd-stop-body">
                      <div className="fd-stop-name">{stop.name}</div>
                      <div className="fd-stop-addr">📍 {stop.address}</div>
                      <div className="fd-poi-tip">💡 {stop.tip}</div>
                      <span className={`fd-stop-chip ${stop.category}`}>
                        {stop.category === 'food' ? '🍽️ Yemek' : '🏛️ Kültür'}
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
            {eventDays.map((day, idx) => (
              <div key={day.date} className="fd-events-day-block">
                <div className="fd-section-label">
                  {getDaySectionTitle(day.date)}
                </div>
                {day.events.length > 0 ? (
                  day.events.map(ev => <EventCard key={ev.id} ev={ev} />)
                ) : (
                  <p className="fd-events-day-empty">
                    Bu gün için etkinlik bulunamadı.
                  </p>
                )}
                {idx === 0 && (staticData?.events ?? []).map(ev => (
                  <div key={ev.id} className="fd-event-card fd-event-static">
                    <div className="fd-event-date">
                      <span className="fd-event-emoji">🎫</span>
                      <span className="fd-event-mon">{ev.category.slice(0, 4).toUpperCase()}</span>
                    </div>
                    <div className="fd-event-body">
                      <div className="fd-event-name">{ev.name}</div>
                      <div className="fd-event-meta">📍 {ev.location}</div>
                      <div className="fd-event-meta">🕐 {ev.time}</div>
                      {ev.tip && <div className="fd-poi-tip">💡 {ev.tip}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {eventDays.length === 0 && (staticData?.events ?? []).length === 0 && (
              <div className="emptyState">
                <span className="icon">🎭</span>
                <p>Bugün ve yarın için etkinlik bulunamadı.</p>
              </div>
            )}

            {eventDays.length === 0 && (staticData?.events ?? []).length > 0 && (
              <div className="fd-events-day-block">
                <div className="fd-section-label">
                  {getDaySectionTitle(toLocalDateKey(new Date()))}
                </div>
                {(staticData?.events ?? []).map(ev => (
                  <div key={ev.id} className="fd-event-card fd-event-static">
                    <div className="fd-event-date">
                      <span className="fd-event-emoji">🎫</span>
                      <span className="fd-event-mon">{ev.category.slice(0, 4).toUpperCase()}</span>
                    </div>
                    <div className="fd-event-body">
                      <div className="fd-event-name">{ev.name}</div>
                      <div className="fd-event-meta">📍 {ev.location}</div>
                      <div className="fd-event-meta">🕐 {ev.time}</div>
                      {ev.tip && <div className="fd-poi-tip">💡 {ev.tip}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
