'use client';

import { useMemo } from 'react';
import { BedDouble, DollarSign, TrendingUp, CalendarCheck } from 'lucide-react';
import KpiCard from './KpiCard';
import OccupancyChart from './OccupancyChart';
import ExternalFactors from './ExternalFactors';
import { formatIDR, formatPercentage } from '@/lib/utils/format';
import type { RoomType, CurrentPrice, DailyRate, WeatherData, Event, CompetitorPrice } from '@/types';

interface TodayOverviewProps {
  roomTypes: RoomType[];
  currentPrices: CurrentPrice[];
  dailyRates: DailyRate[];
  weather: WeatherData | null;
  events: Event[];
  competitorPrices: CompetitorPrice[];
}

export default function TodayOverview({
  roomTypes,
  currentPrices,
  dailyRates,
  weather,
  events,
  competitorPrices,
}: TodayOverviewProps) {
  const stats = useMemo(() => {
    const totalRooms = dailyRates.reduce(
      (s, r) => s + (r.available_rooms || 0) + (r.booked_rooms || 0),
      0
    );
    const totalBooked = dailyRates.reduce((s, r) => s + (r.booked_rooms || 0), 0);
    const avgOccupancy = totalRooms > 0 ? (totalBooked / totalRooms) * 100 : 0;

    const avgAdr =
      dailyRates.length > 0
        ? dailyRates.reduce((s, r) => s + (r.adr || 0), 0) / dailyRates.length
        : 0;

    const revpar = avgOccupancy > 0 ? (avgAdr * avgOccupancy) / 100 : 0;

    return { avgOccupancy, avgAdr, revpar, totalBooked, totalRooms };
  }, [dailyRates]);

  // Mock trend data for charts (will be replaced with real data from API)
  const mockOccupancyTrend = useMemo(() => {
    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trends.push({
        date: d.toISOString().split('T')[0],
        rate: 60 + Math.random() * 30,
      });
    }
    return trends;
  }, []);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Occupancy"
          value={formatPercentage(stats.avgOccupancy)}
          subtitle={`${stats.totalBooked} / ${stats.totalRooms} rooms`}
          trend={3.2}
          icon={BedDouble}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <KpiCard
          title="Average Daily Rate"
          value={formatIDR(stats.avgAdr)}
          subtitle="Across all room types"
          trend={5.8}
          icon={DollarSign}
          iconColor="text-emerald-600"
          iconBgColor="bg-emerald-50"
        />
        <KpiCard
          title="RevPAR"
          value={formatIDR(stats.revpar)}
          subtitle="Revenue per available room"
          trend={-1.2}
          icon={TrendingUp}
          iconColor="text-violet-600"
          iconBgColor="bg-violet-50"
        />
        <KpiCard
          title="Pending Recs"
          value="3"
          subtitle="Awaiting your review"
          icon={CalendarCheck}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-50"
        />
      </div>

      {/* Charts & External Factors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OccupancyChart data={mockOccupancyTrend} />
        </div>
        <div>
          <ExternalFactors
            weather={weather}
            events={events}
            competitorPrices={competitorPrices}
          />
        </div>
      </div>

      {/* AI Suggestion Banner */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-blue-100 p-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900">AI Pricing Insight</h3>
            <p className="mt-1 text-sm text-blue-700">
              {events.length > 0
                ? `With ${events.length} event(s) nearby and ${formatPercentage(stats.avgOccupancy)} occupancy, consider increasing Deluxe room pricing by 10-15% for optimal revenue.`
                : `Current occupancy at ${formatPercentage(stats.avgOccupancy)} with stable demand. No major pricing changes recommended for today.`}
            </p>
          </div>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            View Details
          </button>
        </div>
      </div>

      {/* Room Type Breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Room Type Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 font-medium text-gray-500">Room Type</th>
                <th className="pb-3 font-medium text-gray-500">Current Price</th>
                <th className="pb-3 font-medium text-gray-500">ADR</th>
                <th className="pb-3 font-medium text-gray-500">Occupancy</th>
                <th className="pb-3 font-medium text-gray-500">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {roomTypes.map((rt) => {
                const price = currentPrices.find((cp) => cp.room_type_id === rt.id);
                const rate = dailyRates.find((dr) => dr.room_type_id === rt.id);

                return (
                  <tr key={rt.id} className="border-b border-gray-50">
                    <td className="py-3 font-medium text-gray-900">{rt.name}</td>
                    <td className="py-3 text-gray-700">
                      {price ? formatIDR(Number(price.current_price)) : '-'}
                    </td>
                    <td className="py-3 text-gray-700">
                      {rate?.adr ? formatIDR(Number(rate.adr)) : '-'}
                    </td>
                    <td className="py-3 text-gray-700">
                      {rate?.occupancy_rate ? formatPercentage(Number(rate.occupancy_rate)) : '-'}
                    </td>
                    <td className="py-3 text-gray-700">
                      {rate?.revenue ? formatIDR(Number(rate.revenue)) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
