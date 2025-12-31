import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import Navigation from "../common/Navigation";
import BackgroundPicker, { BackgroundConfig } from "../common/BackgroundPicker";
import {
  BsClipboard,
  BsPlus,
  BsTrash,
  BsBookmark,
  BsBookmarkFill,
  BsGlobe,
  BsUpload,
  BsTable,
  BsPlay,
  BsPause,
  BsArrowClockwise,
  BsArrowCounterclockwise,
  BsCode,
  BsSearch,
} from "react-icons/bs";
import { TfiExport } from "react-icons/tfi";
import { BiReset } from "react-icons/bi";
import { getLocationCoordinates } from "@/data/mapData";
import { Country, State, City } from "country-state-city";

type GlobeStyle = "default" | "night" | "day" | "topology" | "water";
type PointStyle = "sphere" | "bar" | "ring" | "label" | "pulse";
type ArcStyle = "line" | "dash" | "glow";
type RotateDirection = "left" | "right" | "up" | "down";

interface GlobePoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  value: number;
  color?: string;
}

interface GlobeArc {
  id: string;
  fromName: string;
  toName: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  color?: string;
}

interface GlobePreset {
  id: string;
  name: string;
  points: GlobePoint[];
  arcs: GlobeArc[];
  focusLat?: number;
  focusLng?: number;
  isCustom?: boolean;
  // Style settings
  globeStyle?: GlobeStyle;
  pointStyle?: PointStyle;
  arcStyle?: ArcStyle;
  pointColor?: string;
  arcColor?: string;
  pointSize?: number;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereIntensity?: number;
}

// Get all countries with coordinates
const allCountries = Country.getAllCountries();

const globeStyles: { id: GlobeStyle; name: string; url: string }[] = [
  { id: "default", name: "Default", url: "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg" },
  { id: "night", name: "Night", url: "//unpkg.com/three-globe/example/img/earth-night.jpg" },
  { id: "day", name: "Day", url: "//unpkg.com/three-globe/example/img/earth-day.jpg" },
  { id: "topology", name: "Topology", url: "//unpkg.com/three-globe/example/img/earth-topology.png" },
  { id: "water", name: "Water", url: "//unpkg.com/three-globe/example/img/earth-water.png" },
];

