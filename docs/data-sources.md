# Data Sources Documentation

## Overview

Mietchecker aggregates property evaluation metrics from multiple authoritative sources across Germany. This document describes how data is sourced, integrated, and extended to new cities.

## OpenStreetMap / Overpass API

### Purpose
OpenStreetMap (OSM) provides crowdsourced geographic data including Points of Interest (POIs), amenities, and infrastructure features. The Overpass API allows complex geospatial queries.

### Architecture

**Location**: `lib/osm.ts`

**Core Functions**:
- `fetchNearbyPOIs()` - Generic POI query by tags and radius
- `fetchGroceryStores()` - Supermarkets, convenience stores within 500m
- `fetchLaundromats()` - Laundry facilities within 1000m
- `fetchParking()` - Parking spaces and facilities within 500m
- `estimateLightPollution()` - Light pollution estimation using street lamps and urban features
- `fetchAllOSMMetrics()` - Aggregate all OSM metrics for a location

### Query Language (Overpass QL)

Overpass uses a custom query language. Example query for grocery stores:

```
[out:json][timeout:25];
(
  node["shop"~"supermarket|convenience|organic|grocery"](around:500,52.5200,13.4050);
  way["shop"~"supermarket|convenience|organic|grocery"](around:500,52.5200,13.4050);
);
out center;
```

**Components**:
- `[out:json]` - Output format (JSON)
- `[timeout:25]` - Query timeout in seconds
- `node[tags]` - Point features matching tags
- `way[tags]` - Linear/area features matching tags
- `(around:radius,lat,lon)` - Radius filter in meters
- `out center` - Return center point for ways

### Supported Queries

**Grocery Stores**:
```
Tags: shop~"supermarket|convenience|organic|grocery"
Radius: 500m
```

**Laundromats**:
```
Tags: shop="laundry"
Radius: 1000m
```

**Parking**:
```
Tags: amenity~"parking|parking_space|parking_entrance"
Radius: 500m
```

**Light Pollution Estimation**:
```
Street Lamps: highway="street_lamp" (1000m radius)
Urban Features: landuse~"commercial|industrial|retail" (2000m radius)
Calculation: (lights/10 + urban_features/5) clamped to Bortle 1-9 scale
```

### Caching Strategy

**TTL**: 24 hours (86400 seconds)
**Key**: Hash of query string
**Implementation**: In-memory Map<string, CachedData>
**Invalidation**: Time-based only (no manual purge mechanism)

**Cache Structure**:
```typescript
cache.set(cacheKey, {
  data: OSMResponse,
  timestamp: Date.now()
});
```

**Considerations**:
- Suitable for development/small deployments
- For production, upgrade to Redis or Memcached
- Cache hits reduce external API calls and improve response time

### Rate Limiting & Retry Logic

**Retry Strategy**:
- Default 3 retries with exponential backoff
- Backoff: 2^i seconds (1s, 2s, 4s)
- Triggered on: HTTP 429 (rate limit), 504 (timeout), network errors

**Example Flow**:
```
Request attempt 1 → 429 Too Many Requests
Wait 1 second
Request attempt 2 → 504 Gateway Timeout
Wait 2 seconds
Request attempt 3 → 200 OK, return data
Cache for 24 hours
```

**API Limits**:
- Overpass: ~2,000 queries per day per IP
- Query timeout: 25 seconds (configured)
- Large area queries may fail (use smaller radius or pagination)

### POI Response Format

```json
{
  "id": 12345,
  "name": "Edeka Müller",
  "type": "supermarket",
  "lat": 52.5200,
  "lon": 13.4050,
  "distance": 245.5,
  "tags": {
    "amenity": "supermarket",
    "name": "Edeka Müller",
    "opening_hours": "Mo-Sa 07:00-20:00; Su 10:00-19:00",
    "parking": "yes"
  }
}
```

## City Open Data Integration

### Pattern for Integration

Each city data source follows a standardized pattern:

```typescript
interface CityDataSource {
  city: string;
  metrics: {
    noise: NoiseDataSource;
    crime: CrimeDataSource;
    internet_speed: InternetDataSource;
    demographics: DemographicsDataSource;
  };
}
```

