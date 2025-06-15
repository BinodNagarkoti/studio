
import type { LucideIcon } from 'lucide-react';
// import type { GenerateStockReportOutput } from '@/ai/flows/generate-stock-report'; // Commented out
// import type { AssessConfidenceLevelOutput } from '@/ai/flows/assess-confidence-level'; // Commented out
// import type { GenerateRiskDisclaimerOutput } from '@/ai/flows/generate-risk-disclaimer'; // Commented out

// --- Core Data Types (Aligning with new Supabase Schema) ---
// These are largely commented out as the primary analysis no longer fetches this structured data for display.
// They are kept for reference if a mixed approach is desired later or for other parts of the app (like Broker Insights).

export interface BaseEntity {
  id: string; 
  created_at?: string;
  updated_at?: string;
  scraped_at?: string;
}

/* // Commenting out Company as it's not directly used by the AI-only display
export interface Company extends BaseEntity {
  name: string;
  ticker_symbol: string;
  industry_sector?: string | null;
  exchange_listed?: string | null; 
  incorporation_date?: string | null; 
  headquarters_location?: string | null;
  website_url?: string | null; 
  description?: string | null;
  is_active?: boolean;
  industry?: string | null; 
  sector_name?: string | null; 
}
*/

/* // Commenting out FinancialReport
export interface FinancialReport extends BaseEntity {
  report_id: string; 
  company_id: string; 
  report_date: string; 
  fiscal_period: 'quarterly' | 'annual'; 
  currency?: string; 
  revenue?: number | null;
  net_income?: number | null;
  gross_profit?: number | null;
  operating_income?: number | null;
  eps?: number | null; 
  dps?: number | null; 
  total_assets?: number | null;
  total_liabilities?: number | null;
  shareholders_equity?: number | null;
  current_assets?: number | null;
  current_liabilities?: number | null;
  cash_and_equivalents?: number | null; 
  long_term_debt?: number | null;
  operating_cash_flow?: number | null;
  investing_cash_flow?: number | null;
  financing_cash_flow?: number | null;
  free_cash_flow?: number | null;
  source_url?: string | null;
  fiscal_year?: number; 
}
*/

/* // Commenting out DailyMarketData
export interface DailyMarketData extends BaseEntity {
  company_id: string; 
  trade_date: string; 
  open_price?: number | null;
  high_price?: number | null;
  low_price?: number | null;
  close_price?: number | null;
  adjusted_close_price?: number | null;
  volume?: number | null; 
  turnover?: number | null;
  market_cap?: number | null; 
  previous_close_price?: number | null;
  price_change?: number | null;
  percent_change?: number | null; 
  fifty_two_week_high?: number | null;
  fifty_two_week_low?: number | null;
}
*/

/* // Commenting out CompanyRatio
export interface CompanyRatio extends BaseEntity {
  ratio_id: string; 
  company_id: string; 
  as_of_date: string; 
  report_id?: string | null; 
  pe_ratio?: number | null;
  pb_ratio?: number | null;
  ps_ratio?: number | null;
  dividend_yield?: number | null;
  roe?: number | null;
  roa?: number | null;
  net_profit_margin?: number | null;
  current_ratio?: number | null;
  quick_ratio?: number | null;
  debt_to_equity_ratio?: number | null;
  interest_coverage_ratio?: number | null;
}
*/

/* // Commenting out CompanyTechnicalIndicator
export interface CompanyTechnicalIndicator extends BaseEntity {
  company_id: string; 
  trade_date: string; 
  indicator_name: string; 
  value?: number | null;
  interpretation?: string | null; 
  parameters?: Record<string, any> | null; 
}
*/

/* // Commenting out CompanyNewsEvent
export interface CompanyNewsEvent extends BaseEntity {
  company_id?: string | null; 
  event_date: string; 
  headline: string; 
  source_name?: string | null; 
  summary?: string | null;
  url?: string | null;
  event_type?: 'Earnings' | 'Merger' | 'AnalystUpdate' | 'Regulatory' | 'InsiderTransaction' | 'AGM/SGM' | 'Dividend' | 'RightShare' | 'Other'; 
  sentiment_score?: number | null; 
  content?: string | null; 
  publish_datetime?: string | null; 
  details_json?: Record<string, any> | null; 
  sentiment?: 'Positive' | 'Negative' | 'Neutral' | null;
}
*/

// Broker and FloorSheetTransaction might still be used by Broker Insights tab
export interface Broker extends BaseEntity {
  broker_code: string; 
  name: string;
  address?: string | null;
  contact_info?: string | null;
  is_active?: boolean;
  license_number?: string | null;
  website?: string | null;
}

export interface FloorSheetTransaction extends BaseEntity {
  nepse_transaction_id?: number | null; 
  trade_date: string; 
  contract_number?: string | null;
  stock_symbol: string; 
  company_id: string; 
  buyer_broker_id?: string | null; 
  seller_broker_id?: string | null; 
  quantity: number;
  rate: number;
  amount: number;
  transaction_time?: string | null; 
}


// --- UI & Component Specific Types ---
export interface SectionCardProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  action?: React.ReactNode;
  defaultOpen?: boolean;
}

/* // Commenting out ChartDataPoint as no charts are being rendered from DB data
export interface ChartDataPoint {
  date: string;
  value: number;
  [key: string]: any; 
}
*/

export type NepseStockSymbol = string; 

/* // Commenting out StockDisplayProfile as it's no longer constructed or used
export interface StockDisplayProfile {
  company: Company; // Now commented out
  latestMarketData?: DailyMarketData | null; // Now commented out
  latestFinancialReport?: FinancialReport | null; // Now commented out
  recentNews?: CompanyNewsEvent[]; // Now commented out
  ratios?: CompanyRatio | null; // Now commented out
  technicalIndicators?: CompanyTechnicalIndicator[]; // Now commented out
}
*/

// Commenting out AIReportData, ConfidenceData, DisclaimerData as they were tied to old flow structures
// export interface AIReportData extends GenerateStockReportOutput {}
// export interface ConfidenceData extends AssessConfidenceLevelOutput {}
// export interface DisclaimerData extends GenerateRiskDisclaimerOutput {}


// For Broker Insights - These remain active
export interface ProcessedStockInfo {
  symbol: string; 
  companyName: string;
  lastProcessedDate: string; 
  volumeTraded: number;
  transactionType: 'Buy' | 'Sell' | 'Match';
}

// For company selection in forms (used by StockSearchForm with local JSON)
export interface CompanySelectItem {
  // id: string; // ID from DB, not present in stock_data.json
  stock_symbol: string; // Changed from ticker_symbol to match stock_data.json
  name: string;
}

// For broker selection in forms - Remains active
export interface BrokerSelectItem {
  id: string; 
  broker_code: string;
  name: string;
}

// UI types for old StockDetails to be refactored/removed - Commenting out
/*
export interface FundamentalDataItem {
  metric: string;
  value: string | number;
  description?: string;
}
export interface TechnicalIndicator { 
  name: string;
  value: string | number;
  interpretation?: string;
  chartData?: ChartDataPoint[];
  chartColor?: string;
}
export interface NewsItem { 
  id: string;
  title: string;
  source: string;
  date: string;
  summary: string;
  url: string;
}
export interface StockDetails { 
  symbol: string;
  name: string;
  lastPrice?: number;
  change?: number;
  changePercent?: number;
  marketCap?: string;
  volume?: string;
  fundamentalData: FundamentalDataItem[];
  technicalIndicators: TechnicalIndicator[]; 
  news: NewsItem[]; 
}
*/
