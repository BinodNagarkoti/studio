
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper function to automatically update 'updated_at' columns
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Companies Table (Enhanced)
DROP TABLE IF EXISTS public.companies CASCADE;
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    ticker_symbol VARCHAR(20) NOT NULL UNIQUE,
    sector_name TEXT,
    industry TEXT,
    exchange_listed TEXT DEFAULT 'NEPSE',
    incorporation_date DATE,
    headquarters_location TEXT,
    website_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    scraped_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.companies IS 'Stores basic information about publicly traded companies.';
COMMENT ON COLUMN public.companies.sector_name IS 'Broad sector classification, e.g., Banking, Hydropower.';
COMMENT ON COLUMN public.companies.industry IS 'More specific industry classification, e.g., Commercial Bank, Microfinance.';

CREATE TRIGGER set_timestamp_companies
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- 2. Financial Reports Table
DROP TABLE IF EXISTS public.financial_reports CASCADE;
CREATE TABLE public.financial_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    report_date DATE NOT NULL, -- End date of the reporting period or publication date
    fiscal_year INTEGER NOT NULL,
    fiscal_period VARCHAR(10) NOT NULL, -- e.g., 'Q1', 'Q2', 'Q3', 'Q4', 'FY' (Full Year/Annual)
    -- Income Statement
    revenue DECIMAL(20, 2),
    net_income DECIMAL(20, 2),
    gross_profit DECIMAL(20, 2),
    operating_income DECIMAL(20, 2),
    eps DECIMAL(10, 2), -- Earnings Per Share for this period
    dps DECIMAL(10, 2), -- Dividends Per Share declared from this period's earnings
    -- Balance Sheet
    total_assets DECIMAL(20, 2),
    total_liabilities DECIMAL(20, 2),
    shareholders_equity DECIMAL(20, 2),
    current_assets DECIMAL(20, 2),
    current_liabilities DECIMAL(20, 2),
    cash_and_equivalents DECIMAL(20, 2),
    long_term_debt DECIMAL(20, 2),
    -- Cash Flow Statement
    operating_cash_flow DECIMAL(20, 2),
    investing_cash_flow DECIMAL(20, 2),
    financing_cash_flow DECIMAL(20, 2),
    free_cash_flow DECIMAL(20, 2),
    source_url TEXT, -- Link to the financial report PDF/source
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    scraped_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (company_id, fiscal_year, fiscal_period)
);
COMMENT ON TABLE public.financial_reports IS 'Stores periodic financial statement data for companies.';
COMMENT ON COLUMN public.financial_reports.report_date IS 'End date of the reporting period or the date report was published.';
COMMENT ON COLUMN public.financial_reports.fiscal_period IS 'E.g., Q1, Q2, Q3, Q4, FY for Annual.';

CREATE TRIGGER set_timestamp_financial_reports
BEFORE UPDATE ON public.financial_reports
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- 3. Daily Market Data Table (Replaces daily_prices)
DROP TABLE IF EXISTS public.daily_market_data CASCADE;
CREATE TABLE public.daily_market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    trade_date DATE NOT NULL,
    open_price DECIMAL(12, 2),
    high_price DECIMAL(12, 2),
    low_price DECIMAL(12, 2),
    close_price DECIMAL(12, 2),
    adjusted_close_price DECIMAL(12, 2), -- Adjusted for splits and dividends
    volume BIGINT,
    turnover DECIMAL(20, 2),
    market_cap DECIMAL(20, 2),
    fifty_two_week_high DECIMAL(12, 2), -- As reported on this trade_date
    fifty_two_week_low DECIMAL(12, 2),  -- As reported on this trade_date
    previous_close_price DECIMAL(12,2),
    price_change DECIMAL(12,2),
    percent_change DECIMAL(8,4),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    scraped_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (company_id, trade_date)
);
COMMENT ON TABLE public.daily_market_data IS 'Stores daily OHLCV and other market data for stocks.';

