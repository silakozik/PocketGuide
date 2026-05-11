"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Clock3, Filter, RefreshCw } from "lucide-react";
import { AdminReport, ApiError, getReports } from "@/lib/admin-api";

type ReportStatusFilter = "all" | "open" | "in_progress" | "resolved";

export default function ReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ReportStatusFilter>("all");

  const summary = useMemo(() => {
    const total = reports.length;
    const open = reports.filter((item) => item.status === "open").length;
    const inProgress = reports.filter((item) => item.status === "in_progress").length;
    const resolved = reports.filter((item) => item.status === "resolved").length;
    return { total, open, inProgress, resolved };
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const text = `${report.userId ?? ""} ${report.citySlug ?? ""} ${report.category ?? ""} ${report.message ?? ""}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesStatus = status === "all" || report.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, reports, status]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getReports({ q: query, status: status === "all" ? undefined : status });
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("Rapor endpoint'i mevcut degil. Bu ekran endpoint eklendiginde otomatik calisir.");
      } else {
        setError("Rapor verisi alinamadi.");
      }
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const statusClass = (value?: string) => {
    if (value === "open") return "bg-red-50 text-red-700";
    if (value === "in_progress") return "bg-amber-50 text-amber-700";
    if (value === "resolved") return "bg-emerald-50 text-emerald-700";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Reports Monitor</h1>
          <p className="text-sm text-gray-500">Kullanici geri bildirimlerini, hata raporlarini ve durumlarini takip et.</p>
        </div>
        <button
          type="button"
          onClick={fetchReports}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard title="Toplam" value={summary.total} icon={<BarChart3 className="h-4 w-4" />} />
        <SummaryCard title="Acik" value={summary.open} icon={<Clock3 className="h-4 w-4" />} />
        <SummaryCard title="In Progress" value={summary.inProgress} icon={<Clock3 className="h-4 w-4" />} />
        <SummaryCard title="Resolved" value={summary.resolved} icon={<Clock3 className="h-4 w-4" />} />
      </div>

      <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-[1fr_220px_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="User, city, category veya aciklama ara..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as ReportStatusFilter)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring-2"
        >
          <option value="all">Tum durumlar</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <button
          type="button"
          onClick={fetchReports}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          <Filter className="h-4 w-4" />
          Apply
        </button>
      </div>

      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Report</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Kullanici</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Kategori</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Durum</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tarih</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  Raporlar yukleniyor...
                </td>
              </tr>
            )}
            {!loading && filteredReports.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  Gosterilecek rapor bulunamadi.
                </td>
              </tr>
            )}
            {!loading &&
              filteredReports.map((report) => (
                <tr key={report.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{report.message || "No description"}</div>
                    <div className="text-xs text-gray-500">{report.id}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{report.userId ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{report.category ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(report.status)}`}>
                      {report.status ?? "unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {report.createdAt ? new Date(report.createdAt).toLocaleString("tr-TR") : "-"}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-2 inline-flex rounded-md bg-gray-50 p-2 text-gray-600">{icon}</div>
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}
