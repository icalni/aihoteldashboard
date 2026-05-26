'use client';

import { cn } from '@/lib/utils/format';
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number; // percentage change, positive = up, negative = down
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  format?: 'currency' | 'percentage' | 'number';
}

export default function KpiCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBgColor = 'bg-blue-50',
}: KpiCardProps) {
  const isTrendPositive = trend !== undefined && trend >= 0;
  const TrendIcon = isTrendPositive ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
        <div className={cn('rounded-lg p-3', iconBgColor)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-1.5 border-t border-gray-100 pt-3">
          <TrendIcon
            className={cn(
              'h-4 w-4',
              isTrendPositive ? 'text-green-500' : 'text-red-500'
            )}
          />
          <span
            className={cn(
              'text-sm font-medium',
              isTrendPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-400">vs last week</span>
        </div>
      )}
    </div>
  );
}
