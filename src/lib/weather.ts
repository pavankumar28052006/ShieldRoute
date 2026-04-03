/**
 * weather.ts
 * Live weather and AQI data service for ShieldRoute.
 * Uses OpenWeatherMap (current weather + air pollution API).
 * Falls back gracefully to static demo values if API key is absent.
 */

const ZONE_TO_CITY: Record<string, { city: string; country: string }> = {
  Koramangala: { city: 'Bengaluru', country: 'IN' },
  'Banjara Hills': { city: 'Hyderabad', country: 'IN' },
  Andheri: { city: 'Mumbai', country: 'IN' },
  'Connaught Place': { city: 'New Delhi', country: 'IN' },
  'T Nagar': { city: 'Chennai', country: 'IN' },
};

export interface WeatherData {
  rainfall_mm: number;
  temperature_c: number;
  description: string;
  aqi: number;
  aqiCategory: string;
  isLive: boolean;
}

export interface ActiveTrigger {
  code: string;
  name: string;
  value: string;
  threshold: string;
}

/** Map OpenWeatherMap AQI index (1–5) to approximate AQI number. */
function mapAQIIndex(index: number): number {
  switch (index) {
    case 1: return 30;   // Good
    case 2: return 80;   // Fair
    case 3: return 160;  // Moderate
    case 4: return 260;  // Poor
    case 5: return 420;  // Very Poor / Hazardous
    default: return 100;
  }
}

function getAQICategory(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 200) return 'Unhealthy (Sensitive)';
  if (aqi <= 300) return 'Unhealthy';
  if (aqi <= 400) return 'Very Unhealthy';
  return 'Hazardous';
}

const STATIC_FALLBACK: WeatherData = {
  rainfall_mm: 0,
  temperature_c: 28,
  description: 'Clear',
  aqi: 120,
  aqiCategory: 'Moderate',
  isLive: false,
};

/**
 * Fetch real weather and AQI for a given delivery zone.
 * Requires VITE_OPENWEATHERMAP_KEY to be set; otherwise returns static fallback.
 */
export async function getWeatherForZone(zone: string): Promise<WeatherData> {
  const apiKey = import.meta.env.VITE_OPENWEATHERMAP_KEY;
  const location = ZONE_TO_CITY[zone];

  if (!apiKey || !location) return STATIC_FALLBACK;

  try {
    // 1. Current weather
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        location.city
      )},${location.country}&appid=${apiKey}&units=metric`
    );
    if (!weatherRes.ok) return STATIC_FALLBACK;
    const w = await weatherRes.json();

    const rainfall_mm: number = w.rain?.['1h'] ?? 0;
    const temperature_c: number = Math.round((w.main?.temp ?? 28) * 10) / 10;
    const description: string = w.weather?.[0]?.main ?? 'Clear';
    const lat: number | undefined = w.coord?.lat;
    const lon: number | undefined = w.coord?.lon;

    // 2. Air pollution (same key, lat/lon from weather response)
    let aqi = 120;
    let aqiCategory = 'Moderate';

    if (lat !== undefined && lon !== undefined) {
      const aqiRes = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
      );
      if (aqiRes.ok) {
        const aq = await aqiRes.json();
        const aqiIndex: number | undefined = aq.list?.[0]?.main?.aqi;
        if (aqiIndex) {
          aqi = mapAQIIndex(aqiIndex);
          aqiCategory = getAQICategory(aqi);
        }
      }
    }

    return { rainfall_mm, temperature_c, description, aqi, aqiCategory, isLive: true };
  } catch {
    return STATIC_FALLBACK;
  }
}

/**
 * Check which parametric triggers are breached for given weather data.
 * Only flags triggers that are in the worker's covered plan.
 */
export function checkActiveTriggers(
  weather: WeatherData,
  coveredTriggers: string[]
): ActiveTrigger[] {
  const active: ActiveTrigger[] = [];

  if (coveredTriggers.includes('Rain') && weather.rainfall_mm >= 35) {
    active.push({
      code: 'T01',
      name: 'Heavy Rainfall',
      value: `${weather.rainfall_mm.toFixed(1)}mm/hr`,
      threshold: '≥35mm in 6h',
    });
  }

  if (coveredTriggers.includes('Heat') && weather.temperature_c >= 44) {
    active.push({
      code: 'T02',
      name: 'Extreme Heat',
      value: `${weather.temperature_c.toFixed(1)}°C`,
      threshold: '≥44°C for 4h',
    });
  }

  if (coveredTriggers.includes('AQI') && weather.aqi >= 400) {
    active.push({
      code: 'T03',
      name: 'Severe AQI',
      value: `AQI ${weather.aqi}`,
      threshold: 'AQI ≥400 for 3h',
    });
  }

  return active;
}
