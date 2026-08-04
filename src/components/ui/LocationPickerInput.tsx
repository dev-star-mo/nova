"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { MapPin, Search, Loader2, Map as MapIcon, ChevronDown, Check, X } from "lucide-react";

const LocationMap = dynamic(
  () => import("./LocationMap").then((mod) => mod.LocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-44 rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400 font-bold uppercase tracking-wider mt-2">
        Loading Map View...
      </div>
    ),
  }
);

interface PlaceResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationPickerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
  inputClassName?: string;
  error?: boolean;
}

const PRESET_LOCATIONS = [
  "JKIA Terminal 1, Nairobi",
  "Wilson Airport, Nairobi",
  "Westlands, Nairobi",
  "Nairobi CBD (City Centre)",
  "Gigiri / UN Avenue, Nairobi",
];

export function LocationPickerInput({
  value,
  onChange,
  placeholder = "Search location or select on map...",
  label,
  icon,
  inputClassName = "",
  error = false,
}: LocationPickerInputProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({
    lat: -1.286389,
    lon: 36.817223, // Default Nairobi center
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep internal query in sync with external value if changed externally
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search places using OpenStreetMap Nominatim
  const searchPlaces = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&addressdetails=1&limit=5`,
        {
          headers: {
            "Accept-Language": "en-US,en;q=0.9",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
        setIsOpen(true);
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      void searchPlaces(val);
    }, 350);
  };

  const handleSelectSuggestion = (place: PlaceResult) => {
    const displayName = place.display_name;
    setQuery(displayName);
    onChange(displayName);
    setSuggestions([]);
    setIsOpen(false);

    const latNum = parseFloat(place.lat);
    const lonNum = parseFloat(place.lon);
    if (!isNaN(latNum) && !isNaN(lonNum)) {
      setCoords({ lat: latNum, lon: lonNum });
    }
  };

  const handleSelectPreset = (presetName: string) => {
    setQuery(presetName);
    onChange(presetName);
    setIsOpen(false);
    void searchPlaces(presetName);
  };

  // Reverse geocode when map is clicked
  const handleMapClick = async (lat: number, lon: number) => {
    setCoords({ lat, lon });
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
        {
          headers: {
            "Accept-Language": "en-US,en;q=0.9",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          setQuery(data.display_name);
          onChange(data.display_name);
        }
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-onyx-950">
            {icon || <MapPin className="h-3 w-3 text-brand-600" />}
            {label}
          </label>
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-600 hover:text-brand-700 transition-colors"
          >
            <MapIcon className="h-3 w-3" />
            {showMap ? "Hide Map" : "Pin on Map"}
          </button>
        </div>
      )}

      <div className="relative group">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full rounded-2xl border px-5 py-4 text-sm font-bold focus:outline-none transition-all pr-12 ${
            error
              ? "border-red-500 bg-red-50/20 text-red-900 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
              : "border-slate-100 bg-slate-50/50 hover:border-brand-600/30 focus:border-brand-600 focus:bg-white focus:shadow-xl focus:shadow-brand-600/5"
          } ${inputClassName}`}
        />

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 text-brand-600 animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                onChange("");
                setSuggestions([]);
              }}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <Search className="h-4 w-4 text-slate-400 pointer-events-none" />
          )}
        </div>
      </div>

      {/* Quick preset chips */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {PRESET_LOCATIONS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handleSelectPreset(preset)}
            className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all ${
              query === preset
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700"
            }`}
          >
            {preset.split(",")[0]}
          </button>
        ))}
      </div>

      {/* Autocomplete suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-[120] mt-1 max-h-60 w-full overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95">
          {suggestions.map((place) => (
            <li
              key={place.place_id}
              onClick={() => handleSelectSuggestion(place)}
              className="flex cursor-pointer items-start gap-3 rounded-xl px-4 py-3 text-xs hover:bg-slate-50 transition-colors group"
            >
              <MapPin className="h-4 w-4 text-brand-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-onyx-950 line-clamp-1">{place.display_name.split(",")[0]}</p>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{place.display_name}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Interactive Leaflet Map */}
      {showMap && (
        <div className="animate-in fade-in duration-300">
          <LocationMap lat={coords.lat} lon={coords.lon} onMapClick={handleMapClick} />
          <p className="text-[9px] text-slate-400 font-medium italic mt-1 text-right">
            💡 Click or drag marker on map to set precise pickup/dropoff location
          </p>
        </div>
      )}
    </div>
  );
}
