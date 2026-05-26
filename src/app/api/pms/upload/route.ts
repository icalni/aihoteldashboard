// ============================================================
// POST /api/pms/upload — Upload PMS CSV data
// ============================================================
//
// Accepts a CSV file with columns:
//   date, room_type, occupancy_rate, adr, revenue, available_rooms, booked_rooms
//
// The first property and matching room_type are resolved automatically.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Send a CSV file as multipart/form-data with field name "file".' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only .csv files are accepted' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the first property
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

    // Get room types for name -> id resolution
    const { data: roomTypes } = await supabase
      .from('room_types')
      .select('id, name')
      .eq('property_id', propertyId);

    if (!roomTypes || roomTypes.length === 0) {
      return NextResponse.json(
        { error: 'No room types found. Run seed data first.' },
        { status: 404 }
      );
    }

    const roomTypeMap = new Map<string, string>();
    for (const rt of roomTypes) {
      roomTypeMap.set(rt.name.toLowerCase(), rt.id);
    }

    // Parse CSV
    const text = await file.text();
    const lines = text.split('\n').filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must have a header row and at least one data row' },
        { status: 400 }
      );
    }

    // Parse header
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const requiredColumns = ['date', 'room_type'];
    const missingColumns = requiredColumns.filter((col) => !headers.includes(col));

    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `CSV missing required columns: ${missingColumns.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse data rows
    const dailyRateRows: Array<Record<string, unknown>> = [];
    const currentPriceRows: Array<Record<string, unknown>> = [];
    const errors: string[] = [];
    let inserted = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: Record<string, string> = {};

      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });

      const roomTypeName = row.room_type?.toLowerCase();
      const roomTypeId = roomTypeMap.get(roomTypeName);

      if (!roomTypeId) {
        errors.push(`Row ${i + 1}: Unknown room type "${row.room_type}"`);
        continue;
      }

      const date = row.date;
      if (!date) {
        errors.push(`Row ${i + 1}: Missing date`);
        continue;
      }

      const occupancyRate = parseFloat(row.occupancy_rate) || null;
      const adr = parseFloat(row.adr) || null;
      const revenue = parseFloat(row.revenue) || null;
      const availableRooms = parseInt(row.available_rooms, 10) || null;
      const bookedRooms = parseInt(row.booked_rooms, 10) || null;

      dailyRateRows.push({
        property_id: propertyId,
        room_type_id: roomTypeId,
        date,
        occupancy_rate: occupancyRate,
        adr,
        revenue,
        available_rooms: availableRooms,
        booked_rooms: bookedRooms,
      });

      // If ADR is provided, also update current price
      if (adr) {
        currentPriceRows.push({
          property_id: propertyId,
          room_type_id: roomTypeId,
          date,
          current_price: adr,
          suggested_price: null,
          price_changed: false,
        });
      }

      inserted++;
    }

    // Batch insert daily rates
    if (dailyRateRows.length > 0) {
      const { error: drError } = await supabase
        .from('daily_rates')
        .upsert(dailyRateRows, { onConflict: 'property_id,room_type_id,date' });

      if (drError) {
        console.error('[API /pms/upload] Daily rates insert error:', drError);
        return NextResponse.json(
          { error: 'Failed to insert daily rates', detail: drError.message },
          { status: 500 }
        );
      }
    }

    // Batch insert current prices
    if (currentPriceRows.length > 0) {
      const { error: cpError } = await supabase
        .from('current_prices')
        .upsert(currentPriceRows, { onConflict: 'property_id,room_type_id,date' });

      if (cpError) {
        console.error('[API /pms/upload] Current prices insert error:', cpError);
        return NextResponse.json(
          { error: 'Failed to insert current prices', detail: cpError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        message: `Uploaded ${inserted} records successfully`,
        inserted,
        errors: errors.length > 0 ? errors : undefined,
        warnings: errors.length > 0
          ? `${errors.length} row(s) skipped due to errors`
          : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /pms/upload] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
