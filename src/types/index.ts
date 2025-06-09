
import type { LucideIcon } from 'lucide-react';
import type { GenerateStockReportOutput } from '@/ai/flows/generate-stock-report';
import type { AssessConfidenceLevelOutput } from '@/ai/flows/assess-confidence-level';
import type { GenerateRiskDisclaimerOutput } from '@/ai/flows/generate-risk-disclaimer';
// Import Supabase generated types if you have run the generation script
// import type { Database } from './supabase'; // Path to your generated Supabase types

// --- Core Data Types (Aligning with new Supabase Schema) ---

// Base type for most tables with timestamps
export interface BaseEntity {
  id: string; // Assuming UUID from Supabase
  created_at?: string;
  updated_at?: string;
  scraped_at?: string;
}

export interface Company extends BaseEntity {
  name: string;
  ticker_symbol: string;
  industry_sector?: string | null;
  exchange_listed?: string | null; // Changed from 'exchange'
  incorporation_date?: string | null; // Date
  headquarters_location?: string | null;
  website_url?: string | null; // Changed from 'website'
  description?: string | null;
  is_active?: boolean;
  // Added from Supabase schema for companies:
  industry?: string | null; // This might be redundant with industry_sector, review based on source
  sector_name?: string | null; // This might be redundant with industry_sector, review based on source
}

export interface FinancialReport extends BaseEntity {
  report_id: string; // Using report_id as the primary key identifier for this type
  company_id: string; // Foreign Key to Companies
  report_date: string; // Date
  fiscal_period: 'quarterly' | 'annual'; // Changed from period_type
  currency?: string; // e.g., 'NPR' - Added as it's good practice, though not in all Supabase tables explicitly

  // Income Statement
  revenue?: number | null;
  net_income?: number | null;
  gross_profit?: number | null;
  operating_income?: number | null;
  eps?: number | null; // Earnings Per Share
  dps?: number | null; // Dividends Per Share

  // Balance Sheet
  total_assets?: number | null;
  total_liabilities?: number | null;
  shareholders_equity?: number | null;
  current_assets?: number | null;
  current_liabilities?: number | null;
  cash_and_equivalents?: number | null; // Changed from cash_and_cash_equivalents
  long_term_debt?: number | null;

  // Cash Flow
  operating_cash_flow?: number | null;
  investing_cash_flow?: number | null;
  financing_cash_flow?: number | null;
  free_cash_flow?: number | null;
  
  // Shares - outstanding_shares was removed from FinancialReport as it's often in ownership/company table
  
  source_url?: string | null;
  fiscal_year?: number; // Added from Supabase schema
}

export interface DailyMarketData extends BaseEntity {
  company_id: string; // Foreign Key to Companies
  trade_date: string; // Date
  open_price?: number | null;
  high_price?: number | null;
  low_price?: number | null;
  close_price?: number | null;
  adjusted_close_price?: number | null;
  volume?: number | null; // Changed from volume_traded
  turnover?: number | null;
  market_cap?: number | null; // Changed from market_capitalization
  previous_close_price?: number | null;
  price_change?: number | null;
  percent_change?: number | null; // Changed from price_change_percent
  fifty_two_week_high?: number | null;
  fifty_two_week_low?: number | null;
}

export interface CompanyRatio extends BaseEntity {
  ratio_id: string; // Using ratio_id as primary key for this type
  company_id: string; // Foreign Key to Companies
  as_of_date: string; // Renamed from report_date for clarity with Supabase schema
  report_id?: string | null; // Link to a specific financial report if applicable
  
  // Valuation Ratios
  pe_ratio?: number | null;
  pb_ratio?: number | null;
  ps_ratio?: number | null;
  dividend_yield?: number | null;

  // Profitability Ratios
  roe?: number | null;
  roa?: number | null;
  net_profit_margin?: number | null;

  // Liquidity Ratios
  current_ratio?: number | null;
  quick_ratio?: number | null;

  // Debt Ratios
  debt_to_equity_ratio?: number | null;
  interest_coverage_ratio?: number | null;
}

export interface CompanyTechnicalIndicator extends BaseEntity {
  // id is from BaseEntity
  company_id: string; // Foreign Key to Companies
  trade_date: string; // Renamed from indicator_date to match Supabase 'daily_technical_indicators'
  indicator_name: string; // e.g., 'SMA_50', 'RSI_14'
  value?: number | null;
  interpretation?: string | null; // e.g., 'Bullish', 'Bearish', 'Neutral' - To be derived or added.
  parameters?: Record<string, any> | null; // From Supabase daily_technical_indicators.parameters (JSON)
}

