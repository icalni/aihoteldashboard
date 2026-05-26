// ============================================================
// GET /api/debug — Diagnostic endpoint to check database state
// ============================================================
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-client';

export async function GET() {
  const supabase = createAdminClient();
  const results: Record<string, unknown> = {};

  try {
    // Check tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('properties')
      .select('count');

    results.tablesCheck = { tables, error: tablesError };

    // Check properties
    const { data: properties, error: propError } = await supabase
      .from('properties')
      .select('*');
    results.properties = { data: properties, error: propError };

    if (properties && properties.length > 0) {
      const propertyId = properties[0].id;

      // Check room types
      const { data: roomTypes } = await supabase
        .from('room_types')
        .select('*')
        .eq('property_id', propertyId);
      results.roomTypes = { count: roomTypes?.length || 0 };

      // Check daily rates
      const { data: dailyRates } = await supabase
        .from('daily_rates')
        .select('count')
        .eq('property_id', propertyId);
      results.dailyRates = dailyRates;

      // Check current prices
      const { data: currentPrices } = await supabase
        .from('current_prices')
        .select('count')
        .eq('property_id', propertyId);
      results.currentPrices = currentPrices;

      // Check competitor prices
      const { data: competitors } = await supabase
        .from('competitor_prices')
        .select('count')
        .eq('property_id', propertyId);
      results.competitors = competitors;

      // Check weather
      const { data: weather } = await supabase
        .from('weather_data')
        .select('count')
        .eq('property_id', propertyId);
      results.weather = weather;

      // Check events
      const { data: events } = await supabase
        .from('events')
        .select('count')
        .eq('property_id', propertyId);
      results.events = events;

      // Check pricing recommendations
      const { data: recommendations } = await supabase
        .from('pricing_recommendations')
        .select('count')
        .eq('property_id', propertyId);
      results.recommendations = recommendations;

      // Check env vars
      results.envVars = {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        deepseekKey: !!process.env.DEEPSEEK_API_KEY,
      };
    }
  } catch (err) {
    results.error = String(err);
  }

  return NextResponse.json(results);
}