CREATE TRIGGER set_timestamp_daily_market_data
BEFORE UPDATE ON public.daily_market_data
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- 4. Company Ratios Table
DROP TABLE IF EXISTS public.company_ratios CASCADE;
CREATE TABLE public.company_ratios (
    ratio_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    as_of_date DATE NOT NULL, -- The date for which these ratios are applicable (e.g., report date or trade date)
    report_id UUID REFERENCES public.financial_reports(report_id) ON DELETE SET NULL, -- Optional link to a specific financial report
    -- Valuation Ratios
    pe_ratio DECIMAL(10, 2),
    pb_ratio DECIMAL(10, 2),
    ps_ratio DECIMAL(10, 2),
    dividend_yield DECIMAL(8, 4), -- e.g., 0.05 for 5%
    -- Profitability Ratios
    roe DECIMAL(8, 4), -- Return on Equity
    roa DECIMAL(8, 4), -- Return on Assets
    net_profit_margin DECIMAL(8, 4),
    -- Liquidity Ratios
    current_ratio DECIMAL(10, 2),
    quick_ratio DECIMAL(10, 2),
    -- Debt Ratios
    debt_to_equity_ratio DECIMAL(10, 2),
    interest_coverage_ratio DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    scraped_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, as_of_date)
);
COMMENT ON TABLE public.company_ratios IS 'Stores calculated financial ratios and metrics for companies.';

CREATE TRIGGER set_timestamp_company_ratios
BEFORE UPDATE ON public.company_ratios
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- 5. Daily Technical Indicators Table
DROP TABLE IF EXISTS public.daily_technical_indicators CASCADE;
CREATE TABLE public.daily_technical_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    trade_date DATE NOT NULL,
    indicator_name VARCHAR(100) NOT NULL, -- e.g., 'SMA_50', 'RSI_14', 'MACD_Line'
    value DECIMAL(18, 6),
    parameters JSONB, -- e.g., {"period": 50}
    created_at TIMESTAMPTZ DEFAULT now(),
    scraped_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (company_id, trade_date, indicator_name, parameters) -- Parameters might need careful handling for uniqueness
);
COMMENT ON TABLE public.daily_technical_indicators IS 'Stores calculated technical indicator values for stocks.';
COMMENT ON COLUMN public.daily_technical_indicators.parameters IS 'JSON object detailing parameters used for calculation, e.g., {"period": 14}. Important for uniqueness if multiple versions of an indicator (e.g. SMA_20, SMA_50) are stored.';

-- 6. Economic and Sector Data
DROP TABLE IF EXISTS public.nepal_economic_data CASCADE;
CREATE TABLE public.nepal_economic_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_date DATE NOT NULL UNIQUE,
    gdp_growth_rate DECIMAL(8, 4),
    inflation_rate_cpi DECIMAL(8, 4),
    central_bank_policy_rate DECIMAL(8, 4),
    npr_usd_exchange_rate DECIMAL(10, 4),
    npr_inr_exchange_rate DECIMAL(10, 4),
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    scraped_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.nepal_economic_data IS 'Stores macroeconomic data for Nepal.';

CREATE TRIGGER set_timestamp_nepal_economic_data
BEFORE UPDATE ON public.nepal_economic_data
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TABLE IF EXISTS public.sector_daily_summary CASCADE;
CREATE TABLE public.sector_daily_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sector_name TEXT NOT NULL, -- Could be FK to a sectors table if sectors are predefined
    trade_date DATE NOT NULL,
    index_value DECIMAL(12, 2),
    percent_change DECIMAL(8, 4),
    total_turnover DECIMAL(20, 2),
    total_volume BIGINT,
    meta_data JSONB, -- For any other sector specific summary data
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    scraped_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (sector_name, trade_date)
);
COMMENT ON TABLE public.sector_daily_summary IS 'Stores daily summary data for different market sectors.';

CREATE TRIGGER set_timestamp_sector_daily_summary
BEFORE UPDATE ON public.sector_daily_summary
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- 7. News and Events Table (Replaces announcements)
DROP TABLE IF EXISTS public.news_and_events CASCADE;
CREATE TABLE public.news_and_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL, -- Nullable if general market news
    event_date DATE NOT NULL,
    publish_datetime TIMESTAMPTZ, -- More precise time if available
    headline TEXT NOT NULL,
    source_name VARCHAR(255),
    url TEXT UNIQUE, -- Unique URL for scraped articles to avoid duplicates
    summary TEXT,
    content TEXT, -- Full content if scraped
    event_type VARCHAR(100), -- 'EarningsRelease', 'Merger', 'AnalystRating', 'InsiderTransaction', 'CorporateAnnouncement', 'GeneralMarket'
    sentiment_score DECIMAL(3, 2), -- e.g., between -1.00 and 1.00
    details_json JSONB, -- For structured data like analyst ratings or insider transaction details
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    scraped_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.news_and_events IS 'Stores news articles, corporate announcements, and other relevant events.';
COMMENT ON COLUMN public.news_and_events.event_type IS 'Categorizes the type of news or event.';

