
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
  exchange?: string | null;
  incorporation_date?: string | null; // Date
  headquarters_location?: string | null;
  website?: string | null;
  description?: string | null;
  is_active?: boolean;
}

export interface FinancialReport extends BaseEntity {
  company_id: string; // Foreign Key to Companies
  report_date: string; // Date
  period_type: 'quarterly' | 'annual';
  currency: string; // e.g., 'NPR'

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
  cash_and_cash_equivalents?: number | null;
  long_term_debt?: number | null;

  // Cash Flow
  operating_cash_flow?: number | null;
  investing_cash_flow?: number | null;
  financing_cash_flow?: number | null;
  free_cash_flow?: number | null;

  // Shares
  outstanding_shares?: number | null;
  
  source_url?: string | null;
}

export interface DailyMarketData extends BaseEntity {
  company_id: string; // Foreign Key to Companies
  trade_date: string; // Date
  open_price?: number | null;
  high_price?: number | null;
  low_price?: number | null;
  close_price?: number | null;
  adjusted_close_price?: number | null;
  volume_traded?: number | null;
  turnover?: number | null;
  market_capitalization?: number | null;
  previous_close_price?: number | null;
  price_change?: number | null;
  price_change_percent?: number | null;
  fifty_two_week_high?: number | null;
  fifty_two_week_low?: number | null;
}

export interface CompanyRatio extends BaseEntity {
  company_id: string; // Foreign Key to Companies
  report_date: string; // Date, aligning with a financial report or market data point
  
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
  company_id: string; // Foreign Key to Companies
  indicator_date: string; // Date
  indicator_name: string; // e.g., 'SMA_50', 'RSI_14'
  value?: number | null;
  interpretation?: string | null; // e.g., 'Bullish', 'Bearish', 'Neutral'
  // Parameters used for calculation can be stored as JSON if needed
  // parameters_json?: Record<string, any> | null;
}

export interface CompanyNewsEvent extends BaseEntity {
  company_id?: string | null; // Optional if news is general
  event_date: string; // Date
  title: string;
  source?: string | null;
  summary?: string | null;
  url?: string | null;
  category?: 'Earnings' | 'Merger' | 'AnalystUpdate' | 'Regulatory' | 'InsiderTransaction' | 'Other';
  sentiment?: 'Positive' | 'Negative' | 'Neutral' | null;
}

export interface CompanyOwnership extends BaseEntity {
  company_id: string; // Foreign Key to Companies
  report_date: string; // Date
  promoter_holdings_percent?: number | null;
  public_shareholding_percent?: number | null;
  institutional_holdings_percent?: number | null;
  // board_composition_json?: Record<string, any> | null; // For storing board details as JSON
}

export interface CompanyRiskFactor extends BaseEntity {
  company_id: string; // Foreign Key to Companies
  report_date: string; // Date
  beta?: number | null;
  credit_rating?: string | null;
  // litigation_history_summary?: string | null;
}

export interface DividendHistory extends BaseEntity {
  company_id: string; // Foreign Key to Companies
  ex_dividend_date: string; // Date
  record_date?: string | null; // Date
  payment_date?: string | null; // Date
  dividend_type: 'Cash' | 'Stock';
  dividend_amount?: number | null; // Amount per share for cash, or percentage for stock
  currency?: string | null;
  fiscal_year?: string | null;
  announcement_date?: string | null; // Date
}

export interface StockSplit extends BaseEntity {
  company_id: string; // Foreign Key to Companies
  split_date: string; // Date
  split_ratio_from: number;
  split_ratio_to: number;
  announcement_date?: string | null; // Date
}

export interface NepseIndex extends BaseEntity {
  index_name: string; // e.g., 'NEPSE Index', 'Sensitive Index'
  short_code?: string | null; // e.g., 'NEPSE', 'SEN'
  description?: string | null;
}

export interface DailyIndexValue extends BaseEntity {
  index_id: string; // Foreign Key to NepseIndices
  trade_date: string; // Date
  current_value: number;
  point_change?: number | null;
  percent_change?: number | null;
  open_value?: number | null;
  high_value?: number | null;
  low_value?: number | null;
  previous_close_value?: number | null;
}

export interface MarketSummary extends BaseEntity {
  summary_date: string; // Date
  total_turnover?: number | null;
  total_traded_shares?: number | null;
  total_transactions?: number | null;
  total_market_cap?: number | null;
  total_float_market_cap?: number | null;
  advanced_count?: number | null; // Number of scrips advanced
  declined_count?: number | null; // Number of scrips declined
  unchanged_count?: number | null; // Number of scrips unchanged
}

export interface SectorSummary extends BaseEntity {
  summary_date: string; // Date
  sector_name: string;
  turnover?: number | null;
  // Add other sector-specific summary points if available
}

export interface Broker extends BaseEntity {
  broker_code: string; // e.g., '58'
  name: string;
  license_number?: string | null;
  address?: string | null;
  contact_info?: string | null;
  website?: string | null;
  is_active?: boolean;
}

export interface FloorSheetTransaction extends BaseEntity {
  transaction_id_nepse: string; // Unique ID from NEPSE if available, or generated
  trade_date: string; // Date
  contract_number: string;
  stock_symbol: string; // Consider if this should be company_id + lookup, or symbol directly
  buyer_broker_code: string;
  seller_broker_code: string;
  quantity: number;
  rate: number;
  amount: number;
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

// --- Existing Types to be reviewed/refactored based on new data model ---
// This NepseStockSymbol will likely be replaced by fetching companies dynamically
export type NepseStockSymbol = "NABIL" | "HDL" | "UPPER" | "API" | "CIT"; 


// This StockDetails will need to be a composite of the new types.
// It represents the combined data profile for a single stock for display.
export interface StockDisplayProfile {
  company: Company;
  latestMarketData?: DailyMarketData | null;
  latestFinancialReport?: FinancialReport | null; // Or a summary of multiple reports
  recentNews?: CompanyNewsEvent[];
  ratios?: CompanyRatio | null; // Latest ratios
  technicalIndicators?: CompanyTechnicalIndicator[]; // Set of key indicators
  // Add other relevant aggregated data as needed
}

// Old types for reference or potential refactoring:
// export interface FundamentalDataItem {
//   metric: string;
//   value: string | number;
//   description?: string;
// }
// export interface TechnicalIndicator {
//   name: string;
//   value: string | number;
//   interpretation?: string;
//   chartData?: ChartDataPoint[];
//   chartColor?: string;
// }
// export interface NewsItem {
//   id: string;
//   title: string;
//   source: string;
//   date: string;
//   summary: string;
//   url: string;
// }
// export interface StockDetails { // This will be replaced by StockDisplayProfile or similar
//   symbol: string;
//   name: string;
//   lastPrice?: number;
//   change?: number;
//   changePercent?: number;
//   marketCap?: string;
//   volume?: string;
//   fundamentalData: FundamentalDataItem[];
//   technicalIndicators: TechnicalIndicator[];
//   news: NewsItem[];
// }

export interface AIReportData extends GenerateStockReportOutput {}
export interface ConfidenceData extends AssessConfidenceLevelOutput {}
export interface DisclaimerData extends GenerateRiskDisclaimerOutput {}


// For Broker Insights (still relevant, uses the Broker type above)
export interface ProcessedStockInfo {
  symbol: NepseStockSymbol; // Or use string if symbols are dynamic
  companyName: string;
  lastProcessedDate: string; // YYYY-MM-DD
  volumeTraded: number;
  transactionType: 'Buy' | 'Sell' | 'Match';
}
