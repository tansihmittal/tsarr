import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import Navigation from "../common/Navigation";
import BackgroundPicker, { BackgroundConfig } from "../common/BackgroundPicker";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import {
  BsClipboard,
  BsPlus,
  BsTrash,
  BsBookmark,
  BsBookmarkFill,
  BsGlobe,
  BsUpload,
  BsTable,
  BsGeoAlt,
  BsBuilding,
  BsHeart,
  BsStar,
  BsFlag,
  BsLightning,
  BsCircleFill,
} from "react-icons/bs";
import { TfiExport } from "react-icons/tfi";
import { BiReset } from "react-icons/bi";
import { countryNameMap, usStateMap, indiaStateMap, chinaProvinceMap, normalizeLocationName, getLocationCoordinates, getCountryFromCity, isCity, getStateFromCity, isUSCity, isUSState, normalizeStateName, getIndiaStateFromCity, isIndiaCity, isIndiaState, getChinaProvinceFromCity, isChinaCity, isChinaProvince } from "@/data/mapData";

// Map TopoJSON URLs
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const US_GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const INDIA_GEO_URL = "https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson";
const CHINA_GEO_URL = "https://raw.githubusercontent.com/nicholaswmin/china-geojson/master/china_provinces.json";

type MapType = "choropleth" | "bubble" | "marker" | "flow" | "heatmap";
type MapRegion = "world" | "usa" | "europe" | "asia" | "africa" | "southamerica" | "oceania" | "northamerica" | "middleeast" | "india" | "china" | "custom";
type MarkerIcon = "circle" | "pin" | "star" | "heart" | "flag" | "building" | "lightning";

interface MapDataPoint {
  id: string;
  name: string;
  value: number;
  coordinates?: [number, number];
  color?: string;
  icon?: MarkerIcon;
}

interface FlowData {
  id: string;
  from: [number, number];
  to: [number, number];
  fromCity?: string;
  toCity?: string;
  value: number;
  label?: string;
}

interface MapPreset {
  id: string;
  name: string;
  mapType: MapType;
  region: MapRegion;
  data: MapDataPoint[];
  flows?: FlowData[];
  isCustom?: boolean;
}

interface RegionConfig {
  id: MapRegion;
  name: string;
  center: [number, number];
  scale: number;
}

const markerIcons: { id: MarkerIcon; name: string; icon: React.ReactNode }[] = [
  { id: "circle", name: "Circle", icon: <BsCircleFill /> },
  { id: "pin", name: "Pin", icon: <BsGeoAlt /> },
  { id: "star", name: "Star", icon: <BsStar /> },
  { id: "heart", name: "Heart", icon: <BsHeart /> },
  { id: "flag", name: "Flag", icon: <BsFlag /> },
  { id: "building", name: "Building", icon: <BsBuilding /> },
  { id: "lightning", name: "Lightning", icon: <BsLightning /> },
];

const mapTypes: { id: MapType; name: string; icon: string }[] = [
  { id: "choropleth", name: "Choropleth", icon: "🗺️" },
  { id: "bubble", name: "Bubble", icon: "🔵" },
  { id: "marker", name: "Marker", icon: "📍" },
  { id: "flow", name: "Flow/Arc", icon: "↗️" },
  { id: "heatmap", name: "Heat Map", icon: "🔥" },
];

const regionOptions: RegionConfig[] = [
  { id: "world", name: "World", center: [0, 20], scale: 147 },
  { id: "usa", name: "USA", center: [-96, 38], scale: 800 },
  { id: "northamerica", name: "N. America", center: [-100, 45], scale: 300 },
  { id: "southamerica", name: "S. America", center: [-60, -15], scale: 350 },
  { id: "europe", name: "Europe", center: [15, 52], scale: 600 },
  { id: "asia", name: "Asia", center: [100, 35], scale: 350 },
  { id: "india", name: "India", center: [78, 22], scale: 800 },
  { id: "china", name: "China", center: [105, 35], scale: 500 },
  { id: "middleeast", name: "Middle East", center: [45, 28], scale: 600 },
  { id: "africa", name: "Africa", center: [20, 0], scale: 350 },
  { id: "oceania", name: "Oceania", center: [140, -25], scale: 450 },
  { id: "custom", name: "Custom", center: [0, 0], scale: 150 },
];

const colorSchemes = {
  blue: ["#e3f2fd", "#90caf9", "#42a5f5", "#1e88e5", "#1565c0", "#0d47a1"],
  green: ["#e8f5e9", "#a5d6a7", "#66bb6a", "#43a047", "#2e7d32", "#1b5e20"],
  red: ["#ffebee", "#ef9a9a", "#ef5350", "#e53935", "#c62828", "#b71c1c"],
  purple: ["#f3e5f5", "#ce93d8", "#ab47bc", "#8e24aa", "#6a1b9a", "#4a148c"],
  orange: ["#fff3e0", "#ffcc80", "#ffa726", "#fb8c00", "#ef6c00", "#e65100"],
  teal: ["#e0f2f1", "#80cbc4", "#26a69a", "#00897b", "#00695c", "#004d40"],
  yellow: ["#fffde7", "#fff59d", "#ffee58", "#fdd835", "#fbc02d", "#f9a825"],
  pink: ["#fce4ec", "#f48fb1", "#f06292", "#ec407a", "#d81b60", "#ad1457"],
};

// Use imported countryNameMap from mapData.ts
const countryMapping = countryNameMap;

