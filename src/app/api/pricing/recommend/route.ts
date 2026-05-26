// ============================================================
// POST /api/pricing/recommend — Generate a single AI pricing recommendation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { pricingService } from '@/lib/services/pricing-service';
import type { RecommendationRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json();
    const { property_id, room_type_id, date } = body;

    if (!property_id || !room_type_id || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: property_id, room_type_id, date' },
        { status: 400 }
      );
    }

    // Get room type name for context
    const { createAdminClient } = await import('@/lib/supabase/server-client');
    const supabase = createAdminClient();

    const { data: roomType } = await supabase
      .from('room_types')
      .select('name')
      .eq('id', room_type_id)
      .single();

    const roomTypeName = roomType?.name || 'Unknown';

    const recommendation = await pricingService.generateRecommendation(
      property_id,
      room_type_id,
      roomTypeName,
      date
    );

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Failed to generate recommendation. Check that current price data exists for this date and room type.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: recommendation }, { status: 201 });
  } catch (error) {
    console.error('[API /pricing/recommend] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