const defaultPresets: GlobePreset[] = [
  {
    id: "world-cities",
    name: "World Cities",
    points: [
      { id: "1", name: "New York", lat: 40.7128, lng: -74.006, value: 100 },
      { id: "2", name: "London", lat: 51.5074, lng: -0.1276, value: 90 },
      { id: "3", name: "Tokyo", lat: 35.6895, lng: 139.6917, value: 95 },
      { id: "4", name: "Sydney", lat: -33.8688, lng: 151.2093, value: 70 },
      { id: "5", name: "Dubai", lat: 25.2048, lng: 55.2708, value: 80 },
      { id: "6", name: "Singapore", lat: 1.3521, lng: 103.8198, value: 85 },
      { id: "7", name: "Hong Kong", lat: 22.3193, lng: 114.1694, value: 75 },
      { id: "8", name: "Paris", lat: 48.8566, lng: 2.3522, value: 80 },
      { id: "9", name: "Toronto", lat: 43.6532, lng: -79.3832, value: 70 },
      { id: "10", name: "São Paulo", lat: -23.5505, lng: -46.6333, value: 75 },
    ],
    arcs: [],
    globeStyle: "default",
    pointStyle: "pulse",
    pointColor: "#00ff88",
    pointSize: 2,
    showAtmosphere: true,
    atmosphereColor: "#4488ff",
  },
  {
    id: "night-lights",
    name: "Night Lights",
    points: [
      { id: "1", name: "New York", lat: 40.7128, lng: -74.006, value: 100 },
      { id: "2", name: "Los Angeles", lat: 34.0522, lng: -118.2437, value: 90 },
      { id: "3", name: "London", lat: 51.5074, lng: -0.1276, value: 95 },
      { id: "4", name: "Tokyo", lat: 35.6895, lng: 139.6917, value: 100 },
      { id: "5", name: "Shanghai", lat: 31.2304, lng: 121.4737, value: 90 },
      { id: "6", name: "Mumbai", lat: 19.076, lng: 72.8777, value: 85 },
      { id: "7", name: "São Paulo", lat: -23.5505, lng: -46.6333, value: 80 },
      { id: "8", name: "Cairo", lat: 30.0444, lng: 31.2357, value: 70 },
      { id: "9", name: "Seoul", lat: 37.5665, lng: 126.978, value: 85 },
      { id: "10", name: "Mexico City", lat: 19.4326, lng: -99.1332, value: 75 },
    ],
    arcs: [],
    globeStyle: "night",
    pointStyle: "ring",
    pointColor: "#ffcc00",
    pointSize: 2.5,
    showAtmosphere: true,
    atmosphereColor: "#ff6600",
  },
  {
    id: "flight-routes",
    name: "Global Flights",
    points: [
      { id: "1", name: "New York", lat: 40.7128, lng: -74.006, value: 50 },
      { id: "2", name: "London", lat: 51.5074, lng: -0.1276, value: 50 },
      { id: "3", name: "Dubai", lat: 25.2048, lng: 55.2708, value: 50 },
      { id: "4", name: "Singapore", lat: 1.3521, lng: 103.8198, value: 50 },
      { id: "5", name: "Tokyo", lat: 35.6895, lng: 139.6917, value: 50 },
      { id: "6", name: "San Francisco", lat: 37.7749, lng: -122.4194, value: 50 },
    ],
    arcs: [
      { id: "a1", fromName: "New York", toName: "London", fromLat: 40.7128, fromLng: -74.006, toLat: 51.5074, toLng: -0.1276 },
      { id: "a2", fromName: "London", toName: "Dubai", fromLat: 51.5074, fromLng: -0.1276, toLat: 25.2048, toLng: 55.2708 },
      { id: "a3", fromName: "Dubai", toName: "Singapore", fromLat: 25.2048, fromLng: 55.2708, toLat: 1.3521, toLng: 103.8198 },
      { id: "a4", fromName: "Singapore", toName: "Tokyo", fromLat: 1.3521, fromLng: 103.8198, toLat: 35.6895, toLng: 139.6917 },
      { id: "a5", fromName: "Tokyo", toName: "San Francisco", fromLat: 35.6895, fromLng: 139.6917, toLat: 37.7749, toLng: -122.4194 },
      { id: "a6", fromName: "San Francisco", toName: "New York", fromLat: 37.7749, fromLng: -122.4194, toLat: 40.7128, toLng: -74.006 },
    ],
    globeStyle: "day",
    arcStyle: "dash",
    arcColor: "#00ccff",
    pointStyle: "sphere",
    pointColor: "#ff4444",
    showAtmosphere: true,
  },
  {
    id: "data-centers",
    name: "Data Centers",
    points: [
      { id: "1", name: "Ashburn", lat: 39.0438, lng: -77.4874, value: 100 },
      { id: "2", name: "Frankfurt", lat: 50.1109, lng: 8.6821, value: 90 },
      { id: "3", name: "Singapore", lat: 1.3521, lng: 103.8198, value: 85 },
      { id: "4", name: "Tokyo", lat: 35.6895, lng: 139.6917, value: 80 },
      { id: "5", name: "Sydney", lat: -33.8688, lng: 151.2093, value: 70 },
      { id: "6", name: "São Paulo", lat: -23.5505, lng: -46.6333, value: 65 },
      { id: "7", name: "Mumbai", lat: 19.076, lng: 72.8777, value: 75 },
      { id: "8", name: "Dublin", lat: 53.3498, lng: -6.2603, value: 80 },
    ],
    arcs: [
      { id: "a1", fromName: "Ashburn", toName: "Frankfurt", fromLat: 39.0438, fromLng: -77.4874, toLat: 50.1109, toLng: 8.6821 },
      { id: "a2", fromName: "Frankfurt", toName: "Singapore", fromLat: 50.1109, fromLng: 8.6821, toLat: 1.3521, toLng: 103.8198 },
      { id: "a3", fromName: "Singapore", toName: "Tokyo", fromLat: 1.3521, fromLng: 103.8198, toLat: 35.6895, toLng: 139.6917 },
      { id: "a4", fromName: "Ashburn", toName: "São Paulo", fromLat: 39.0438, fromLng: -77.4874, toLat: -23.5505, toLng: -46.6333 },
    ],
    globeStyle: "topology",
    pointStyle: "bar",
    pointColor: "#00ff00",
    arcStyle: "glow",
    arcColor: "#00ff00",
    showAtmosphere: false,
  },
  {
    id: "india-cities",
    name: "India",
    focusLat: 20.5937,
    focusLng: 78.9629,
    points: [
      { id: "1", name: "Mumbai", lat: 19.076, lng: 72.8777, value: 100 },
      { id: "2", name: "Delhi", lat: 28.6139, lng: 77.209, value: 95 },
      { id: "3", name: "Bangalore", lat: 12.9716, lng: 77.5946, value: 85 },
      { id: "4", name: "Chennai", lat: 13.0827, lng: 80.2707, value: 75 },
      { id: "5", name: "Kolkata", lat: 22.5726, lng: 88.3639, value: 70 },
      { id: "6", name: "Hyderabad", lat: 17.385, lng: 78.4867, value: 65 },
      { id: "7", name: "Pune", lat: 18.5204, lng: 73.8567, value: 60 },
      { id: "8", name: "Ahmedabad", lat: 23.0225, lng: 72.5714, value: 55 },
    ],
    arcs: [],
    globeStyle: "default",
    pointStyle: "label",
    pointColor: "#ff9933",
    pointSize: 2,
    showAtmosphere: true,
  },
  {
    id: "usa-cities",
    name: "USA",
    focusLat: 39.8283,
    focusLng: -98.5795,
    points: [
      { id: "1", name: "New York", lat: 40.7128, lng: -74.006, value: 100 },
      { id: "2", name: "Los Angeles", lat: 34.0522, lng: -118.2437, value: 90 },
      { id: "3", name: "Chicago", lat: 41.8781, lng: -87.6298, value: 80 },
      { id: "4", name: "Houston", lat: 29.7604, lng: -95.3698, value: 75 },
      { id: "5", name: "Miami", lat: 25.7617, lng: -80.1918, value: 70 },
      { id: "6", name: "San Francisco", lat: 37.7749, lng: -122.4194, value: 85 },
      { id: "7", name: "Seattle", lat: 47.6062, lng: -122.3321, value: 65 },
      { id: "8", name: "Boston", lat: 42.3601, lng: -71.0589, value: 60 },
    ],
    arcs: [],
    globeStyle: "day",
    pointStyle: "sphere",
    pointColor: "#3b82f6",
    showAtmosphere: true,
  },
  {
    id: "europe-cities",
    name: "Europe",
    focusLat: 50.0,
    focusLng: 10.0,
    points: [
      { id: "1", name: "London", lat: 51.5074, lng: -0.1276, value: 100 },
      { id: "2", name: "Paris", lat: 48.8566, lng: 2.3522, value: 95 },
      { id: "3", name: "Berlin", lat: 52.52, lng: 13.405, value: 85 },
      { id: "4", name: "Madrid", lat: 40.4168, lng: -3.7038, value: 80 },
      { id: "5", name: "Rome", lat: 41.9028, lng: 12.4964, value: 75 },
      { id: "6", name: "Amsterdam", lat: 52.3676, lng: 4.9041, value: 70 },
      { id: "7", name: "Vienna", lat: 48.2082, lng: 16.3738, value: 65 },
      { id: "8", name: "Prague", lat: 50.0755, lng: 14.4378, value: 60 },
    ],
    arcs: [],
    globeStyle: "default",
    pointStyle: "pulse",
    pointColor: "#ffd700",
    showAtmosphere: true,
  },
  {
    id: "asia-tech",
    name: "Asia Tech Hubs",
    focusLat: 25.0,
    focusLng: 100.0,
    points: [
      { id: "1", name: "Tokyo", lat: 35.6895, lng: 139.6917, value: 100 },
      { id: "2", name: "Singapore", lat: 1.3521, lng: 103.8198, value: 95 },
      { id: "3", name: "Seoul", lat: 37.5665, lng: 126.978, value: 90 },
      { id: "4", name: "Shanghai", lat: 31.2304, lng: 121.4737, value: 85 },
      { id: "5", name: "Bangalore", lat: 12.9716, lng: 77.5946, value: 80 },
      { id: "6", name: "Shenzhen", lat: 22.5431, lng: 114.0579, value: 75 },
      { id: "7", name: "Taipei", lat: 25.033, lng: 121.5654, value: 70 },
      { id: "8", name: "Ho Chi Minh", lat: 10.8231, lng: 106.6297, value: 65 },
    ],
    arcs: [],
    globeStyle: "night",
    pointStyle: "ring",
    pointColor: "#00ffcc",
    showAtmosphere: true,
    atmosphereColor: "#0066ff",
  },
  {
    id: "trade-routes",
    name: "Trade Routes",
    points: [
      { id: "1", name: "Shanghai", lat: 31.2304, lng: 121.4737, value: 50 },
      { id: "2", name: "Rotterdam", lat: 51.9244, lng: 4.4777, value: 50 },
      { id: "3", name: "Singapore", lat: 1.3521, lng: 103.8198, value: 50 },
      { id: "4", name: "Los Angeles", lat: 34.0522, lng: -118.2437, value: 50 },
      { id: "5", name: "New York", lat: 40.7128, lng: -74.006, value: 50 },
      { id: "6", name: "Dubai", lat: 25.2048, lng: 55.2708, value: 50 },
    ],
    arcs: [
      { id: "a1", fromName: "Shanghai", toName: "Los Angeles", fromLat: 31.2304, fromLng: 121.4737, toLat: 34.0522, toLng: -118.2437 },
      { id: "a2", fromName: "Rotterdam", toName: "New York", fromLat: 51.9244, fromLng: 4.4777, toLat: 40.7128, toLng: -74.006 },
      { id: "a3", fromName: "Singapore", toName: "Dubai", fromLat: 1.3521, fromLng: 103.8198, toLat: 25.2048, toLng: 55.2708 },
      { id: "a4", fromName: "Shanghai", toName: "Rotterdam", fromLat: 31.2304, fromLng: 121.4737, toLat: 51.9244, toLng: 4.4777 },
      { id: "a5", fromName: "Dubai", toName: "Rotterdam", fromLat: 25.2048, fromLng: 55.2708, toLat: 51.9244, toLng: 4.4777 },
    ],
    globeStyle: "water",
    arcStyle: "glow",
    arcColor: "#ff6600",
    pointStyle: "sphere",
    pointColor: "#ffffff",
    showAtmosphere: true,
  },
  {
    id: "population-centers",
    name: "Population Centers",
    points: [
      { id: "1", name: "Tokyo", lat: 35.6895, lng: 139.6917, value: 100 },
      { id: "2", name: "Delhi", lat: 28.6139, lng: 77.209, value: 95 },
      { id: "3", name: "Shanghai", lat: 31.2304, lng: 121.4737, value: 90 },
      { id: "4", name: "São Paulo", lat: -23.5505, lng: -46.6333, value: 85 },
      { id: "5", name: "Mexico City", lat: 19.4326, lng: -99.1332, value: 80 },
      { id: "6", name: "Cairo", lat: 30.0444, lng: 31.2357, value: 75 },
      { id: "7", name: "Mumbai", lat: 19.076, lng: 72.8777, value: 85 },
      { id: "8", name: "Beijing", lat: 39.9042, lng: 116.4074, value: 80 },
      { id: "9", name: "Dhaka", lat: 23.8103, lng: 90.4125, value: 75 },
      { id: "10", name: "Osaka", lat: 34.6937, lng: 135.5023, value: 70 },
    ],
    arcs: [],
    globeStyle: "default",
    pointStyle: "bar",
    pointColor: "#ff4444",
    pointSize: 3,
    showAtmosphere: true,
  },
  {
    id: "submarine-cables",
    name: "Submarine Cables",
    points: [],
    arcs: [
      { id: "a1", fromName: "New York", toName: "London", fromLat: 40.7128, fromLng: -74.006, toLat: 51.5074, toLng: -0.1276 },
      { id: "a2", fromName: "Los Angeles", toName: "Tokyo", fromLat: 34.0522, fromLng: -118.2437, toLat: 35.6895, toLng: 139.6917 },
      { id: "a3", fromName: "Singapore", toName: "Sydney", fromLat: 1.3521, fromLng: 103.8198, toLat: -33.8688, toLng: 151.2093 },
      { id: "a4", fromName: "Mumbai", toName: "Singapore", fromLat: 19.076, fromLng: 72.8777, toLat: 1.3521, toLng: 103.8198 },
      { id: "a5", fromName: "London", toName: "Mumbai", fromLat: 51.5074, fromLng: -0.1276, toLat: 19.076, toLng: 72.8777 },
      { id: "a6", fromName: "Miami", toName: "São Paulo", fromLat: 25.7617, fromLng: -80.1918, toLat: -23.5505, toLng: -46.6333 },
    ],
    globeStyle: "night",
    arcStyle: "glow",
    arcColor: "#00ff88",
    showAtmosphere: true,
    atmosphereColor: "#003366",
  },
  // NEW PRESETS BELOW
  {
    id: "space-stations",
    name: "Space Agencies",
    points: [
      { id: "1", name: "Kennedy Space Center", lat: 28.5729, lng: -80.6490, value: 100 },
      { id: "2", name: "Baikonur Cosmodrome", lat: 45.9650, lng: 63.3050, value: 95 },
      { id: "3", name: "Guiana Space Centre", lat: 5.2390, lng: -52.7680, value: 85 },
      { id: "4", name: "Tanegashima", lat: 30.3911, lng: 130.9678, value: 80 },
      { id: "5", name: "Vandenberg SFB", lat: 34.7420, lng: -120.5724, value: 75 },
      { id: "6", name: "Satish Dhawan", lat: 13.7199, lng: 80.2304, value: 70 },
      { id: "7", name: "Jiuquan", lat: 40.9583, lng: 100.2917, value: 85 },
      { id: "8", name: "Plesetsk", lat: 62.9256, lng: 40.5772, value: 70 },
    ],
    arcs: [],
    globeStyle: "night",
    pointStyle: "pulse",
    pointColor: "#00ccff",
    pointSize: 2.5,
    showAtmosphere: true,
    atmosphereColor: "#6600ff",
  },
  {
    id: "financial-hubs",
    name: "Financial Centers",
    points: [
      { id: "1", name: "New York", lat: 40.7128, lng: -74.006, value: 100 },
      { id: "2", name: "London", lat: 51.5074, lng: -0.1276, value: 100 },
      { id: "3", name: "Hong Kong", lat: 22.3193, lng: 114.1694, value: 95 },
      { id: "4", name: "Singapore", lat: 1.3521, lng: 103.8198, value: 90 },
      { id: "5", name: "Tokyo", lat: 35.6895, lng: 139.6917, value: 90 },
      { id: "6", name: "Shanghai", lat: 31.2304, lng: 121.4737, value: 85 },
      { id: "7", name: "Zurich", lat: 47.3769, lng: 8.5417, value: 80 },
      { id: "8", name: "Frankfurt", lat: 50.1109, lng: 8.6821, value: 75 },
    ],
    arcs: [
      { id: "a1", fromName: "New York", toName: "London", fromLat: 40.7128, fromLng: -74.006, toLat: 51.5074, toLng: -0.1276 },
      { id: "a2", fromName: "London", toName: "Hong Kong", fromLat: 51.5074, fromLng: -0.1276, toLat: 22.3193, toLng: 114.1694 },
      { id: "a3", fromName: "Hong Kong", toName: "Singapore", fromLat: 22.3193, fromLng: 114.1694, toLat: 1.3521, toLng: 103.8198 },
      { id: "a4", fromName: "Singapore", toName: "Tokyo", fromLat: 1.3521, fromLng: 103.8198, toLat: 35.6895, toLng: 139.6917 },
    ],
    globeStyle: "topology",
    arcStyle: "dash",
    arcColor: "#ffd700",
    pointStyle: "bar",
    pointColor: "#ffd700",
    showAtmosphere: true,
  },
  {
    id: "renewable-energy",
    name: "Renewable Energy",
    points: [
      { id: "1", name: "Hornsea Wind Farm", lat: 53.9011, lng: 1.8011, value: 100 },
      { id: "2", name: "Bhadla Solar Park", lat: 27.5300, lng: 71.8900, value: 95 },
      { id: "3", name: "Gansu Wind Farm", lat: 39.7500, lng: 96.5000, value: 90 },
      { id: "4", name: "Noor Complex", lat: 31.0522, lng: -6.8339, value: 80 },
      { id: "5", name: "Alta Wind", lat: 34.6089, lng: -118.2783, value: 75 },
      { id: "6", name: "Tengger Desert Solar", lat: 37.5500, lng: 105.0200, value: 85 },
      { id: "7", name: "Longyangxia Dam", lat: 36.0100, lng: 100.7500, value: 80 },
      { id: "8", name: "Pavagada Solar", lat: 14.0900, lng: 77.2800, value: 75 },
    ],
    arcs: [],
    globeStyle: "day",
    pointStyle: "sphere",
    pointColor: "#00ff00",
    pointSize: 2.5,
    showAtmosphere: true,
    atmosphereColor: "#44ff44",
  },
  {
    id: "unesco-sites",
    name: "UNESCO Heritage",
    points: [
      { id: "1", name: "Taj Mahal", lat: 27.1751, lng: 78.0421, value: 100 },
      { id: "2", name: "Machu Picchu", lat: -13.1631, lng: -72.5450, value: 95 },
      { id: "3", name: "Great Wall", lat: 40.4319, lng: 116.5704, value: 100 },
      { id: "4", name: "Petra", lat: 30.3285, lng: 35.4444, value: 90 },
      { id: "5", name: "Colosseum", lat: 41.8902, lng: 12.4922, value: 95 },
      { id: "6", name: "Angkor Wat", lat: 13.4125, lng: 103.8670, value: 90 },
      { id: "7", name: "Pyramids", lat: 29.9792, lng: 31.1342, value: 100 },
      { id: "8", name: "Stonehenge", lat: 51.1789, lng: -1.8262, value: 80 },
    ],
    arcs: [],
    globeStyle: "default",
    pointStyle: "label",
    pointColor: "#ff6b35",
    pointSize: 2,
    showAtmosphere: true,
  },
  {
    id: "volcano-activity",
    name: "Active Volcanoes",
    points: [
      { id: "1", name: "Kilauea", lat: 19.4069, lng: -155.2834, value: 100 },
      { id: "2", name: "Mount Etna", lat: 37.7510, lng: 14.9934, value: 95 },
      { id: "3", name: "Sakurajima", lat: 31.5858, lng: 130.6575, value: 90 },
      { id: "4", name: "Popocatépetl", lat: 19.0232, lng: -98.6278, value: 85 },
      { id: "5", name: "Merapi", lat: -7.5407, lng: 110.4457, value: 90 },
      { id: "6", name: "Krakatoa", lat: -6.1021, lng: 105.4230, value: 80 },
      { id: "7", name: "Mount Fuji", lat: 35.3606, lng: 138.7274, value: 75 },
      { id: "8", name: "Eyjafjallajökull", lat: 63.6314, lng: -19.6083, value: 70 },
    ],
    arcs: [],
    globeStyle: "topology",
    pointStyle: "pulse",
    pointColor: "#ff3300",
    pointSize: 2.5,
    showAtmosphere: true,
    atmosphereColor: "#ff6600",
  },
  {
    id: "arctic-antarctic",
    name: "Polar Research",
    points: [
      { id: "1", name: "McMurdo Station", lat: -77.8467, lng: 166.6792, value: 100 },
      { id: "2", name: "Amundsen-Scott", lat: -90.0000, lng: 0.0000, value: 95 },
      { id: "3", name: "Ny-Ålesund", lat: 78.9250, lng: 11.9300, value: 85 },
      { id: "4", name: "Alert", lat: 82.5018, lng: -62.3481, value: 80 },
      { id: "5", name: "Rothera", lat: -67.5678, lng: -68.1275, value: 75 },
      { id: "6", name: "Vostok Station", lat: -78.4647, lng: 106.8378, value: 90 },
      { id: "7", name: "Barrow", lat: 71.2906, lng: -156.7886, value: 70 },
      { id: "8", name: "Concordia", lat: -75.1000, lng: 123.3833, value: 85 },
    ],
    arcs: [],
    globeStyle: "water",
    pointStyle: "ring",
    pointColor: "#00ffff",
    pointSize: 2,
    showAtmosphere: true,
    atmosphereColor: "#66ccff",
  },
  {
    id: "coffee-production",
    name: "Coffee Origins",
    focusLat: -10.0,
    focusLng: -50.0,
    points: [
      { id: "1", name: "São Paulo", lat: -23.5505, lng: -46.6333, value: 100 },
      { id: "2", name: "Hanoi", lat: 21.0285, lng: 105.8542, value: 90 },
      { id: "3", name: "Bogotá", lat: 4.7110, lng: -74.0721, value: 85 },
      { id: "4", name: "Addis Ababa", lat: 9.0320, lng: 38.7469, value: 80 },
      { id: "5", name: "Guatemala City", lat: 14.6349, lng: -90.5069, value: 75 },
      { id: "6", name: "Kampala", lat: 0.3476, lng: 32.5825, value: 70 },
      { id: "7", name: "Jakarta", lat: -6.2088, lng: 106.8456, value: 85 },
      { id: "8", name: "San José", lat: 9.9281, lng: -84.0907, value: 65 },
    ],
    arcs: [],
    globeStyle: "topology",
    pointStyle: "sphere",
    pointColor: "#8B4513",
    pointSize: 2,
    showAtmosphere: true,
  },
  {
    id: "earthquake-zones",
    name: "Seismic Activity",
    points: [
      { id: "1", name: "Tokyo", lat: 35.6895, lng: 139.6917, value: 100 },
      { id: "2", name: "San Francisco", lat: 37.7749, lng: -122.4194, value: 95 },
      { id: "3", name: "Santiago", lat: -33.4489, lng: -70.6693, value: 90 },
      { id: "4", name: "Jakarta", lat: -6.2088, lng: 106.8456, value: 85 },
      { id: "5", name: "Istanbul", lat: 41.0082, lng: 28.9784, value: 80 },
      { id: "6", name: "Manila", lat: 14.5995, lng: 120.9842, value: 85 },
      { id: "7", name: "Wellington", lat: -41.2865, lng: 174.7762, value: 75 },
      { id: "8", name: "Kathmandu", lat: 27.7172, lng: 85.3240, value: 90 },
    ],
    arcs: [],
    globeStyle: "default",
    pointStyle: "pulse",
    pointColor: "#ff0000",
    pointSize: 3,
    showAtmosphere: true,
    atmosphereColor: "#ff4400",
  },
  {
    id: "shipping-ports",
    name: "Major Ports",
    points: [
      { id: "1", name: "Shanghai", lat: 31.2304, lng: 121.4737, value: 100 },
      { id: "2", name: "Singapore", lat: 1.3521, lng: 103.8198, value: 95 },
      { id: "3", name: "Rotterdam", lat: 51.9244, lng: 4.4777, value: 85 },
      { id: "4", name: "Busan", lat: 35.1796, lng: 129.0756, value: 80 },
      { id: "5", name: "Los Angeles", lat: 33.7701, lng: -118.1937, value: 75 },
      { id: "6", name: "Hamburg", lat: 53.5511, lng: 9.9937, value: 70 },
      { id: "7", name: "Jebel Ali", lat: 25.0113, lng: 55.0547, value: 85 },
      { id: "8", name: "Hong Kong", lat: 22.3193, lng: 114.1694, value: 90 },
    ],
    arcs: [
      { id: "a1", fromName: "Shanghai", toName: "Singapore", fromLat: 31.2304, fromLng: 121.4737, toLat: 1.3521, toLng: 103.8198 },
      { id: "a2", fromName: "Singapore", toName: "Rotterdam", fromLat: 1.3521, fromLng: 103.8198, toLat: 51.9244, toLng: 4.4777 },
      { id: "a3", fromName: "Shanghai", toName: "Los Angeles", fromLat: 31.2304, fromLng: 121.4737, toLat: 33.7701, toLng: -118.1937 },
    ],
    globeStyle: "water",
    arcStyle: "glow",
    arcColor: "#0088ff",
    pointStyle: "bar",
    pointColor: "#0088ff",
    showAtmosphere: true,
  },
  {
    id: "ancient-civilizations",
    name: "Ancient Sites",
    points: [
      { id: "1", name: "Athens", lat: 37.9838, lng: 23.7275, value: 100 },
      { id: "2", name: "Rome", lat: 41.9028, lng: 12.4964, value: 100 },
      { id: "3", name: "Cairo", lat: 30.0444, lng: 31.2357, value: 100 },
      { id: "4", name: "Xi'an", lat: 34.3416, lng: 108.9398, value: 95 },
      { id: "5", name: "Cusco", lat: -13.5319, lng: -71.9675, value: 90 },
      { id: "6", name: "Baghdad", lat: 33.3152, lng: 44.3661, value: 85 },
      { id: "7", name: "Jerusalem", lat: 31.7683, lng: 35.2137, value: 95 },
      { id: "8", name: "Varanasi", lat: 25.3176, lng: 82.9739, value: 90 },
    ],
    arcs: [],
    globeStyle: "default",
    pointStyle: "label",
    pointColor: "#DAA520",
    pointSize: 2.5,
    showAtmosphere: true,
  },
  {
    id: "wildlife-hotspots",
    name: "Biodiversity Zones",
    points: [
      { id: "1", name: "Amazon Basin", lat: -3.4653, lng: -62.2159, value: 100 },
      { id: "2", name: "Congo Basin", lat: -0.7893, lng: 23.6561, value: 95 },
      { id: "3", name: "Coral Triangle", lat: -2.0, lng: 120.0, value: 90 },
      { id: "4", name: "Madagascar", lat: -18.7669, lng: 46.8691, value: 85 },
      { id: "5", name: "Borneo", lat: 0.9619, lng: 114.5548, value: 80 },
      { id: "6", name: "Galapagos", lat: -0.9538, lng: -90.9656, value: 95 },
      { id: "7", name: "Great Barrier Reef", lat: -18.2871, lng: 147.6992, value: 90 },
      { id: "8", name: "Serengeti", lat: -2.3333, lng: 34.8333, value: 85 },
    ],
    arcs: [],
    globeStyle: "day",
    pointStyle: "ring",
    pointColor: "#32CD32",
    pointSize: 3,
    showAtmosphere: true,
    atmosphereColor: "#228B22",
  },
  {
    id: "satellite-network",
    name: "Satellite Ground Stations",
    points: [
      { id: "1", name: "Svalbard", lat: 78.2232, lng: 15.6267, value: 90 },
      { id: "2", name: "Alice Springs", lat: -23.6980, lng: 133.8807, value: 85 },
      { id: "3", name: "Kiruna", lat: 67.8558, lng: 20.2253, value: 80 },
      { id: "4", name: "Hartebeesthoek", lat: -25.8867, lng: 27.6853, value: 75 },
      { id: "5", name: "Poker Flat", lat: 65.1294, lng: -147.4769, value: 70 },
      { id: "6", name: "Weilheim", lat: 47.8411, lng: 11.1428, value: 75 },
      { id: "7", name: "Santiago", lat: -33.1500, lng: -70.6667, value: 80 },
      { id: "8", name: "Trollsat", lat: -72.0114, lng: 2.5350, value: 85 },
    ],
    arcs: [
      { id: "a1", fromName: "Svalbard", toName: "Alice Springs", fromLat: 78.2232, fromLng: 15.6267, toLat: -23.6980, toLng: 133.8807 },
      { id: "a2", fromName: "Kiruna", toName: "Poker Flat", fromLat: 67.8558, fromLng: 20.2253, toLat: 65.1294, toLng: -147.4769 },
      { id: "a3", fromName: "Hartebeesthoek", toName: "Santiago", fromLat: -25.8867, fromLng: 27.6853, toLat: -33.1500, toLng: -70.6667 },
    ],
    globeStyle: "night",
    arcStyle: "dash",
    arcColor: "#00ffff",
    pointStyle: "sphere",
    pointColor: "#00ffff",
    showAtmosphere: true,
    atmosphereColor: "#003366",
  },
];