const defaultPresets: MapPreset[] = [
  {
    id: "world-population",
    name: "World Population",
    mapType: "choropleth",
    region: "world",
    data: [
      { id: "China", name: "China", value: 1400 },
      { id: "India", name: "India", value: 1380 },
      { id: "United States of America", name: "USA", value: 331 },
      { id: "Indonesia", name: "Indonesia", value: 273 },
      { id: "Pakistan", name: "Pakistan", value: 220 },
      { id: "Brazil", name: "Brazil", value: 212 },
    ],
  },
  {
    id: "us-cities",
    name: "US Major Cities",
    mapType: "bubble",
    region: "usa",
    data: [
      { id: "nyc", name: "New York", value: 8336, coordinates: [-74.006, 40.7128] },
      { id: "la", name: "Los Angeles", value: 3979, coordinates: [-118.2437, 34.0522] },
      { id: "chi", name: "Chicago", value: 2693, coordinates: [-87.6298, 41.8781] },
      { id: "hou", name: "Houston", value: 2320, coordinates: [-95.3698, 29.7604] },
      { id: "phx", name: "Phoenix", value: 1680, coordinates: [-112.074, 33.4484] },
    ],
  },
  {
    id: "world-markers",
    name: "World Capitals",
    mapType: "marker",
    region: "world",
    data: [
      { id: "lon", name: "London", value: 1, coordinates: [-0.1276, 51.5074], icon: "star" },
      { id: "par", name: "Paris", value: 1, coordinates: [2.3522, 48.8566], icon: "heart" },
      { id: "tok", name: "Tokyo", value: 1, coordinates: [139.6917, 35.6895], icon: "flag" },
      { id: "nyc", name: "New York", value: 1, coordinates: [-74.006, 40.7128], icon: "building" },
      { id: "syd", name: "Sydney", value: 1, coordinates: [151.2093, -33.8688], icon: "pin" },
    ],
  },
  {
    id: "trade-routes",
    name: "Trade Routes",
    mapType: "flow",
    region: "world",
    data: [],
    flows: [
      { id: "f1", from: [-74.006, 40.7128], to: [-0.1276, 51.5074], value: 100, label: "New York → London", fromCity: "New York", toCity: "London" },
      { id: "f2", from: [121.4737, 31.2304], to: [-118.2437, 34.0522], value: 80, label: "Shanghai → Los Angeles", fromCity: "Shanghai", toCity: "Los Angeles" },
      { id: "f3", from: [139.6917, 35.6895], to: [-122.4194, 37.7749], value: 60, label: "Tokyo → San Francisco", fromCity: "Tokyo", toCity: "San Francisco" },
    ],
  },
  {
    id: "india-cities",
    name: "India Major Cities",
    mapType: "bubble",
    region: "india",
    data: [
      { id: "mum", name: "Mumbai", value: 20411, coordinates: [72.8777, 19.076] },
      { id: "del", name: "Delhi", value: 16787, coordinates: [77.1025, 28.7041] },
      { id: "blr", name: "Bangalore", value: 8443, coordinates: [77.5946, 12.9716] },
      { id: "hyd", name: "Hyderabad", value: 6809, coordinates: [78.4867, 17.385] },
      { id: "ahm", name: "Ahmedabad", value: 5577, coordinates: [72.5714, 23.0225] },
      { id: "che", name: "Chennai", value: 4681, coordinates: [80.2707, 13.0827] },
      { id: "kol", name: "Kolkata", value: 4496, coordinates: [88.3639, 22.5726] },
    ],
  },
  {
    id: "europe-gdp",
    name: "Europe GDP",
    mapType: "choropleth",
    region: "europe",
    data: [
      { id: "Germany", name: "Germany", value: 4200 },
      { id: "United Kingdom", name: "UK", value: 3100 },
      { id: "France", name: "France", value: 2900 },
      { id: "Italy", name: "Italy", value: 2100 },
      { id: "Spain", name: "Spain", value: 1400 },
    ],
  },
  {
    id: "africa-data",
    name: "Africa Overview",
    mapType: "choropleth",
    region: "africa",
    data: [
      { id: "Nigeria", name: "Nigeria", value: 206 },
      { id: "Ethiopia", name: "Ethiopia", value: 115 },
      { id: "Egypt", name: "Egypt", value: 102 },
      { id: "South Africa", name: "South Africa", value: 59 },
      { id: "Kenya", name: "Kenya", value: 54 },
    ],
  },
];

const STORAGE_KEY = "map-maker-presets";

// Debounced input component to prevent cursor jumping
const DebouncedInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
  placeholder?: string;
}> = ({ value, onChange, type = "text", className = "", placeholder }) => {
  const [localValue, setLocalValue] = useState(value);
  const isTypingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isTypingRef.current) {
      setLocalValue(value);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    isTypingRef.current = true;
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
      isTypingRef.current = false;
    }, 500);
  };

  return (
    <input
      type={type}
      value={localValue}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
    />
  );
};

// Data point row with debounced inputs and auto-coordinate lookup
const DataPointRow: React.FC<{
  point: MapDataPoint;
  index: number;
  mapType: MapType;
  markerIcon: MarkerIcon;
  onUpdate: (index: number, updates: Partial<MapDataPoint>) => void;
  onRemove: (index: number) => void;
}> = ({ point, index, mapType, markerIcon, onUpdate, onRemove }) => {
  const [localName, setLocalName] = useState(point.name);
  const [localValue, setLocalValue] = useState(point.value.toString());
  const [coordsFound, setCoordsFound] = useState(!!point.coordinates);
  const isTypingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isTypingRef.current) {
      setLocalName(point.name);
      setLocalValue(point.value.toString());
      setCoordsFound(!!point.coordinates && point.coordinates[0] !== 0);
    }
  }, [point]);

  const handleNameChange = (name: string) => {
    setLocalName(name);
    isTypingRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // Auto-lookup coordinates when typing finishes
      const coords = getLocationCoordinates(name);
      const normalizedName = normalizeLocationName(name);
      if (coords) {
        setCoordsFound(true);
        onUpdate(index, { name, id: normalizedName, coordinates: coords });
      } else {
        setCoordsFound(false);
        onUpdate(index, { name, id: normalizedName });
      }
      isTypingRef.current = false;
    }, 500);
  };

  const handleValueChange = (val: string) => {
    setLocalValue(val);
    isTypingRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onUpdate(index, { value: parseFloat(val) || 0 });
      isTypingRef.current = false;
    }, 500);
  };

  return (
    <div className="p-2 bg-base-200 rounded-lg space-y-1">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={localName}
          onChange={(e) => handleNameChange(e.target.value)}
          className="input input-xs input-bordered flex-1 min-w-0"
          placeholder="City, State, or Country"
        />
        <input
          type="number"
          value={localValue}
          onChange={(e) => handleValueChange(e.target.value)}
          className="input input-xs input-bordered w-16"
          placeholder="Value"
        />
        {mapType === "marker" && (
          <select
            value={point.icon || markerIcon}
            onChange={(e) => onUpdate(index, { icon: e.target.value as MarkerIcon })}
            className="select select-xs select-bordered w-16"
          >
            {markerIcons.map((ic) => <option key={ic.id} value={ic.id}>{ic.name}</option>)}
          </select>
        )}
        <button onClick={() => onRemove(index)} className="btn btn-xs btn-ghost text-error"><BsTrash /></button>
      </div>
      {mapType !== "choropleth" && (
        <div className="text-[10px] pl-1">
          {coordsFound && point.coordinates ? (
            <span className="text-success">📍 {point.coordinates[0].toFixed(2)}, {point.coordinates[1].toFixed(2)}</span>
          ) : (
            <span className="text-warning">⚠️ Location not found - type a valid city/country</span>
          )}
        </div>
      )}
    </div>
  );
};

