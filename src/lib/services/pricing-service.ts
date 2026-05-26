// ============================================================
// Pricing Service — Business Logic Layer
// ============================================================

import { createAdminClient } from '@/lib/supabase/server-client';
import { getPricingRecommendation } from '@/lib/ai/deepseek';
import type {
  PricingRecommendation,
  CurrentPrice,
  DailyRate,
  WeatherData,
  Event,
  CompetitorPrice,
  DashboardStats,
} from '@/types';

export class PricingService {
  private supabase = createAdminClient();

  /**
   * Get today's overview data for the dashboard.
   */
  async getTodayOverview(propertyId: string) {
    const today = new Date().toISOString().split('T')[0];

    const [
      property,
      roomTypes,
      currentPrices,
      dailyRates,
      weather,
      events,
      competitorPrices,
      pendingRecs,
    ] = await Promise.all([
      this.supabase.from('properties').select('*').eq('id', propertyId).single(),
      this.supabase.from('room_types').select('*').eq('property_id', propertyId),
      this.supabase.from('current_prices').select('*').eq('property_id', propertyId).eq('date', today),
      this.supabase.from('daily_rates').select('*').eq('property_id', propertyId).eq('date', today),
      this.supabase.from('weather_data').select('*').eq('property_id', propertyId).eq('date', today).single(),
      this.supabase.from('events').select('*')
        .eq('property_id', propertyId)
        .lte('start_date', today)
        .gte('end_date', today),
      this.supabase.from('competitor_prices').select('*')
        .eq('property_id', propertyId)
        .eq('date', today),
      this.supabase.from('pricing_recommendations').select('id', { count: 'exact', head: true })
        .eq('property_id', propertyId)
        .eq('status', 'pending'),
    ]);

    return {
      property: property.data,
      room_types: roomTypes.data || [],
      current_prices: currentPrices.data || [],
      daily_rates: dailyRates.data || [],
      weather: weather.data,
      events: events.data || [],
      competitor_prices: competitorPrices.data || [],
      pending_recommendations: pendingRecs.count || 0,
    };
  }

  /**
   * Get dashboard statistics (aggregated).
   */
  async getDashboardStats(propertyId: string): Promise<DashboardStats | null> {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];

    // Get today's rates
    const { data: todayRates } = await this.supabase
      .from('daily_rates')
      .select('*')
      .eq('property_id', propertyId)
      .eq('date', today);

    // Get last 14 days of rates for trends
    const { data: trendRates } = await this.supabase
      .from('daily_rates')
      .select('*')
      .eq('property_id', propertyId)
      .gte('date', fourteenDaysAgo)
      .lte('date', today)
      .order('date', { ascending: true });

    const typedTodayRates: Array<Record<string, unknown>> = (todayRates || []) as unknown as Array<Record<string, unknown>>;
    const typedTrendRates: Array<Record<string, unknown>> = (trendRates || []) as unknown as Array<Record<string, unknown>>;

    if (!todayRates || !trendRates) return null;

    // Calculate aggregates
    const totalRooms = typedTodayRates.reduce((s: number, r: Record<string, unknown>) => s + (r.available_rooms as number || 0) + (r.booked_rooms as number || 0), 0);
    const totalBooked = typedTodayRates.reduce((s: number, r: Record<string, unknown>) => s + (r.booked_rooms as number || 0), 0);
    const avgOccupancy = totalRooms > 0 ? (totalBooked / totalRooms) * 100 : 0;
    const avgAdr = typedTodayRates.reduce((s: number, r: Record<string, unknown>) => s + (r.adr as number || 0), 0) / (typedTodayRates.length || 1);
    const avgRevpar = avgOccupancy > 0 ? (avgAdr * avgOccupancy) / 100 : 0;

    // Trends
    const lastWeekRates = typedTrendRates.filter((r: Record<string, unknown>) => (r.date as string) >= sevenDaysAgo);
    const prevWeekRates = typedTrendRates.filter((r: Record<string, unknown>) => (r.date as string) < sevenDaysAgo);

