// ============================================================
// POST /api/seed — Trigger seed data generation
// ============================================================
//
// Generates 90 days of mock data:
//   - 1 property (Hotel Saison)
//   - 3 room types (Standard, Deluxe, Suite)
//   - Daily rates and current prices
//   - Weather data (Jakarta tropical climate)
//   - Competitor prices for 3 hotels
//   - 6 sample events spread across date range
// ============================================================

import { NextResponse } from 'next/server';
import { generateSeedData } from '@/lib/seed/generate-seed';

export async function POST() {
  try {
    console.log('[API /seed] Starting seed data generation...');

    await generateSeedData();

    return NextResponse.json(
      {
        message: 'Seed data generated successfully',
        note: 'Property, room types, daily rates, current prices, weather, competitor prices, and events have been created.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /seed] Error:', error);
    return NextResponse.json(
      { error: 'Seed data generation failed. Check server logs for details.' },
      { status: 500 }
    );
  }
}