// Flow row with city name inputs - much easier to use
const FlowRow: React.FC<{
  flow: FlowData;
  index: number;
  // eslint-disable-next-line
  onUpdate: (index: number, updates: Partial<FlowData>) => void;
  onRemove: (index: number) => void;
}> = ({ flow, index, onUpdate, onRemove }) => {
  const [localFromCity, setLocalFromCity] = useState(flow.fromCity || "");
  const [localToCity, setLocalToCity] = useState(flow.toCity || "");
  const [localValue, setLocalValue] = useState(flow.value.toString());
  const isTypingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isTypingRef.current) {
      setLocalFromCity(flow.fromCity || "");
      setLocalToCity(flow.toCity || "");
      setLocalValue(flow.value.toString());
    }
  }, [flow]);

  const debouncedUpdate = (updates: Partial<FlowData>) => {
    isTypingRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onUpdate(index, updates);
      isTypingRef.current = false;
    }, 500);
  };

  const handleFromCityChange = (city: string) => {
    setLocalFromCity(city);
    const coords = getLocationCoordinates(city);
    if (coords) {
      debouncedUpdate({ fromCity: city, from: coords, label: `${city} → ${localToCity}` });
    } else {
      debouncedUpdate({ fromCity: city, label: `${city} → ${localToCity}` });
    }
  };

  const handleToCityChange = (city: string) => {
    setLocalToCity(city);
    const coords = getLocationCoordinates(city);
    if (coords) {
      debouncedUpdate({ toCity: city, to: coords, label: `${localFromCity} → ${city}` });
    } else {
      debouncedUpdate({ toCity: city, label: `${localFromCity} → ${city}` });
    }
  };

  return (
    <div className="p-2 bg-base-200 rounded-lg space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={localFromCity}
          onChange={(e) => handleFromCityChange(e.target.value)}
          className="input input-xs input-bordered flex-1"
          placeholder="From city (e.g. Tokyo)"
        />
        <span className="text-gray-400">→</span>
        <input
          type="text"
          value={localToCity}
          onChange={(e) => handleToCityChange(e.target.value)}
          className="input input-xs input-bordered flex-1"
          placeholder="To city (e.g. London)"
        />
        <input
          type="number"
          value={localValue}
          onChange={(e) => { setLocalValue(e.target.value); debouncedUpdate({ value: parseFloat(e.target.value) || 0 }); }}
          className="input input-xs input-bordered w-16"
          placeholder="Value"
        />
        <button onClick={() => onRemove(index)} className="btn btn-xs btn-ghost text-error"><BsTrash /></button>
      </div>
      <div className="text-[10px] text-gray-500">
        {flow.from[0] !== 0 && flow.to[0] !== 0 ? (
          <span>📍 {flow.from[0].toFixed(2)}, {flow.from[1].toFixed(2)} → {flow.to[0].toFixed(2)}, {flow.to[1].toFixed(2)}</span>
        ) : (
          <span className="text-warning">⚠️ Enter valid city names to show route</span>
        )}
      </div>
    </div>
  );
};

