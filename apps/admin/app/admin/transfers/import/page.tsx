"use client";

import { useState, useEffect } from "react";
import { 
  Download, MapPin, Search, Loader2, CheckCircle2, 
  AlertCircle, ChevronRight, Activity, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { CityDTO } from "@pocketguide/types";

interface ProgressMessage {
  message: string;
  status: 'loading' | 'done' | 'error';
  summary?: {
    added: number;
    updated: number;
  };
}

export default function ImportPage() {
  const [cities, setCities] = useState<CityDTO[]>([]);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ProgressMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/admin/cities");
      if (res.ok) {
        const data = await res.json();
        setCities(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startImport = () => {
    if (!selectedCityId) return;

    setIsImporting(true);
    setProgress([]);
    setError(null);

    const eventSource = new EventSource(
      `http://localhost:3001/api/admin/transfers/import-transit?cityId=${selectedCityId}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress((prev) => [...prev, data]);

      if (data.status === 'done') {
        eventSource.close();
        setIsImporting(false);
      }
      if (data.status === 'error') {
        setError(data.message);
        eventSource.close();
        setIsImporting(false);
      }
    };

    eventSource.onerror = (e) => {
      setError("Bağlantı kesildi.");
      eventSource.close();
      setIsImporting(false);
    };
  };

  const selectedCity = cities.find(c => c.id === selectedCityId);

  return (
    <div className="max-w-4xl mx-auto">
      <Link 
        href="/admin/transfers" 
        className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Transfers
      </Link>

      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gradient-to-br from-blue-50/50 to-white">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-600 rounded-xl text-white mr-4 shadow-lg shadow-blue-200">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bulk OSM Import</h1>
              <p className="text-gray-500">Pull transit data automatically from OpenStreetMap.</p>
            </div>
          </div>

          <div className="flex gap-4 items-end mt-8">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Target City</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select 
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  disabled={isImporting}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white font-medium"
                >
                  <option value="">Choose a city...</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>{city.nameTr}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={startImport}
              disabled={!selectedCityId || isImporting}
              className={`px-8 py-3 rounded-xl font-bold transition flex items-center shadow-lg ${
                !selectedCityId || isImporting 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
              }`}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Activity className="w-5 h-5 mr-2" />
                  Start Import
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-8 min-h-[300px]">
          {!isImporting && progress.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <Search className="w-10 h-10" />
              </div>
              <h3 className="text-gray-900 font-semibold text-lg">Waiting for action</h3>
              <p className="text-gray-500 max-w-sm mt-1">Select a city and click start to begin the automated transit data ingestion process.</p>
            </div>
          )}

          {(isImporting || progress.length > 0) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900">Import Logs</h3>
                {isImporting && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
              </div>
              
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
                {progress.map((p, idx) => (
                  <div key={idx} className="flex items-start p-4 bg-white hover:bg-gray-50/50 transition">
                    {p.status === 'loading' ? (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin mr-3 mt-0.5" />
                    ) : p.status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                    )}
                    <div>
                      <p className={`text-sm ${p.status === 'error' ? 'text-red-600' : 'text-gray-700'}`}>
                        {p.message}
                      </p>
                      {p.summary && (
                        <div className="mt-3 flex gap-3">
                          <div className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold ring-1 ring-green-100">
                            +{p.summary.added} Added
                          </div>
                          <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold ring-1 ring-blue-100">
                            {p.summary.updated} Updated
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start mt-4">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                  <div className="text-sm text-red-700 font-medium">
                    {error}
                  </div>
                </div>
              )}

              {progress.some(p => p.status === 'done') && (
                <div className="mt-8 p-6 bg-gray-900 rounded-2xl text-white flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Process Complete</div>
                    <div className="text-lg font-bold">Successfully imported routes for {selectedCity?.nameTr}</div>
                  </div>
                  <Link 
                    href="/admin/transfers"
                    className="px-6 py-2 bg-white text-gray-900 rounded-xl font-bold text-sm hover:bg-gray-100 transition shadow-lg"
                  >
                    View Routes
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center">
          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mr-3">
            <Info className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-gray-600">Rate limited (1 request/sec)</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center">
          <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mr-3">
            <Info className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-gray-600">Dual server failover active</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center">
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mr-3">
            <Info className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-gray-600">Auto-deduplicated data</span>
        </div>
      </div>
    </div>
  );
}
