'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns';
import { cn, formatIDR } from '@/lib/utils/format';
import type { CurrentPrice, PricingRecommendation } from '@/types';

interface PricingCalendarProps {
  currentPrices: CurrentPrice[];
  recommendations: PricingRecommendation[];
}

export default function PricingCalendar({ currentPrices, recommendations }: PricingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const startPadding = getDay(startOfMonth(currentMonth));

  const getPriceForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const rec = recommendations.find((r) => r.date === dateStr);
    const price = currentPrices.find((p) => p.date === dateStr);

    if (rec && rec.status === 'approved') {
      return { price: Number(rec.recommended_price), type: 'approved' as const };
    }
    if (rec) {
      return { price: Number(rec.recommended_price), type: 'suggested' as const };
    }
    if (price) {
      return { price: Number(price.current_price), type: 'current' as const };
    }
    return null;
  };

  const getCellColor = (type: string | undefined) => {
    switch (type) {
      case 'approved':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'suggested':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'current':
        return 'bg-white border-gray-200 text-gray-800';
      default:
        return 'bg-gray-50 border-gray-100 text-gray-400';
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      {/* Month Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding cells for start of month */}
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="h-24 rounded-lg border border-transparent bg-transparent" />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const cell = getPriceForDay(day);
          const isTodayFlag = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'h-24 rounded-lg border p-2 transition-all hover:shadow-sm cursor-pointer',
                getCellColor(cell?.type),
                isTodayFlag && 'ring-2 ring-blue-400'
              )}
            >
              <p className={cn('text-sm font-medium', isTodayFlag && 'text-blue-600')}>
                {format(day, 'd')}
              </p>
              {cell && (
                <div className="mt-1">
                  <p className="text-xs font-semibold truncate">
                    {formatIDR(cell.price)}
                  </p>
                  <p className="text-[10px] text-gray-500 capitalize">{cell.type}</p>
                </div>
              )}
              {!cell && (
                <p className="mt-1 text-[10px] text-gray-400">No data</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-6 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border border-gray-200 bg-white" />
          <span className="text-xs text-gray-500">Current</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border border-blue-200 bg-blue-50" />
          <span className="text-xs text-gray-500">AI Suggested</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border border-green-200 bg-green-50" />
          <span className="text-xs text-gray-500">Approved</span>
        </div>
      </div>
    </div>
  );
}
