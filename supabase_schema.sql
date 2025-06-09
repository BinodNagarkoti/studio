
-- Supabase Schema for ShareScope AI - NEPSE Data

-- Helper to automatically update 'updated_at' columns
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table for Companies (Stocks)
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    sector TEXT, -- Consider normalizing this into a separate 'sectors' table later
    instrument_type TEXT,
    listing_date DATE,
    company_website TEXT,
    email TEXT,
    isin TEXT UNIQUE,
    face_value DECIMAL(10, 2) DEFAULT 100.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_companies_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- Example RLS: Allow public read access
CREATE POLICY "Allow public read access to companies" ON companies
FOR SELECT USING (true);


-- Table for Daily Stock Prices and Trading Data
CREATE TABLE IF NOT EXISTS daily_prices (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    open_price DECIMAL(18, 2),
    high_price DECIMAL(18, 2),
    low_price DECIMAL(18, 2),
    close_price DECIMAL(18, 2),
    ltp DECIMAL(18, 2), -- Last Traded Price
    previous_close_price DECIMAL(18, 2),
    change DECIMAL(18, 2),
    change_percent DECIMAL(8, 2),
    volume_traded BIGINT,
    turnover DECIMAL(24, 2),
    total_trades INTEGER,
    market_cap DECIMAL(24, 2),
    fifty_two_week_high DECIMAL(18, 2),
    fifty_two_week_low DECIMAL(18, 2),
    average_volume_3_months BIGINT,
    average_turnover_3_months DECIMAL(24,2),
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_company_date UNIQUE (company_id, date)
);

ALTER TABLE daily_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to daily_prices" ON daily_prices
FOR SELECT USING (true);


