import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import Header from '@/components/layout/Header';
import TodayOverview from '@/components/dashboard/TodayOverview';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  // Fetch default property
  const { data: property } = await supabase
    .from('properties')
    .select('id')
    .limit(1)
    .single();

  const propertyId = property?.id || '';

  // Fetch today's data
  const today = new Date().toISOString().split('T')[0];

  const [
    roomTypes,
    currentPrices,
    dailyRates,
    weather,
    events,
    competitorPrices,
  ] = await Promise.all([
    supabase.from('room_types').select('*').eq('property_id', propertyId),
    supabase.from('current_prices').select('*, room_type:room_types(*)').eq('property_id', propertyId).eq('date', today),
    supabase.from('daily_rates').select('*').eq('property_id', propertyId).eq('date', today),
    supabase.from('weather_data').select('*').eq('property_id', propertyId).eq('date', today).maybeSingle(),
    supabase.from('events').select('*').eq('property_id', propertyId).lte('start_date', today).gte('end_date', today),
    supabase.from('competitor_prices').select('*').eq('property_id', propertyId).eq('date', today),
  ]);

  return (
    <>
      <Header title="Today's Overview" />
      <div className="p-6">
        <TodayOverview
          roomTypes={roomTypes.data || []}
          currentPrices={currentPrices.data || []}
          dailyRates={dailyRates.data || []}
          weather={weather.data}
          events={events.data || []}
          competitorPrices={competitorPrices.data || []}
        />
      </div>
    </>
  );
}