CREATE TRIGGER set_timestamp_news_and_events
BEFORE UPDATE ON public.news_and_events
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- 8. Ownership and Governance Table
DROP TABLE IF EXISTS public.company_ownership_governance CASCADE;
CREATE TABLE public.company_ownership_governance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    as_of_date DATE NOT NULL,
    promoter_holdings_percent DECIMAL(5, 2),
    public_shareholding_percent DECIMAL(5, 2),
    government_holdings_percent DECIMAL(5,2),
    foreign_holdings_percent DECIMAL(5,2),
    institutional_holdings_percent DECIMAL(5, 2),
    board_composition_details JSONB, -- Store as JSON array of board members or summary text
    total_outstanding_shares BIGINT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    scraped_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (company_id, as_of_date)
);
COMMENT ON TABLE public.company_ownership_governance IS 'Stores data related to company ownership structure and corporate governance.';

CREATE TRIGGER set_timestamp_company_ownership_governance
BEFORE UPDATE ON public.company_ownership_governance
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- 9. Risk Factors Table
DROP TABLE IF EXISTS public.company_risk_factors CASCADE;
CREATE TABLE public.company_risk_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    as_of_date DATE NOT NULL,
    beta DECIMAL(8, 4),
    credit_rating_agency VARCHAR(100),
    credit_rating_value VARCHAR(20),
    credit_rating_date DATE,
    litigation_summary TEXT,
    other_risk_factors JSONB, -- For storing various other risk textual descriptions or structured data
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    scraped_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (company_id, as_of_date)
);
COMMENT ON TABLE public.company_risk_factors IS 'Stores risk-related data for companies like Beta, credit ratings.';

CREATE TRIGGER set_timestamp_company_risk_factors
BEFORE UPDATE ON public.company_risk_factors
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- 10. Historical Data - Specific Tables
DROP TABLE IF EXISTS public.dividend_history CASCADE;
CREATE TABLE public.dividend_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    ex_dividend_date DATE NOT NULL,
    record_date DATE,
    payment_date DATE,
    dividend_type VARCHAR(50) NOT NULL, -- 'Cash', 'BonusShare' (Stock Dividend)
    amount_per_share DECIMAL(10, 2), -- For cash dividend
    bonus_share_ratio VARCHAR(20), -- e.g., '1:0.5' (shares:bonus_shares)
    fiscal_year_of_profit VARCHAR(20), -- e.g., '2079/80'
    book_closure_date_start DATE,
    book_closure_date_end DATE,
    source_announcement_id UUID REFERENCES public.news_and_events(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    scraped_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (company_id, ex_dividend_date, dividend_type, fiscal_year_of_profit)
);
COMMENT ON TABLE public.dividend_history IS 'Stores historical dividend payments and bonus share issuances.';

CREATE TRIGGER set_timestamp_dividend_history
BEFORE UPDATE ON public.dividend_history
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TABLE IF EXISTS public.stock_splits CASCADE;
CREATE TABLE public.stock_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    split_date DATE NOT NULL, -- Effective date of the split
    split_ratio_from INTEGER NOT NULL, -- e.g., 1 for a 1-to-10 split
    split_ratio_to INTEGER NOT NULL,   -- e.g., 10 for a 1-to-10 split
    source_announcement_id UUID REFERENCES public.news_and_events(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    scraped_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (company_id, split_date)
);
COMMENT ON TABLE public.stock_splits IS 'Stores historical stock split information.';

CREATE TRIGGER set_timestamp_stock_splits
BEFORE UPDATE ON public.stock_splits
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Additional NEPSE Specific Tables (from previous schema, adapted)
DROP TABLE IF EXISTS public.nepse_indices CASCADE;
CREATE TABLE public.nepse_indices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    index_code VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'NEPSE', 'SENSI', 'BANK'
    name TEXT NOT NULL,
    description TEXT,
    base_date DATE,
    base_value DECIMAL(12,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.nepse_indices IS 'Defines the various indices tracked on NEPSE.';

CREATE TRIGGER set_timestamp_nepse_indices
BEFORE UPDATE ON public.nepse_indices
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TABLE IF EXISTS public.daily_index_values CASCADE;
CREATE TABLE public.daily_index_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    index_id UUID NOT NULL REFERENCES public.nepse_indices(id) ON DELETE CASCADE,
    trade_date DATE NOT NULL,
    open_value DECIMAL(12, 2),
    high_value DECIMAL(12, 2),
    low_value DECIMAL(12, 2),
    close_value DECIMAL(12, 2),
    point_change DECIMAL(10, 2),
    percent_change DECIMAL(8, 4),
    created_at TIMESTAMPTZ DEFAULT now(),
    scraped_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (index_id, trade_date)
);
COMMENT ON TABLE public.daily_index_values IS 'Stores daily OHLC values for NEPSE indices.';

