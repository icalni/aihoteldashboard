// ============================================================
// POST /api/pricing/batch-recommend — Generate bulk AI recommendations
// for a date range across all room types
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { pricingService } from '@/lib/services/pricing-service';
import type { BatchRecommendRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: BatchRecommendRequest = await request.json();
    const { property_id, start_date, end_date } = body;

    if (!property_id || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields: property_id, start_date, end_date' },
        { status: 400 }
      );
    }

    // Get all room types for this property
    const { createAdminClient } = await import('@/lib/supabase/server-client');
    const supabase = createAdminClient();

    const { data: roomTypes } = await supabase
      .from('room_types')
      .select('*')
      .eq('property_id', property_id);

    if (!roomTypes || roomTypes.length === 0) {
      return NextResponse.json(
        { error: 'No room types found for this property' },
        { status: 404 }
      );
    }

    // Generate recommendations for each date × room type combination
    const start = new Date(start_date);
    const end = new Date(end_date);
    const results: Array<{ date: string; room_type: string; success: boolean; id?: string }> = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      for (const rt of roomTypes) {
        try {
          const rec = await pricingService.generateRecommendation(
            property_id,
            rt.id,
            rt.name,
            dateStr
          );

          results.push({
            date: dateStr,
            room_type: rt.name,
            success: true,
            id: rec?.id,
          });
        } catch (err) {
          console.error(`[Batch] Failed for ${rt.name} on ${dateStr}:`, err);
          results.push({
            date: dateStr,
            room_type: rt.name,
            success: false,
          });
        }
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json(
      {
        message: `Generated ${successCount} recommendations (${failCount} failures)`,
        total: results.length,
        success_count: successCount,
        fail_count: failCount,
        results,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /pricing/batch-recommend] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
