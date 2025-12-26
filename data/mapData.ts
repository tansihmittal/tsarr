import {
  Country,
  State,
  City,
  ICity,
  ICountry,
  IState,
} from "country-state-city";

// Get all data from the package
const allCountries = Country.getAllCountries();
const allStates = State.getAllStates();
const allCities = City.getAllCities();

// Curated major cities with correct coordinates [longitude, latitude]
// These override the package data for accuracy (package has wrong coords for some cities)
const majorCityCoords: Record<string, [number, number]> = {
  // World Capitals & Major Cities - coordinates verified
  london: [-0.1276, 51.5074],
  paris: [2.3522, 48.8566],
  berlin: [13.405, 52.52],
  madrid: [-3.7038, 40.4168],
  rome: [12.4964, 41.9028],
  tokyo: [139.6917, 35.6895],
  beijing: [116.4074, 39.9042],
  shanghai: [121.4737, 31.2304],
  "hong kong": [114.1694, 22.3193],
  singapore: [103.8198, 1.3521],
  seoul: [126.978, 37.5665],
  sydney: [151.2093, -33.8688],
  melbourne: [144.9631, -37.8136],
  "new york": [-74.006, 40.7128],
  "los angeles": [-118.2437, 34.0522],
  chicago: [-87.6298, 41.8781],
  toronto: [-79.3832, 43.6532],
  moscow: [37.6173, 55.7558],
  dubai: [55.2708, 25.2048],
  mumbai: [72.8777, 19.076],
  delhi: [77.209, 28.6139],
  "new delhi": [77.209, 28.6139],
  bangalore: [77.5946, 12.9716],
  bengaluru: [77.5946, 12.9716],
  chennai: [80.2707, 13.0827],
  kolkata: [88.3639, 22.5726],
  hyderabad: [78.4867, 17.385],
  guangzhou: [113.2644, 23.1291],
  shenzhen: [114.0579, 22.5431],
  osaka: [135.5023, 34.6937],
  "san francisco": [-122.4194, 37.7749],
  houston: [-95.3698, 29.7604],
  miami: [-80.1918, 25.7617],
  "mexico city": [-99.1332, 19.4326],
  "sao paulo": [-46.6333, -23.5505],
  "são paulo": [-46.6333, -23.5505],
  "buenos aires": [-58.3816, -34.6037],
  cairo: [31.2357, 30.0444],
  lagos: [3.3792, 6.5244],
  bangkok: [100.5018, 13.7563],
  jakarta: [106.8456, -6.2088],
  istanbul: [28.9784, 41.0082],
};

// Country coordinates (center points) - for better map centering
const countryCoords: Record<string, [number, number]> = {
  china: [105.0, 35.0],
  india: [78.0, 22.0],
  usa: [-98.0, 39.0],
  "united states": [-98.0, 39.0],
  "united states of america": [-98.0, 39.0],
  russia: [100.0, 60.0],
  brazil: [-53.0, -10.0],
  australia: [134.0, -25.0],
  canada: [-106.0, 56.0],
  japan: [138.0, 36.0],
  germany: [10.0, 51.0],
  france: [2.0, 46.0],
  uk: [-2.0, 54.0],
  "united kingdom": [-2.0, 54.0],
};

// Build lookup maps for fast access
const countryByCode: Record<string, ICountry> = {};
const countryByName: Record<string, ICountry> = {};
allCountries.forEach((c) => {
  countryByCode[c.isoCode.toUpperCase()] = c;
  countryByCode[c.isoCode.toLowerCase()] = c;
  countryByName[c.name.toLowerCase()] = c;
});

const stateByName: Record<string, IState> = {};
allStates.forEach((s) => {
  stateByName[s.name.toLowerCase()] = s;
});

// Build city lookup - group by country for better matching
const citiesByCountry: Record<string, ICity[]> = {};
allCities.forEach((c) => {
  if (c.latitude && c.longitude) {
    if (!citiesByCountry[c.countryCode]) {
      citiesByCountry[c.countryCode] = [];
    }
    citiesByCountry[c.countryCode].push(c);
  }
});

