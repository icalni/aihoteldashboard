// ============================================================
// PATCH /api/pricing/review — Approve, modify, or reject a recommendation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { pricingService } from '@/lib/services/pricing-service';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { recommendation_id, action, modified_price } = body;

    if (!recommendation_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: recommendation_id, action' },
        { status: 400 }
      );
    }

    const validActions = ['approved', 'modified', 'rejected'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action "${action}". Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    if (action === 'modified' && (!modified_price || modified_price <= 0)) {
      return NextResponse.json(
        { error: 'modified_price is required when action is "modified"' },
        { status: 400 }
      );
    }

    const success = await pricingService.reviewRecommendation(
      recommendation_id,
      action,
      modified_price
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update recommendation. Check that the ID exists.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Recommendation ${action} successfully`,
    });
  } catch (error) {
    console.error('[API /pricing/review] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
