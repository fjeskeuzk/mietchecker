// OpenStreetMap / Overpass API integration
// Fetches POIs, amenities, and geographic data

import { MetricKey } from '@/types/database';

const OVERPASS_URL =
  process.env.OPENSTREETMAP_OVERPASS_URL || 'https://overpass-api.de/api/interpreter';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export interface OSMElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  center?: { lat: number; lon: number };
}

export interface OSMResponse {
  elements: OSMElement[];
}

export interface POI {
  id: number;
  name: string | null;
  type: string;
  lat: number;
  lon: number;
  distance?: number;
  tags: Record<string, string>;
}

// Cache for API responses
const cache = new Map<string, { data: unknown; timestamp: number }>();

function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return cached.data as T;
}

function setCachedData(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Query Overpass API with retry logic
async function queryOverpass(query: string, retries = 3): Promise<OSMResponse> {
  const cacheKey = `overpass:${query}`;
  const cached = getCachedData<OSMResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(OVERPASS_URL, {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 504) {
          // Rate limited or timeout - wait and retry
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
          continue;
        }
        throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setCachedData(cacheKey, data);
      return data;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }

  throw new Error('Failed to query Overpass API after retries');
}

// Fetch nearby POIs by tags
export async function fetchNearbyPOIs(
  lat: number,
  lon: number,
  radius: number,
  tags: Record<string, string | string[]>
): Promise<POI[]> {
  // Build Overpass QL query
  const tagFilters = Object.entries(tags)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `["${key}"~"${value.join('|')}"]`;
      }
      return `["${key}"="${value}"]`;
    })
    .join('');

  const query = `
    [out:json][timeout:25];
    (
      node${tagFilters}(around:${radius},${lat},${lon});
      way${tagFilters}(around:${radius},${lat},${lon});
    );
    out center;
  `;

  const response = await queryOverpass(query);

  return response.elements.map((element) => {
    const elementLat = element.lat ?? element.center?.lat ?? lat;
    const elementLon = element.lon ?? element.center?.lon ?? lon;
    const distance = calculateDistance(lat, lon, elementLat, elementLon);

    return {
      id: element.id,
      name: element.tags?.name ?? null,
      type: element.tags?.amenity ?? element.tags?.shop ?? 'unknown',
      lat: elementLat,
      lon: elementLon,
      distance,
      tags: element.tags ?? {},
    };
  });
}

// Fetch grocery stores nearby
export async function fetchGroceryStores(lat: number, lon: number, radius = 500): Promise<POI[]> {
  return fetchNearbyPOIs(lat, lon, radius, {
    shop: ['supermarket', 'convenience', 'organic', 'grocery'],
  });
}

// Fetch laundromats nearby
export async function fetchLaundromats(lat: number, lon: number, radius = 1000): Promise<POI[]> {
  return fetchNearbyPOIs(lat, lon, radius, {
    shop: 'laundry',
  });
}

// Fetch parking facilities
export async function fetchParking(lat: number, lon: number, radius = 500): Promise<POI[]> {
  return fetchNearbyPOIs(lat, lon, radius, {
    amenity: ['parking', 'parking_space', 'parking_entrance'],
  });
}

// Estimate light pollution based on urban features
export async function estimateLightPollution(lat: number, lon: number): Promise<number> {
  // Fetch street lights and urban features
  const lights = await fetchNearbyPOIs(lat, lon, 1000, {
    highway: 'street_lamp',
  });

  const urbanFeatures = await fetchNearbyPOIs(lat, lon, 2000, {
    landuse: ['commercial', 'industrial', 'retail'],
  });

  // Simple heuristic: more lights and urban features = higher light pollution
  // Bortle scale equivalent (1-9, lower is better)
  const lightScore = Math.min(lights.length / 10, 5);
  const urbanScore = Math.min(urbanFeatures.length / 5, 4);

  return Math.min(lightScore + urbanScore, 9);
}

// Geocode an address to coordinates using Nominatim
export async function geocodeAddress(address: string): Promise<{
  latitude: number;
  longitude: number;
  displayName: string;
} | null> {
  const cacheKey = `geocode:${address}`;
  const cached = getCachedData<{ latitude: number; longitude: number; displayName: string }>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(
      `${NOMINATIM_URL}/search?` +
        new URLSearchParams({
          q: address,
          format: 'json',
          limit: '1',
          addressdetails: '1',
        }),
      {
        headers: {
          'User-Agent': 'Mietchecker/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error('Nominatim error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return null;
    }

    const result = {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };

    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Fetch all OSM metrics for a location
export async function fetchAllOSMMetrics(lat: number, lon: number) {
  const [groceryStores, laundromats, parking, lightPollution] = await Promise.all([
    fetchGroceryStores(lat, lon),
    fetchLaundromats(lat, lon),
    fetchParking(lat, lon),
    estimateLightPollution(lat, lon),
  ]);

  return {
    grocery_stores: {
      count: groceryStores.length,
      pois: groceryStores,
      radius: 500,
    },
    laundromats: {
      count: laundromats.length,
      pois: laundromats,
      radius: 1000,
    },
    parking: {
      count: parking.length,
      pois: parking,
      radius: 500,
    },
    light: {
      level: lightPollution,
      scale: 'bortle',
    },
  };
}
