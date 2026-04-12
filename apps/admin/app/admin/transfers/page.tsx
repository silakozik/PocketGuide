"use client";

import { useState, useEffect } from "react";
import { 
  Bus, Train, Plane, MapPin, Search, Plus, 
  ChevronRight, Filter, Download, MoreVertical, 
  CheckCircle2, XCircle, Clock, Info
} from "lucide-react";
import { TransferRouteDTO, CityDTO } from "@pocketguide/types";

export default function TransfersPage() {
  const [routes, setRoutes] = useState<TransferRouteDTO[]>([]);
  const [cities, setCities] = useState<CityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    cityId: "",
    type: "",
    mode: ""
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch cities for the filter
      const citiesRes = await fetch("http://localhost:3001/api/admin/cities"); // Assuming cities endpoint
      if (citiesRes.ok) {
        const citiesData = await citiesRes.json();
        setCities(citiesData);
      }

      fetchRoutes();
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(filters as any).toString();
      const res = await fetch(`http://localhost:3001/api/admin/transfers/routes?${query}`);
      if (res.ok) {
        const data = await res.json();
        setRoutes(data);
      }
    } catch (error) {
      console.error("Failed to fetch routes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'metro': return <Train className="w-4 h-4" />;
      case 'bus': return <Bus className="w-4 h-4" />;
      case 'rail': return <Train className="w-4 h-4 text-orange-600" />;
      case 'ferry': return <Plane className="w-4 h-4" />; // Replace with Ship icon if available
      default: return <Bus className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">General Transfer Guide</h1>
          <p className="text-gray-500">Manage airport, intercity and local transport routes.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => window.location.href = '/admin/transfers/import'}
            className="flex items-center px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <Download className="w-4 h-4 mr-2" />
            Bulk OSM Import
          </button>
          <button 
            onClick={() => window.location.href = '/admin/transfers/new'}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Route
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <select 
            value={filters.cityId}
            onChange={(e) => setFilters({...filters, cityId: e.target.value})}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.nameTr}</option>
            ))}
          </select>
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select 
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Types</option>
            <option value="airport">Airport</option>
            <option value="intercity">Intercity</option>
            <option value="intracity">Local</option>
          </select>
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
          <select 
            value={filters.mode}
            onChange={(e) => setFilters({...filters, mode: e.target.value})}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Modes</option>
            <option value="metro">Metro</option>
            <option value="bus">Bus</option>
            <option value="rail">Train</option>
            <option value="ferry">Ferry</option>
          </select>
        </div>
        <button 
          onClick={fetchRoutes}
          className="flex items-center px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition h-10"
        >
          <Filter className="w-4 h-4 mr-2" />
          Apply Filters
        </button>
      </div>

      {/* Routes List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-900">Route Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-900">Type & Mode</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-900">From → To</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-900">Duration & Cost</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-900">Source</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-900"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">
                  Loading routes...
                </td>
              </tr>
            ) : routes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No routes found. Try adjusting filters or import from OSM.
                </td>
              </tr>
            ) : routes.map(route => (
              <tr key={route.id} className="hover:bg-gray-50/50 transition cursor-pointer">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{route.name}</div>
                  <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{route.id.slice(0, 8)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      route.type === 'airport' ? 'bg-purple-100 text-purple-700' :
                      route.type === 'intercity' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {route.type}
                    </span>
                    <span className="flex items-center text-gray-500 text-sm">
                      {getModeIcon(route.mode)}
                      <span className="ml-1 capitalize">{route.mode}</span>
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 flex items-center">
                    <span className="font-medium">{route.fromPoint}</span>
                    <ChevronRight className="w-3 h-3 mx-1 text-gray-400" />
                    <span className="font-medium">{route.toPoint}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 font-medium">
                    {route.durationMin && route.durationMax ? `${route.durationMin}-${route.durationMax} min` : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {route.costAmount ? `${route.costAmount} ${route.costCurrency}` : 'Free / Card'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    route.source === 'osm' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-50 text-gray-700 border border-gray-100'
                  }`}>
                    {route.source.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {route.isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-1.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400 mr-1.5" />
                    )}
                    <span className={`text-sm ${route.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                      {route.isActive ? 'Active' : 'Draft'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
