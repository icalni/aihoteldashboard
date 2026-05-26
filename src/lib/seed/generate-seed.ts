// ============================================================
// Seed Data Generator — Runs on first setup to populate Supabase
// ============================================================
//
// Usage: npx ts-node --compiler-options '{"module":"commonjs"}' src/lib/seed/generate-seed.ts
// Or via an API route trigger.
// ============================================================

import { createAdminClient } from '@/lib/supabase/server-client';
import { DEFAULT_PROPERTY, ROOM_TYPES, COMPETITOR_HOTELS } from '@/lib/utils/constants';

interface RoomTypeSeed {
  name: string;
  base_price: number;
  capacity: number;
}

const ROOM_TYPE_SEEDS: RoomTypeSeed[] = [
  { name: 'Standard', base_price: 299000, capacity: 2 },
  { name: 'Deluxe', base_price: 499000, capacity: 3 },
  { name: 'Suite', base_price: 899000, capacity: 4 },
];

/**
 * Generate and insert all seed data for the MVP.
 */
export async function generateSeedData(): Promise<void> {
  const supabase = createAdminClient();
  console.log('[Seed] Starting data generation...');

  // 1. Create/upsert property
  const { data: property } = await supabase
    .from('properties')
    .upsert({
      name: DEFAULT_PROPERTY.name,
      city: DEFAULT_PROPERTY.city,
      country: 'Indonesia',
      room_count: 50,
    })
    .select()
    .single();

  if (!property) {
    console.error('[Seed] Failed to create property');
    return;
  }

  const propertyId = property.id;
  console.log(`[Seed] Property created: ${propertyId}`);

  // 2. Create room types
  const roomTypeIds: Record<string, string> = {};
  for (const rt of ROOM_TYPE_SEEDS) {
    const { data: roomType } = await supabase
      .from('room_types')
      .upsert({
        property_id: propertyId,
        name: rt.name,
        base_price: rt.base_price,
        capacity: rt.capacity,
      })
      .select()
      .single();

    if (roomType) {
      roomTypeIds[rt.name] = roomType.id;
    }
  }
  console.log('[Seed] Room types created');

  // 3. Generate 90 days of historical data (past 60 + future 30)
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 60);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 30);

  for (const rt of ROOM_TYPE_SEEDS) {
    const roomTypeId = roomTypeIds[rt.name];
    if (!roomTypeId) continue;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isFriday = dayOfWeek === 5;

      // Realistic occupancy simulation
      let baseOcc = isWeekend ? 85 : isFriday ? 78 : 65;
      // Add randomness
      const occupancyRate = Math.min(98, Math.max(35, baseOcc + Math.round((Math.random() - 0.5) * 20)));

      // ADR correlated with occupancy
      const adrMultiplier = 1 + (occupancyRate - 50) / 200;
      const adr = Math.round(rt.base_price * adrMultiplier / 1000) * 1000;

      const availableRooms = rt.capacity * 15; // 15 rooms per type
      const bookedRooms = Math.round(availableRooms * (occupancyRate / 100));
      const revenue = bookedRooms * adr;

      // Insert daily rate
      await supabase
        .from('daily_rates')
        .upsert({
          property_id: propertyId,
          room_type_id: roomTypeId,
          date: dateStr,
          occupancy_rate: occupancyRate,
          adr,
          revenue,
          available_rooms: availableRooms,
          booked_rooms: bookedRooms,
        }, { onConflict: 'property_id,room_type_id,date' });

      // Insert current price for future dates (or past if not exists)
      if (d >= today || Math.random() > 0.7) {
        await supabase
          .from('current_prices')
          .upsert({
            property_id: propertyId,
            room_type_id: roomTypeId,
            date: dateStr,
            current_price: adr,
            suggested_price: null,
            price_changed: false,
          }, { onConflict: 'property_id,room_type_id,date' });
      }
    }
  }
  console.log('[Seed] Daily rates and prices created');

  // 4. Generate competitor prices
  const conditions = ['Sunny', 'Cloudy', 'Partly Cloudy', 'Clear', 'Rainy'];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    const weekendMultiplier = dayOfWeek >= 5 ? 1.15 : 1.0;

    // Weather
    const month = d.getMonth();
    const baseHigh = month >= 10 || month <= 3 ? 31 : 33;
    await supabase
      .from('weather_data')
      .upsert({
        property_id: propertyId,
        date: dateStr,
        high_temp: baseHigh + Math.round((Math.random() - 0.5) * 4),
        low_temp: (month >= 10 || month <= 3 ? 24 : 26) + Math.round((Math.random() - 0.5) * 3),
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        precipitation_pct: Math.round(Math.random() * (month >= 10 || month <= 3 ? 80 : 30)),
      }, { onConflict: 'property_id,date' });

    // Competitor prices (for Deluxe category)
    for (const hotel of COMPETITOR_HOTELS) {
      const variance = 0.85 + Math.random() * 0.3;
      const price = Math.round(499000 * variance * weekendMultiplier / 1000) * 1000;

      await supabase
        .from('competitor_prices')
        .upsert({
          property_id: propertyId,
          competitor_name: hotel,
          room_category: 'Deluxe',
          price,
          date: dateStr,
          source: 'mock',
        }, { onConflict: 'property_id,competitor_name,room_category,date' });
    }
  }
  console.log('[Seed] Weather and competitor data created');

  // 5. Generate mock events
  const mockEvents = [
    { name: 'Jakarta International Jazz Festival', category: 'concert', venue: 'JIEXPO Kemayoran' },
    { name: 'Indonesia Convention & Exhibition', category: 'conference', venue: 'ICE BSD' },
    { name: 'Jakarta Marathon', category: 'sports', venue: 'Monas' },
    { name: 'Tech Summit Indonesia', category: 'conference', venue: 'Ritz-Carlton Jakarta' },
    { name: 'Jakarta Food Festival', category: 'festival', venue: 'Senayan Park' },
    { name: 'Music Festival Jakarta', category: 'concert', venue: 'GBK Complex' },
  ];

  for (let i = 0; i < mockEvents.length; i++) {
    const eventDate = new Date(today);
    eventDate.setDate(eventDate.getDate() + (i * 5)); // Spread events
    const endEventDate = new Date(eventDate);
    endEventDate.setDate(endEventDate.getDate() + 2);

    await supabase
      .from('events')
      .upsert({
        property_id: propertyId,
        name: mockEvents[i].name,
        venue: mockEvents[i].venue,
        category: mockEvents[i].category,
        start_date: eventDate.toISOString().split('T')[0],
        end_date: endEventDate.toISOString().split('T')[0],
        expected_attendance: Math.round(1000 + Math.random() * 15000),
        radius_km: Math.round(5 + Math.random() * 15),
        source: 'mock',
      }, { onConflict: 'property_id,name,start_date' });
  }
  console.log('[Seed] Events created');

  console.log('[Seed] Data generation complete!');
  console.log(`[Seed] Property ID: ${propertyId}`);
}
