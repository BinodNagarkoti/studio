
"use client";

import type { StockDisplayProfile, AIReportData, ConfidenceData, DisclaimerData, CompanyTechnicalIndicator, FundamentalDataItem, NewsItem, TechnicalIndicator as OldTechnicalIndicatorType } from '@/types'; // Updated types
import { SectionCard } from '@/components/common/SectionCard';
import { TechnicalIndicatorChart } from '@/components/charts/TechnicalIndicatorChart';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, BarChart3, Brain, FileText, Gauge, Newspaper, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';


// Helper to transform StockDisplayProfile to old StockDetails fundamental data format for compatibility
// This should be phased out as the UI fully adapts to StockDisplayProfile
const transformToOldFundamentalData = (profile: StockDisplayProfile): FundamentalDataItem[] => {
  const items: FundamentalDataItem[] = [];
  if (profile.ratios?.pe_ratio !== undefined && profile.ratios?.pe_ratio !== null) {
    items.push({ metric: "P/E Ratio", value: profile.ratios.pe_ratio, description: "Price-to-Earnings Ratio" });
  }
  if (profile.latestFinancialReport?.eps !== undefined && profile.latestFinancialReport?.eps !== null) {
    items.push({ metric: "EPS", value: profile.latestFinancialReport.eps, description: "Earnings Per Share" });
  }
  if (profile.ratios?.pb_ratio !== undefined && profile.ratios?.pb_ratio !== null) {
    items.push({ metric: "P/B Ratio", value: profile.ratios.pb_ratio, description: "Price-to-Book Ratio" });
  }
  if (profile.ratios?.dividend_yield !== undefined && profile.ratios?.dividend_yield !== null) {
    items.push({ metric: "Dividend Yield", value: `${(profile.ratios.dividend_yield * 100).toFixed(2)}%`, description: "Dividend Yield" });
  }
   if (profile.latestFinancialReport?.net_income !== undefined && profile.latestFinancialReport?.net_income !== null) {
    items.push({ metric: "Net Income", value: profile.latestFinancialReport.net_income.toLocaleString(), description: "Net Income (Latest Report)" });
  }
  if (profile.latestFinancialReport?.revenue !== undefined && profile.latestFinancialReport?.revenue !== null) {
    items.push({ metric: "Revenue", value: profile.latestFinancialReport.revenue.toLocaleString(), description: "Revenue (Latest Report)" });
  }
  if (items.length === 0) {
    items.push({ metric: "Data", value: "Not Available", description: "Detailed fundamental data not found." });
  }
  return items;
};

// Helper to transform StockDisplayProfile recentNews to old NewsItem format
const transformToOldNewsData = (profile: StockDisplayProfile): NewsItem[] => {
  if (!profile.recentNews) return [];
  return profile.recentNews.map(news => ({
    id: news.id,
    title: news.headline,
    source: news.source_name || 'Unknown',
    date: news.event_date,
    summary: news.summary || '',
    url: news.url || '#',
  }));
};

// Helper to transform StockDisplayProfile technicalIndicators to old TechnicalIndicator format
const transformToOldTechnicalIndicators = (profile: StockDisplayProfile): OldTechnicalIndicatorType[] => {
  if (!profile.technicalIndicators) return [];
  return profile.technicalIndicators.map(ti => ({
    name: ti.indicator_name,
    value: ti.value ?? 'N/A',
    interpretation: ti.interpretation ?? undefined,
    // chartData: [], // Chart data is not available directly on CompanyTechnicalIndicator
    // chartColor: 'var(--chart-1)' // Default color
  }));
};


interface StockDataDisplayProps {
  stockDetails: StockDisplayProfile; // Updated to use StockDisplayProfile
  aiReport?: AIReportData;
  confidence?: ConfidenceData;
  disclaimer?: DisclaimerData;
}