### Berlin Open Data

**Authority**: Senatsverwaltung für Mobilität, Verkehr, Klimaschutz und Umwelt (SenMVKU)

**Available Datasets**:

#### Noise Pollution (Lärmkartierung)
- **Source**: Senatsverwaltung SenMVKU
- **Data Type**: Noise maps (dB levels by location)
- **Granularity**: Street-level
- **Update Frequency**: Every 3-5 years
- **Access**: Open data portal (daten.berlin.de)
- **Example Endpoint**:
  ```
  GET https://daten.berlin.de/api/action/package_search?q=lärmkartierung
  ```
- **Score Mapping**:
  - 30-50 dB: 90-100/100 (very quiet)
  - 51-65 dB: 70-89/100 (moderate)
  - 66-80 dB: 40-69/100 (loud)
  - 81+ dB: 0-39/100 (very loud)

#### Crime Statistics (Kriminalstatistik)
- **Source**: Polizei Berlin
- **Data Type**: Crime incidents per district and category
- **Granularity**: District level (Bezirk)
- **Update Frequency**: Annually
- **Access**: Polizei Berlin official reports
- **Metric**: Crimes per 1,000 inhabitants
- **Example**:
  ```
  District: Charlottenburg-Wilmersdorf
  Crime Rate: 12.5 per 1,000
  Score: 87/100 (inverted scale)
  ```

#### Demographics (Demografie)
- **Source**: Amt für Statistik Berlin-Brandenburg
- **Data Type**: Age distribution, population density
- **Granularity**: District and LOR (LebensweltOrientierte Räume)
- **Update Frequency**: Annually
- **Metric**: Average age
- **Optimal Range**: 30-40 years
- **Score Mapping**:
  - 20-29: Lower score (too young)
  - 30-40: 100/100 (optimal)
  - 41-50: Lower score (too old)

### Hamburg Open Data

**Authority**: Freie und Hansestadt Hamburg

**Available Datasets**:

#### Internet Speed
- **Source**: Bundesnetzagentur / City measurement campaigns
- **Data Type**: Broadband availability and speed
- **Granularity**: Postal code / micro-location
- **Update Frequency**: Annually
- **Metric**: Mbps (theoretical maximum)
- **Access**: hamburg.de or BNA portal
- **Example**:
  ```
  Location: 22767 Hamburg (Altona)
  Available: VDSL 50 Mbps, FTTH 1 Gbps
  Score: 95/100
  ```

#### Demographics
- **Source**: Statistisches Amt für Hamburg und Schleswig-Holstein
- **Data Type**: Population, age distribution, household types
- **Granularity**: District (Bezirk) and statistics area
- **Update Frequency**: Annually
- **Metric**: Average age, household composition

### Extensible City Data Pattern

**Location**: `lib/cityData.ts`

**Structure**:
```typescript
interface CityDataConfig {
  name: string;
  country: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  dataSources: {
    noise?: {
      provider: string;
      endpoint: string;
      method: 'api' | 'dataset';
      transform?: (raw: any) => number;
    };
    crime?: {...};
    internet_speed?: {...};
    demographics?: {...};
  };
}
```

**Current Implementation**:
```typescript
export const cityDataSources = {
  berlin: {
    name: 'Berlin',
    noise: berlinNoiseProvider,
    crime: berlinCrimeProvider,
    demographics: berlinDemographicsProvider,
  },
  hamburg: {
    name: 'Hamburg',
    internet_speed: hamburgInternetProvider,
    demographics: hamburgDemographicsProvider,
  },
};
```

## How to Add a New City

### Step 1: Identify Data Sources

Research and collect authoritative sources for your city:

```
Target Metrics:
- Noise pollution
- Crime statistics
- Internet speed availability
- Demographics (age)
```

**Resources**:
- City government open data portals
- National statistical offices
- Infrastructure operators (Deutsche Telekom, Vodafone for internet)
- Police departments
- Planning departments (Amt für Stadtplanung)