-- Table for Floor Sheets (Individual Trades)
CREATE TABLE IF NOT EXISTS floor_sheets (
    id BIGSERIAL PRIMARY KEY,
    contract_no TEXT UNIQUE NOT NULL, -- Assuming contract_no is unique per trade
    date DATE NOT NULL,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    buyer_broker_code TEXT, -- Consider linking to a brokers table later
    seller_broker_code TEXT, -- Consider linking to a brokers table later
    quantity INTEGER NOT NULL,
    rate DECIMAL(18, 2) NOT NULL,
    amount DECIMAL(24, 2) NOT NULL,
    transaction_time TIME,
    business_date DATE,
    scraped_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE floor_sheets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to floor_sheets" ON floor_sheets
FOR SELECT USING (true);


-- Table for Market Indices
CREATE TABLE IF NOT EXISTS indices (
    id SERIAL PRIMARY KEY,
    index_name TEXT NOT NULL, -- e.g., "NEPSE Index", "Sensitive Index", "Banks Sub-Index"
    date DATE NOT NULL,
    current_value DECIMAL(18, 2) NOT NULL,
    point_change DECIMAL(18, 2),
    percent_change DECIMAL(8, 2),
    previous_close DECIMAL(18,2),
    high_value DECIMAL(18,2),
    low_value DECIMAL(18,2),
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_index_name_date UNIQUE (index_name, date)
);

ALTER TABLE indices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to indices" ON indices
FOR SELECT USING (true);


-- Table for Sector Summary
CREATE TABLE IF NOT EXISTS sector_summary (
    id SERIAL PRIMARY KEY,
    sector_name TEXT NOT NULL, -- Matches company.sector or a predefined list
    date DATE NOT NULL,
    turnover DECIMAL(24, 2),
    total_traded_shares BIGINT,
    total_transactions INTEGER,
    total_scrips_traded INTEGER,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_sector_name_date UNIQUE (sector_name, date)
);

ALTER TABLE sector_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to sector_summary" ON sector_summary
FOR SELECT USING (true);


-- Table for Overall Market Summary History
CREATE TABLE IF NOT EXISTS market_summary_history (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    total_turnover DECIMAL(24, 2),
    total_traded_shares BIGINT,
    total_transactions INTEGER,
    total_scrips_traded INTEGER,
    total_listed_companies INTEGER,
    total_market_cap DECIMAL(30, 2), -- Sum of all company market caps
    nepse_index_value DECIMAL(18, 2), -- Storing the main index value for that day for quick ref
    nepse_index_change DECIMAL(18, 2),
    nepse_index_percent_change DECIMAL(8, 2),
    scraped_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE market_summary_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to market_summary_history" ON market_summary_history
FOR SELECT USING (true);


-- Table for Brokers
CREATE TABLE IF NOT EXISTS brokers (
    id TEXT PRIMARY KEY, -- e.g., "B58" (matches BrokerInfo type)
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL, -- e.g., "58" (matches BrokerInfo type)
    address TEXT,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_brokers_updated_at
BEFORE UPDATE ON brokers
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to brokers" ON brokers
FOR SELECT USING (true);


-- Table for Scraped Data Checkpoints (Optional, for managing scraping process)
CREATE TABLE IF NOT EXISTS scraping_checkpoints (
    id SERIAL PRIMARY KEY,
    source_url TEXT NOT NULL, -- e.g., 'https://nepalstock.com.np/floor-sheet'
    last_scraped_identifier TEXT, -- Could be a date, contract_no, etc.
    last_scraped_at TIMESTAMPTZ,
    status TEXT, -- e.g., 'success', 'failed'
    notes TEXT,
    UNIQUE (source_url)
);

ALTER TABLE scraping_checkpoints ENABLE ROW LEVEL SECURITY;
-- RLS for checkpoints would typically be restricted to an admin/service role
-- For now, allowing read to anon, but you should tighten this.
CREATE POLICY "Allow service role access to scraping_checkpoints" ON scraping_checkpoints
FOR ALL USING (true); -- Replace 'true' with role-based checks in production.


-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_companies_symbol ON companies(symbol);
CREATE INDEX IF NOT EXISTS idx_daily_prices_company_id_date ON daily_prices(company_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_prices_date ON daily_prices(date DESC);
CREATE INDEX IF NOT EXISTS idx_floor_sheets_company_id_date ON floor_sheets(company_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_floor_sheets_date ON floor_sheets(date DESC);
CREATE INDEX IF NOT EXISTS idx_indices_name_date ON indices(index_name, date DESC);
CREATE INDEX IF NOT EXISTS idx_sector_summary_name_date ON sector_summary(sector_name, date DESC);
CREATE INDEX IF NOT EXISTS idx_market_summary_history_date ON market_summary_history(date DESC);
CREATE INDEX IF NOT EXISTS idx_brokers_code ON brokers(code);

-- Enable pg_cron extension if you plan to schedule jobs within Supabase (optional)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- GRANT USAGE ON SCHEMA cron TO postgres; -- or a specific role
-- GRANT SELECT ON cron.job TO postgres; -- or a specific role


COMMENT ON TABLE companies IS 'Stores information about listed companies/stocks.';
COMMENT ON COLUMN companies.sector IS 'Sector the company belongs to. Consider normalizing for consistency.';
COMMENT ON TABLE daily_prices IS 'Stores daily aggregated price and volume data for each company.';
COMMENT ON TABLE floor_sheets IS 'Stores individual trade records (floor sheet data).';
COMMENT ON COLUMN floor_sheets.buyer_broker_code IS 'Code of the buying broker. Can be linked to brokers.code.';
COMMENT ON COLUMN floor_sheets.seller_broker_code IS 'Code of the selling broker. Can be linked to brokers.code.';
COMMENT ON TABLE indices IS 'Stores daily values for various market indices.';
COMMENT ON TABLE sector_summary IS 'Stores daily aggregated trading data per sector.';
COMMENT ON TABLE market_summary_history IS 'Stores overall market summary for each trading day.';
COMMENT ON TABLE brokers IS 'Stores information about stock brokers.';
COMMENT ON TABLE scraping_checkpoints IS 'Optional table to help manage the state of the scraping process.';

-- Remember to set up Row Level Security (RLS) policies for each table based on your access patterns.
-- The examples above allow public read, which is common for data display apps.
-- For write operations (from your scraper), you'll likely use the 'service_role' key or a dedicated role with specific INSERT/UPDATE permissions.

