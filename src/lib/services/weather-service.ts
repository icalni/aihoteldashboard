// ============================================================
// Weather Service — OpenWeatherMap Integration
// ============================================================

import { createAdminClient } from '@/lib/supabase/server-client';
import { DEFAULT_PROPERTY } from '@/lib/utils/constants';

interface WeatherAPIResponse {
  daily: Array<{
    dt: number;
    temp: {
      max: number;
      min: number;
    };
    weather: Array<{
      main: string;
      description: string;
    }>;
    pop: number; // probability of precipitation
  }>;
}

export class WeatherService {
  /**
   * Fetch weather forecast from OpenWeatherMap API and store in DB.
   */
  async fetchAndStoreWeather(propertyId: string): Promise<void> {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    const supabase = createAdminClient();

    if (!apiKey) {
      console.warn('[WeatherService] No API key configured, skipping');
      return;
    }

    try {
      const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${DEFAULT_PROPERTY.lat}&lon=${DEFAULT_PROPERTY.lng}&exclude=current,minutely,hourly,alerts&units=metric&appid=${apiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        console.error(`[WeatherService] API error: ${response.status}`);
        return;
      }

      const data: WeatherAPIResponse = await response.json();

      if (!data.daily) {
        console.warn('[WeatherService] No daily forecast data');
        return;
      }

      // Insert each day's forecast
      const rows = data.daily.slice(0, 8).map((day) => ({
        property_id: propertyId,
        date: new Date(day.dt * 1000).toISOString().split('T')[0],
        high_temp: day.temp.max,
        low_temp: day.temp.min,
        condition: day.weather[0]?.main || 'Unknown',
        precipitation_pct: Math.round(day.pop * 100),
      }));

      const { error } = await supabase
        .from('weather_data')
        .upsert(rows, { onConflict: 'property_id,date' });

      if (error) {
        console.error('[WeatherService] DB insert error:', error);
      }
    } catch (error) {
      console.error('[WeatherService] Fetch error:', error);
    }
  }

  /**
   * Generate mock weather data when API is unavailable.
   */
  async seedMockWeather(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<void> {
    const supabase = createAdminClient();
    const rows: Array<Record<string, unknown>> = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const conditions = ['Sunny', 'Cloudy', 'Partly Cloudy', 'Clear', 'Rainy', 'Thunderstorms'];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const month = d.getMonth();

      // Jakarta tropical climate simulation
      const baseHigh = month >= 10 || month <= 3 ? 31 : 33; // Rainy vs dry season
      const baseLow = month >= 10 || month <= 3 ? 24 : 26;

      rows.push({
        property_id: propertyId,
        date: dateStr,
        high_temp: baseHigh + Math.round((Math.random() - 0.5) * 4),
        low_temp: baseLow + Math.round((Math.random() - 0.5) * 3),
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        precipitation_pct: Math.round(Math.random() * (month >= 10 || month <= 3 ? 80 : 30)),
      });
    }

    const { error } = await supabase
      .from('weather_data')
      .upsert(rows, { onConflict: 'property_id,date' });

    if (error) {
      console.error('[WeatherService] Mock seed error:', error);
    }
  }
}

export const weatherService = new WeatherService();