### Step 2: Create City Data Provider

Create a new file `lib/providers/[cityName]Provider.ts`:

```typescript
// lib/providers/municchProvider.ts (example for Munich)

import { CityMetricProvider } from '@/types/cityData';

export const municchNoiseProvider: CityMetricProvider = {
  name: 'Munich Noise Maps',
  endpoint: 'https://www.muenchen.de/...api/noise',
  method: 'api',
  async fetch(lat: number, lon: number): Promise<number> {
    try {
      const response = await fetch(
        `https://www.muenchen.de/api/noise?lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      // Transform raw API response to dB value
      return data.noise_level_db;
    } catch (error) {
      console.error('Failed to fetch Munich noise data:', error);
      throw error;
    }
  }
};

export const municchCrimeProvider: CityMetricProvider = {
  name: 'Munich Crime Statistics',
  endpoint: 'https://www.muenchen.de/...api/crime',
  method: 'api',
  async fetch(lat: number, lon: number): Promise<number> {
    // Determine district from coordinates
    const district = getDistrictFromCoords(lat, lon);
    const response = await fetch(
      `https://www.muenchen.de/api/crime/${district}`
    );
    const data = await response.json();
    return data.crime_per_1000;
  }
};

export const municchInternetProvider: CityMetricProvider = {
  name: 'Munich Internet Speed',
  endpoint: 'https://www.muenchen.de/...api/internet',
  method: 'api',
  async fetch(lat: number, lon: number): Promise<number> {
    const response = await fetch(
      `https://www.muenchen.de/api/internet?lat=${lat}&lon=${lon}`
    );
    const data = await response.json();
    return data.max_speed_mbps;
  }
};

export const municchDemographicsProvider: CityMetricProvider = {
  name: 'Munich Demographics',
  endpoint: 'https://www.muenchen.de/...api/demographics',
  method: 'api',
  async fetch(lat: number, lon: number): Promise<number> {
    const district = getDistrictFromCoords(lat, lon);
    const response = await fetch(
      `https://www.muenchen.de/api/demographics/${district}`
    );
    const data = await response.json();
    return data.average_age;
  }
};

function getDistrictFromCoords(lat: number, lon: number): string {
  // Implement reverse geocoding or coordinate-to-district mapping
  // Could use OSM or local mapping
  const districts = {
    'altstadt-lehel': { bounds: {...} },
    'ludwigsvorstadt': { bounds: {...} },
    // ... more districts
  };

  for (const [name, config] of Object.entries(districts)) {
    if (isInBounds(lat, lon, config.bounds)) {
      return name;
    }
  }

  return 'unknown';
}

function isInBounds(lat: number, lon: number, bounds: any): boolean {
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lon >= bounds.west &&
    lon <= bounds.east
  );
}
```

### Step 3: Register City in cityData.ts

```typescript
// lib/cityData.ts

import {
  municchNoiseProvider,
  municchCrimeProvider,
  municchInternetProvider,
  municchDemographicsProvider,
} from './providers/municchProvider';

export const cityDataSources = {
  // ... existing cities

  munich: {
    name: 'Munich',
    country: 'Germany',
    bounds: {
      north: 48.2735,
      south: 48.0903,
      east: 11.7041,
      west: 11.3701,
    },
    providers: {
      noise: municchNoiseProvider,
      crime: municchCrimeProvider,
      internet_speed: municchInternetProvider,
      demographics: municchDemographicsProvider,
    },
  },
};

/**
 * Get data providers for a city by name or coordinates
 */
export async function getCityProviders(
  cityName: string
): Promise<CityProviders | null> {
  return cityDataSources[cityName.toLowerCase()] || null;
}

/**
 * Fetch all metrics for a location (combines OSM + city data)
 */
