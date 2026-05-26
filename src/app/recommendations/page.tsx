import { createServerSupabaseClient } from '@/lib/supabase/server-client';
import Header from '@/components/layout/Header';
import RecommendationFeed from '@/components/recommendations/RecommendationFeed';

export const dynamic = 'force-dynamic';

export default async function RecommendationsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: property } = await supabase
    .from('properties')
    .select('id')
    .limit(1)
    .single();

  const propertyId = property?.id || '';

  const { data: recommendations } = await supabase
    .from('pricing_recommendations')
    .select('*, room_type:room_types(*)')
    .eq('property_id', propertyId)
    .order('date', { ascending: true });

  return (
    <>
      <Header title="Recommendations" />
      <div className="p-6">
        <RecommendationFeed
          initialRecommendations={recommendations || []}
        />
      </div>
    </>
  );
}
