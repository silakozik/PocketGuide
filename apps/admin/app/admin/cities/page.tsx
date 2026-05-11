"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, ToggleLeft, ToggleRight } from "lucide-react";
import { AdminCity, ApiError, getCities, syncCityData, updateCityStatus } from "@/lib/admin-api";

type StatusFilter = "all" | "active" | "passive";

export default function CitiesPage() {
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [workingCityId, setWorkingCityId] = useState("");

  const filteredCities = useMemo(() => {
    return cities.filter((city) => {
      const status = city.status ?? (city.isActive ? "active" : "passive");
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const normalized = `${city.nameEn} ${city.nameTr} ${city.slug} ${city.countryCode}`.toLowerCase();
      const matchesSearch = normalized.includes(query.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [cities, query, statusFilter]);

  const fetchCities = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getCities();
      setCities(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Yetkilendirme gerekiyor. API tarafında admin oturumu bulunamadı.");
      } else {
        setError("Sehir listesi alinamadi.");
      }
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleToggle = async (city: AdminCity) => {
    const current = city.status ?? (city.isActive ? "active" : "passive");
    const next = current === "active" ? "passive" : "active";
    try {
      setWorkingCityId(city.id);
      await updateCityStatus(city.id, next);
      setCities((prev) =>
        prev.map((item) => (item.id === city.id ? { ...item, status: next, isActive: next === "active" } : item)),
      );
    } catch {
      setError("Sehir durumu guncellenemedi.");
    } finally {
      setWorkingCityId("");
    }
  };

  const handleSync = async (city: AdminCity) => {
    try {
      setWorkingCityId(city.id);
      await syncCityData({
        citySlug: city.slug,
        cityName: city.nameEn,
        countryCode: city.countryCode,
      });
      await fetchCities();
    } catch {
      setError("Sehir verisi senkronize edilemedi.");
    } finally {
      setWorkingCityId("");
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">City Data Management</h1>
          <p className="text-sm text-gray-500">Sehir verilerini guncelle, durumlarini yonet ve tekrar senkronize et.</p>
        </div>
        <button
          type="button"
          onClick={fetchCities}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-[1fr_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none ring-blue-500 focus:ring-2"
            placeholder="Sehir, slug veya ulke ara..."
          />
        </label>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
        >
          <option value="all">Tum durumlar</option>
          <option value="active">Aktif</option>
          <option value="passive">Pasif</option>
        </select>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Sehir</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">POI Ozeti</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Durum</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Son Senkron</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Islemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td className="px-4 py-10 text-center text-gray-500" colSpan={5}>
                  Sehirler yukleniyor...
                </td>
              </tr>
            )}
            {!loading && filteredCities.length === 0 && (
              <tr>
                <td className="px-4 py-10 text-center text-gray-500" colSpan={5}>
                  Gosterilecek sehir bulunamadi.
                </td>
              </tr>
            )}
            {!loading &&
              filteredCities.map((city) => {
                const status = city.status ?? (city.isActive ? "active" : "passive");
                const isBusy = workingCityId === city.id;
                return (
                  <tr key={city.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{city.nameEn}</div>
                      <div className="text-xs text-gray-500">
                        {city.slug} | {city.countryCode}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                          SIM {city.poiCounts?.sim_card ?? 0}
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                          Ulasim {city.poiCounts?.transport_stop ?? 0}
                        </span>
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
                          Doviz {city.poiCounts?.exchange ?? 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {status === "active" ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{city.lastSyncedAt ? new Date(city.lastSyncedAt).toLocaleString("tr-TR") : "Hic"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggle(city)}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {status === "active" ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                          Durum
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleSync(city)}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Sync
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