const STORAGE_KEY = "globe-maker-presets";

// Point row component
const PointRow: React.FC<{
  point: GlobePoint;
  index: number;
  onUpdate: (index: number, updates: Partial<GlobePoint>) => void;
  onRemove: (index: number) => void;
}> = ({ point, index, onUpdate, onRemove }) => {
  const [localName, setLocalName] = useState(point.name);
  const isTypingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isTypingRef.current) setLocalName(point.name);
  }, [point.name]);

  const handleNameChange = (name: string) => {
    setLocalName(name);
    isTypingRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const coords = getLocationCoordinates(name);
      if (coords) {
        onUpdate(index, { name, lat: coords[1], lng: coords[0] });
      } else {
        onUpdate(index, { name });
      }
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
          className="input input-xs input-bordered flex-1"
          placeholder="City name"
        />
        <input
          type="number"
          value={point.value}
          onChange={(e) => onUpdate(index, { value: parseFloat(e.target.value) || 0 })}
          className="input input-xs input-bordered w-16"
          placeholder="Value"
        />
        <button onClick={() => onRemove(index)} className="btn btn-xs btn-ghost text-error"><BsTrash /></button>
      </div>
      <div className="text-[10px] text-gray-500">
        {point.lat !== 0 || point.lng !== 0 ? (
          <span className="text-success">📍 {point.lat.toFixed(2)}, {point.lng.toFixed(2)}</span>
        ) : (
          <span className="text-warning">⚠️ Enter a valid city name</span>
        )}
      </div>
    </div>
  );
};

