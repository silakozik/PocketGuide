import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './first-day.css';

const API = 'http://localhost:3000';

interface POI {
  id: string;
  name: string;
  category: string;
  address: string | null;
  lat: number;
  lng: number;
}

interface City {
  id: string;
  nameEn: string;
  slug: string;
}

const CATEGORIES = [
  { id: 'sim', label: 'SIM Kart', icon: '📱', color: '#3b82f6', className: 'sim' },
  { id: 'transport_card', label: 'Ulaşım', icon: '🚇', color: '#10b981', className: 'transport' },
  { id: 'exchange', label: 'Döviz', icon: '💱', color: '#f59e0b', className: 'exchange' },
];

// Helper to calculate distance in KM
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

// Map Updater Component to center map when data changes
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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // 1. Get User Location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.log('Location denied', err)
      );
    }
  }, []);

  // 2. Fetch City and POIs
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch from new Adaptation API
        const res = await fetch(`${API}/api/adaptation/${citySlug}`);
        const result = await res.json();
        
        setCity(result.city);
        setPois(result.data);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (citySlug) fetchData();
  }, [citySlug]);

  // 3. Filter and Sort
  const filteredPois = useMemo(() => {
    return pois
      .filter(p => p.category === activeTab)
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(p => ({
        ...p,
        distance: userLocation ? getDistance(userLocation.lat, userLocation.lng, p.lat, p.lng) : null
      }))
      .sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
  }, [pois, activeTab, searchQuery, userLocation]);

  // Map markers for the current category
  const activeMarkers = useMemo(() => {
    return pois.filter(p => p.category === activeTab);
  }, [pois, activeTab]);

  const mapCenter = useMemo(() => {
    if (activeMarkers.length > 0) {
      return [activeMarkers[0].lat, activeMarkers[0].lng] as [number, number];
    }
    return [41.0082, 28.9784] as [number, number]; // Default to Istanbul if no data
  }, [activeMarkers]);

  if (loading && !city) {
    return (
      <div className="firstDayRoot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="firstDayRoot">
      {/* Header */}
      <header className="firstDayHeader">
        <Link to="/map" className="backBtn">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="headerTitle">
          <h1>{city?.nameEn || 'Şehir Rehberi'}</h1>
          <p>İlk Gün İhtiyaçları</p>
        </div>
      </header>

      {/* Mini Map */}
      <div className="miniMapContainer">
        <MapContainer center={mapCenter} zoom={13} className="miniMap" zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ChangeView center={mapCenter} />
          {activeMarkers.map(p => (
            <Marker 
              key={p.id} 
              position={[p.lat, p.lng]}
              icon={L.divIcon({
                className: 'leaflet-custom-marker',
                html: `<div class="custom-marker" style="background: ${CATEGORIES.find(c => c.id === p.category)?.color}">
                        <i>${CATEGORIES.find(c => c.id === p.category)?.icon}</i>
                      </div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 30]
              })}
            >
              <Popup>
                <strong>{p.name}</strong><br/>
                {p.address}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Tabs */}
      <div className="tabsContainer">
        {CATEGORIES.map(cat => (
          <button 
            key={cat.id}
            className={`tabBtn ${cat.className} ${activeTab === cat.id ? 'active' : ''}`}
            onClick={() => setActiveTab(cat.id)}
          >
            <span className="icon">{cat.icon}</span>
            <span className="label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* List Section */}
      <div className="listSection">
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
          {filteredPois.length > 0 ? (
            filteredPois.map(p => (
              <div key={p.id} className="poiCard">
                <div className="poiInfo">
                  <h3>{p.name}</h3>
                  <div className="poiAddress">
                    <span>📍</span>
                    <span>{p.address || 'Adres bilgisi yok'}</span>
                  </div>
                  <div className="poiMeta">
                    {p.distance !== null && (
                      <div className="metaItem distance">
                        {p.distance < 1 ? `${Math.round(p.distance * 1000)} m` : `${p.distance.toFixed(1)} km`}
                      </div>
                    )}
                    <div className="metaItem">Hergün Açık</div>
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
            ))
          ) : (
            <div className="emptyState">
              <span className="icon">🔍</span>
              <p>Sonuç bulunamadı.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
