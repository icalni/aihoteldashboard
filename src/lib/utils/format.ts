import { CURRENCY } from './constants';

/**
 * Format a number as Indonesian Rupiah (IDR).
 * Example: 299000 → "Rp 299.000"
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number as a percentage.
 * Example: 0.85 → "85%"
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Format a date string to a readable format.
 * Example: "2026-05-27" → "Wed, 27 May 2026"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date to short format.
 * Example: "2026-05-27" → "27 May"
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Format a number with compact notation.
 * Example: 1500000 → "1.5M"
 */
export function formatCompact(number: number): string {
  return new Intl.NumberFormat('en-GB', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(number);
}

/**
 * Get the day name from a date string.
 */
export function getDayName(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-GB', { weekday: 'long' });
}

/**
 * Format temperature
 */
export function formatTemp(celsius: number): string {
  return `${Math.round(celsius)}°C`;
}

/**
 * Classname merger utility (wrapper around tailwind-merge + clsx)
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date N days from now as YYYY-MM-DD string
 */
export function getDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}