DROP TABLE IF EXISTS public.market_overall_summary CASCADE;
CREATE TABLE public.market_overall_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    summary_date DATE NOT NULL UNIQUE,
    total_turnover DECIMAL(20, 2),
    total_traded_shares BIGINT,
    total_transactions INTEGER,
    total_market_cap DECIMAL(20, 2),
    nepse_index_value DECIMAL(12, 2), -- Nepse Alpha index close
    nepse_point_change DECIMAL(10,2),
    nepse_percent_change DECIMAL(8,4),
    sensitive_index_value DECIMAL(12,2),
    sensitive_point_change DECIMAL(10,2),
    sensitive_percent_change DECIMAL(8,4),
    float_index_value DECIMAL(12,2),
    float_point_change DECIMAL(10,2),
    float_percent_change DECIMAL(8,4),
    sensitive_float_index_value DECIMAL(12,2),
    sensitive_float_point_change DECIMAL(10,2),
    sensitive_float_percent_change DECIMAL(8,4),
    scraped_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.market_overall_summary IS 'Stores overall market summary data for each trading day.';

CREATE TRIGGER set_timestamp_market_overall_summary
BEFORE UPDATE ON public.market_overall_summary
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TABLE IF EXISTS public.brokers CASCADE;
CREATE TABLE public.brokers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    broker_code VARCHAR(10) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    contact_info TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.brokers IS 'Information about stock brokers.';

CREATE TRIGGER set_timestamp_brokers
BEFORE UPDATE ON public.brokers
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TABLE IF EXISTS public.floor_sheet_transactions CASCADE;
CREATE TABLE public.floor_sheet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nepse_transaction_id BIGINT, -- Transaction ID from NEPSE, can be very large
    trade_date DATE NOT NULL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    buyer_broker_id UUID REFERENCES public.brokers(id) ON DELETE SET NULL,
    seller_broker_id UUID REFERENCES public.brokers(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    rate DECIMAL(12, 2) NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    transaction_time TIME,
    contract_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now(),
    scraped_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (nepse_transaction_id, trade_date) -- Assuming nepse_transaction_id might repeat across dates but unique per day
);
COMMENT ON TABLE public.floor_sheet_transactions IS 'Stores individual transactions from the NEPSE floor sheet.';
COMMENT ON COLUMN public.floor_sheet_transactions.nepse_transaction_id IS 'The unique transaction ID from NEPSE for that trade. Often called S.N. or Contract No. in floor sheets.';

DROP TABLE IF EXISTS public.scraping_checkpoints CASCADE;
CREATE TABLE public.scraping_checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name VARCHAR(255) NOT NULL UNIQUE, -- e.g., 'today_price', 'floor_sheet', 'company_financials_NABIL'
    last_scraped_value TEXT, -- Could be a date, an ID, a page number
    last_successful_run TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
COMMENT ON TABLE public.scraping_checkpoints IS 'Tracks the progress of scraping tasks.';

CREATE TRIGGER set_timestamp_scraping_checkpoints
BEFORE UPDATE ON public.scraping_checkpoints
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Indexes for common lookups
CREATE INDEX idx_financial_reports_company_period ON public.financial_reports(company_id, fiscal_year, fiscal_period);
CREATE INDEX idx_daily_market_data_company_date ON public.daily_market_data(company_id, trade_date DESC);
CREATE INDEX idx_company_ratios_company_date ON public.company_ratios(company_id, as_of_date DESC);
CREATE INDEX idx_daily_tech_indicators_company_date_name ON public.daily_technical_indicators(company_id, trade_date DESC, indicator_name);
CREATE INDEX idx_news_event_date ON public.news_and_events(event_date DESC);
CREATE INDEX idx_news_company_id ON public.news_and_events(company_id);
CREATE INDEX idx_dividend_history_company_date ON public.dividend_history(company_id, ex_dividend_date DESC);
CREATE INDEX idx_stock_splits_company_date ON public.stock_splits(company_id, split_date DESC);
CREATE INDEX idx_daily_index_values_index_date ON public.daily_index_values(index_id, trade_date DESC);
CREATE INDEX idx_floor_sheet_company_date ON public.floor_sheet_transactions(company_id, trade_date DESC);
CREATE INDEX idx_floor_sheet_trade_date ON public.floor_sheet_transactions(trade_date DESC);


