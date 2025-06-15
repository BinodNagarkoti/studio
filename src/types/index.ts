
import type { LucideIcon } from 'lucide-react';
import type { GetAIWebSearchStockReportOutput as AIOutputType } from '@/ai/flows/get-ai-web-search-stock-report';


export interface BaseEntity {
  id: string; 
  created_at?: string;
  updated_at?: string;
  scraped_at?: string;
}

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

export type NepseStockSymbol = string; 

// AI Generated data types
export interface AIChartDataPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface AITechnicalIndicatorChartInfo {
  indicator_name: string;
  current_value: string;
  interpretation: string;
  chart_data: AIChartDataPoint[];
  chart_type?: 'line' | 'bar';
}

// Re-exporting the AI flow's output type for convenience in UI components
export type GetAIWebSearchStockReportOutput = AIOutputType;


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
  stock_symbol: string; 
  name: string;
}

// For broker selection in forms - Remains active
export interface BrokerSelectItem {
  id: string; 
  broker_code: string;
  name: string;
}

// --- Commented out types previously used for DB-driven display ---
/*
export interface Company extends BaseEntity { ... }
export interface FinancialReport extends BaseEntity { ... }
export interface DailyMarketData extends BaseEntity { ... }
export interface CompanyRatio extends BaseEntity { ... }
export interface CompanyTechnicalIndicator extends BaseEntity { ... }
export interface CompanyNewsEvent extends BaseEntity { ... }
export interface StockDisplayProfile { ... }
export interface FundamentalDataItem { ... }
export interface TechnicalIndicator { ... }
export interface NewsItem { ... }
export interface StockDetails { ... }
*/
```