    const lastWeekOcc = lastWeekRates.reduce((s: number, r: Record<string, unknown>) => s + (r.occupancy_rate as number || 0), 0) / (lastWeekRates.length || 1);
    const prevWeekOcc = prevWeekRates.reduce((s: number, r: Record<string, unknown>) => s + (r.occupancy_rate as number || 0), 0) / (prevWeekRates.length || 1);
    const wowOccChange = prevWeekOcc > 0 ? ((lastWeekOcc - prevWeekOcc) / prevWeekOcc) * 100 : 0;

    const lastWeekRevpar = lastWeekRates.reduce((s: number, r: Record<string, unknown>) => {
      const revpar = ((r.occupancy_rate as number || 0) * (r.adr as number || 0)) / 100;
      return s + revpar;
    }, 0) / (lastWeekRates.length || 1);

    const prevWeekRevpar = prevWeekRates.reduce((s: number, r: Record<string, unknown>) => {
      const revpar = ((r.occupancy_rate as number || 0) * (r.adr as number || 0)) / 100;
      return s + revpar;
    }, 0) / (prevWeekRates.length || 1);

    const wowRevparChange = prevWeekRevpar > 0 ? ((lastWeekRevpar - prevWeekRevpar) / prevWeekRevpar) * 100 : 0;

    // Build trend data (last 7 days)
    const occupancyTrend = lastWeekRates.map((r: Record<string, unknown>) => ({
      date: r.date as string,
      rate: r.occupancy_rate as number || 0,
    }));

    const revenueTrend = lastWeekRates.map((r: Record<string, unknown>) => ({
      date: r.date as string,
      revenue: r.revenue as number || 0,
    }));

