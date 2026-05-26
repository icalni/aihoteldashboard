// ============================================================
// Events Service — PredictHQ Integration
// ============================================================

import { createAdminClient } from '@/lib/supabase/server-client';
import { DEFAULT_PROPERTY } from '@/lib/utils/constants';

export class EventsService {
  private supabase = createAdminClient();

  /**
   * Fetch events from PredictHQ API and store in DB.
   */
  async fetchAndStoreEvents(propertyId: string): Promise<void> {
    const apiKey = process.env.PREDICTHQ_API_KEY;

    if (!apiKey) {
      console.warn('[EventsService] No API key configured, skipping');
      return;
    }

    try {
      const url = `https://api.predicthq.com/v1/events/?within=10km@${DEFAULT_PROPERTY.lat},${DEFAULT_PROPERTY.lng}&start_around.origin=now&start_around.scope=next_30_days&sort=start`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`[EventsService] API error: ${response.status}`);
        return;
      }

      const data = await response.json();
      const results = data.results || [];

      if (results.length === 0) {
        console.log('[EventsService] No events found');
        return;
      }

      const rows = results.map((event: Record<string, unknown>) => {
        const entities = (event.entities as Array<Record<string, unknown>>) || [];
        return {
          property_id: propertyId,
          name: event.title as string,
          venue: (entities[0]?.name as string) || null,
          category: event.category as string,
          start_date: (event.start as string).split('T')[0],
          end_date: event.end ? (event.end as string).split('T')[0] : null,
          expected_attendance: entities[0]?.formatted_address ? Number(entities[0].formatted_address) : null,
          radius_km: 10,
          source: 'predicthq',
        };
      });

      // Upsert events
      for (const row of rows) {
        const { error } = await this.supabase
          .from('events')
          .upsert(row, { onConflict: 'property_id,name,start_date' });

        if (error) {
          console.error('[EventsService] DB insert error:', error);
        }
      }
    } catch (error) {
      console.error('[EventsService] Fetch error:', error);
    }
  }

  /**
   * Generate mock events for MVP when API is unavailable.
   */
  async seedMockEvents(
    propertyId: string,
    startDate: string,
    endDate: string
  ): Promise<void> {
    const mockEvents = [
      { name: 'Jakarta International Jazz Festival', category: 'concert', venue: 'JIEXPO Kemayoran' },
      { name: 'Indonesia Convention & Exhibition', category: 'conference', venue: 'ICE BSD' },
      { name: 'Jakarta Marathon', category: 'sports', venue: 'Monas' },
      { name: 'Art Jakarta Exhibition', category: 'arts', venue: 'Grand Indonesia' },
      { name: 'Jakarta Food Festival', category: 'festival', venue: 'Senayan Park' },
      { name: 'Tech Summit Indonesia', category: 'conference', venue: 'Ritz-Carlton Jakarta' },
      { name: 'Music Festival Jakarta', category: 'concert', venue: 'GBK Complex' },
      { name: 'Indonesia Fashion Week', category: 'fashion', venue: 'Jakarta Convention Center' },
    ];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const rows: Array<Record<string, unknown>> = [];

    // Spread events across the date range
    const eventInterval = Math.floor((end.getTime() - start.getTime()) / (mockEvents.length * 86400000));

    mockEvents.forEach((event, index) => {
      const eventDate = new Date(start.getTime() + (index * eventInterval * 86400000));
      if (eventDate > end) return;

      const dateStr = eventDate.toISOString().split('T')[0];
      const endDateStr = new Date(eventDate.getTime() + 2 * 86400000).toISOString().split('T')[0];

      rows.push({
        property_id: propertyId,
        name: event.name,
        venue: event.venue,
        category: event.category,
        start_date: dateStr,
        end_date: endDateStr,
        expected_attendance: Math.round(1000 + Math.random() * 15000),
        radius_km: Math.round(5 + Math.random() * 15),
        source: 'mock',
      });
    });

    if (rows.length > 0) {
      const { error } = await this.supabase
        .from('events')
        .upsert(rows, { onConflict: 'property_id,name,start_date' });

      if (error) {
        console.error('[EventsService] Mock seed error:', error);
      }
    }
  }

  /**
   * Get events happening on a specific date.
   */
  async getEventsForDate(
    propertyId: string,
    date: string
  ): Promise<Array<Record<string, unknown>>> {
    const { data } = await this.supabase
      .from('events')
      .select('*')
      .eq('property_id', propertyId)
      .lte('start_date', date)
      .gte('end_date', date);

    return (data || []) as Array<Record<string, unknown>>;
  }
}

export const eventsService = new EventsService();
