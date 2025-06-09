
import type { LucideIcon } from 'lucide-react';
import type { GenerateStockReportOutput } from '@/ai/flows/generate-stock-report';
import type { AssessConfidenceLevelOutput } from '@/ai/flows/assess-confidence-level';
import type { GenerateRiskDisclaimerOutput } from '@/ai/flows/generate-risk-disclaimer';

export interface FundamentalDataItem {
  metric: string;
  value: string | number;
  description?: string;
}

export interface ChartDataPoint {
  date: string; // Could be any string label like 'Jan', 'Feb' or 'YYYY-MM-DD'
  value: number;
}

export interface TechnicalIndicator {
  name: string;
  value: string | number;
  interpretation?: string;
  chartData?: ChartDataPoint[];
  chartColor?: string; // e.g., 'var(--chart-1)'
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

export interface SectionCardProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  action?: React.ReactNode;
  defaultOpen?: boolean;
}

export interface AIReportData extends GenerateStockReportOutput {}
export interface ConfidenceData extends AssessConfidenceLevelOutput {}
export interface DisclaimerData extends GenerateRiskDisclaimerOutput {}

export type NepseStockSymbol = "NABIL" | "HDL" | "UPPER" | "API" | "CIT"; // Example symbols

// Broker Insights Types
export interface BrokerInfo {
  id: string; // e.g. "B58"
  name: string; // e.g. "Imperial Securities Co. Pvt. Ltd. (58)"
  code: string; // e.g. "58"
}

export interface ProcessedStockInfo {
  symbol: NepseStockSymbol;
  companyName: string;
  lastProcessedDate: string; // YYYY-MM-DD
  volumeTraded: number; // Total volume traded by this broker for this stock
  transactionType: 'Buy' | 'Sell' | 'Match'; // Or more specific if available
}
