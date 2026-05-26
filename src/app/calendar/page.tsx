import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import Header from '@/components/layout/Header';
import PricingCalendar from '@/components/calendar/PricingCalendar';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const supabase = await createServerSupabaseClient();

  const { data: property } = await supabase
    .from('properties')
    .select('id')
    .limit(1)
    .single();

  const propertyId = property?.id || '';
  const today = new Date().toISOString().split('T')[0];

  // Get date range for next 30 days
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  const endDateStr = endDate.toISOString().split('T')[0];

  const [currentPrices, recommendations] = await Promise.all([
    supabase
      .from('current_prices')
      .select('*, room_type:room_types(*)')
      .eq('property_id', propertyId)
      .gte('date', today)
      .lte('date', endDateStr),
    supabase
      .from('pricing_recommendations')
      .select('*, room_type:room_types(*)')
      .eq('property_id', propertyId)
      .gte('date', today)
      .lte('date', endDateStr),
  ]);

  return (
    <>
      <Header title="30-Day Pricing Calendar" />
      <div className="p-6">
        <PricingCalendar
          currentPrices={currentPrices.data || []}
          recommendations={recommendations.data || []}
        />
      </div>
    </>
  );
}