// Normalize location name for TopoJSON matching
export function normalizeLocationName(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();
  const upper = trimmed.toUpperCase();

  // Check country by code
  if (countryByCode[upper]) return countryByCode[upper].name;
  if (countryByName[lower]) return countryByName[lower].name;

  // Check state by name (any country)
  if (stateByName[lower]) return stateByName[lower].name;

  return trimmed;
}

// Get coordinates for any location (city, state, or country)
export function getLocationCoordinates(
  name: string
): [number, number] | null {
  if (!name || !name.trim()) return null;

  const normalized = name.trim();
  const lower = normalized.toLowerCase();
  const upper = normalized.toUpperCase();

  // 1. Check curated major cities first (most accurate)
  if (majorCityCoords[lower]) {
    return majorCityCoords[lower];
  }

  // 2. Check curated country coordinates
  if (countryCoords[lower]) {
    return countryCoords[lower];
  }

  // 3. Check country by code (e.g., "US", "IN", "CN")
  const countryByCodeMatch = countryByCode[upper];
  if (countryByCodeMatch?.latitude && countryByCodeMatch?.longitude) {
    return [
      parseFloat(countryByCodeMatch.longitude),
      parseFloat(countryByCodeMatch.latitude),
    ];
  }

  // 4. Check country by name
  const countryByNameMatch = countryByName[lower];
  if (countryByNameMatch?.latitude && countryByNameMatch?.longitude) {
    return [
      parseFloat(countryByNameMatch.longitude),
      parseFloat(countryByNameMatch.latitude),
    ];
  }

  // 5. Search cities - prefer major countries
  const preferredCountries = [
    "US", "GB", "IN", "CN", "JP", "DE", "FR", "AU", "CA", "BR",
  ];
  for (const countryCode of preferredCountries) {
    const cities = citiesByCountry[countryCode] || [];
    const city = cities.find((c) => c.name.toLowerCase() === lower);
    if (city?.latitude && city?.longitude) {
      return [parseFloat(city.longitude), parseFloat(city.latitude)];
    }
  }

  // 6. Search all cities
  for (const cities of Object.values(citiesByCountry)) {
    const city = cities.find((c) => c.name.toLowerCase() === lower);
    if (city?.latitude && city?.longitude) {
      return [parseFloat(city.longitude), parseFloat(city.latitude)];
    }
  }

  // 7. Check state by name
  const state = stateByName[lower];
  if (state?.latitude && state?.longitude) {
    return [parseFloat(state.longitude), parseFloat(state.latitude)];
  }

  return null;
}

// Get cities of a country
export function getCitiesOfCountry(countryCode: string): ICity[] {
  return City.getCitiesOfCountry(countryCode.toUpperCase()) || [];
}

// Get states of a country
export function getStatesOfCountry(countryCode: string): IState[] {
  return State.getStatesOfCountry(countryCode.toUpperCase()) || [];
}

// Get all countries
export function getAllCountries(): ICountry[] {
  return allCountries;
}

// Get country info
export function getCountryInfo(input: string): ICountry | null {
  const lower = input.toLowerCase();
  const upper = input.toUpperCase();
  return (
    countryByCode[upper] || countryByCode[lower] || countryByName[lower] || null
  );
}

// Export types
export type { ICity, ICountry, IState };

// Build country name map for TopoJSON compatibility
export const countryNameMap: Record<string, string> = {};
allCountries.forEach((c) => {
  countryNameMap[c.isoCode] = c.name;
  countryNameMap[c.isoCode.toLowerCase()] = c.name;
  countryNameMap[c.name] = c.name;
});

// Build state maps dynamically from package for all major countries
export const stateMapsByCountry: Record<string, Record<string, string>> = {};
const majorCountryCodes = [
  "US", "IN", "CN", "AU", "CA", "BR", "DE", "MX", "JP", "GB", "FR", "IT", "ES", "RU",
];
majorCountryCodes.forEach((countryCode) => {
  const stateMap: Record<string, string> = {};
  State.getStatesOfCountry(countryCode).forEach((s) => {
    stateMap[s.isoCode] = s.name;
    stateMap[s.isoCode.toLowerCase()] = s.name;
    stateMap[s.name] = s.name;
    stateMap[s.name.toLowerCase()] = s.name;
  });
  stateMapsByCountry[countryCode] = stateMap;
});

