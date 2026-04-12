import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './admin.css';

const API = 'http://localhost:3000';

interface City {
  id: string;
  slug: string;
  nameEn: string;
  nameTr: string;
  countryCode: string;
  status: string;
  lastSyncedAt: string | null;
  createdAt: string;
  poiCounts: Record<string, number>;
}

interface ProgressStep {
  step: string;
  status: 'loading' | 'done' | 'error';
  message: string;
  count?: number;
  total?: number;
  breakdown?: { sim: number; transport: number; exchange: number };
}

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Form state
  const [cityName, setCityName] = useState('');
  const [citySlug, setCitySlug] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [importSummary, setImportSummary] = useState<{ sim: number; transport: number; exchange: number } | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<City | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCities = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/cities`, { credentials: 'include' });
      if (res.status === 401) {
        navigate('/admin/login', { replace: true });
        return;
      }
      const data = await res.json();
      setCities(data);
    } catch (err) {
      console.error('Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  // Auto-generate slug from city name
  useEffect(() => {
    const slug = cityName
      .toLowerCase()
      .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setCitySlug(slug);
  }, [cityName]);

  // ── Import City ──
  const handleImport = async () => {
    if (!cityName.trim()) return;
    setImporting(true);
    setProgress([]);
    setImportSummary(null);

    try {
      const res = await fetch(`${API}/api/admin/cities/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ citySlug, cityName, countryCode: countryCode || 'XX' }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: ProgressStep = JSON.parse(line.slice(6));
              setProgress((prev) => {
                const idx = prev.findIndex((p) => p.step === event.step);
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = event;
                  return next;
                }
                return [...prev, event];
              });

              if (event.step === 'complete' && event.breakdown) {
                setImportSummary(event.breakdown);
              }
            } catch { /* ignore parse errors */ }
          }
        }
      }

      // Refresh city list
      await fetchCities();
      setCityName('');
      setCountryCode('');
    } catch (err) {
      console.error('Import error:', err);
      setProgress((prev) => [
        ...prev,
        { step: 'error', status: 'error', message: 'Bağlantı hatası' },
      ]);
    } finally {
      setImporting(false);
    }
  };

  // ── Toggle Status ──
  const handleToggleStatus = async (city: City) => {
    const newStatus = city.status === 'active' ? 'passive' : 'active';
    try {
      await fetch(`${API}/api/admin/cities/${city.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchCities();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  // ── Sync Now ──
  const handleSync = async (city: City) => {
    setImporting(true);
    setProgress([]);
    setImportSummary(null);

    try {
      const res = await fetch(`${API}/api/admin/cities/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ citySlug: city.slug, cityName: city.nameEn, countryCode: city.countryCode }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: ProgressStep = JSON.parse(line.slice(6));
              setProgress((prev) => {
                const idx = prev.findIndex((p) => p.step === event.step);
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = event;
                  return next;
                }
                return [...prev, event];
              });
              if (event.step === 'complete' && event.breakdown) {
                setImportSummary(event.breakdown);
              }
            } catch { /* */ }
          }
        }
      }

      await fetchCities();
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setImporting(false);
    }
  };

  // ── Delete City ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`${API}/api/admin/cities/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await fetchCities();
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  // ── Logout ──
  const handleLogout = async () => {
    await fetch(`${API}/api/admin/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    navigate('/admin/login', { replace: true });
  };

  const formatDate = (d: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="admin-root">
      {/* Top bar */}
      <header className="admin-topbar">
        <div className="admin-topbar-logo">
          PocketGuide <span>Admin</span>
        </div>
        <div className="admin-topbar-right">
          <button className="admin-logout-btn" onClick={handleLogout}>
            Çıkış Yap
          </button>
        </div>
      </header>

      <div className="admin-body">
        {/* ── Add / Import ── */}
        <h2 className="admin-section-title">Şehir Yönetimi</h2>

        <div className="admin-add-form">
          <div className="admin-form-title">➕ Yeni Şehir Ekle & Veri Aktar</div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="admin-form-label">Şehir Adı</label>
              <input
                className="admin-input"
                placeholder="İstanbul"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Slug</label>
              <input
                className="admin-input"
                placeholder="istanbul"
                value={citySlug}
                onChange={(e) => setCitySlug(e.target.value)}
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Ülke</label>
              <input
                className="admin-input"
                placeholder="TR"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                maxLength={3}
              />
            </div>
            <button
              className="admin-import-btn"
              disabled={importing || !cityName.trim()}
              onClick={handleImport}
            >
              {importing ? '⏳ İçe aktarılıyor…' : '📥 Import Data'}
            </button>
          </div>

          {/* Progress */}
          {progress.length > 0 && (
            <div className="admin-progress">
              {progress.map((p) => (
                <div key={p.step} className="admin-progress-step">
                  <div className={`step-icon ${p.status}`}>
                    {p.status === 'loading' && '⏳'}
                    {p.status === 'done' && '✓'}
                    {p.status === 'error' && '✗'}
                  </div>
                  <span className="step-text">{p.message}</span>
                  {p.count !== undefined && (
                    <span className="step-count">{p.count} bulundu</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {importSummary && (
            <div className="admin-summary">
              <div className="admin-summary-item">
                <div className="admin-summary-num">{importSummary.sim}</div>
                <div className="admin-summary-label">SIM Noktası</div>
              </div>
              <div className="admin-summary-item">
                <div className="admin-summary-num">{importSummary.transport}</div>
                <div className="admin-summary-label">Ulaşım</div>
              </div>
              <div className="admin-summary-item">
                <div className="admin-summary-num">{importSummary.exchange}</div>
                <div className="admin-summary-label">Döviz Bürosu</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Cities Table ── */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Şehir</th>
                <th>Ülke</th>
                <th>POI Sayıları</th>
                <th>Son Senkronizasyon</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-muted)' }}>
                    Yükleniyor…
                  </td>
                </tr>
              ) : cities.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-empty">
                      <div className="admin-empty-icon">🏙️</div>
                      Henüz şehir eklenmemiş. Yukarıdaki formu kullanarak ilk şehrinizi ekleyin.
                    </div>
                  </td>
                </tr>
              ) : (
                cities.map((city) => (
                  <tr key={city.id}>
                    <td>
                      <div className="city-name-cell">{city.nameEn}</div>
                      <div className="city-slug-cell">{city.slug}</div>
                    </td>
                    <td className="city-country-cell">{city.countryCode}</td>
                    <td>
                      <div className="poi-counts">
                        <span className="poi-chip sim">
                          SIM {city.poiCounts['sim_card'] || 0}
                        </span>
                        <span className="poi-chip transport">
                          🚇 {city.poiCounts['transport_stop'] || 0}
                        </span>
                        <span className="poi-chip exchange">
                          💱 {city.poiCounts['exchange'] || 0}
                        </span>
                      </div>
                    </td>
                    <td>
                      {city.lastSyncedAt ? (
                        <span className="synced-date">{formatDate(city.lastSyncedAt)}</span>
                      ) : (
                        <span className="synced-date never">Hiç</span>
                      )}
                    </td>
                    <td>
                      <div className="admin-status-toggle">
                        <button
                          className={`status-switch ${city.status === 'active' ? 'active' : ''}`}
                          onClick={() => handleToggleStatus(city)}
                          title={city.status === 'active' ? 'Pasife al' : 'Aktifleştir'}
                        />
                        <span className="status-label">
                          {city.status === 'active' ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-action-btn sync"
                          onClick={() => handleSync(city)}
                          disabled={importing}
                        >
                          🔄 Sync
                        </button>
                        <button
                          className="admin-action-btn delete"
                          onClick={() => setDeleteTarget(city)}
                        >
                          🗑 Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <div className="admin-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-icon">⚠️</div>
            <h3 className="admin-modal-title">Şehri Sil</h3>
            <p className="admin-modal-text">
              <strong>{deleteTarget.nameEn}</strong> şehri ve bağlı tüm POI verileri kalıcı olarak
              silinecek. Bu işlem geri alınamaz.
            </p>
            <div className="admin-modal-actions">
              <button className="admin-modal-cancel" onClick={() => setDeleteTarget(null)}>
                İptal
              </button>
              <button
                className="admin-modal-confirm"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Siliniyor…' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
