import { useState, useEffect, useCallback, useRef, type MouseEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Nav } from '../components/Nav';
import { Footer } from '../components/Footer';
import {
  PhotoDetailModal,
  type PhotoDetailInitial,
} from '../components/PhotoDetailModal';
import { likePhoto as apiLikePhoto } from '../lib/photosApi';
const API = 'http://localhost:3001';

function exploreTileVariant(index: number): string {
  const mod = index % 11;
  if (mod === 3 || mod === 7) return 'sp-explore-tile--tall';
  if (mod === 5) return 'sp-explore-tile--wide';
  return '';
}

async function searchAll(q: string) {
  if (q.trim().length < 2) return { cities: [], users: [], photos: [] };
  const res = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`);
  return res.json();
}

async function getDiscover(interests: string[], city: string, offset = 0) {
  const params = new URLSearchParams({
    limit: '20',
    offset: String(offset),
  });
  if (interests.length) params.set('interests', interests.join(','));
  if (city) params.set('city', city);
  const res = await fetch(`${API}/api/photos/discover?${params}`);
  if (!res.ok) {
    throw new Error(`Keşfet yüklenemedi (${res.status})`);
  }
  return res.json();
}

async function likePhoto(id: string) {
  await apiLikePhoto(id);
}

const CITY_EMOJIS: Record<string, string> = {
  istanbul: '🕌',
  paris: '🗼',
  tokyo: '🏯',
  londra: '🎡',
  roma: '🏛️',
  barcelona: '🌊',
  dubai: '🏙️',
  amsterdam: '🚲',
  sydney: '🦘',
  'new-york': '🗽',
};

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'search' | 'discover'>(
    searchParams.get('tab') === 'discover' ? 'discover' : 'search',
  );

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const [discoverPhotos, setDiscoverPhotos] = useState<any[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverOffset, setDiscoverOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [cityFilter, setCityFilter] = useState('');
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoDetailInitial | null>(
    null,
  );

  const userInterests: string[] = JSON.parse(
    localStorage.getItem('pg_user_interests') ?? '[]',
  );

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await searchAll(query);
        setSearchResults(res);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  }, [query]);

  const loadDiscover = useCallback(
    async (reset = false) => {
      setDiscoverLoading(true);
      setDiscoverError(null);
      try {
        const offset = reset ? 0 : discoverOffset;
        const res = await getDiscover(userInterests, cityFilter, offset);
        const photos = res.data ?? [];
        if (reset) {
          setDiscoverPhotos(photos);
          setDiscoverOffset(20);
        } else {
          setDiscoverPhotos((prev) => [...prev, ...photos]);
          setDiscoverOffset((prev) => prev + 20);
        }
        setHasMore(photos.length === 20);
      } catch (err) {
        setDiscoverError(
          err instanceof Error ? err.message : 'Fotoğraflar yüklenemedi',
        );
        if (reset) setDiscoverPhotos([]);
      } finally {
        setDiscoverLoading(false);
      }
    },
    [cityFilter, discoverOffset, userInterests],
  );

  useEffect(() => {
    if (activeTab !== 'discover') return;
    setDiscoverPhotos([]);
    setDiscoverOffset(0);
    loadDiscover(true);
  }, [activeTab, cityFilter]);

  useEffect(() => {
    const onPhotosChanged = () => {
      if (query.trim().length >= 2) {
        searchAll(query).then(setSearchResults).catch(() => {});
      }
      if (activeTab === 'discover') {
        setDiscoverPhotos([]);
        setDiscoverOffset(0);
        loadDiscover(true);
      }
    };
    window.addEventListener('pg-photos-changed', onPhotosChanged);
    return () => window.removeEventListener('pg-photos-changed', onPhotosChanged);
  }, [query, activeTab, loadDiscover]);

  useEffect(() => {
    if (activeTab !== 'discover' || !hasMore || discoverLoading) return;
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadDiscover();
      },
      { rootMargin: '400px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [activeTab, hasMore, discoverLoading, loadDiscover, discoverPhotos.length]);

  const handleLike = async (e: MouseEvent, photoId: string) => {
    e.stopPropagation();
    await likePhoto(photoId);
    setLikedPhotos((prev) => new Set([...prev, photoId]));
  };

  const handlePhotoLikeChange = (photoId: string, likeCount: number) => {
    setLikedPhotos((prev) => new Set([...prev, photoId]));
    setDiscoverPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, likeCount } : p)),
    );
    if (searchResults?.photos) {
      setSearchResults((prev: any) => ({
        ...prev,
        photos: prev.photos.map((p: any) =>
          p.id === photoId ? { ...p, likeCount } : p,
        ),
      }));
    }
  };

  const openPhoto = (photo: PhotoDetailInitial) => {
    setSelectedPhoto(photo);
  };

  const switchTab = (tab: 'search' | 'discover') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const hasSearchResults =
    searchResults &&
    (searchResults.cities?.length > 0 ||
      searchResults.users?.length > 0 ||
      searchResults.photos?.length > 0);

  return (
    <>
      <Nav />
      <div className="sp-root">
        <div className="sp-tabs">
          <button
            type="button"
            className={`sp-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => switchTab('search')}
          >
            🔍 Ara
          </button>
          <button
            type="button"
            className={`sp-tab ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => switchTab('discover')}
          >
            ✨ Keşfet
          </button>
        </div>

        {activeTab === 'search' && (
          <div className="map-top-bar sp-search-top-bar">
            <Link to="/" className="map-back-btn" aria-label="Geri dön">
              <svg
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>

            <div className="map-search-wrap">
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
                  placeholder="Şehir, kullanıcı veya mekan ara..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
                {searchLoading && <div className="map-search-spinner" />}
                {query && !searchLoading && (
                  <button
                    type="button"
                    className="map-search-clear"
                    onClick={() => {
                      setQuery('');
                      setSearchResults(null);
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <Link to="/map" className="map-locate-btn" aria-label="Haritaya git">
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
            </Link>
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="sp-discover-filters">
            <div className="sp-filter-scroll">
              <button
                type="button"
                className={`sp-filter-chip ${cityFilter === '' ? 'active' : ''}`}
                onClick={() => setCityFilter('')}
              >
                🌍 Tümü
              </button>
              {Object.entries(CITY_EMOJIS).map(([slug, emoji]) => (
                <button
                  key={slug}
                  type="button"
                  className={`sp-filter-chip ${cityFilter === slug ? 'active' : ''}`}
                  onClick={() =>
                    setCityFilter(slug === cityFilter ? '' : slug)
                  }
                >
                  {emoji} {slug.charAt(0).toUpperCase() + slug.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          className={`sp-content${activeTab === 'discover' ? ' sp-content--discover' : ''}`}
        >
          {activeTab === 'search' && (
            <div className="sp-search-section">
              {!searchLoading && searchResults && (
                <div className="sp-results">
                  {searchResults.cities?.length > 0 && (
                    <div className="sp-result-group">
                      <div className="sp-result-group-title">📍 Şehirler</div>
                      {searchResults.cities.map((city: any) => (
                        <Link
                          key={city.slug}
                          to={`/${city.slug}`}
                          className="sp-result-item"
                        >
                          <span className="sp-result-icon">
                            {CITY_EMOJIS[city.slug] ?? '🏙️'}
                          </span>
                          <div className="sp-result-info">
                            <div className="sp-result-name">
                              {city.nameTr || city.nameEn}
                            </div>
                            <div className="sp-result-meta">
                              {city.countryCode}
                            </div>
                          </div>
                          <span className="sp-result-arrow">→</span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.users?.length > 0 && (
                    <div className="sp-result-group">
                      <div className="sp-result-group-title">👤 Kullanıcılar</div>
                      {searchResults.users.map((user: any) => (
                        <div key={user.id} className="sp-result-item">
                          <div className="sp-result-avatar">
                            {user.userName?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div className="sp-result-info">
                            <div className="sp-result-name">{user.userName}</div>
                            <div className="sp-result-meta">{user.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.photos?.length > 0 && (
                    <div className="sp-result-group">
                      <div className="sp-result-group-title">📸 Fotoğraflar</div>
                      <div className="sp-photo-row">
                        {searchResults.photos.map((photo: any) => (
                          <button
                            key={photo.id}
                            type="button"
                            className="sp-photo-thumb"
                            onClick={() =>
                              openPhoto({
                                id: photo.id,
                                imageUrl: photo.imageUrl,
                                caption: photo.caption,
                                cityName: photo.cityName,
                                userId: photo.userId,
                              })
                            }
                          >
                            <img src={photo.imageUrl} alt={photo.caption ?? ''} />
                            {photo.cityName && (
                              <div className="sp-photo-city">{photo.cityName}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!hasSearchResults && (
                    <div className="sp-no-results">
                      <span>🔍</span>
                      <p>&quot;{query}&quot; için sonuç bulunamadı.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'discover' && (
            <div className="sp-discover-section">
              {userInterests.length > 0 && (
                <p className="sp-explore-feed-label">Senin için</p>
              )}

              {discoverLoading && discoverPhotos.length === 0 && (
                <div className="sp-explore-mosaic sp-explore-mosaic--loading">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className={`sp-explore-tile sp-explore-tile--skeleton ${exploreTileVariant(i)}`}
                    />
                  ))}
                </div>
              )}

              {discoverError && (
                <div className="sp-no-results">
                  <span>⚠️</span>
                  <p>{discoverError}</p>
                  <button
                    type="button"
                    className="sp-load-more-btn"
                    onClick={() => loadDiscover(true)}
                  >
                    Tekrar dene
                  </button>
                </div>
              )}

              {!discoverError && !discoverLoading && discoverPhotos.length === 0 && (
                <div className="sp-no-results">
                  <span>📸</span>
                  <p>Henüz herkese açık fotoğraf yok.</p>
                </div>
              )}

              {discoverPhotos.length > 0 && (
                <div className="sp-explore-mosaic">
                  {discoverPhotos.map((photo: any, index: number) => {
                    const likes =
                      (photo.likeCount ?? 0) +
                      (likedPhotos.has(photo.id) ? 1 : 0);
                    return (
                      <button
                        key={photo.id}
                        type="button"
                        className={`sp-explore-tile ${exploreTileVariant(index)}`}
                        aria-label={
                          photo.caption ||
                          photo.cityName ||
                          'Seyahat fotoğrafı'
                        }
                        onClick={() =>
                          openPhoto({
                            id: photo.id,
                            imageUrl: photo.imageUrl,
                            caption: photo.caption,
                            cityName: photo.cityName,
                            locationName: photo.locationName,
                            createdAt: photo.createdAt,
                            userId: photo.userId,
                            userName: photo.userName,
                            likeCount: photo.likeCount,
                          })
                        }
                      >
                        <img
                          src={photo.imageUrl}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="sp-explore-tile-overlay">
                          <button
                            type="button"
                            className={`sp-explore-like ${likedPhotos.has(photo.id) ? 'liked' : ''}`}
                            onClick={(e) => handleLike(e, photo.id)}
                            aria-label="Beğen"
                          >
                            <svg
                              width="22"
                              height="22"
                              viewBox="0 0 24 24"
                              fill={
                                likedPhotos.has(photo.id)
                                  ? 'currentColor'
                                  : 'none'
                              }
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            {likes > 0 && (
                              <span className="sp-explore-like-count">
                                {likes}
                              </span>
                            )}
                          </button>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {discoverLoading && discoverPhotos.length > 0 && (
                <div className="sp-explore-loading-more">Yükleniyor…</div>
              )}
              {hasMore && <div ref={loadMoreRef} className="sp-explore-sentinel" />}
            </div>
          )}
        </div>
      </div>
      {activeTab !== 'discover' && <Footer />}
      {selectedPhoto && (
        <PhotoDetailModal
          photoId={selectedPhoto.id}
          initialPhoto={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onLikeChange={handlePhotoLikeChange}
        />
      )}
    </>
  );
}
