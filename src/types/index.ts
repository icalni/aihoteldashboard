// ============================================================
// Hotel Dashboard — TypeScript Type Definitions
// ============================================================

// --- Properties ---
export interface Property {
  id: string;
  name: string;
  city: string | null;
  country: string | null;
  room_count: number | null;
  created_at: string;
}

// --- Room Types ---
export interface RoomType {
  id: string;
  property_id: string;
  name: string; // e.g. "Standard", "Deluxe", "Suite"
  base_price: number; // in IDR
  capacity: number | null;
}

// --- Daily Rates (from PMS / CSV) ---
export interface DailyRate {
  id: string;
  property_id: string;
  room_type_id: string;
  date: string; // ISO date
  occupancy_rate: number | null; // percentage 0-100
  adr: number | null; // Average Daily Rate (IDR)
  revenue: number | null; // IDR
  available_rooms: number | null;
  booked_rooms: number | null;
}

// --- Current Prices ---
export interface CurrentPrice {
  id: string;
  property_id: string;
  room_type_id: string;
  date: string;
  current_price: number; // IDR
  suggested_price: number | null; // IDR
  price_changed: boolean;
  room_type?: RoomType;
}

// --- Competitor Prices ---
export interface CompetitorPrice {
  id: string;
  property_id: string;
  competitor_name: string;
  room_category: string | null;
  price: number; // IDR
  date: string;
  source: string;
}

// --- Weather Data ---
export interface WeatherData {
  id: string;
  property_id: string;
  date: string;
  high_temp: number;
  low_temp: number;
  condition: string; // e.g. "Sunny", "Rainy"
  precipitation_pct: number;
}

// --- Events ---
export interface Event {
  id: string;
  property_id: string;
  name: string;
  venue: string | null;
  category: string | null;
  start_date: string;
  end_date: string | null;
  expected_attendance: number | null;
  radius_km: number | null;
  source: string;
}

// --- Pricing Recommendations (from DeepSeek AI) ---
export type RecommendationStatus = 'pending' | 'approved' | 'modified' | 'rejected';

export interface PricingRecommendation {
  id: string;
  property_id: string;
  room_type_id: string;
  date: string;
  current_price: number;
  recommended_price: number;
  confidence_score: number; // 0-100
  reasoning: string;
  factors: string[]; // JSONB stored as string array
  status: RecommendationStatus;
  modified_price: number | null;
  reviewed_at: string | null;
  created_at: string;
  room_type?: RoomType;
}

// --- API Request/Response Types ---

export interface PricingOverview {
  date: string;
  property: Property;
  room_types: RoomType[];
  current_prices: CurrentPrice[];
  daily_rates: DailyRate[];
  weather: WeatherData | null;
  events: Event[];
  competitor_prices: CompetitorPrice[];
  pending_recommendations: number;
}

export interface RecommendationRequest {
  property_id: string;
  room_type_id: string;
  date: string;
}

export interface BatchRecommendRequest {
  property_id: string;
  start_date: string;
  end_date: string;
}

export interface ReviewRequest {
  recommendation_id: string;
  action: 'approved' | 'rejected';
  modified_price?: number;
}

export interface AIRecommendationResponse {
  recommendedPrice: number;
  confidenceScore: number;
  reasoning: string;
  keyFactors: string[];
}

export interface CSVRow {
  date: string;
  room_type: string;
  occupancy_rate: number;
  adr: number;
  revenue: number;
  available_rooms: number;
  booked_rooms: number;
}

// --- Dashboard Aggregates ---
export interface DashboardStats {
  today_occupancy: number;
  today_adr: number;
  today_revpar: number;
  occupancy_trend: { date: string; rate: number }[];
  revenue_trend: { date: string; revenue: number }[];
  week_over_week_occupancy: number; // percentage change
  week_over_week_revpar: number;
}