export interface CompanyNewsEvent extends BaseEntity {
  // id from BaseEntity
  company_id?: string | null; // Optional if news is general
  event_date: string; // Date
  headline: string; // Renamed from title
  source_name?: string | null; // Renamed from source
  summary?: string | null;
  url?: string | null;
  event_type?: 'Earnings' | 'Merger' | 'AnalystUpdate' | 'Regulatory' | 'InsiderTransaction' | 'AGM/SGM' | 'Dividend' | 'RightShare' | 'Other'; // Expanded from category
  sentiment_score?: number | null; // Added from Supabase schema
  content?: string | null; // Added from Supabase schema
  publish_datetime?: string | null; // Added from Supabase schema
  details_json?: Record<string, any> | null; // Added from Supabase schema
  // Derived sentiment
  sentiment?: 'Positive' | 'Negative' | 'Neutral' | null;
}

export interface Broker extends BaseEntity {
  // id from BaseEntity
  broker_code: string; // e.g., '58'
  name: string;
  address?: string | null;
  contact_info?: string | null;
  is_active?: boolean;
  // Fields like license_number, website were not in the brokers table, kept as optional
  license_number?: string | null;
  website?: string | null;
}

export interface FloorSheetTransaction extends BaseEntity {
  // id from BaseEntity
  nepse_transaction_id?: number | null; // Renamed from transaction_id_nepse
  trade_date: string; // Date
  contract_number?: string | null;
  stock_symbol: string; 
  company_id: string; // Added foreign key
  buyer_broker_id?: string | null; // Foreign key to brokers table id
  seller_broker_id?: string | null; // Foreign key to brokers table id
  quantity: number;
  rate: number;
  amount: number;
  transaction_time?: string | null; // Time
}


// --- UI & Component Specific Types ---
export interface SectionCardProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  action?: React.ReactNode;
  defaultOpen?: boolean;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  [key: string]: any; // For additional properties in chart data
}

// This NepseStockSymbol will likely be replaced by fetching companies dynamically.
// For now, it's a string to accept dynamic symbols from the DB.
export type NepseStockSymbol = string; 

// This represents the combined data profile for a single stock for display.
export interface StockDisplayProfile {
  company: Company;
  latestMarketData?: DailyMarketData | null;
  latestFinancialReport?: FinancialReport | null; 
  recentNews?: CompanyNewsEvent[];
  ratios?: CompanyRatio | null; 
  technicalIndicators?: CompanyTechnicalIndicator[];
  // Future additions:
  // dividendHistory?: DividendHistory[];
  // stockSplits?: StockSplit[];
  // ownership?: CompanyOwnership;
}


export interface AIReportData extends GenerateStockReportOutput {}
export interface ConfidenceData extends AssessConfidenceLevelOutput {}
export interface DisclaimerData extends GenerateRiskDisclaimerOutput {}


// For Broker Insights
export interface ProcessedStockInfo {
  symbol: string; // Changed from NepseStockSymbol
  companyName: string;
  lastProcessedDate: string; // YYYY-MM-DD
  volumeTraded: number;
  transactionType: 'Buy' | 'Sell' | 'Match';
}

// For company selection in forms
export interface CompanySelectItem {
  id: string;
  ticker_symbol: string;
  name: string;
}

// For broker selection in forms
export interface BrokerSelectItem {
  id: string; // This is the broker table's UUID primary key
  broker_code: string;
  name: string;
}

// UI types for old StockDetails to be refactored/removed.
// These are kept temporarily to minimize immediate breakage if any deep references exist.
export interface FundamentalDataItem {
  metric: string;
  value: string | number;
  description?: string;
}
export interface TechnicalIndicator { // This is the old one, distinct from CompanyTechnicalIndicator
  name: string;
  value: string | number;
  interpretation?: string;
  chartData?: ChartDataPoint[];
  chartColor?: string;
}
export interface NewsItem { // This is the old one, distinct from CompanyNewsEvent
  id: string;
  title: string;
  source: string;
  date: string;
  summary: string;
  url: string;
}
export interface StockDetails { // This will be replaced by StockDisplayProfile or similar
  symbol: string;
  name: string;
  lastPrice?: number;
  change?: number;
  changePercent?: number;
  marketCap?: string;
  volume?: string;
  fundamentalData: FundamentalDataItem[];
  technicalIndicators: TechnicalIndicator[]; // Uses old TechnicalIndicator type
  news: NewsItem[]; // Uses old NewsItem type
}

    