    return {
      today_occupancy: Math.round(avgOccupancy * 100) / 100,
      today_adr: Math.round(avgAdr),
      today_revpar: Math.round(avgRevpar),
      occupancy_trend: occupancyTrend,
      revenue_trend: revenueTrend,
      week_over_week_occupancy: Math.round(wowOccChange * 100) / 100,
      week_over_week_revpar: Math.round(wowRevparChange * 100) / 100,
    };
  }

  /**
   * Generate AI pricing recommendation for a specific date and room type.
   */
  async generateRecommendation(
    propertyId: string,
    roomTypeId: string,
    roomTypeName: string,
    date: string
  ): Promise<PricingRecommendation | null> {
    // Get current price
    const { data: currentPrice } = await this.supabase
      .from('current_prices')
      .select('*')
      .eq('property_id', propertyId)
      .eq('room_type_id', roomTypeId)
      .eq('date', date)
      .single();

    if (!currentPrice) return null;

    // Get daily rate context
    const { data: dailyRate } = await this.supabase
      .from('daily_rates')
      .select('*')
      .eq('property_id', propertyId)
      .eq('room_type_id', roomTypeId)
      .eq('date', date)
      .single();

    // Get weather
    const { data: weather } = await this.supabase
      .from('weather_data')
      .select('*')
      .eq('property_id', propertyId)
      .eq('date', date)
      .single();

    // Get events overlapping this date
    const { data: events } = await this.supabase
      .from('events')
      .select('*')
      .eq('property_id', propertyId)
      .lte('start_date', date)
      .gte('end_date', date);

    // Get competitor average
    const { data: competitors } = await this.supabase
      .from('competitor_prices')
      .select('price')
      .eq('property_id', propertyId)
      .eq('date', date);

    const typedCompetitors = (competitors || []) as Array<Record<string, unknown>>;
    const competitorAvg = typedCompetitors.length > 0
      ? typedCompetitors.reduce((s: number, c: Record<string, unknown>) => s + Number(c.price), 0) / typedCompetitors.length
      : null;

    // Call DeepSeek AI
    const aiResponse = await getPricingRecommendation({
      date,
      roomType: roomTypeName,
      currentPrice: Number(currentPrice.current_price),
      occupancy: Number(dailyRate?.occupancy_rate || 0),
      adr: Number(dailyRate?.adr || 0),
      availableRooms: dailyRate?.available_rooms || 0,
      bookedRooms: dailyRate?.booked_rooms || 0,
      weatherCondition: weather?.condition || null,
      highTemp: weather ? Number(weather.high_temp) : null,
      lowTemp: weather ? Number(weather.low_temp) : null,
      events: ((events || []) as Array<Record<string, unknown>>).map((e: Record<string, unknown>) => e.name as string),
      competitorAvg,
    });

    // Insert recommendation
    const { data: recommendation } = await this.supabase
      .from('pricing_recommendations')
      .insert({
        property_id: propertyId,
        room_type_id: roomTypeId,
        date,
        current_price: currentPrice.current_price,
        recommended_price: aiResponse.recommendedPrice,
        confidence_score: aiResponse.confidenceScore,
        reasoning: aiResponse.reasoning,
        factors: JSON.parse(JSON.stringify(aiResponse.keyFactors)),
        status: 'pending',
      })
      .select()
      .single();

    // Update suggested price on current_prices
    await this.supabase
      .from('current_prices')
      .update({ suggested_price: aiResponse.recommendedPrice })
      .eq('id', currentPrice.id);

    return recommendation;
  }

  /**
   * Approve, modify, or reject a recommendation.
   */
  async reviewRecommendation(
    recommendationId: string,
    action: string,
    modifiedPrice?: number
  ): Promise<boolean> {
    const updateData: Record<string, unknown> = {
      status: action,
      reviewed_at: new Date().toISOString(),
    };

    if (action === 'modified' && modifiedPrice) {
      updateData.modified_price = modifiedPrice;
    }

    const { error } = await this.supabase
      .from('pricing_recommendations')
      .update(updateData)
      .eq('id', recommendationId);

    if (error) {
      console.error('[PricingService] Review error:', error);
      return false;
    }

    // If approved or modified, update the current_prices table
    if (action === 'approved' || action === 'modified') {
      const { data: rec } = await this.supabase
        .from('pricing_recommendations')
        .select('*')
        .eq('id', recommendationId)
        .single();

      if (rec) {
        const recData = rec as unknown as Record<string, unknown>;
        const priceToSet = action === 'modified' && modifiedPrice
          ? modifiedPrice
          : Number(recData.recommended_price);

        await this.supabase
          .from('current_prices')
          .update({
            current_price: priceToSet,
            suggested_price: null,
            price_changed: true,
          })
          .eq('property_id', recData.property_id)
          .eq('room_type_id', recData.room_type_id)
          .eq('date', recData.date);
      }
    }

    return true;
  }

  /**
   * Get pending recommendations with room type info.
   */
  async getPendingRecommendations(propertyId: string): Promise<PricingRecommendation[]> {
    const { data } = await this.supabase
      .from('pricing_recommendations')
      .select('*, room_type:room_types(*)')
      .eq('property_id', propertyId)
      .eq('status', 'pending')
      .order('date', { ascending: true });

    return (data || []) as unknown as PricingRecommendation[];
  }

  /**
   * Get recommendations for a date range (for the calendar view).
   */
  async getRecommendationsByDateRange(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<PricingRecommendation[]> {
    const { data } = await this.supabase
      .from('pricing_recommendations')
      .select('*, room_type:room_types(*)')
      .eq('property_id', propertyId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    return (data || []) as unknown as PricingRecommendation[];
  }

  /**
   * Get current prices for date range (for the calendar view).
   */
  async getCurrentPricesByRange(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<CurrentPrice[]> {
    const { data } = await this.supabase
      .from('current_prices')
      .select('*, room_type:room_types(*)')
      .eq('property_id', propertyId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    return (data || []) as unknown as CurrentPrice[];
  }
}

export const pricingService = new PricingService();