// Arc row component
const ArcRow: React.FC<{
  arc: GlobeArc;
  index: number;
  onUpdate: (index: number, updates: Partial<GlobeArc>) => void;
  onRemove: (index: number) => void;
}> = ({ arc, index, onUpdate, onRemove }) => {
  const [localFrom, setLocalFrom] = useState(arc.fromName);
  const [localTo, setLocalTo] = useState(arc.toName);
  const isTypingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isTypingRef.current) {
      setLocalFrom(arc.fromName);
      setLocalTo(arc.toName);
    }
  }, [arc.fromName, arc.toName]);

  const handleFromChange = (name: string) => {
    setLocalFrom(name);
    isTypingRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const coords = getLocationCoordinates(name);
      if (coords) {
        onUpdate(index, { fromName: name, fromLat: coords[1], fromLng: coords[0] });
      } else {
        onUpdate(index, { fromName: name });
      }
      isTypingRef.current = false;
    }, 500);
  };

  const handleToChange = (name: string) => {
    setLocalTo(name);
    isTypingRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const coords = getLocationCoordinates(name);
      if (coords) {
        onUpdate(index, { toName: name, toLat: coords[1], toLng: coords[0] });
      } else {
        onUpdate(index, { toName: name });
      }
      isTypingRef.current = false;
    }, 500);
  };

  return (
    <div className="p-2 bg-base-200 rounded-lg space-y-1">
      <div className="flex items-center gap-2">
        <input type="text" value={localFrom} onChange={(e) => handleFromChange(e.target.value)} className="input input-xs input-bordered flex-1" placeholder="From city" />
        <span className="text-gray-400">→</span>
        <input type="text" value={localTo} onChange={(e) => handleToChange(e.target.value)} className="input input-xs input-bordered flex-1" placeholder="To city" />
        <button onClick={() => onRemove(index)} className="btn btn-xs btn-ghost text-error"><BsTrash /></button>
      </div>
    </div>
  );
};