// Convenience exports for common countries
export const usStateMap = stateMapsByCountry["US"] || {};
export const indiaStateMap = stateMapsByCountry["IN"] || {};
export const chinaProvinceMap = stateMapsByCountry["CN"] || {};

// Get country name from city name (using package data)
export function getCountryFromCity(cityName: string): string | null {
  if (!cityName) return null;
  const lower = cityName.trim().toLowerCase();

  // Search in country-state-city package
  for (const [countryCode, cities] of Object.entries(citiesByCountry)) {
    const city = cities.find((c) => c.name.toLowerCase() === lower);
    if (city) {
      const country = countryByCode[countryCode];
      return country?.name || null;
    }
  }

  return null;
}

// Check if a name is a city (not a country or state)
export function isCity(name: string): boolean {
  if (!name) return false;
  const lower = name.trim().toLowerCase();

  // Check if it's NOT a country
  if (countryByName[lower]) return false;

  // Search in cities database
  for (const cities of Object.values(citiesByCountry)) {
    if (cities.find((c) => c.name.toLowerCase() === lower)) {
      return true;
    }
  }

  return false;
}

// Get state/province from city for a specific country (using package data)
export function getStateFromCityByCountry(
  cityName: string,
  countryCode: string
): string | null {
  if (!cityName || !countryCode) return null;
  const lower = cityName.trim().toLowerCase();
  const code = countryCode.toUpperCase();

  // Search in country-state-city package
  const cities = citiesByCountry[code] || [];
  const city = cities.find((c) => c.name.toLowerCase() === lower);
  if (city && city.stateCode) {
    const state = State.getStateByCodeAndCountry(city.stateCode, code);
    return state?.name || null;
  }

  return null;
}

// Check if a name is a city in a specific country
export function isCityInCountry(name: string, countryCode: string): boolean {
  if (!name || !countryCode) return false;
  const lower = name.trim().toLowerCase();
  const code = countryCode.toUpperCase();

  const cities = citiesByCountry[code] || [];
  return cities.some((c) => c.name.toLowerCase() === lower);
}

// Check if a name is a state/province in a specific country
export function isStateInCountry(name: string, countryCode: string): boolean {
  if (!name || !countryCode) return false;
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  const upper = trimmed.toUpperCase();
  const code = countryCode.toUpperCase();

  const stateMap = stateMapsByCountry[code];
  if (stateMap) {
    if (stateMap[upper] || stateMap[lower]) return true;
  }

  // Check in package
  const states = State.getStatesOfCountry(code);
  return states.some(
    (s) => s.name.toLowerCase() === lower || s.isoCode.toUpperCase() === upper
  );
}

// US-specific functions
export function getStateFromCity(cityName: string): string | null {
  return getStateFromCityByCountry(cityName, "US");
}

export function isUSCity(name: string): boolean {
  return isCityInCountry(name, "US");
}

export function isUSState(name: string): boolean {
  return isStateInCountry(name, "US");
}

export function normalizeStateName(input: string): string {
  if (!input) return "";
  const trimmed = input.trim();
  const upper = trimmed.toUpperCase();
  const lower = trimmed.toLowerCase();

  if (usStateMap[upper]) return usStateMap[upper];
  if (usStateMap[lower]) return usStateMap[lower];

  return trimmed;
}

// India-specific functions
export function getIndiaStateFromCity(cityName: string): string | null {
  return getStateFromCityByCountry(cityName, "IN");
}

export function isIndiaCity(name: string): boolean {
  return isCityInCountry(name, "IN");
}

export function isIndiaState(name: string): boolean {
  return isStateInCountry(name, "IN");
}

// China-specific functions
export function getChinaProvinceFromCity(cityName: string): string | null {
  return getStateFromCityByCountry(cityName, "CN");
}

export function isChinaCity(name: string): boolean {
  return isCityInCountry(name, "CN");
}

export function isChinaProvince(name: string): boolean {
  return isStateInCountry(name, "CN");
}