export async function fetchLocationMetrics(
  lat: number,
  lon: number,
  cityName: string
) {
  const providers = await getCityProviders(cityName);
  if (!providers) {
    throw new Error(`No data sources configured for city: ${cityName}`);
  }

  const [osm, noise, crime, internet, demographics] = await Promise.all([
    fetchAllOSMMetrics(lat, lon),
    providers.noise?.fetch(lat, lon).catch(() => null),
    providers.crime?.fetch(lat, lon).catch(() => null),
    providers.internet_speed?.fetch(lat, lon).catch(() => null),
    providers.demographics?.fetch(lat, lon).catch(() => null),
  ]);

  return {
    osm,
    noise,
    crime,
    internet_speed: internet,
    demographics,
  };
}
```

### Step 4: Update Type Definitions

```typescript
// types/database.ts

export type MetricKey =
  | 'noise'
  | 'light'
  | 'crime'
  | 'internet_speed'
  | 'demographics'
  | 'grocery_stores'
  | 'laundromats'
  | 'parking';

export interface ProjectMetric {
  id: string;
  project_id: string;
  metric_key: MetricKey;
  metric_value: number;
  normalized_score: number;
  raw: Record<string, any>;
  source: string; // e.g., "OpenStreetMap", "Berlin Senatsverwaltung"
  fetched_at: Date;
}
```

### Step 5: Update API Route for Data Ingestion

```typescript
// app/api/projects/[projectId]/ingest/route.ts

import { fetchLocationMetrics } from '@/lib/cityData';

