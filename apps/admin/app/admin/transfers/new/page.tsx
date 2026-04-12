"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, Save, Plus, X, Bus, Train, Plane, 
  MapPin, Clock, DollarSign, List, Tag
} from "lucide-react";
import Link from "next/link";
import { CityDTO, TransferType, TransportMode } from "@pocketguide/types";

export default function NewRoutePage() {
  const [cities, setCities] = useState<CityDTO[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    cityId: "",
    type: "intracity" as TransferType,
    mode: "bus" as TransportMode,
    name: "",
    fromPoint: "",
    toPoint: "",
    durationMin: 0,
    durationMax: 0,
    costAmount: "",
    costCurrency: "EUR",
    frequency: "",
    operatingHours: "",
    transportCard: "",
    steps: [""] as string[],
    tags: [""] as string[],
    isActive: true
  });

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/admin/cities");
      if (res.ok) setCities(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleListChange = (key: 'steps' | 'tags', index: number, value: string) => {
    const list = [...formData[key]];
    list[index] = value;
    setFormData({ ...formData, [key]: list });
  };

  const addListItem = (key: 'steps' | 'tags') => {
    setFormData({ ...formData, [key]: [...formData[key], ""] });
  };

  const removeListItem = (key: 'steps' | 'tags', index: number) => {
    const list = formData[key].filter((_, i) => i !== index);
    setFormData({ ...formData, [key]: list.length ? list : [""] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await fetch("http://localhost:3001/api/admin/transfers/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          source: 'manual',
          steps: formData.steps.filter(s => s.trim()),
          tags: formData.tags.filter(t => t.trim())
        })
      });

      if (res.ok) {
        window.location.href = "/admin/transfers";
      }
    } catch (e) {
      console.error(e);
      alert("Error saving route");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin/transfers" className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-2 transition">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Transfers
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Add New Transit Route</h1>
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:bg-gray-200 disabled:shadow-none"
        >
          {isSaving ? "Saving..." : <><Save className="w-5 h-5 mr-2" /> Save Route</>}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Basic Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 italic flex items-center text-sm text-gray-500">
            <Info className="w-4 h-4 mr-2" />
            Note: Routes added manually will have the "MANUAL" source tag and are prioritized.
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="font-bold text-lg mb-4 flex items-center underline decoration-blue-500 underline-offset-8">
              Basic Information
            </h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <select 
                  required
                  value={formData.cityId}
                  onChange={(e) => setFormData({...formData, cityId: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50"
                >
                  <option value="">Select City</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.nameTr}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Route Name</label>
                <input 
                  type="text" required
                  placeholder="e.g. M2 Metro, Marmaray"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Transfer Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as TransferType})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50"
                >
                  <option value="intracity">Intracity (Local)</option>
                  <option value="airport">Airport Link</option>
                  <option value="intercity">Intercity</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Transport Mode</label>
                <select 
                  value={formData.mode}
                  onChange={(e) => setFormData({...formData, mode: e.target.value as TransportMode})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50"
                >
                  <option value="metro">Metro</option>
                  <option value="bus">Bus</option>
                  <option value="rail">Train</option>
                  <option value="ferry">Ferry</option>
                  <option value="tram">Tram</option>
                  <option value="taxi">Taxi</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">From</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" required
                    placeholder="Starting point"
                    value={formData.fromPoint}
                    onChange={(e) => setFormData({...formData, fromPoint: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">To</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" required
                    placeholder="Destination point"
                    value={formData.toPoint}
                    onChange={(e) => setFormData({...formData, toPoint: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-lg mb-6 flex items-center underline decoration-blue-500 underline-offset-8">
              Directions & Steps
            </h2>
            <div className="space-y-3">
              {formData.steps.map((step, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="flex-none w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold mt-2">
                    {idx + 1}
                  </div>
                  <input 
                    type="text"
                    placeholder="Enter a step..."
                    value={step}
                    onChange={(e) => handleListChange('steps', idx, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50"
                  />
                  <button 
                    type="button"
                    onClick={() => removeListItem('steps', idx)}
                    className="p-2 text-gray-400 hover:text-red-500 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button 
                type="button"
                onClick={() => addListItem('steps')}
                className="flex items-center text-sm text-blue-600 font-bold hover:text-blue-700 p-2"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Step
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar details */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="font-bold text-gray-900 border-b border-gray-50 pb-4">Schedule & Cost</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Duration (Minutes)</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" placeholder="Min"
                    value={formData.durationMin}
                    onChange={(e) => setFormData({...formData, durationMin: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50"
                  />
                  <span className="text-gray-400">-</span>
                  <input 
                    type="number" placeholder="Max"
                    value={formData.durationMax}
                    onChange={(e) => setFormData({...formData, durationMax: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Frequency</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" placeholder="e.g. Every 10 mins"
                    value={formData.frequency}
                    onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cost (Optional)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" placeholder="Amount"
                      value={formData.costAmount}
                      onChange={(e) => setFormData({...formData, costAmount: e.target.value})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50"
                    />
                  </div>
                  <select 
                    value={formData.costCurrency}
                    onChange={(e) => setFormData({...formData, costCurrency: e.target.value})}
                    className="w-20 px-2 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="TRY">TRY</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Transport Card</label>
                <input 
                  type="text" placeholder="e.g. Istanbulkart"
                  value={formData.transportCard}
                  onChange={(e) => setFormData({...formData, transportCard: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50/50"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 border-b border-gray-50 pb-4 mb-4 flex items-center">
              <Tag className="w-4 h-4 mr-2" /> Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, idx) => (
                <div key={idx} className="relative group">
                  <input 
                    type="text"
                    placeholder="New Tag"
                    value={tag}
                    onChange={(e) => handleListChange('tags', idx, e.target.value)}
                    className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs outline-none focus:ring-1 focus:ring-blue-400 w-24 pr-6"
                  />
                  <button 
                    type="button"
                    onClick={() => removeListItem('tags', idx)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button 
                type="button"
                onClick={() => addListItem('tags')}
                className="w-8 h-8 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-500 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 border-b border-gray-50 pb-4 mb-4">Settings</h2>
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-3 font-medium text-gray-700">Set as Active</span>
            </label>
            <p className="text-xs text-gray-400 mt-2">Inactive routes won't be visible to users in the app.</p>
          </div>
        </div>
      </div>
    </form>
  );
}

function Info({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
