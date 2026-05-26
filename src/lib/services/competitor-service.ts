// ============================================================
// Competitor Pricing Service
// ============================================================
//
// MVP: Uses mock/synthetic data.
// Future: Replace with Booking.com Affiliate API or RapidAPI adapter.
// ============================================================

import { createAdminClient } from '@/lib/supabase/server-client';
import { COMPETITOR_HOTELS } from '@/lib/utils/constants';

interface CompetitorRow {
  competitor_name: string;
  room_category: string;
  price: number;
  date: string;
}

/**
 * Generate mock competitor prices for a given property and date range.
 * This simulates what a real API would return.
 */
export class CompetitorService {
  private supabase = createAdminClient();

  /**
   * Generate and insert mock competitor prices for a date range.
   */
  async seedCompetitorPrices(
    propertyId: string,
    basePrice: number,
    startDate: string,
    endDate: string
  ): Promise<void> {
    const rows: CompetitorRow[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const weekendMultiplier = dayOfWeek >= 5 ? 1.15 : 1.0;

      for (const hotel of COMPETITOR_HOTELS) {
        // Each competitor has slightly different pricing
        const variance = 0.85 + Math.random() * 0.3; // 85% to 115% of base
        const price = Math.round(basePrice * variance * weekendMultiplier / 1000) * 1000;

        rows.push({
          competitor_name: hotel,
          room_category: 'Deluxe',
          price,
          date: dateStr,
        });
      }
    }

    // Batch insert
    const { error } = await this.supabase
      .from('competitor_prices')
      .upsert(
        rows.map(r => ({
          property_id: propertyId,
          ...r,
          source: 'mock',
        })),
        { onConflict: 'property_id,competitor_name,room_category,date' }
      );

    if (error) {
      console.error('[CompetitorService] Seed error:', error);
    }
  }

  /**
   * Get average competitor price for a given date.
   */
  async getAverageCompetitorPrice(
    propertyId: string,
    date: string
  ): Promise<number | null> {
    const { data } = await this.supabase
      .from('competitor_prices')
      .select('price')
      .eq('property_id', propertyId)
      .eq('date', date);

    if (!data || data.length === 0) return null;

    const typedData = data as Array<Record<string, unknown>>;
    const total = typedData.reduce((s: number, r: Record<string, unknown>) => s + Number(r.price), 0);
    return Math.round(total / typedData.length);
  }
}

export const competitorService = new CompetitorService();