export function StockDataDisplay({ stockDetails, aiReport, confidence, disclaimer }: StockDataDisplayProps) {
  const { company, latestMarketData, latestFinancialReport, recentNews, ratios, technicalIndicators } = stockDetails;

  // For compatibility with existing UI sections that expect the old structure
  const oldFundamentalData = transformToOldFundamentalData(stockDetails);
  const oldNewsData = transformToOldNewsData(stockDetails);
  const oldTechnicalIndicators = transformToOldTechnicalIndicators(stockDetails);


  const getChangeIcon = () => {
    if (latestMarketData?.price_change === undefined || latestMarketData?.price_change === null) return <Minus className="h-5 w-5 text-muted-foreground" />;
    if (latestMarketData.price_change > 0) return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (latestMarketData.price_change < 0) return <TrendingDown className="h-5 w-5 text-red-500" />;
    return <Minus className="h-5 w-5 text-muted-foreground" />;
  };
  
  const getChangeColorClass = () => {
    if (latestMarketData?.price_change === undefined || latestMarketData?.price_change === null) return 'text-muted-foreground';
    if (latestMarketData.price_change > 0) return 'text-green-500';
    if (latestMarketData.price_change < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionCard title={`${company.name} (${company.ticker_symbol})`} icon={BarChart3} defaultOpen={true}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          {latestMarketData?.close_price !== undefined && (
            <div>
              <p className="font-medium text-muted-foreground">Last Price</p>
              <p className="text-lg font-semibold">{latestMarketData.close_price.toFixed(2)} NPR</p>
            </div>
          )}
          {(latestMarketData?.price_change !== undefined && latestMarketData?.percent_change !== undefined) && (
             <div className={`${getChangeColorClass()}`}>
              <p className="font-medium">Change</p>
              <div className="flex items-center gap-1">
                 {getChangeIcon()}
                <p className="text-lg font-semibold">
                  {latestMarketData.price_change.toFixed(2)} ({latestMarketData.percent_change.toFixed(2)}%)
                </p>
              </div>
            </div>
          )}
           {latestMarketData?.market_cap && (
            <div>
              <p className="font-medium text-muted-foreground">Market Cap</p>
              <p className="text-lg font-semibold">{latestMarketData.market_cap.toLocaleString()}</p>
            </div>
          )}
          {latestMarketData?.volume && (
            <div>
              <p className="font-medium text-muted-foreground">Volume</p>
              <p className="text-lg font-semibold">{latestMarketData.volume.toLocaleString()}</p>
            </div>
          )}
        </div>
        {company.description && (
          <p className="mt-4 text-sm text-muted-foreground">{company.description}</p>
        )}
      </SectionCard>

      <SectionCard title="Fundamental Data" icon={FileText}>
        {oldFundamentalData.length > 0 && oldFundamentalData[0].value !== "Not Available" ? (
          <ul className="space-y-3">
            {oldFundamentalData.map((item) => (
              <li key={item.metric} className="flex justify-between items-center p-2 bg-secondary/30 rounded-md">
                <span className="font-medium text-foreground/80" title={item.description}>{item.metric}:</span>
                <span className="font-semibold text-primary">{item.value}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Fundamental data not available for this stock.</p>
        )}
      </SectionCard>

      <SectionCard title="Technical Indicators" icon={TrendingUp}>
         <Alert variant="default" className="mb-4 bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-900/30 dark:border-sky-700 dark:text-sky-300">
            <Info className="h-4 w-4 text-sky-500" />
            <AlertDescription>
              Individual chart data for technical indicators is currently unavailable. Values shown are the latest reported.
            </AlertDescription>
          </Alert>
        {oldTechnicalIndicators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {oldTechnicalIndicators.map((indicator: OldTechnicalIndicatorType) => ( // Use OldTechnicalIndicatorType
              <div key={indicator.name} className="p-4 border rounded-lg bg-secondary/30">
                <div className="flex justify-between items-baseline mb-2">
                  <h4 className="text-md font-semibold text-foreground/90">{indicator.name}</h4>
                  <Badge variant={indicator.interpretation?.includes('Bullish') ? 'default' : indicator.interpretation?.includes('Bearish') ? 'destructive' : 'secondary'}
                  className={indicator.interpretation?.includes('Bullish') ? 'bg-accent text-accent-foreground' : ''}
                  >
                    {indicator.value} {indicator.interpretation && `(${indicator.interpretation})`}
                  </Badge>
                </div>
                {/* 
                  Chart data is not available on CompanyTechnicalIndicator type directly.
                  TechnicalIndicatorChart expects chartData. It will show "No chart data available".
                */}
                <TechnicalIndicatorChart
                  data={indicator.chartData || []} // Pass empty array if undefined
                  dataKey="value"
                  name={indicator.name}
                  color={indicator.chartColor || 'var(--chart-1)'}
                  type={indicator.name.toLowerCase().includes('volume') ? 'bar' : 'line'}
                />
              </div>
            ))}
          </div>
        ) : (
           <p className="text-muted-foreground">Technical indicators not available for this stock.</p>
        )}
      </SectionCard>

      <SectionCard title="Recent News" icon={Newspaper}>
        {oldNewsData.length > 0 ? (
          <ul className="space-y-4">
            {oldNewsData.slice(0,3).map((item) => ( // Using oldNewsData
              <li key={item.id} className="p-3 border rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <h4 className="font-semibold text-foreground/90 mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground mb-1">
                  {item.source} - {new Date(item.date).toLocaleDateString()}
                </p>
                <p className="text-sm text-foreground/80 mb-2">{item.summary}</p>
                <Link href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                  Read more
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No recent news available for this stock.</p>
        )}
      </SectionCard>

      {aiReport && aiReport.report && (
        <SectionCard title="AI Stock Report" icon={Brain}>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-accent">Overall Outlook Score:</h4>
              <Badge variant="default" className="text-lg bg-accent text-accent-foreground">{aiReport.score}</Badge>
            </div>
            <div className="prose prose-sm max-w-none text-foreground/90 p-3 bg-secondary/30 rounded-md">
              <p className="whitespace-pre-wrap">{aiReport.report}</p>
            </div>
          </div>
        </SectionCard>
      )}

      {confidence && confidence.reasoning && (
        <SectionCard title="AI Confidence Meter" icon={Gauge}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-primary">Confidence Level:</p>
               <span className="text-2xl font-bold text-primary">{(confidence.confidenceLevel * 100).toFixed(0)}%</span>
            </div>
            <Progress value={confidence.confidenceLevel * 100} className="w-full h-4 [&>div]:bg-primary" />
            <div className="prose prose-sm max-w-none text-foreground/80 p-3 bg-secondary/30 rounded-md">
               <h5 className="font-medium mb-1">Reasoning:</h5>
               <p className="whitespace-pre-wrap">{confidence.reasoning}</p>
            </div>
          </div>
        </SectionCard>
      )}

      {disclaimer && disclaimer.disclaimer && (
        <SectionCard title="Risk Disclaimer" icon={AlertTriangle}>
          <div className="prose prose-sm max-w-none text-destructive-foreground/80 p-3 bg-destructive/80 rounded-md">
            <p className="whitespace-pre-wrap text-destructive-foreground">{disclaimer.disclaimer}</p>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

    