// ============================================================
// Application Constants & Configuration
// ============================================================

export const DEFAULT_PROPERTY = {
  name: process.env.NEXT_PUBLIC_DEFAULT_PROPERTY_NAME || 'Hotel Saison',
  city: process.env.NEXT_PUBLIC_DEFAULT_PROPERTY_CITY || 'Jakarta',
  lat: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_PROPERTY_LAT || '-6.2088'),
  lng: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_PROPERTY_LNG || '106.8456'),
};

export const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite'] as const;

export const RECOMMENDATION_STATUS = {
  PENDING: 'pending' as const,
  APPROVED: 'approved' as const,
  MODIFIED: 'modified' as const,
  REJECTED: 'rejected' as const,
};

export const COMPETITOR_HOTELS = [
  'Hotel Grand Indonesia',
  'The Ritz-Carlton Jakarta',
  'Shangri-La Jakarta',
];

export const CURRENCY = {
  locale: 'id-ID',
  code: 'IDR',
  symbol: 'Rp',
};

export const API_ROUTES = {
  PRICING_RECOMMEND: '/api/pricing/recommend',
  PRICING_BATCH: '/api/pricing/batch-recommend',
  PRICING_REVIEW: '/api/pricing/review',
  PMS_UPLOAD: '/api/pms/upload',
  WEATHER: '/api/weather',
  EVENTS: '/api/events',
} as const;
