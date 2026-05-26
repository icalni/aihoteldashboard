'use client';

import { Sun, CloudRain, MapPin, Building2, TrendingUp } from 'lucide-react';
import type { WeatherData, Event, CompetitorPrice } from '@/types';
import { formatIDR, formatTemp } from '@/lib/utils/format';

interface ExternalFactorsProps {
  weather: WeatherData | null;
  events: Event[];
  competitorPrices: CompetitorPrice[];
}

export default function ExternalFactors({
  weather,
  events,
  competitorPrices,
}: ExternalFactorsProps) {
  const avgCompetitorPrice =
    competitorPrices.length > 0
      ? competitorPrices.reduce((s, c) => s + Number(c.price), 0) / competitorPrices.length
      : 0;

  const getWeatherIcon = (condition: string) => {
    const c = condition?.toLowerCase() || '';
    if (c.includes('rain') || c.includes('thunder') || c.includes('drizzle')) return CloudRain;
    return Sun;
  };

  const WeatherIcon = weather ? getWeatherIcon(weather.condition) : Sun;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">External Factors</h3>
      <div className="space-y-4">
        {/* Weather */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-amber-50 p-2.5">
            <WeatherIcon className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {weather ? `${weather.condition}` : 'Weather data unavailable'}
            </p>
            {weather && (
              <p className="text-xs text-gray-500">
                {formatTemp(Number(weather.high_temp))} / {formatTemp(Number(weather.low_temp))} — {weather.precipitation_pct}% precipitation
              </p>
            )}
          </div>
        </div>

        {/* Events */}
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-purple-50 p-2.5">
            <MapPin className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            {events.length > 0 ? (
              events.slice(0, 2).map((event) => (
                <div key={event.id} className="mb-1">
                  <p className="text-sm font-medium text-gray-900">{event.name}</p>
                  <p className="text-xs text-gray-500">
                    {event.expected_attendance
                      ? `${event.expected_attendance.toLocaleString()} attendees`
                      : ''}
                    {event.venue ? ` at ${event.venue}` : ''}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No events nearby today</p>
            )}
          </div>
        </div>

        {/* Competitors */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2.5">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {competitorPrices.length > 0
                ? `Avg competitor: ${formatIDR(avgCompetitorPrice)}`
                : 'No competitor data'}
            </p>
            <p className="text-xs text-gray-500">
              {competitorPrices.length} prices recorded today
            </p>
          </div>
        </div>

        {/* AI Insight */}
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-green-50 p-2.5">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">AI Market Insight</p>
            <p className="text-xs text-gray-500">
              {events.length > 0
                ? 'Local events may increase demand — consider dynamic pricing uplift.'
                : 'Standard demand pattern today. Monitor competitor changes.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