const MapMakerLayout: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mapType, setMapType] = useState<MapType>("choropleth");
  const [region, setRegion] = useState<MapRegion>("world");
  const [title, setTitle] = useState("My Map");
  const [data, setData] = useState<MapDataPoint[]>(defaultPresets[0].data);
  const [flows, setFlows] = useState<FlowData[]>([]);
  const [colorScheme, setColorScheme] = useState<keyof typeof colorSchemes>("blue");
  const [showLabels, setShowLabels] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [strokeColor, setStrokeColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(0.5);
  const [defaultFill, setDefaultFill] = useState("#d1d5db");
  const [markerColor, setMarkerColor] = useState("#ef4444");
  const [markerIcon, setMarkerIcon] = useState<MarkerIcon>("circle");
  const [markerSize, setMarkerSize] = useState(8);
  const [flowColor, setFlowColor] = useState("#6366f1");
  const [padding, setPadding] = useState(40);
  const [borderRadius, setBorderRadius] = useState(16);
  const [activeTab, setActiveTab] = useState<"data" | "style" | "presets">("data");
  const [customPresets, setCustomPresets] = useState<MapPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState("");
  const [zoom, setZoom] = useState(1);
  
  // Custom region controls
  const [customCenter, setCustomCenter] = useState<[number, number]>([0, 20]);
  const [customScale, setCustomScale] = useState(150);

  const [background, setBackground] = useState<BackgroundConfig>({
    type: "solid",
    background: "#f8fafc",
    color1: "#f8fafc",
    color2: "#f8fafc",
    direction: "to bottom right",
  });

  const currentRegion = region === "custom" 
    ? { id: "custom" as MapRegion, name: "Custom", center: customCenter, scale: customScale }
    : regionOptions.find((r) => r.id === region) || regionOptions[0];
  
  // Select appropriate TopoJSON based on region
  const getGeoUrl = () => {
    switch (region) {
      case "usa": return US_GEO_URL;
      case "india": return INDIA_GEO_URL;
      case "china": return CHINA_GEO_URL;
      default: return GEO_URL;
    }
  };
  const geoUrl = getGeoUrl();

  // Load custom presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCustomPresets(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Parse Excel/CSV data
  const parseExcelData = useCallback((text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      toast.error("Need at least 2 rows (header + data)");
      return;
    }
    
    const headers = lines[0].split(/[,\t]/).map((h) => h.trim().toLowerCase());
    
    // Check if this is flow data (has from/to columns)
    const fromIdx = headers.findIndex(h => ["from", "origin", "source", "start", "from_city", "fromcity"].includes(h));
    const toIdx = headers.findIndex(h => ["to", "destination", "dest", "target", "end", "to_city", "tocity"].includes(h));
    
    if (fromIdx !== -1 && toIdx !== -1) {
      parseFlowData(lines, headers, fromIdx, toIdx);
      return;
    }
    
    const nameIdx = headers.findIndex(h => ["name", "country", "location", "city", "region", "state", "place"].includes(h));
    const valueIdx = headers.findIndex(h => ["value", "amount", "count", "population", "gdp", "data", "number", "total", "sales"].includes(h));
    const lngIdx = headers.findIndex(h => ["lng", "lon", "longitude", "long", "x"].includes(h));
    const latIdx = headers.findIndex(h => ["lat", "latitude", "y"].includes(h));
    
    if (nameIdx === -1) {
      toast.error("Need a 'name', 'country', or 'city' column");
      return;
    }
    
    const newData: MapDataPoint[] = [];
    let citiesDetected = 0;
    const aggregated: Record<string, { value: number; items: string[] }> = {};
    const isUSARegion = region === "usa";
    const isIndiaRegion = region === "india";
    const isChinaRegion = region === "china";
    const isStateRegion = isUSARegion || isIndiaRegion || isChinaRegion;
    
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(/[,\t]/).map((c) => c.trim());
      if (!cells[nameIdx]) continue;
      
      const rawName = cells[nameIdx];
      const value = valueIdx !== -1 ? parseFloat(cells[valueIdx]) || 0 : 1;
      
      // For choropleth mode, aggregate cities to countries/states
      if (mapType === "choropleth") {
        // For USA region, aggregate US cities to states
        if (isUSARegion && isUSCity(rawName)) {
          citiesDetected++;
          const stateName = getStateFromCity(rawName);
          if (stateName) {
            if (!aggregated[stateName]) {
              aggregated[stateName] = { value: 0, items: [] };
            }
            aggregated[stateName].value += value;
            aggregated[stateName].items.push(rawName);
            continue;
          }
        }
        // Check if it's a US state code/name for USA region
        else if (isUSARegion && isUSState(rawName)) {
          const stateName = normalizeStateName(rawName);
          const point: MapDataPoint = {
            id: stateName,
            name: rawName,
            value,
          };
          newData.push(point);
          continue;
        }
        // For India region, aggregate cities to states
        else if (isIndiaRegion && isIndiaCity(rawName)) {
          citiesDetected++;
          const stateName = getIndiaStateFromCity(rawName);
          if (stateName) {
            if (!aggregated[stateName]) {
              aggregated[stateName] = { value: 0, items: [] };
            }
            aggregated[stateName].value += value;
            aggregated[stateName].items.push(rawName);
            continue;
          }
        }
        // Check if it's an India state
        else if (isIndiaRegion && isIndiaState(rawName)) {
          const point: MapDataPoint = {
            id: rawName,
            name: rawName,
            value,
          };
          newData.push(point);
          continue;
        }
        // For China region, aggregate cities to provinces
        else if (isChinaRegion && isChinaCity(rawName)) {
          citiesDetected++;
          const provinceName = getChinaProvinceFromCity(rawName);
          if (provinceName) {
            if (!aggregated[provinceName]) {
              aggregated[provinceName] = { value: 0, items: [] };
            }
            aggregated[provinceName].value += value;
            aggregated[provinceName].items.push(rawName);
            continue;
          }
        }
        // Check if it's a China province
        else if (isChinaRegion && isChinaProvince(rawName)) {
          const point: MapDataPoint = {
            id: rawName,
            name: rawName,
            value,
          };
          newData.push(point);
          continue;
        }
        // For world region, aggregate cities to countries
        else if (!isStateRegion && isCity(rawName)) {
          citiesDetected++;
          const countryName = getCountryFromCity(rawName);
          if (countryName) {
            if (!aggregated[countryName]) {
              aggregated[countryName] = { value: 0, items: [] };
            }
            aggregated[countryName].value += value;
            aggregated[countryName].items.push(rawName);
            continue;
          }
        }
      }
      
      const normalizedName = normalizeLocationName(rawName);
      
      const point: MapDataPoint = {
        id: normalizedName,
        name: rawName,
        value,
      };
      
      if (lngIdx !== -1 && latIdx !== -1) {
        const lng = parseFloat(cells[lngIdx]);
        const lat = parseFloat(cells[latIdx]);
        if (!isNaN(lng) && !isNaN(lat)) {
          point.coordinates = [lng, lat];
        }
      }
      
      if (!point.coordinates) {
        const coords = getLocationCoordinates(rawName);
        if (coords) {
          point.coordinates = coords;
        }
      }
      
      newData.push(point);
    }
    
    // Add aggregated data for choropleth
    if (mapType === "choropleth" && Object.keys(aggregated).length > 0) {
      for (const [name, data] of Object.entries(aggregated)) {
        newData.push({
          id: name,
          name: `${name} (${data.items.length} cities)`,
          value: data.value,
        });
      }
      if (citiesDetected > 0) {
        const targetType = isUSARegion ? "states" : isIndiaRegion ? "states" : isChinaRegion ? "provinces" : "countries";
        toast.success(`Aggregated ${citiesDetected} cities into ${Object.keys(aggregated).length} ${targetType}`);
      }
    }
    
    if (newData.length === 0) {
      if (citiesDetected > 0) {
        toast.error("Cities detected! Switch to Bubble or Marker map for city data");
        return;
      }
      toast.error("No valid data found");
      return;
    }
    
    setData(newData);
    toast.success(`Imported ${newData.length} data points!`);
  }, [mapType, region]); // parseFlowData is defined below, so we can't include it here

  // Parse flow/arc data from CSV/Excel
  const parseFlowData = useCallback((lines: string[], headers: string[], fromIdx: number, toIdx: number) => {
    const valueIdx = headers.findIndex(h => ["value", "amount", "count", "volume", "weight", "flow"].includes(h));
    const labelIdx = headers.findIndex(h => ["label", "name", "route", "description"].includes(h));
    
    const newFlows: FlowData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(/[,\t]/).map((c) => c.trim());
      const fromCity = cells[fromIdx];
      const toCity = cells[toIdx];
      
      if (!fromCity || !toCity) continue;
      
      const fromCoords = getLocationCoordinates(fromCity);
      const toCoords = getLocationCoordinates(toCity);
      
      const flow: FlowData = {
        id: `flow-${Date.now()}-${i}`,
        from: fromCoords || [0, 0],
        to: toCoords || [0, 0],
        fromCity,
        toCity,
        value: valueIdx !== -1 ? parseFloat(cells[valueIdx]) || 50 : 50,
        label: labelIdx !== -1 ? cells[labelIdx] : `${fromCity} → ${toCity}`,
      };
      
      newFlows.push(flow);
    }
    
    if (newFlows.length === 0) {
      toast.error("No valid flow data found");
      return;
    }
    
    setFlows(newFlows);
    setMapType("flow");
    toast.success(`Imported ${newFlows.length} flow routes!`);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => parseExcelData(event.target?.result as string);
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [parseExcelData]);

  // Listen for paste events
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text");
      if (text && (text.includes("\t") || (text.includes(",") && text.includes("\n")))) {
        e.preventDefault();
        parseExcelData(text);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [parseExcelData]);

  const saveCustomPresets = (presets: MapPreset[]) => {
    setCustomPresets(presets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  };

  // Color scale for choropleth
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const colorScale = scaleLinear<string>()
    .domain([minValue, maxValue])
    .range([colorSchemes[colorScheme][0], colorSchemes[colorScheme][5]]);

  // Bubble size scale
  const bubbleScale = scaleLinear().domain([minValue, maxValue]).range([4, 30]);

  const getCountryColor = (geoId: string) => {
    if (!geoId) return defaultFill;
    // Normalize the geoId for comparison
    const normalizedGeoId = geoId.toLowerCase().trim();
    
    // Try multiple matching strategies
    const item = data.find((d) => {
      const normalizedId = d.id.toLowerCase().trim();
      const normalizedName = d.name.toLowerCase().trim();
      
      // Direct match
      if (normalizedId === normalizedGeoId || normalizedName === normalizedGeoId) return true;
      
      // Check if geoId matches the mapped version
      if (countryMapping[d.id]?.toLowerCase() === normalizedGeoId) return true;
      if (countryMapping[d.name]?.toLowerCase() === normalizedGeoId) return true;
      
      // Check if data id/name maps to geoId
      const mappedFromId = countryMapping[d.id.toUpperCase()];
      const mappedFromName = countryMapping[d.name.toUpperCase()];
      if (mappedFromId?.toLowerCase() === normalizedGeoId) return true;
      if (mappedFromName?.toLowerCase() === normalizedGeoId) return true;
      
      // For US states
      if (region === "usa") {
        const stateFromCode = usStateMap[d.id.toUpperCase()];
        const stateFromName = usStateMap[d.name.toUpperCase()];
        if (stateFromCode?.toLowerCase() === normalizedGeoId) return true;
        if (stateFromName?.toLowerCase() === normalizedGeoId) return true;
      }
      
      // For India states
      if (region === "india") {
        const stateFromCode = indiaStateMap[d.id.toUpperCase()];
        const stateFromName = indiaStateMap[d.name.toUpperCase()];
        const stateFromLower = indiaStateMap[d.id.toLowerCase()] || indiaStateMap[d.name.toLowerCase()];
        if (stateFromCode?.toLowerCase() === normalizedGeoId) return true;
        if (stateFromName?.toLowerCase() === normalizedGeoId) return true;
        if (stateFromLower?.toLowerCase() === normalizedGeoId) return true;
        // Also check partial match for state names (GeoJSON may have different naming)
        if (normalizedGeoId.includes(normalizedId) || normalizedId.includes(normalizedGeoId)) return true;
      }
      
      // For China provinces
      if (region === "china") {
        const provFromCode = chinaProvinceMap[d.id.toUpperCase()];
        const provFromName = chinaProvinceMap[d.name.toUpperCase()];
        const provFromLower = chinaProvinceMap[d.id.toLowerCase()] || chinaProvinceMap[d.name.toLowerCase()];
        if (provFromCode?.toLowerCase() === normalizedGeoId) return true;
        if (provFromName?.toLowerCase() === normalizedGeoId) return true;
        if (provFromLower?.toLowerCase() === normalizedGeoId) return true;
        // Also check partial match for province names
        if (normalizedGeoId.includes(normalizedId) || normalizedId.includes(normalizedGeoId)) return true;
      }
      
      return false;
    });
    
    if (item) return colorScale(item.value);
    return defaultFill;
  };

  const updateDataPoint = (index: number, updates: Partial<MapDataPoint>) => {
    const updated = [...data];
    updated[index] = { ...updated[index], ...updates };
    setData(updated);
  };

  const addDataPoint = () => {
    const newPoint: MapDataPoint = {
      id: `point-${Date.now()}`,
      name: "",
      value: 50,
      coordinates: mapType !== "choropleth" ? [0, 0] : undefined,
      icon: markerIcon,
    };
    setData([...data, newPoint]);
  };

  const removeDataPoint = (index: number) => {
    if (data.length <= 1) return;
    setData(data.filter((_, i) => i !== index));
  };

  const addFlow = () => {
    const newFlow: FlowData = {
      id: `flow-${Date.now()}`,
      from: [-74.006, 40.7128],
      to: [0, 51.5],
      value: 50,
      label: `Route ${flows.length + 1}`,
      fromCity: "New York",
      toCity: "London",
    };
    setFlows([...flows, newFlow]);
  };

  const updateFlow = (index: number, updates: Partial<FlowData>) => {
    const updated = [...flows];
    updated[index] = { ...updated[index], ...updates };
    setFlows(updated);
  };

  const removeFlow = (index: number) => {
    setFlows(flows.filter((_, i) => i !== index));
  };

  const loadPreset = (preset: MapPreset) => {
    setMapType(preset.mapType);
    setRegion(preset.region);
    setData([...preset.data]);
    setFlows(preset.flows ? [...preset.flows] : []);
    setTitle(preset.name);
    toast.success(`Loaded "${preset.name}"`);
  };

  const saveAsPreset = () => {
    if (!newPresetName.trim()) {
      toast.error("Enter a preset name");
      return;
    }
    const preset: MapPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      mapType,
      region,
      data: data.map((d) => ({ ...d })),
      flows: flows.map((f) => ({ ...f })),
      isCustom: true,
    };
    saveCustomPresets([...customPresets, preset]);
    setNewPresetName("");
    toast.success("Preset saved!");
  };

  const deleteCustomPreset = (id: string) => {
    saveCustomPresets(customPresets.filter((p) => p.id !== id));
    toast.success("Preset deleted");
  };

  const resetAll = () => {
    if (!confirm("Reset all changes?")) return;
    setMapType("choropleth");
    setRegion("world");
    setTitle("My Map");
    setData(defaultPresets[0].data);
    setFlows([]);
    setCustomCenter([0, 20]);
    setCustomScale(150);
    setBackground({ type: "solid", background: "#f8fafc", color1: "#f8fafc", color2: "#f8fafc", direction: "to bottom right" });
    toast.success("Reset complete");
  };

  const handleExport = useCallback(async (format: "png" | "jpeg" | "svg", scale: number = 2) => {
    if (!mapContainerRef.current) return;
    const htmlToImage = await import("html-to-image");
    try {
      let dataUrl: string;
      if (format === "svg") {
        dataUrl = await htmlToImage.toSvg(mapContainerRef.current, { backgroundColor: background.type === "solid" ? background.color1 : "#ffffff" });
      } else if (format === "jpeg") {
        dataUrl = await htmlToImage.toJpeg(mapContainerRef.current, { pixelRatio: scale, backgroundColor: background.type === "solid" ? background.color1 : "#ffffff", quality: 0.95 });
      } else {
        dataUrl = await htmlToImage.toPng(mapContainerRef.current, { pixelRatio: scale, backgroundColor: background.type === "solid" ? background.color1 : undefined });
      }
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `tsarr-in-map.${format}`;
      a.click();
      toast.success(`Exported as ${format.toUpperCase()}${format !== "svg" ? ` ${scale}x` : ""}`);
    } catch {
      toast.error("Export failed");
    }
  }, [background]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!mapContainerRef.current) return;
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(mapContainerRef.current, { pixelRatio: 2 });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  }, []);

  const ToolbarButton = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2.5 bg-base-100 border border-base-200 rounded-lg transition-all hover:bg-base-200/50 hover:border-primary/20 hover:shadow-sm">
      <span className="text-lg">{icon}</span>
      <span className="font-medium text-primary-content">{label}</span>
    </button>
  );

  const renderMarkerIcon = (icon: MarkerIcon = markerIcon, size: number = markerSize, color: string = markerColor) => {
    const iconProps = { fill: color, stroke: "#fff", strokeWidth: 1 };
    switch (icon) {
      case "pin":
        return (
          <g transform={`translate(-${size/2}, -${size})`}>
            <path d={`M${size/2} 0 C${size*0.2} 0 0 ${size*0.3} 0 ${size*0.5} C0 ${size*0.8} ${size/2} ${size} ${size/2} ${size} C${size/2} ${size} ${size} ${size*0.8} ${size} ${size*0.5} C${size} ${size*0.3} ${size*0.8} 0 ${size/2} 0Z`} {...iconProps} />
            <circle cx={size/2} cy={size*0.45} r={size*0.2} fill="#fff" />
          </g>
        );
      case "star":
        const starPoints = Array.from({ length: 5 }, (_, i) => {
          const angle = (i * 72 - 90) * Math.PI / 180;
          const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
          return `${Math.cos(angle) * size},${Math.sin(angle) * size} ${Math.cos(innerAngle) * size * 0.4},${Math.sin(innerAngle) * size * 0.4}`;
        }).join(" ");
        return <polygon points={starPoints} {...iconProps} />;
      case "heart":
        return (
          <g transform={`translate(-${size}, -${size*0.9})`}>
            <path d={`M${size} ${size*0.3} C${size} ${size*0.1} ${size*0.7} 0 ${size*0.5} 0 C${size*0.2} 0 0 ${size*0.3} 0 ${size*0.6} C0 ${size*1.2} ${size} ${size*1.8} ${size} ${size*1.8} C${size} ${size*1.8} ${size*2} ${size*1.2} ${size*2} ${size*0.6} C${size*2} ${size*0.3} ${size*1.8} 0 ${size*1.5} 0 C${size*1.3} 0 ${size} ${size*0.1} ${size} ${size*0.3}Z`} {...iconProps} />
          </g>
        );
      case "flag":
        return (
          <g transform={`translate(-${size*0.1}, -${size})`}>
            <rect x={0} y={0} width={size*0.15} height={size} fill={color} />
            <path d={`M${size*0.15} 0 L${size} ${size*0.25} L${size*0.15} ${size*0.5}Z`} {...iconProps} />
          </g>
        );
      case "building":
        return (
          <g transform={`translate(-${size/2}, -${size})`}>
            <rect x={0} y={size*0.2} width={size} height={size*0.8} {...iconProps} />
            <rect x={size*0.15} y={0} width={size*0.3} height={size*0.3} {...iconProps} />
            <rect x={size*0.2} y={size*0.4} width={size*0.2} height={size*0.2} fill="#fff" />
            <rect x={size*0.6} y={size*0.4} width={size*0.2} height={size*0.2} fill="#fff" />
            <rect x={size*0.2} y={size*0.7} width={size*0.2} height={size*0.2} fill="#fff" />
            <rect x={size*0.6} y={size*0.7} width={size*0.2} height={size*0.2} fill="#fff" />
          </g>
        );
      case "lightning":
        return (
          <g transform={`translate(-${size*0.4}, -${size})`}>
            <polygon points={`${size*0.5},0 0,${size*0.6} ${size*0.35},${size*0.6} ${size*0.2},${size} ${size*0.8},${size*0.4} ${size*0.45},${size*0.4}`} {...iconProps} />
          </g>
        );
      default:
        return <circle r={size} fill={color} stroke="#fff" strokeWidth={2} />;
    }
  };

  const renderLegend = () => {
    if (!showLegend || mapType === "marker") return null;
    const colors = colorSchemes[colorScheme];
    return (
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="text-xs font-semibold text-gray-700 mb-2">Legend</div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500">{minValue.toLocaleString()}</span>
          {colors.map((c, i) => (
            <div key={i} className="w-6 h-3 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span className="text-[10px] text-gray-500">{maxValue.toLocaleString()}</span>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-[100vh] h-fit editor-bg relative">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-4 lg:px-0 relative">
        <div className="grid gap-5 lg:grid-cols-[3fr_1.5fr]">
          {/* Preview Area */}
          <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="grid grid-cols-2 gap-2 mb-3 lg:flex lg:flex-wrap lg:justify-end">
              <div className="dropdown">
                <label tabIndex={0}><ToolbarButton icon={<TfiExport />} label="Export" onClick={() => {}} /></label>
                <ul tabIndex={0} className="dropdown-content menu p-2 mt-1 bg-base-100 border-2 rounded-lg min-w-[180px] z-50">
                  <li><a onClick={() => handleExport("png", 1)}>PNG 1x</a></li>
                  <li><a onClick={() => handleExport("png", 2)}>PNG 2x</a></li>
                  <li><a onClick={() => handleExport("png", 4)}>PNG 4x</a></li>
                  <li><a onClick={() => handleExport("jpeg", 2)}>JPEG 2x</a></li>
                  <li><a onClick={() => handleExport("svg")}>SVG</a></li>
                </ul>
              </div>
              <ToolbarButton icon={<BsClipboard />} label="Copy to Clipboard" onClick={handleCopyToClipboard} />
              <ToolbarButton icon={<BiReset />} label="Reset" onClick={resetAll} />
            </div>

            {/* Map Container */}
            <div className="relative flex-1 min-h-[500px] lg:min-h-[600px] flex items-center justify-center rounded-2xl bg-base-200/30 border border-base-200/80 overflow-hidden">
              <div
                ref={mapContainerRef}
                className="w-full h-full flex flex-col items-center justify-center relative"
                style={{ background: background.background, padding: `${padding}px`, borderRadius: `${borderRadius}px` }}
              >
                {title && <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">{title}</h2>}
                <div className="w-full flex-1 relative">
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{ center: currentRegion.center, scale: currentRegion.scale * zoom }}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <Geographies geography={geoUrl}>
                      {({ geographies }: { geographies: any[] }) =>
                        geographies?.map((geo: any) => {
                          const geoId = geo?.properties?.name || geo?.id || '';
                          if (!geoId) return null;
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={mapType === "choropleth" ? getCountryColor(geoId) : defaultFill}
                              stroke={strokeColor}
                              strokeWidth={strokeWidth}
                              style={{
                                default: { outline: "none" },
                                hover: { outline: "none", fill: mapType === "choropleth" ? getCountryColor(geoId) : "#a5b4fc" },
                                pressed: { outline: "none" },
                              }}
                            />
                          );
                        })
                      }
                    </Geographies>

                    {/* Bubble markers */}
                    {mapType === "bubble" &&
                      data.filter((d) => d.coordinates).map((d) => (
                        <Marker key={d.id} coordinates={d.coordinates!}>
                          <circle r={bubbleScale(d.value)} fill={colorScale(d.value)} fillOpacity={0.7} stroke={strokeColor} strokeWidth={1} />
                          {showLabels && (
                            <text textAnchor="middle" y={-bubbleScale(d.value) - 5} className="text-[10px] fill-gray-700 font-medium">{d.name}</text>
                          )}
                        </Marker>
                      ))}

                    {/* Point markers with icons */}
                    {mapType === "marker" &&
                      data.filter((d) => d.coordinates).map((d) => (
                        <Marker key={d.id} coordinates={d.coordinates!}>
                          {renderMarkerIcon(d.icon || markerIcon, markerSize, d.color || markerColor)}
                          {showLabels && (
                            <text textAnchor="middle" y={-markerSize - 4} className="text-[10px] fill-gray-700 font-medium">{d.name}</text>
                          )}
                        </Marker>
                      ))}

                    {/* Heat map circles */}
                    {mapType === "heatmap" &&
                      data.filter((d) => d.coordinates).map((d) => (
                        <Marker key={d.id} coordinates={d.coordinates!}>
                          <circle r={bubbleScale(d.value) * 1.5} fill={colorScale(d.value)} fillOpacity={0.4} style={{ filter: "blur(8px)" }} />
                          <circle r={bubbleScale(d.value)} fill={colorScale(d.value)} fillOpacity={0.6} />
                        </Marker>
                      ))}

                    {/* Flow lines with arrows */}
                    {mapType === "flow" &&
                      flows.map((f) => {
                        if (f.from[0] === 0 && f.from[1] === 0) return null;
                        if (f.to[0] === 0 && f.to[1] === 0) return null;
                        
                        const midX = (f.from[0] + f.to[0]) / 2;
                        const midY = (f.from[1] + f.to[1]) / 2;
                        const strokeW = Math.max(2, Math.min(f.value / 20, 8));
                        
                        return (
                          <g key={f.id}>
                            {/* Main flow line */}
                            <Line 
                              from={f.from} 
                              to={f.to} 
                              stroke={flowColor} 
                              strokeWidth={strokeW} 
                              strokeLinecap="round" 
                              strokeOpacity={0.7}
                            />
                            {/* Start point - small circle */}
                            <Marker coordinates={f.from}>
                              <circle r={5} fill={flowColor} stroke="#fff" strokeWidth={2} />
                            </Marker>
                            {/* End point - arrow triangle */}
                            <Marker coordinates={f.to}>
                              <g>
                                <circle r={8} fill={flowColor} stroke="#fff" strokeWidth={2} />
                                <text 
                                  textAnchor="middle" 
                                  dominantBaseline="central" 
                                  fill="#fff" 
                                  fontSize="10" 
                                  fontWeight="bold"
                                >
                                  ▶
                                </text>
                              </g>
                            </Marker>
                            {/* Label at midpoint */}
                            {showLabels && f.label && (
                              <Marker coordinates={[midX, midY]}>
                                <g>
                                  <rect 
                                    x={-40} 
                                    y={-10} 
                                    width={80} 
                                    height={16} 
                                    fill="white" 
                                    fillOpacity={0.9} 
                                    rx={3}
                                  />
                                  <text 
                                    textAnchor="middle" 
                                    dominantBaseline="central"
                                    className="text-[9px] fill-gray-700 font-medium"
                                  >
                                    {f.label}
                                  </text>
                                </g>
                              </Marker>
                            )}
                          </g>
                        );
                      })}
                  </ComposableMap>
                  {renderLegend()}
                </div>
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-base-100 rounded-2xl shadow-lg p-5 h-fit max-h-[85vh] overflow-y-auto">
            <div className="grid grid-cols-3 bg-base-200 rounded-lg p-1 mb-5">
              {(["data", "style", "presets"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 px-3 text-sm font-medium rounded-md capitalize transition-all ${activeTab === tab ? "bg-base-100 shadow-sm" : "hover:bg-base-100/50"}`}>
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "data" && (
              <div className="space-y-5">
                {/* Map Type */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Map Type</label>
                  <div className="grid grid-cols-5 gap-2">
                    {mapTypes.map((t) => (
                      <button key={t.id} onClick={() => setMapType(t.id)} className={`p-2 rounded-lg text-center transition-all ${mapType === t.id ? "bg-primary text-white ring-2 ring-primary ring-offset-2 ring-offset-base-100" : "bg-base-200 hover:bg-base-300 text-primary-content"}`}>
                        <div className="text-lg">{t.icon}</div>
                        <div className="text-[9px] font-semibold">{t.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Region */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Region</label>
                  <div className="grid grid-cols-4 gap-2">
                    {regionOptions.map((r) => (
                      <button key={r.id} onClick={() => setRegion(r.id)} className={`py-2 px-1 rounded-lg text-[10px] font-medium transition-all ${region === r.id ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}>
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Region Controls */}
                {region === "custom" && (
                  <div className="p-3 bg-base-200 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-primary-content/70 block mb-1">Center Lng</label>
                        <input type="number" value={customCenter[0]} onChange={(e) => setCustomCenter([parseFloat(e.target.value) || 0, customCenter[1]])} className="input input-xs input-bordered w-full" />
                      </div>
                      <div>
                        <label className="text-[10px] text-primary-content/70 block mb-1">Center Lat</label>
                        <input type="number" value={customCenter[1]} onChange={(e) => setCustomCenter([customCenter[0], parseFloat(e.target.value) || 0])} className="input input-xs input-bordered w-full" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-primary-content/70 block mb-1">Scale: {customScale}</label>
                      <input type="range" min="50" max="2000" value={customScale} onChange={(e) => setCustomScale(parseInt(e.target.value))} className="range range-primary range-xs" />
                    </div>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Map Title</label>
                  <DebouncedInput value={title} onChange={setTitle} className="input input-bordered w-full input-sm" placeholder="Enter title" />
                </div>

                {/* Zoom */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Zoom: {zoom.toFixed(1)}x</label>
                  <input type="range" min="0.5" max="4" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="range range-primary range-sm" />
                </div>

                {/* Import Data */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Import Data</label>
                  <div className="flex gap-2">
                    <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFileUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="btn btn-sm btn-outline flex-1 gap-1"><BsUpload /> CSV</button>
                    <button onClick={() => toast("Paste from Excel (Ctrl+V)", { icon: "📋" })} className="btn btn-sm btn-outline flex-1 gap-1"><BsTable /> Paste</button>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-2 space-y-1">
                    <p><strong>Points:</strong> name, value, lng, lat</p>
                    <p><strong>Flow:</strong> from, to, value</p>
                    <p className="text-gray-400">Example: Delhi, Mumbai, 100</p>
                  </div>
                </div>

                {/* Data Points */}
                {mapType !== "flow" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-primary-content/70">Data Points ({data.length})</label>
                      <button onClick={addDataPoint} className="btn btn-xs btn-ghost gap-1"><BsPlus /> Add</button>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {data.map((d, i) => (
                        <DataPointRow
                          key={d.id}
                          point={d}
                          index={i}
                          mapType={mapType}
                          markerIcon={markerIcon}
                          onUpdate={updateDataPoint}
                          onRemove={removeDataPoint}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Flow Data */}
                {mapType === "flow" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-primary-content/70">Flow Routes ({flows.length})</label>
                      <button onClick={addFlow} className="btn btn-xs btn-ghost gap-1"><BsPlus /> Add</button>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {flows.map((f, i) => (
                        <FlowRow
                          key={f.id}
                          flow={f}
                          index={i}
                          onUpdate={updateFlow}
                          onRemove={removeFlow}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "style" && (
              <div className="space-y-5">
                {/* Color Scheme */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Color Scheme</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.keys(colorSchemes) as (keyof typeof colorSchemes)[]).map((scheme) => (
                      <button key={scheme} onClick={() => setColorScheme(scheme)} className={`p-2 rounded-lg transition-all ${colorScheme === scheme ? "ring-2 ring-primary ring-offset-2" : ""}`}>
                        <div className="flex h-3 rounded overflow-hidden">
                          {colorSchemes[scheme].slice(0, 4).map((c, i) => (
                            <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        <div className="text-[9px] font-medium mt-1 capitalize">{scheme}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Marker Icon (for marker type) */}
                {mapType === "marker" && (
                  <div>
                    <label className="text-sm font-medium text-primary-content/70 block mb-2">Default Marker Icon</label>
                    <div className="grid grid-cols-7 gap-2">
                      {markerIcons.map((ic) => (
                        <button key={ic.id} onClick={() => setMarkerIcon(ic.id)} className={`p-2 rounded-lg text-center transition-all ${markerIcon === ic.id ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}>
                          <div className="text-lg">{ic.icon}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Marker Size */}
                {mapType === "marker" && (
                  <div>
                    <label className="text-sm font-medium text-primary-content/70 block mb-2">Marker Size: {markerSize}px</label>
                    <input type="range" min="4" max="20" value={markerSize} onChange={(e) => setMarkerSize(parseInt(e.target.value))} className="range range-primary range-sm" />
                  </div>
                )}

                {/* Background */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Background</label>
                  <BackgroundPicker background={background} onBackgroundChange={setBackground} showTilt={false} />
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-primary-content/70 block mb-1">Default Fill</label>
                    <input type="color" value={defaultFill} onChange={(e) => setDefaultFill(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-xs text-primary-content/70 block mb-1">Stroke</label>
                    <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                  </div>
                  {mapType === "marker" && (
                    <div>
                      <label className="text-xs text-primary-content/70 block mb-1">Marker</label>
                      <input type="color" value={markerColor} onChange={(e) => setMarkerColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                    </div>
                  )}
                  {mapType === "flow" && (
                    <div>
                      <label className="text-xs text-primary-content/70 block mb-1">Flow</label>
                      <input type="color" value={flowColor} onChange={(e) => setFlowColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                    </div>
                  )}
                </div>

                {/* Stroke Width */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Stroke Width: {strokeWidth}</label>
                  <input type="range" min="0" max="2" step="0.1" value={strokeWidth} onChange={(e) => setStrokeWidth(parseFloat(e.target.value))} className="range range-primary range-sm" />
                </div>

                {/* Padding & Border Radius */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-primary-content/70 block mb-1">Padding: {padding}px</label>
                    <input type="range" min="0" max="80" value={padding} onChange={(e) => setPadding(parseInt(e.target.value))} className="range range-primary range-xs" />
                  </div>
                  <div>
                    <label className="text-xs text-primary-content/70 block mb-1">Radius: {borderRadius}px</label>
                    <input type="range" min="0" max="40" value={borderRadius} onChange={(e) => setBorderRadius(parseInt(e.target.value))} className="range range-primary range-xs" />
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} className="checkbox checkbox-primary checkbox-sm" />
                    <span className="text-sm">Labels</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showLegend} onChange={(e) => setShowLegend(e.target.checked)} className="checkbox checkbox-primary checkbox-sm" />
                    <span className="text-sm">Legend</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === "presets" && (
              <div className="space-y-5">
                {/* Save Custom Preset */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Save Current as Preset</label>
                  <div className="flex gap-2">
                    <input type="text" value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} className="input input-bordered input-sm flex-1" placeholder="Preset name" />
                    <button onClick={saveAsPreset} className="btn btn-sm btn-primary gap-1"><BsBookmark /> Save</button>
                  </div>
                </div>

                {/* Custom Presets */}
                {customPresets.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-primary-content/70 block mb-2">Your Presets</label>
                    <div className="grid grid-cols-2 gap-2">
                      {customPresets.map((p) => (
                        <div key={p.id} className="relative group">
                          <button onClick={() => loadPreset(p)} className="w-full p-3 bg-base-200 rounded-lg text-left hover:bg-base-300 transition-all">
                            <div className="flex items-center gap-2">
                              <BsBookmarkFill className="text-primary" />
                              <span className="text-sm font-medium truncate">{p.name}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">{p.mapType} • {p.region}</div>
                          </button>
                          <button onClick={() => deleteCustomPreset(p.id)} className="absolute top-1 right-1 btn btn-xs btn-ghost text-error opacity-0 group-hover:opacity-100"><BsTrash /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Default Presets */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Templates</label>
                  <div className="grid grid-cols-2 gap-2">
                    {defaultPresets.map((p) => (
                      <button key={p.id} onClick={() => loadPreset(p)} className="p-3 bg-base-200 rounded-lg text-left hover:bg-base-300 transition-all">
                        <div className="flex items-center gap-2">
                          <BsGlobe className="text-gray-500" />
                          <span className="text-sm font-medium truncate">{p.name}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">{p.mapType} • {p.region}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default MapMakerLayout;
