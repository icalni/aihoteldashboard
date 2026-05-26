// ============================================================
// GET /api/weather — Fetch weather data from OpenWeatherMap
// ============================================================
//
// Proxies OpenWeatherMap One Call API 3.0, stores results in DB,
// and returns stored weather for the default property.
//
// Query params:
//   refresh=true — Forces a fresh fetch from OpenWeatherMap
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-client';
import { weatherService } from '@/lib/services/weather-service';
import { DEFAULT_PROPERTY } from '@/lib/utils/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';

    // Get the first property
    const supabase = createAdminClient();
    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .limit(1)
      .single();

    if (!property) {
      return NextResponse.json(
        { error: 'No property found. Run seed data first.' },
        { status: 404 }
      );
    }

    const propertyId = property.id;

    // Optionally refresh from OpenWeatherMap API
    if (refresh) {
      await weatherService.fetchAndStoreWeather(propertyId);
    }

    // Get stored weather data (next 7 days)
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    const endDateStr = endDate.toISOString().split('T')[0];

    const { data: weatherData, error } = await supabase
      .from('weather_data')
      .select('*')
      .eq('property_id', propertyId)
      .gte('date', today)
      .lte('date', endDateStr)
      .order('date', { ascending: true });

    if (error) {
      console.error('[API /weather] DB query error:', error);
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      property_id: propertyId,
      location: {
        name: DEFAULT_PROPERTY.name,
        city: DEFAULT_PROPERTY.city,
        lat: DEFAULT_PROPERTY.lat,
        lng: DEFAULT_PROPERTY.lng,
      },
      forecast: weatherData || [],
      source: refresh ? 'fresh' : 'cached',
    });
  } catch (error) {
    console.error('[API /weather] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