-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_ratios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_technical_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nepal_economic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sector_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_and_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_ownership_governance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_risk_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividend_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nepse_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_index_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_overall_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floor_sheet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraping_checkpoints ENABLE ROW LEVEL SECURITY;

-- Create default public read-only policies (adjust as needed for your security model)
-- For publicly accessible data, allow anonymous read.
-- For data that should only be accessed by authenticated users or service roles, create more specific policies.

CREATE POLICY "Public read access for companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Public read access for financial_reports" ON public.financial_reports FOR SELECT USING (true);
CREATE POLICY "Public read access for daily_market_data" ON public.daily_market_data FOR SELECT USING (true);
CREATE POLICY "Public read access for company_ratios" ON public.company_ratios FOR SELECT USING (true);
CREATE POLICY "Public read access for daily_technical_indicators" ON public.daily_technical_indicators FOR SELECT USING (true);
CREATE POLICY "Public read access for nepal_economic_data" ON public.nepal_economic_data FOR SELECT USING (true);
CREATE POLICY "Public read access for sector_daily_summary" ON public.sector_daily_summary FOR SELECT USING (true);
CREATE POLICY "Public read access for news_and_events" ON public.news_and_events FOR SELECT USING (true);
CREATE POLICY "Public read access for company_ownership_governance" ON public.company_ownership_governance FOR SELECT USING (true);
CREATE POLICY "Public read access for company_risk_factors" ON public.company_risk_factors FOR SELECT USING (true);
CREATE POLICY "Public read access for dividend_history" ON public.dividend_history FOR SELECT USING (true);
CREATE POLICY "Public read access for stock_splits" ON public.stock_splits FOR SELECT USING (true);
CREATE POLICY "Public read access for nepse_indices" ON public.nepse_indices FOR SELECT USING (true);
CREATE POLICY "Public read access for daily_index_values" ON public.daily_index_values FOR SELECT USING (true);
CREATE POLICY "Public read access for market_overall_summary" ON public.market_overall_summary FOR SELECT USING (true);
CREATE POLICY "Public read access for brokers" ON public.brokers FOR SELECT USING (true);
CREATE POLICY "Public read access for floor_sheet_transactions" ON public.floor_sheet_transactions FOR SELECT USING (true);

-- Scraping checkpoints are usually not public. You'll need service role or specific user access.
-- For now, let's make it readable for demo purposes, but you should restrict this.
CREATE POLICY "Public read for scraping_checkpoints (DEMO ONLY - RESTRICT LATER)" ON public.scraping_checkpoints FOR SELECT USING (true);
-- Example: To allow inserts only by a service role (used by your scraper):
-- CREATE POLICY "Allow service_role to insert scraping_checkpoints" ON public.scraping_checkpoints FOR INSERT WITH CHECK (current_user_is_service_role());
-- CREATE POLICY "Allow service_role to update scraping_checkpoints" ON public.scraping_checkpoints FOR UPDATE USING (current_user_is_service_role()) WITH CHECK (current_user_is_service_role());

-- Drop old tables if they were not dropped by CASCADE earlier
DROP TABLE IF EXISTS public.daily_prices CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.stock_fundamentals CASCADE;
DROP TABLE IF EXISTS public.stock_technicals CASCADE;
DROP TABLE IF EXISTS public.indices CASCADE; -- Replaced by nepse_indices
DROP TABLE IF EXISTS public.market_summary CASCADE; -- Replaced by market_overall_summary
DROP TABLE IF EXISTS public.sector_summary CASCADE; -- Replaced by sector_daily_summary
DROP TABLE IF EXISTS public.floor_sheets CASCADE; -- Replaced by floor_sheet_transactions
DROP TABLE IF EXISTS public.company_brokers CASCADE;

COMMENT ON SCHEMA public IS 'Standard public schema';
-- You might want to create a dedicated schema for your app's tables, e.g., CREATE SCHEMA nepse_data;

-- Grant usage on schema public to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant select on all tables in public schema to anon and authenticated roles
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- IMPORTANT: For your scraper to WRITE data, it should use the SERVICE_ROLE_KEY for Supabase.
-- The RLS policies here are primarily for read access from your Next.js app using the ANON_KEY.
-- If your scraper uses the ANON_KEY (not recommended for writing), you would need to create specific INSERT/UPDATE/DELETE policies.

-- Example for allowing service role to do anything on a table:
-- ALTER TABLE public.companies BYPASS ROW LEVEL SECURITY; -- Temporarily if using service key and want to skip RLS for it
-- Or create specific policies for the service_role.

SELECT 'Database schema setup complete. Review RLS policies carefully.';

