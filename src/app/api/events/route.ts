// ============================================================
// GET /api/events — Fetch events from PredictHQ
// ============================================================
//
// Proxies PredictHQ API, stores results in DB,
// and returns stored events for the default property.
//
// Query params:
//   refresh=true — Forces a fresh fetch from PredictHQ
//   days=30 — Number of days ahead to look (default: 30)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-client';
import { eventsService } from '@/lib/services/events-service';
import { DEFAULT_PROPERTY } from '@/lib/utils/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';
    const days = parseInt(searchParams.get('days') || '30', 10);

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

    // Optionally refresh from PredictHQ API
    if (refresh) {
      await eventsService.fetchAndStoreEvents(propertyId);
    }

    // Get stored events
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    const endDateStr = endDate.toISOString().split('T')[0];

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('property_id', propertyId)
      .gte('end_date', today)
      .lte('start_date', endDateStr)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('[API /events] DB query error:', error);
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      );
    }

    const currentEvent = events?.find(
      (e: Record<string, unknown>) => (e.start_date as string) <= today && (e.end_date as string) >= today
    );

    return NextResponse.json({
      property_id: propertyId,
      location: {
        name: DEFAULT_PROPERTY.name,
        city: DEFAULT_PROPERTY.city,
        lat: DEFAULT_PROPERTY.lat,
        lng: DEFAULT_PROPERTY.lng,
      },
      total: events?.length || 0,
      events_happening_now: currentEvent || null,
      events: events || [],
      source: refresh ? 'fresh' : 'cached',
    });
  } catch (error) {
    console.error('[API /events] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
