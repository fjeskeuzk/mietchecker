// City-specific open data integration
// Adapter pattern for different city data sources

import { MetricKey } from '@/types/database';

export interface CityDataConfig {
  name: string;
  endpoints: {
    crime?: string;
    noise?: string;
    internet?: string;
    demographics?: string;
  };
  parsers: {
    crime?: (data: unknown, lat: number, lon: number) => number | null;
    noise?: (data: unknown, lat: number, lon: number) => number | null;
    internet?: (data: unknown, lat: number, lon: number) => number | null;
    demographics?: (data: unknown, lat: number, lon: number) => number | null;
  };
}

// City configurations
export const CITY_CONFIGS: Record<string, CityDataConfig> = {
  berlin: {
    name: 'Berlin',
    endpoints: {
      // Example endpoints - these would be real city open data APIs in production
      crime: 'https://daten.berlin.de/api/crime',
      noise: 'https://daten.berlin.de/api/noise',
      internet: 'https://daten.berlin.de/api/broadband',
      demographics: 'https://daten.berlin.de/api/demographics',
    },
    parsers: {
      crime: (data: unknown) => {
        // Mock parser - in production, parse real data
        return 12.5; // incidents per 1000 residents
      },
      noise: (data: unknown) => {
        return 65.5; // dB level
      },
      internet: (data: unknown) => {
        return 250; // Mbps download speed
      },
      demographics: (data: unknown) => {
        return 35; // average age
      },
    },
  },
  hamburg: {
    name: 'Hamburg',
    endpoints: {
      crime: 'https://transparenz.hamburg.de/api/crime',
      noise: 'https://transparenz.hamburg.de/api/noise',
      internet: 'https://transparenz.hamburg.de/api/broadband',
      demographics: 'https://transparenz.hamburg.de/api/demographics',
    },
    parsers: {
      crime: (data: unknown) => 8.2,
      noise: (data: unknown) => 58.0,
      internet: (data: unknown) => 300,
      demographics: (data: unknown) => 32,
    },
  },
};

// Determine which city config to use based on coordinates
export function getCityConfigByCoordinates(lat: number, lon: number): CityDataConfig | null {
  // Simple bounding box check for major German cities
  // Berlin: ~52.3-52.7N, 13.1-13.8E
  if (lat >= 52.3 && lat <= 52.7 && lon >= 13.1 && lon <= 13.8) {
    return CITY_CONFIGS.berlin;
  }

  // Hamburg: ~53.4-53.7N, 9.7-10.3E
  if (lat >= 53.4 && lat <= 53.7 && lon >= 9.7 && lon <= 10.3) {
    return CITY_CONFIGS.hamburg;
  }

  return null;
}

// Fetch data from city endpoint with fallback
async function fetchCityEndpoint(url: string): Promise<unknown> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`City data endpoint returned ${response.status}: ${url}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch city data from ${url}:`, error);
    return null;
  }
}

// Fetch crime rate data
export async function fetchCityCrime(
  lat: number,
  lon: number,
  radius = 1000,
  cityConfig?: CityDataConfig
): Promise<number | null> {
  const config = cityConfig ?? getCityConfigByCoordinates(lat, lon);
  if (!config?.endpoints.crime || !config?.parsers.crime) {
    return null;
  }

  // In production, this would fetch real data
  // For now, return mock data based on city
  return config.parsers.crime(null, lat, lon);
}

// Fetch noise pollution data
export async function fetchCityNoise(
  lat: number,
  lon: number,
  radius = 500,
  cityConfig?: CityDataConfig
): Promise<number | null> {
  const config = cityConfig ?? getCityConfigByCoordinates(lat, lon);
  if (!config?.endpoints.noise || !config?.parsers.noise) {
    return null;
  }

  return config.parsers.noise(null, lat, lon);
}

// Fetch internet speed data
export async function fetchCityInternet(
  lat: number,
  lon: number,
  cityConfig?: CityDataConfig
): Promise<number | null> {
  const config = cityConfig ?? getCityConfigByCoordinates(lat, lon);
  if (!config?.endpoints.internet || !config?.parsers.internet) {
    return null;
  }

  return config.parsers.internet(null, lat, lon);
}

// Fetch demographics data
export async function fetchCityDemographics(
  lat: number,
  lon: number,
  cityConfig?: CityDataConfig
): Promise<number | null> {
  const config = cityConfig ?? getCityConfigByCoordinates(lat, lon);
  if (!config?.endpoints.demographics || !config?.parsers.demographics) {
    return null;
  }

  return config.parsers.demographics(null, lat, lon);
}

// Fetch all city metrics
export async function fetchAllCityMetrics(lat: number, lon: number) {
  const cityConfig = getCityConfigByCoordinates(lat, lon);

  if (!cityConfig) {
    console.warn('No city config found for coordinates:', { lat, lon });
    return null;
  }

  const [crime, noise, internet, demographics] = await Promise.all([
    fetchCityCrime(lat, lon, 1000, cityConfig),
    fetchCityNoise(lat, lon, 500, cityConfig),
    fetchCityInternet(lat, lon, cityConfig),
    fetchCityDemographics(lat, lon, cityConfig),
  ]);

  return {
    city: cityConfig.name,
    crime,
    noise,
    internet_speed: internet,
    demographics,
  };
}
