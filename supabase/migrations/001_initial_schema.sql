-- ============================================================
-- Hotel Dashboard — Initial Database Schema
-- ============================================================

-- 1. Properties (multi-property ready)
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  room_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Room Types
CREATE TABLE room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_price DECIMAL(12,2) NOT NULL, -- IDR
  capacity INTEGER,
  UNIQUE(property_id, name)
);

-- 3. Daily Rates (historical PMS data)
CREATE TABLE daily_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  occupancy_rate DECIMAL(5,2), -- percentage 0-100
  adr DECIMAL(12,2), -- Average Daily Rate in IDR
  revenue DECIMAL(14,2), -- IDR
  available_rooms INTEGER,
  booked_rooms INTEGER,
  UNIQUE(property_id, room_type_id, date)
);

-- 4. Current / Active Prices
CREATE TABLE current_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  current_price DECIMAL(12,2) NOT NULL, -- IDR
  suggested_price DECIMAL(12,2), -- AI-suggested price in IDR
  price_changed BOOLEAN DEFAULT FALSE,
  UNIQUE(property_id, room_type_id, date)
);

-- 5. Competitor Prices
CREATE TABLE competitor_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  room_category TEXT,
  price DECIMAL(12,2) NOT NULL, -- IDR
  date DATE NOT NULL,
  source TEXT DEFAULT 'mock',
  UNIQUE(property_id, competitor_name, room_category, date)
);

-- 6. Weather Data
CREATE TABLE weather_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  high_temp DECIMAL(5,2),
  low_temp DECIMAL(5,2),
  condition TEXT,
  precipitation_pct DECIMAL(5,2),
  UNIQUE(property_id, date)
);

-- 7. Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  venue TEXT,
  category TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  expected_attendance INTEGER,
  radius_km DECIMAL(5,2),
  source TEXT DEFAULT 'predicthq'
);

-- 8. Pricing Recommendations (from DeepSeek AI)
CREATE TYPE recommendation_status AS ENUM ('pending', 'approved', 'modified', 'rejected');

CREATE TABLE pricing_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  current_price DECIMAL(12,2) NOT NULL,
  recommended_price DECIMAL(12,2) NOT NULL,
  confidence_score DECIMAL(5,2), -- 0-100
  reasoning TEXT,
  factors JSONB DEFAULT '[]'::jsonb,
  status recommendation_status DEFAULT 'pending',
  modified_price DECIMAL(12,2),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, room_type_id, date)
);

-- ============================================================
-- Indexes for performance
-- ============================================================

CREATE INDEX idx_daily_rates_property_date ON daily_rates(property_id, date);
CREATE INDEX idx_current_prices_property_date ON current_prices(property_id, date);
CREATE INDEX idx_competitor_prices_property_date ON competitor_prices(property_id, date);
CREATE INDEX idx_weather_property_date ON weather_data(property_id, date);
CREATE INDEX idx_events_property_dates ON events(property_id, start_date, end_date);
CREATE INDEX idx_recommendations_status ON pricing_recommendations(property_id, status);
CREATE INDEX idx_recommendations_date ON pricing_recommendations(property_id, date);

-- ============================================================
-- Row Level Security (for future multi-user auth)
-- ============================================================

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_recommendations ENABLE ROW LEVEL SECURITY;

-- For MVP: allow all operations (single-user)
CREATE POLICY "Allow all on properties" ON properties FOR ALL USING (true);
CREATE POLICY "Allow all on room_types" ON room_types FOR ALL USING (true);
CREATE POLICY "Allow all on daily_rates" ON daily_rates FOR ALL USING (true);
CREATE POLICY "Allow all on current_prices" ON current_prices FOR ALL USING (true);
CREATE POLICY "Allow all on competitor_prices" ON competitor_prices FOR ALL USING (true);
CREATE POLICY "Allow all on weather_data" ON weather_data FOR ALL USING (true);
CREATE POLICY "Allow all on events" ON events FOR ALL USING (true);
CREATE POLICY "Allow all on pricing_recommendations" ON pricing_recommendations FOR ALL USING (true);