const GlobeMakerLayout: React.FC = () => {
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [points, setPoints] = useState<GlobePoint[]>(defaultPresets[0].points);
  const [arcs, setArcs] = useState<GlobeArc[]>([]);
  const [globeStyle, setGlobeStyle] = useState<GlobeStyle>("default");
  const [pointStyle, setPointStyle] = useState<PointStyle>("sphere");
  const [arcStyle, setArcStyle] = useState<ArcStyle>("line");
  const [pointColor, setPointColor] = useState("#ff6b6b");
  const [arcColor, setArcColor] = useState("#4ecdc4");
  const [pointSize, setPointSize] = useState(1.5);
  const [arcAltitude, setArcAltitude] = useState(0.3);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotateSpeed, setRotateSpeed] = useState(0.5);
  const [showAtmosphere, setShowAtmosphere] = useState(true);
  const [atmosphereColor, setAtmosphereColor] = useState("#6699cc");
  const [atmosphereIntensity, setAtmosphereIntensity] = useState(0.15);
  const [activeTab, setActiveTab] = useState<"points" | "arcs" | "style" | "presets">("points");
  const [customPresets, setCustomPresets] = useState<GlobePreset[]>([]);
  const [newPresetName, setNewPresetName] = useState("");
  const [globeLoaded, setGlobeLoaded] = useState(false);

  const [background, setBackground] = useState<BackgroundConfig>({
    type: "solid",
    background: "#0a0a1a",
    color1: "#0a0a1a",
    color2: "#1a1a2e",
    direction: "to bottom",
  });
  const [rotateDirection, setRotateDirection] = useState<RotateDirection>("right");
  const [focusCountry, setFocusCountry] = useState<string>("");
  const [locationSearch, setLocationSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ type: "country" | "state" | "city"; name: string; country?: string; state?: string; lat: number; lng: number }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search for locations (countries, states, cities)
  const handleLocationSearch = useCallback((query: string) => {
    setLocationSearch(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      const results: Array<{ type: "country" | "state" | "city"; name: string; country?: string; state?: string; lat: number; lng: number }> = [];
      const lowerQuery = query.toLowerCase();

      // Search countries
      allCountries.forEach((country) => {
        if (country.name.toLowerCase().includes(lowerQuery) && country.latitude && country.longitude) {
          results.push({
            type: "country",
            name: country.name,
            lat: parseFloat(country.latitude),
            lng: parseFloat(country.longitude),
          });
        }
      });

      // Search states (limit to first 5 matching countries for performance)
      const matchingCountries = allCountries.filter(c => 
        c.name.toLowerCase().includes(lowerQuery) || results.length < 10
      ).slice(0, 5);
      
      matchingCountries.forEach((country) => {
        const states = State.getStatesOfCountry(country.isoCode);
        states.forEach((state) => {
          if (state.name.toLowerCase().includes(lowerQuery) && state.latitude && state.longitude) {
            results.push({
              type: "state",
              name: state.name,
              country: country.name,
              lat: parseFloat(state.latitude),
              lng: parseFloat(state.longitude),
            });
          }
        });
      });

      // Search cities (limit for performance)
      if (results.length < 15) {
        const popularCountries = ["US", "IN", "CN", "GB", "DE", "FR", "JP", "AU", "BR", "CA"];
        popularCountries.forEach((countryCode) => {
          const cities = City.getCitiesOfCountry(countryCode) || [];
          cities.forEach((city) => {
            if (city.name.toLowerCase().includes(lowerQuery) && city.latitude && city.longitude && results.length < 20) {
              const country = Country.getCountryByCode(countryCode);
              results.push({
                type: "city",
                name: city.name,
                country: country?.name,
                state: city.stateCode,
                lat: parseFloat(city.latitude),
                lng: parseFloat(city.longitude),
              });
            }
          });
        });
      }

      // Sort: countries first, then states, then cities
      results.sort((a, b) => {
        const typeOrder = { country: 0, state: 1, city: 2 };
        return typeOrder[a.type] - typeOrder[b.type];
      });

      setSearchResults(results.slice(0, 15));
      setShowSearchResults(results.length > 0);
    }, 300);
  }, []);

  // Focus on a location from search
  const focusOnLocation = useCallback((result: { lat: number; lng: number; name: string; type: string }) => {
    if (!globeRef.current) return;
    
    // Different altitude based on type
    const altitude = result.type === "country" ? 2 : result.type === "state" ? 1.5 : 1;
    globeRef.current.pointOfView({ lat: result.lat, lng: result.lng, altitude }, 1000);
    toast.success(`Focused on ${result.name}`);
    setShowSearchResults(false);
    setLocationSearch(result.name);
  }, []);

  // Load custom presets
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setCustomPresets(JSON.parse(saved)); } catch {}
    }
  }, []);

  // Initialize globe
  useEffect(() => {
    if (typeof window === "undefined" || !globeContainerRef.current) return;

    const initGlobe = async () => {
      const GlobeModule = await import("globe.gl");
      const Globe = GlobeModule.default;
      
      if (globeRef.current) {
        globeRef.current._destructor?.();
      }

      const container = globeContainerRef.current;
      if (!container) return;

      const width = container.clientWidth || 600;
      const height = container.clientHeight || 500;

      // eslint-disable-next-line new-cap
      const globe = new Globe(container)
        .width(width)
        .height(height)
        .globeImageUrl(globeStyles.find(s => s.id === globeStyle)?.url || globeStyles[0].url)
        .backgroundColor("rgba(0,0,0,0)")
        .showAtmosphere(showAtmosphere)
        .atmosphereColor(atmosphereColor)
        .atmosphereAltitude(atmosphereIntensity);

      if (autoRotate) {
        globe.controls().autoRotate = true;
        globe.controls().autoRotateSpeed = rotateSpeed * (rotateDirection === "left" ? -1 : 1);
      }

      globeRef.current = globe;
      setGlobeLoaded(true);
    };

    initGlobe();

    // Handle resize
    const handleResize = () => {
      if (globeRef.current && globeContainerRef.current) {
        const width = globeContainerRef.current.clientWidth || 600;
        const height = globeContainerRef.current.clientHeight || 500;
        globeRef.current.width(width).height(height);
      }
    };

    window.addEventListener("resize", handleResize);
    // Initial resize after a short delay to ensure container is rendered
    setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (globeRef.current) {
        globeRef.current._destructor?.();
      }
    };
  }, []);

  // Update globe when settings change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!globeRef.current || !globeLoaded) return;

    const globe = globeRef.current;
    
    // Update globe image
    globe.globeImageUrl(globeStyles.find(s => s.id === globeStyle)?.url || globeStyles[0].url);
    
    // Update atmosphere
    globe.showAtmosphere(showAtmosphere);
    globe.atmosphereColor(atmosphereColor);
    globe.atmosphereAltitude(atmosphereIntensity);

    // Update rotation
    if (globe.controls()) {
      globe.controls().autoRotate = autoRotate;
      globe.controls().autoRotateSpeed = rotateSpeed * (rotateDirection === "left" ? -1 : 1);
    }

    // Update points
    if (pointStyle === "bar") {
      globe
        .pointsData([])
        .ringsData([])
        .labelsData([])
        .hexBinPointsData(points.map(p => ({ lat: p.lat, lng: p.lng, value: p.value })))
        .hexBinPointWeight("value")
        .hexAltitude((d: { sumWeight: number }) => d.sumWeight * 0.001 * pointSize)
        .hexBinResolution(4)
        .hexTopColor(() => pointColor)
        .hexSideColor(() => pointColor);
    } else if (pointStyle === "ring") {
      globe
        .pointsData([])
        .hexBinPointsData([])
        .labelsData([])
        .ringsData(points)
        .ringLat((d: GlobePoint) => d.lat)
        .ringLng((d: GlobePoint) => d.lng)
        .ringColor(() => pointColor)
        .ringMaxRadius(pointSize * 3)
        .ringPropagationSpeed(2)
        .ringRepeatPeriod(1000);
    } else if (pointStyle === "label") {
      globe
        .pointsData([])
        .hexBinPointsData([])
        .ringsData([])
        .labelsData(points)
        .labelLat((d: GlobePoint) => d.lat)
        .labelLng((d: GlobePoint) => d.lng)
        .labelText((d: GlobePoint) => d.name || "•")
        .labelSize(pointSize * 1.5)
        .labelColor(() => pointColor)
        .labelDotRadius(pointSize * 0.3)
        .labelAltitude(0.01);
    } else if (pointStyle === "pulse") {
      // Pulse uses both points and rings for a pulsing effect
      globe
        .hexBinPointsData([])
        .labelsData([])
        .pointsData(points)
        .pointLat((d: GlobePoint) => d.lat)
        .pointLng((d: GlobePoint) => d.lng)
        .pointAltitude(0.01)
        .pointRadius(pointSize * 0.3)
        .pointColor(() => pointColor)
        .ringsData(points)
        .ringLat((d: GlobePoint) => d.lat)
        .ringLng((d: GlobePoint) => d.lng)
        .ringColor(() => pointColor)
        .ringMaxRadius(pointSize * 2)
        .ringPropagationSpeed(3)
        .ringRepeatPeriod(800);
    } else {
      // Default sphere
      globe
        .hexBinPointsData([])
        .ringsData([])
        .labelsData([])
        .pointsData(points)
        .pointLat((d: GlobePoint) => d.lat)
        .pointLng((d: GlobePoint) => d.lng)
        .pointAltitude((d: GlobePoint) => d.value * 0.0005 * pointSize)
        .pointRadius(pointSize * 0.5)
        .pointColor(() => pointColor);
    }

    // Update arcs
    globe
      .arcsData(arcs)
      .arcStartLat((d: GlobeArc) => d.fromLat)
      .arcStartLng((d: GlobeArc) => d.fromLng)
      .arcEndLat((d: GlobeArc) => d.toLat)
      .arcEndLng((d: GlobeArc) => d.toLng)
      .arcColor(() => arcColor)
      .arcAltitude(arcAltitude)
      .arcStroke(arcStyle === "glow" ? 2 : 0.5)
      .arcDashLength(arcStyle === "dash" ? 0.4 : 1)
      .arcDashGap(arcStyle === "dash" ? 0.2 : 0)
      .arcDashAnimateTime(arcStyle === "dash" ? 1500 : arcStyle === "glow" ? 2000 : 0);

  }, [globeLoaded, globeStyle, points, arcs, pointStyle, arcStyle, pointColor, arcColor, pointSize, arcAltitude, autoRotate, rotateSpeed, rotateDirection, showAtmosphere, atmosphereColor, atmosphereIntensity]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Parse CSV/Excel data
  const parseData = useCallback((text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      toast.error("Need at least 2 rows");
      return;
    }

    const headers = lines[0].split(/[,\t]/).map(h => h.trim().toLowerCase());
    const nameIdx = headers.findIndex(h => ["name", "city", "location", "place"].includes(h));
    const latIdx = headers.findIndex(h => ["lat", "latitude"].includes(h));
    const lngIdx = headers.findIndex(h => ["lng", "lon", "longitude"].includes(h));
    const valueIdx = headers.findIndex(h => ["value", "amount", "count", "population"].includes(h));
    const fromIdx = headers.findIndex(h => ["from", "origin", "source"].includes(h));
    const toIdx = headers.findIndex(h => ["to", "destination", "dest"].includes(h));

    // Check if it's arc data
    if (fromIdx !== -1 && toIdx !== -1) {
      const newArcs: GlobeArc[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(/[,\t]/).map(c => c.trim());
        const fromName = cells[fromIdx];
        const toName = cells[toIdx];
        if (!fromName || !toName) continue;

        const fromCoords = getLocationCoordinates(fromName);
        const toCoords = getLocationCoordinates(toName);

        newArcs.push({
          id: `arc-${Date.now()}-${i}`,
          fromName,
          toName,
          fromLat: fromCoords ? fromCoords[1] : 0,
          fromLng: fromCoords ? fromCoords[0] : 0,
          toLat: toCoords ? toCoords[1] : 0,
          toLng: toCoords ? toCoords[0] : 0,
        });
      }
      setArcs(newArcs);
      toast.success(`Imported ${newArcs.length} arcs!`);
      return;
    }

    // Point data
    if (nameIdx === -1 && latIdx === -1) {
      toast.error("Need 'name' or 'lat/lng' columns");
      return;
    }

    const newPoints: GlobePoint[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(/[,\t]/).map(c => c.trim());
      const name = nameIdx !== -1 ? cells[nameIdx] : "";
      const value = valueIdx !== -1 ? parseFloat(cells[valueIdx]) || 50 : 50;

      let lat = 0, lng = 0;
      if (latIdx !== -1 && lngIdx !== -1) {
        lat = parseFloat(cells[latIdx]) || 0;
        lng = parseFloat(cells[lngIdx]) || 0;
      } else if (name) {
        const coords = getLocationCoordinates(name);
        if (coords) {
          lng = coords[0];
          lat = coords[1];
        }
      }

      if (lat !== 0 || lng !== 0 || name) {
        newPoints.push({ id: `point-${Date.now()}-${i}`, name, lat, lng, value });
      }
    }

    if (newPoints.length === 0) {
      toast.error("No valid data found");
      return;
    }

    setPoints(newPoints);
    toast.success(`Imported ${newPoints.length} points!`);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => parseData(event.target?.result as string);
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [parseData]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text");
      if (text && (text.includes("\t") || (text.includes(",") && text.includes("\n")))) {
        e.preventDefault();
        parseData(text);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [parseData]);

  const saveCustomPresets = (presets: GlobePreset[]) => {
    setCustomPresets(presets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  };

  const addPoint = () => {
    setPoints([...points, { id: `point-${Date.now()}`, name: "", lat: 0, lng: 0, value: 50 }]);
  };

  const updatePoint = (index: number, updates: Partial<GlobePoint>) => {
    const updated = [...points];
    updated[index] = { ...updated[index], ...updates };
    setPoints(updated);
  };

  const removePoint = (index: number) => {
    if (points.length <= 1) return;
    setPoints(points.filter((_, i) => i !== index));
  };

  const addArc = () => {
    setArcs([...arcs, { id: `arc-${Date.now()}`, fromName: "", toName: "", fromLat: 0, fromLng: 0, toLat: 0, toLng: 0 }]);
  };

  const updateArc = (index: number, updates: Partial<GlobeArc>) => {
    const updated = [...arcs];
    updated[index] = { ...updated[index], ...updates };
    setArcs(updated);
  };

  const removeArc = (index: number) => {
    setArcs(arcs.filter((_, i) => i !== index));
  };

  const loadPreset = (preset: GlobePreset) => {
    setPoints([...preset.points]);
    setArcs([...preset.arcs]);
    
    // Apply style settings if available
    if (preset.globeStyle) setGlobeStyle(preset.globeStyle);
    if (preset.pointStyle) setPointStyle(preset.pointStyle);
    if (preset.arcStyle) setArcStyle(preset.arcStyle);
    if (preset.pointColor) setPointColor(preset.pointColor);
    if (preset.arcColor) setArcColor(preset.arcColor);
    if (preset.pointSize) setPointSize(preset.pointSize);
    if (preset.showAtmosphere !== undefined) setShowAtmosphere(preset.showAtmosphere);
    if (preset.atmosphereColor) setAtmosphereColor(preset.atmosphereColor);
    if (preset.atmosphereIntensity) setAtmosphereIntensity(preset.atmosphereIntensity);
    
    // Focus on preset location if available
    if (preset.focusLat !== undefined && preset.focusLng !== undefined && globeRef.current) {
      globeRef.current.pointOfView({ lat: preset.focusLat, lng: preset.focusLng, altitude: 2 }, 1000);
    }
    toast.success(`Loaded "${preset.name}"`);
  };

  const focusOnCountry = useCallback((countryCode: string) => {
    if (!globeRef.current || !countryCode) return;
    const country = Country.getCountryByCode(countryCode);
    if (country && country.latitude && country.longitude) {
      setFocusCountry(countryCode);
      globeRef.current.pointOfView({ 
        lat: parseFloat(country.latitude), 
        lng: parseFloat(country.longitude), 
        altitude: 2 
      }, 1000);
      toast.success(`Focused on ${country.name}`);
    }
  }, []);

  const saveAsPreset = () => {
    if (!newPresetName.trim()) {
      toast.error("Enter a preset name");
      return;
    }
    const preset: GlobePreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName.trim(),
      points: points.map(p => ({ ...p })),
      arcs: arcs.map(a => ({ ...a })),
      isCustom: true,
      // Save current style settings
      globeStyle,
      pointStyle,
      arcStyle,
      pointColor,
      arcColor,
      pointSize,
      showAtmosphere,
      atmosphereColor,
      atmosphereIntensity,
    };
    saveCustomPresets([...customPresets, preset]);
    setNewPresetName("");
    toast.success("Preset saved with styles!");
  };

  const deleteCustomPreset = (id: string) => {
    saveCustomPresets(customPresets.filter((p) => p.id !== id));
    toast.success("Preset deleted");
  };

  const resetAll = () => {
    if (!confirm("Reset all changes?")) return;
    setPoints(defaultPresets[0].points);
    setArcs([]);
    setGlobeStyle("default");
    setAutoRotate(true);
    toast.success("Reset complete");
  };

  // Export using WebGL canvas directly
  const handleExport = useCallback(
    async (format: "png" | "jpeg" | "webp") => {
      if (!globeRef.current) {
        toast.error("Globe not loaded");
        return;
      }

      try {
        // Get the WebGL renderer from globe.gl
        const renderer = globeRef.current.renderer();
        if (!renderer) {
          toast.error("Renderer not available");
          return;
        }

        // Force a render
        globeRef.current.renderer().render(
          globeRef.current.scene(),
          globeRef.current.camera()
        );

        // Get canvas and export
        const canvas = renderer.domElement as HTMLCanvasElement;
        const mimeType =
          format === "jpeg"
            ? "image/jpeg"
            : format === "webp"
              ? "image/webp"
              : "image/png";

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              toast.error("Export failed");
              return;
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `tsarr-in-globe.${format}`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`Exported as ${format.toUpperCase()}`);
          },
          mimeType,
          0.95
        );
      } catch (err) {
        console.error("Export error:", err);
        toast.error("Export failed");
      }
    },
    []
  );

  // Record GIF animation
  const [isRecording, setIsRecording] = useState(false);
  const handleRecordGif = useCallback(async () => {
    if (!globeRef.current || isRecording) return;

    setIsRecording(true);
    toast("Recording 3 seconds...", { icon: "🎬" });

    try {
      const GIF = (await import("gif.js")).default;
      const renderer = globeRef.current.renderer();
      const canvas = renderer.domElement as HTMLCanvasElement;

      const gif = new GIF({
        workers: 4,
        quality: 5, // Balance between quality and speed
        width: canvas.width,
        height: canvas.height,
        workerScript: "/gif.worker.js",
        dither: false,
      });

      const frames = 50; // 30 frames for ~3 seconds
      const interval = 100; // 10fps

      for (let i = 0; i < frames; i++) {
        await new Promise((resolve) => setTimeout(resolve, interval));
        globeRef.current.renderer().render(
          globeRef.current.scene(),
          globeRef.current.camera()
        );
        gif.addFrame(canvas, { copy: true, delay: interval });
      }

      gif.on("finished", (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tsarr-in-globe.gif";
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
        toast.success("GIF exported!");
      });

      gif.render();
    } catch (err) {
      console.error("GIF error:", err);
      setIsRecording(false);
      toast.error("GIF recording failed - try PNG instead");
    }
  }, [isRecording]);

  // Record WebM video using same approach as GIF
  const handleRecordVideo = useCallback(async () => {
    if (!globeRef.current || isRecording) return;

    setIsRecording(true);
    toast("Recording 5 seconds...", { icon: "🎥" });

    try {
      const GIF = (await import("gif.js")).default;
      const renderer = globeRef.current.renderer();
      const canvas = renderer.domElement as HTMLCanvasElement;

      // Use GIF.js to collect frames, then convert to video
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: canvas.width,
        height: canvas.height,
        workerScript: "/gif.worker.js",
      });

      const frames = 50; // 50 frames for ~5 seconds
      const interval = 100; // 100ms between frames

      for (let i = 0; i < frames; i++) {
        await new Promise((resolve) => setTimeout(resolve, interval));
        globeRef.current.renderer().render(
          globeRef.current.scene(),
          globeRef.current.camera()
        );
        gif.addFrame(canvas, { copy: true, delay: interval });
      }

      gif.on("finished", (blob: Blob) => {
        // Convert GIF to WebM by downloading as GIF but with .webm extension
        // Actually, let's just download as GIF since it works
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "tsarr-in-globe.gif";
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
        toast.success("Video exported as GIF!");
      });

      gif.render();
    } catch (err) {
      console.error("Video error:", err);
      setIsRecording(false);
      toast.error("Video recording failed");
    }
  }, [isRecording]);

  const handleCopyToClipboard = useCallback(async () => {
    if (!globeRef.current) return;

    try {
      const renderer = globeRef.current.renderer();
      globeRef.current.renderer().render(
        globeRef.current.scene(),
        globeRef.current.camera()
      );
      const canvas = renderer.domElement as HTMLCanvasElement;

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Failed to copy");
          return;
        }
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        toast.success("Copied to clipboard!");
      }, "image/png");
    } catch {
      toast.error("Failed to copy");
    }
  }, []);

  // Generate HTML embed code
  const handleExportHtml = useCallback(() => {
    const pointsJson = JSON.stringify(points);
    const arcsJson = JSON.stringify(arcs);
    const globeImageUrl = globeStyles.find(s => s.id === globeStyle)?.url || globeStyles[0].url;
    
    // Generate point style specific code
    let pointCode = "";
    if (pointStyle === "bar") {
      pointCode = `
      .hexBinPointsData(points.map(p => ({ lat: p.lat, lng: p.lng, value: p.value })))
      .hexBinPointWeight('value')
      .hexAltitude(d => d.sumWeight * 0.001 * ${pointSize})
      .hexBinResolution(4)
      .hexTopColor(() => '${pointColor}')
      .hexSideColor(() => '${pointColor}')`;
    } else if (pointStyle === "ring") {
      pointCode = `
      .ringsData(points)
      .ringLat(d => d.lat)
      .ringLng(d => d.lng)
      .ringColor(() => '${pointColor}')
      .ringMaxRadius(${pointSize * 3})
      .ringPropagationSpeed(2)
      .ringRepeatPeriod(1000)`;
    } else if (pointStyle === "label") {
      pointCode = `
      .labelsData(points)
      .labelLat(d => d.lat)
      .labelLng(d => d.lng)
      .labelText(d => d.name || '•')
      .labelSize(${pointSize * 1.5})
      .labelColor(() => '${pointColor}')
      .labelDotRadius(${pointSize * 0.3})
      .labelAltitude(0.01)`;
    } else if (pointStyle === "pulse") {
      pointCode = `
      .pointsData(points)
      .pointLat(d => d.lat)
      .pointLng(d => d.lng)
      .pointAltitude(0.01)
      .pointRadius(${pointSize * 0.3})
      .pointColor(() => '${pointColor}')
      .ringsData(points)
      .ringLat(d => d.lat)
      .ringLng(d => d.lng)
      .ringColor(() => '${pointColor}')
      .ringMaxRadius(${pointSize * 2})
      .ringPropagationSpeed(3)
      .ringRepeatPeriod(800)`;
    } else {
      // Default sphere
      pointCode = `
      .pointsData(points)
      .pointLat(d => d.lat)
      .pointLng(d => d.lng)
      .pointAltitude(d => d.value * 0.0005 * ${pointSize})
      .pointRadius(${pointSize * 0.5})
      .pointColor(() => '${pointColor}')`;
    }

    // Generate arc style specific code
    const arcStroke = arcStyle === "glow" ? 2 : 0.5;
    const arcDashLength = arcStyle === "dash" ? 0.4 : 1;
    const arcDashGap = arcStyle === "dash" ? 0.2 : 0;
    const arcDashAnimateTime = arcStyle === "dash" ? 1500 : arcStyle === "glow" ? 2000 : 0;
    
    const htmlCode = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Globe Visualization</title>
  <style>
    body { margin: 0; background: ${background.background}; }
    #globe { width: 100vw; height: 100vh; }
  </style>
  <script src="//unpkg.com/globe.gl"></script>
</head>
<body>
  <div id="globe"></div>
  <script>
    const points = ${pointsJson};
    const arcs = ${arcsJson};
    
    const globe = Globe()
      .globeImageUrl('${globeImageUrl}')
      .backgroundColor('rgba(0,0,0,0)')
      .showAtmosphere(${showAtmosphere})
      .atmosphereColor('${atmosphereColor}')${pointCode}
      .arcsData(arcs)
      .arcStartLat(d => d.fromLat)
      .arcStartLng(d => d.fromLng)
      .arcEndLat(d => d.toLat)
      .arcEndLng(d => d.toLng)
      .arcColor(() => '${arcColor}')
      .arcAltitude(${arcAltitude})
      .arcStroke(${arcStroke})
      .arcDashLength(${arcDashLength})
      .arcDashGap(${arcDashGap})
      .arcDashAnimateTime(${arcDashAnimateTime})
      (document.getElementById('globe'));
    
    globe.controls().autoRotate = ${autoRotate};
    globe.controls().autoRotateSpeed = ${rotateSpeed * (rotateDirection === "left" ? -1 : 1)};
  </script>
</body>
</html>`;

    // Copy to clipboard
    navigator.clipboard.writeText(htmlCode).then(() => {
      toast.success("HTML code copied to clipboard!");
    }).catch(() => {
      // Fallback: download as file
      const blob = new Blob([htmlCode], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tsarr-in-globe.html";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("HTML file downloaded!");
    });
  }, [points, arcs, globeStyle, background, showAtmosphere, atmosphereColor, pointSize, pointColor, pointStyle, arcColor, arcStyle, arcAltitude, autoRotate, rotateSpeed, rotateDirection]);

  const ToolbarButton = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2.5 bg-base-100 border border-base-200 rounded-lg transition-all hover:bg-base-200/50 hover:border-primary/20 hover:shadow-sm">
      <span className="text-lg">{icon}</span>
      <span className="font-medium text-primary-content">{label}</span>
    </button>
  );

  return (
    <main className="min-h-[100vh] h-fit editor-bg relative pb-20 lg:pb-0">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <Navigation />
      <section className="container mx-auto px-3 sm:px-4 lg:px-0 relative">
        <div className="grid gap-4 lg:gap-5 lg:grid-cols-[3fr_1.5fr]">
          {/* Preview Area */}
          <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="grid grid-cols-2 gap-2 mb-3 lg:flex lg:flex-wrap lg:justify-end">
              <div className="dropdown">
                <label tabIndex={0}><ToolbarButton icon={<TfiExport />} label="Export" onClick={() => {}} /></label>
                <ul tabIndex={0} className="dropdown-content menu p-2 mt-1 bg-base-100 border-2 rounded-lg min-w-[180px] z-50">
                  <li className="menu-title"><span>Images</span></li>
                  <li><a onClick={() => handleExport("png")}>PNG</a></li>
                  <li><a onClick={() => handleExport("jpeg")}>JPEG</a></li>
                  <li><a onClick={() => handleExport("webp")}>WebP</a></li>
                  <li className="menu-title"><span>Animation</span></li>
                  <li><a onClick={handleRecordGif} className={isRecording ? "opacity-50" : ""}>{isRecording ? "Recording..." : "GIF Animation (3s)"}</a></li>
                  <li className="menu-title"><span>Embed</span></li>
                  <li><a onClick={handleExportHtml}><BsCode className="inline mr-1" /> HTML Code</a></li>
                </ul>
              </div>
              <ToolbarButton icon={<BsClipboard />} label="Copy to Clipboard" onClick={handleCopyToClipboard} />
              <ToolbarButton icon={<BiReset />} label="Reset" onClick={resetAll} />
            </div>

            {/* Globe Container */}
            <div className="relative flex-1 min-h-[300px] sm:min-h-[400px] lg:min-h-[600px] flex items-center justify-center rounded-2xl overflow-hidden" style={{ background: background.background }}>
              <div ref={globeContainerRef} className="absolute inset-0" style={{ width: "100%", height: "100%" }} />
              {!globeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-lg">Loading Globe...</div>
                </div>
              )}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="bg-base-100 rounded-2xl shadow-lg p-5 h-fit max-h-[85vh] overflow-y-auto">
            <div className="grid grid-cols-4 bg-base-200 rounded-lg p-1 mb-5">
              {(["points", "arcs", "style", "presets"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`py-2 px-2 text-xs font-medium rounded-md capitalize transition-all ${activeTab === tab ? "bg-base-100 shadow-sm" : "hover:bg-base-100/50"}`}>
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "points" && (
              <div className="space-y-5">
                {/* Import Data */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Import Data</label>
                  <div className="flex gap-2">
                    <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFileUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="btn btn-sm btn-outline flex-1 gap-1"><BsUpload /> CSV</button>
                    <button onClick={() => toast("Paste from Excel (Ctrl+V)", { icon: "📋" })} className="btn btn-sm btn-outline flex-1 gap-1"><BsTable /> Paste</button>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-2">Format: name, value (or lat, lng, value)</div>
                </div>

                {/* Points List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-primary-content/70">Points ({points.length})</label>
                    <button onClick={addPoint} className="btn btn-xs btn-ghost gap-1"><BsPlus /> Add</button>
                  </div>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {points.map((p, i) => (
                      <PointRow key={p.id} point={p} index={i} onUpdate={updatePoint} onRemove={removePoint} />
                    ))}
                  </div>
                </div>

                {/* Point Style */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Point Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["sphere", "bar", "ring", "label", "pulse"] as PointStyle[]).map((style) => (
                      <button key={style} onClick={() => setPointStyle(style)} className={`py-2 px-3 rounded-lg text-xs font-medium capitalize ${pointStyle === style ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}>
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Point Color & Size */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-primary-content/70 block mb-1">Point Color</label>
                    <input type="color" value={pointColor} onChange={(e) => setPointColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-xs text-primary-content/70 block mb-1">Size: {pointSize}</label>
                    <input type="range" min="0.5" max="5" step="0.5" value={pointSize} onChange={(e) => setPointSize(parseFloat(e.target.value))} className="range range-primary range-xs" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "arcs" && (
              <div className="space-y-5">
                {/* Import Arc Data */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Import Arc Data</label>
                  <div className="flex gap-2">
                    <input ref={fileInputRef} type="file" accept=".csv,.tsv,.txt" onChange={handleFileUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="btn btn-sm btn-outline flex-1 gap-1"><BsUpload /> CSV</button>
                    <button onClick={() => toast("Paste from Excel (Ctrl+V)", { icon: "📋" })} className="btn btn-sm btn-outline flex-1 gap-1"><BsTable /> Paste</button>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-2">Format: from, to</div>
                </div>

                {/* Arcs List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-primary-content/70">Arcs ({arcs.length})</label>
                    <button onClick={addArc} className="btn btn-xs btn-ghost gap-1"><BsPlus /> Add</button>
                  </div>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {arcs.map((a, i) => (
                      <ArcRow key={a.id} arc={a} index={i} onUpdate={updateArc} onRemove={removeArc} />
                    ))}
                  </div>
                </div>

                {/* Arc Style */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Arc Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["line", "dash", "glow"] as ArcStyle[]).map((style) => (
                      <button key={style} onClick={() => setArcStyle(style)} className={`py-2 px-3 rounded-lg text-xs font-medium capitalize ${arcStyle === style ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}>
                        {style === "dash" ? "Animated" : style === "glow" ? "Glow" : "Solid"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Arc Color & Altitude */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-primary-content/70 block mb-1">Arc Color</label>
                    <input type="color" value={arcColor} onChange={(e) => setArcColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-xs text-primary-content/70 block mb-1">Altitude: {arcAltitude}</label>
                    <input type="range" min="0.1" max="1" step="0.1" value={arcAltitude} onChange={(e) => setArcAltitude(parseFloat(e.target.value))} className="range range-primary range-xs" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "style" && (
              <div className="space-y-5">
                {/* Globe Style */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Globe Texture</label>
                  <div className="grid grid-cols-3 gap-2">
                    {globeStyles.map((style) => (
                      <button key={style.id} onClick={() => setGlobeStyle(style.id)} className={`py-2 px-2 rounded-lg text-xs font-medium ${globeStyle === style.id ? "bg-primary text-white" : "bg-base-200 hover:bg-base-300"}`}>
                        {style.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Background</label>
                  <BackgroundPicker background={background} onBackgroundChange={setBackground} showTilt={false} />
                </div>

                {/* Atmosphere */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={showAtmosphere} onChange={(e) => setShowAtmosphere(e.target.checked)} className="checkbox checkbox-primary checkbox-sm" />
                    <span className="text-sm">Show Atmosphere</span>
                  </label>
                </div>
                {showAtmosphere && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-primary-content/70 block mb-1">Atmosphere Color</label>
                      <input type="color" value={atmosphereColor} onChange={(e) => setAtmosphereColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                    </div>
                    <div>
                      <label className="text-xs text-primary-content/70 block mb-1">Intensity: {atmosphereIntensity.toFixed(2)}</label>
                      <input type="range" min="0.02" max="0.5" step="0.02" value={atmosphereIntensity} onChange={(e) => setAtmosphereIntensity(parseFloat(e.target.value))} className="range range-primary range-xs" />
                      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                        <span>Subtle</span>
                        <span>Strong</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto Rotate */}
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} className="checkbox checkbox-primary checkbox-sm" />
                      <span className="text-sm">Auto Rotate</span>
                    </label>
                    <button onClick={() => setAutoRotate(!autoRotate)} className="btn btn-xs btn-ghost">
                      {autoRotate ? <BsPause /> : <BsPlay />}
                    </button>
                  </div>
                  {autoRotate && (
                    <>
                      <div>
                        <label className="text-xs text-primary-content/70 block mb-1">Speed: {rotateSpeed}</label>
                        <input type="range" min="0.1" max="2" step="0.1" value={rotateSpeed} onChange={(e) => setRotateSpeed(parseFloat(e.target.value))} className="range range-primary range-xs" />
                      </div>
                      <div>
                        <label className="text-xs text-primary-content/70 block mb-1">Direction</label>
                        <div className="flex gap-2">
                          <button onClick={() => setRotateDirection("left")} className={`btn btn-xs flex-1 gap-1 ${rotateDirection === "left" ? "btn-primary" : "btn-outline"}`}>
                            <BsArrowCounterclockwise /> Left
                          </button>
                          <button onClick={() => setRotateDirection("right")} className={`btn btn-xs flex-1 gap-1 ${rotateDirection === "right" ? "btn-primary" : "btn-outline"}`}>
                            <BsArrowClockwise /> Right
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Focus on Country */}
                <div>
                  <label className="text-sm font-medium text-primary-content/70 block mb-2">Search & Focus Location</label>
                  <div className="relative" ref={searchContainerRef}>
                    <div className="relative">
                      <BsSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={locationSearch}
                        onChange={(e) => handleLocationSearch(e.target.value)}
                        onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                        placeholder="Type country, state, or city..."
                        className="input input-bordered input-sm w-full pl-9"
                      />
                    </div>
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
                        {searchResults.map((result, idx) => (
                          <button
                            key={`${result.type}-${result.name}-${idx}`}
                            onClick={() => focusOnLocation(result)}
                            className="w-full px-3 py-2 text-left hover:bg-base-200 flex items-center gap-2 text-sm"
                          >
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                              result.type === "country" ? "bg-primary/20 text-primary" :
                              result.type === "state" ? "bg-secondary/20 text-secondary" :
                              "bg-accent/20 text-accent"
                            }`}>
                              {result.type}
                            </span>
                            <span className="truncate">{result.name}</span>
                            {result.country && <span className="text-gray-400 text-xs">({result.country})</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">Start typing to search and auto-zoom</div>
                </div>

                {/* Quick Country Buttons */}
                <div>
                  <label className="text-xs text-primary-content/70 block mb-2">Quick Focus</label>
                  <div className="flex flex-wrap gap-1">
                    {["US", "IN", "CN", "JP", "GB", "DE", "FR", "BR", "AU", "CA"].map((code) => {
                      const country = Country.getCountryByCode(code);
                      return (
                        <button
                          key={code}
                          onClick={() => focusOnCountry(code)}
                          className={`btn btn-xs ${focusCountry === code ? "btn-primary" : "btn-outline"}`}
                        >
                          {country?.flag} {code}
                        </button>
                      );
                    })}
                  </div>
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
                            <div className="text-[10px] text-gray-500 mt-1">{p.points.length} points • {p.arcs.length} arcs</div>
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
                        <div className="text-[10px] text-gray-500 mt-1">{p.points.length} points • {p.arcs.length} arcs</div>
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

export default GlobeMakerLayout;
