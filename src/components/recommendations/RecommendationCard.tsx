'use client';

import {
  TrendingUp,
  TrendingDown,
  Minus,
  CalendarDays,
  BarChart3,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { cn, formatIDR, formatDate } from '@/lib/utils/format';
import ApprovalActions from './ApprovalActions';
import type { PricingRecommendation } from '@/types';

interface RecommendationCardProps {
  recommendation: PricingRecommendation;
  onApprove: (id: string) => Promise<void>;
  onModify: (id: string, price: number) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export default function RecommendationCard({
  recommendation,
  onApprove,
  onModify,
  onReject,
}: RecommendationCardProps) {
  const { id, date, room_type, current_price, recommended_price, confidence_score, reasoning, factors } = recommendation;

  const priceDiff = recommended_price - current_price;
  const priceDiffPercent = current_price > 0 ? (priceDiff / current_price) * 100 : 0;

  const TrendIcon = priceDiff > 0 ? TrendingUp : priceDiff < 0 ? TrendingDown : Minus;
  const trendColor = priceDiff > 0 ? 'text-green-600' : priceDiff < 0 ? 'text-red-600' : 'text-gray-400';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2.5">
            <CalendarDays className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {formatDate(date)}
            </p>
            <p className="text-xs text-gray-500">
              {room_type?.name || 'Unknown Room Type'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1">
          <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-xs font-medium text-blue-700">
            {Math.round(confidence_score)}% confidence
          </span>
        </div>
      </div>

      {/* Price Comparison */}
      <div className="mb-4 rounded-lg bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Current</p>
            <p className="text-lg font-bold text-gray-900">
              {formatIDR(Number(current_price))}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <ArrowRight className={cn('h-5 w-5', trendColor)} />
            <span className={cn('text-xs font-medium mt-0.5', trendColor)}>
              {priceDiff > 0 ? '+' : ''}{priceDiffPercent.toFixed(1)}%
            </span>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Suggested</p>
            <p className="text-lg font-bold text-blue-600">
              {formatIDR(Number(recommended_price))}
            </p>
          </div>
        </div>
      </div>

      {/* AI Reasoning */}
      <div className="mb-4">
        <div className="flex items-start gap-2">
          <Lightbulb className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-sm text-gray-600">{reasoning}</p>
        </div>
      </div>

      {/* Key Factors */}
      {factors && factors.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {factors.map((factor, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
            >
              <TrendIcon className={cn('h-3 w-3', trendColor)} />
              {factor}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <ApprovalActions
          recommendationId={id}
          onApprove={onApprove}
          onModify={onModify}
          onReject={onReject}
          currentPrice={Number(current_price)}
          recommendedPrice={Number(recommended_price)}
        />
      </div>
    </div>
  );
}