export async function POST(request: NextRequest, { params }: Params) {
  // ... authentication checks ...

  const { latitude, longitude, address } = project;

  try {
    // Detect city from address or use fallback
    const city = extractCityFromAddress(address) || 'berlin';

    // Fetch metrics from all sources
    const metrics = await fetchLocationMetrics(latitude, longitude, city);

    // Normalize and store
    // ... rest of ingestion logic ...

  } catch (error) {
    console.error('Data ingestion failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Step 6: Test Your Integration

```bash
# Test locally
npm run dev

# Create a test project in your city
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Property Munich",
    "address": "Marienplatz 8, 80331 Munich",
    "latitude": 48.1376,
    "longitude": 11.5755
  }'

# Trigger data ingestion
curl -X POST http://localhost:3000/api/projects/:projectId/ingest \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verify metrics were fetched and normalized
curl http://localhost:3000/api/projects/:projectId \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Rate Limiting & Caching Strategy

### Overpass API Caching

**Current Implementation**: In-memory cache (24-hour TTL)

**Production Upgrade Path**:
1. **Redis Cache** (recommended for 1000+ users)
   ```typescript
   import Redis from 'redis';
   const client = Redis.createClient(REDIS_URL);

   async function getCachedData<T>(key: string): Promise<T | null> {
     return JSON.parse(await client.get(key));
   }

   async function setCachedData(key: string, data: any, ttl = 86400) {
     await client.setex(key, ttl, JSON.stringify(data));
   }
   ```

2. **Database-level Caching** (for project metrics)
   - Store raw OSM responses in `project_metrics.raw` JSONB
   - Query cache validity before external API call
   - Invalidate on manual refresh

### City Data API Rate Limiting

**Strategy**: Implement per-city rate limits

```typescript
const rateLimits = {
  berlin: {
    noise: 1000, // queries/day
    crime: 1000,
  },
  hamburg: {
    internet_speed: 500,
  },
};

async function checkCityRateLimit(
  city: string,
  provider: string
): Promise<boolean> {
  const limit = rateLimits[city]?.[provider];
  if (!limit) return true; // No limit configured

  // Check against today's query count
  const key = `rate:${city}:${provider}:${date}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 86400); // Reset daily
  }

  return count <= limit;
}
```

### Data Freshness & Invalidation

**Freshness Policy**:
```
Metric Type          | TTL | Invalidation
---------------------|-----|----------------------------
OSM POI Data        | 24h | Time-based
Noise Maps          | 7d  | Time-based or manual
Crime Statistics    | 30d | Annual city updates
Internet Speed      | 30d | ISP network changes
Demographics        | 365d| Census cycles
```

**Manual Refresh Trigger**:
```typescript
// User can manually refresh metrics
PUT /api/projects/:id/metrics/refresh

// Invalidates cached data and re-fetches from sources
// Useful when source data updated but cache TTL not expired
```

## Example Endpoints & Responses

### Berlin Example

**Request**:
```bash
POST /api/projects/:projectId/ingest
Content-Type: application/json
Authorization: Bearer ${JWT}

{
  "force_refresh": false
}
```

**Response**:
```json
{
  "project_id": "uuid-123",
  "metrics": {
    "grocery_stores": {
      "raw_value": 8,
      "normalized_score": 90,
      "pois": [
        {
          "id": 1234567,
          "name": "REWE Prenzlauer Berg",
          "type": "supermarket",
          "distance_m": 245,
          "lat": 52.5340,
          "lon": 13.4115
        }
      ],
      "source": "OpenStreetMap",
      "fetched_at": "2024-11-18T10:30:00Z"
    },
    "noise": {
      "raw_value": 65.5,
      "normalized_score": 72,
      "unit": "dB",
      "source": "Berlin Senatsverwaltung SenMVKU",
      "fetched_at": "2024-11-18T10:30:00Z"
    },
    "crime": {
      "raw_value": 12.8,
      "normalized_score": 87,
      "unit": "per_1000_inhabitants",
      "district": "Pankow",
      "source": "Polizei Berlin",
      "fetched_at": "2024-11-18T10:30:00Z"
    },
    "light": {
      "raw_value": 4,
      "normalized_score": 60,
      "scale": "bortle",
      "interpretation": "Light-polluted sky",
      "source": "OpenStreetMap",
      "fetched_at": "2024-11-18T10:30:00Z"
    },
    "demographics": {
      "raw_value": 35.2,
      "normalized_score": 95,
      "unit": "average_age",
      "source": "Amt für Statistik Berlin-Brandenburg",
      "fetched_at": "2024-11-18T10:30:00Z"
    }
  },
  "overall_score": 81
}
```

### Hamburg Example

**Request**:
```bash
POST /api/projects/:projectId/ingest
Content-Type: application/json
Authorization: Bearer ${JWT}

{
  "force_refresh": false
}
```

**Response**:
```json
{
  "project_id": "uuid-456",
  "metrics": {
    "internet_speed": {
      "raw_value": 250,
      "normalized_score": 95,
      "unit": "Mbps",
      "technologies": ["VDSL 50", "FTTH 1000"],
      "source": "Bundesnetzagentur",
      "fetched_at": "2024-11-18T10:30:00Z"
    },
    "demographics": {
      "raw_value": 38.5,
      "normalized_score": 88,
      "unit": "average_age",
      "source": "Statistisches Amt Hamburg-Schleswig-Holstein",
      "fetched_at": "2024-11-18T10:30:00Z"
    },
    "parking": {
      "raw_value": 12,
      "normalized_score": 85,
      "pois": [
        {
          "id": 7654321,
          "name": "Parkhaus Altona",
          "type": "parking",
          "distance_m": 120,
          "lat": 53.5483,
          "lon": 9.9360
        }
      ],
      "source": "OpenStreetMap",
      "fetched_at": "2024-11-18T10:30:00Z"
    }
  },
  "overall_score": 79
}
```

## Troubleshooting Data Integration

### Common Issues

**Issue**: Overpass API returns 429 (Too Many Requests)
- **Solution**: Increase retry delay or wait before next query. Check if cache is working.

**Issue**: City data provider returns invalid coordinates
- **Solution**: Validate lat/lon bounds before querying. Some providers have geographic boundaries.

**Issue**: Missing metrics for a location
- **Solution**: Not all providers cover all cities. Verify city configuration and provider availability.

**Issue**: Stale data in cache
- **Solution**: Use `force_refresh=true` parameter or clear cache via Redis.

## Future Data Sources

Planned integrations:
- **Traffic/Commute**: Google Maps API, BVG (Berlin transit)
- **Air Quality**: AQICN API, UBA (German Environmental Agency)
- **School Ratings**: SchulÖffner, local education data
- **Housing Market**: ImmoScout24 API (if available), Zensus data
- **Events/Culture**: OpenStreetMap (cultural venues), local APIs
