
"use client";

import type { StockDisplayProfile, CompanyTechnicalIndicator, FundamentalDataItem, NewsItem, TechnicalIndicator as OldTechnicalIndicatorType } from '@/types';
import type { GetAIWebSearchStockReportOutput } from '@/ai/flows/get-ai-web-search-stock-report';
import { SectionCard } from '@/components/common/SectionCard';
import { TechnicalIndicatorChart } from '@/components/charts/TechnicalIndicatorChart';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, BarChart3, Brain, FileText, Gauge, Newspaper, TrendingUp, TrendingDown, Minus, Info, SearchCheck } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';


interface StockDataDisplayProps {
  stockDetails: StockDisplayProfile; // Basic data from DB (company info, market data)
  aiWebSearchReport?: GetAIWebSearchStockReportOutput; // Report from new AI flow
}

export function StockDataDisplay({ stockDetails, aiWebSearchReport }: StockDataDisplayProps) {
  const { company, latestMarketData } = stockDetails;

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

  // Simplified fundamental, technical, and news data from StockDisplayProfile (DB)
  // These might be less relevant if aiWebSearchReport is comprehensive.
  const fundamentalDataForDisplay: FundamentalDataItem[] = [];
  if (stockDetails.ratios?.pe_ratio !== null && stockDetails.ratios?.pe_ratio !== undefined) {
    fundamentalDataForDisplay.push({ metric: "P/E Ratio (DB)", value: stockDetails.ratios.pe_ratio, description: "Price-to-Earnings Ratio from database" });
  }
  if (stockDetails.latestFinancialReport?.eps !== null && stockDetails.latestFinancialReport?.eps !== undefined) {
    fundamentalDataForDisplay.push({ metric: "EPS (DB)", value: stockDetails.latestFinancialReport.eps, description: "Earnings Per Share from database" });
  }

  const technicalIndicatorsForDisplay: OldTechnicalIndicatorType[] = stockDetails.technicalIndicators?.slice(0,2).map(ti => ({
    name: ti.indicator_name + " (DB)",
    value: ti.value ?? 'N/A',
    interpretation: ti.interpretation ?? undefined,
    chartData: [], // Chart data not available for individual indicators from DB in this simplified view
  })) || [];

  const newsForDisplay: NewsItem[] = stockDetails.recentNews?.slice(0,1).map(n => ({
    id: n.id,
    title: n.headline + " (DB)",
    source: n.source_name || 'Unknown',
    date: n.event_date,
    summary: n.summary || '',
    url: n.url || '#',
  })) || [];


  return (
    <div className="space-y-6 sm:space-y-8">
      {company && (
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
      )}

      {aiWebSearchReport && aiWebSearchReport.report && (
        <SectionCard title="AI Web Search Analysis" icon={SearchCheck} defaultOpen={true}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-accent">AI Outlook Score:</h4>
              <Badge variant="default" className="text-lg bg-accent text-accent-foreground">{aiWebSearchReport.score}</Badge>
            </div>
            <div className="prose prose-sm max-w-none text-foreground/90 p-3 bg-secondary/30 rounded-md">
              <h5 className="font-medium mb-1 text-primary">AI Generated Report:</h5>
              <p className="whitespace-pre-wrap">{aiWebSearchReport.report}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-md font-semibold text-primary">AI Confidence Level:</p>
                 <span className="text-xl font-bold text-primary">{(aiWebSearchReport.confidence * 100).toFixed(0)}%</span>
              </div>
              <Progress value={aiWebSearchReport.confidence * 100} className="w-full h-3 [&>div]:bg-primary" />
            </div>
            
            {aiWebSearchReport.disclaimer && (
               <div className="prose prose-sm max-w-none text-destructive-foreground/90 p-3 bg-destructive/80 rounded-md mt-4">
                <h5 className="font-medium mb-1 text-destructive-foreground flex items-center gap-2"><AlertTriangle size={18}/> Risk Disclaimer:</h5>
                <p className="whitespace-pre-wrap text-destructive-foreground">{aiWebSearchReport.disclaimer}</p>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Displaying limited DB data for context, if available */}
      {fundamentalDataForDisplay.length > 0 && (
        <SectionCard title="Fundamental Data (from DB)" icon={FileText} defaultOpen={false}>
           <Alert variant="default" className="mb-3 bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-900/30 dark:border-sky-700 dark:text-sky-300">
            <Info className="h-4 w-4 text-sky-500" />
            <AlertDescription>
              Limited fundamental data from database for context. AI analysis above is based on simulated web search.
            </AlertDescription>
          </Alert>
          <ul className="space-y-3">
            {fundamentalDataForDisplay.map((item) => (
              <li key={item.metric} className="flex justify-between items-center p-2 bg-secondary/30 rounded-md">
                <span className="font-medium text-foreground/80" title={item.description}>{item.metric}:</span>
                <span className="font-semibold text-primary">{item.value}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {technicalIndicatorsForDisplay.length > 0 && (
        <SectionCard title="Technical Indicators (from DB)" icon={TrendingUp} defaultOpen={false}>
           <Alert variant="default" className="mb-3 bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-900/30 dark:border-sky-700 dark:text-sky-300">
            <Info className="h-4 w-4 text-sky-500" />
            <AlertDescription>
              Limited technical indicators from database. AI analysis is separate. Chart data is not displayed for these DB indicators.
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {technicalIndicatorsForDisplay.map((indicator) => (
              <div key={indicator.name} className="p-4 border rounded-lg bg-secondary/30">
                <div className="flex justify-between items-baseline mb-2">
                  <h4 className="text-md font-semibold text-foreground/90">{indicator.name}</h4>
                  <Badge variant={indicator.interpretation?.includes('Bullish') ? 'default' : indicator.interpretation?.includes('Bearish') ? 'destructive' : 'secondary'}
                  className={indicator.interpretation?.includes('Bullish') ? 'bg-accent text-accent-foreground' : ''}
                  >
                    {indicator.value} {indicator.interpretation && `(${indicator.interpretation})`}
                  </Badge>
                </div>
                 <TechnicalIndicatorChart
                  data={indicator.chartData || []} 
                  dataKey="value"
                  name={indicator.name}
                  color={indicator.chartColor || 'var(--chart-1)'}
                />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {newsForDisplay.length > 0 && (
        <SectionCard title="Recent News (from DB)" icon={Newspaper} defaultOpen={false}>
          <Alert variant="default" className="mb-3 bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-900/30 dark:border-sky-700 dark:text-sky-300">
            <Info className="h-4 w-4 text-sky-500" />
            <AlertDescription>
              Latest news item from database for context.
            </AlertDescription>
          </Alert>
          <ul className="space-y-4">
            {newsForDisplay.map((item) => (
              <li key={item.id} className="p-3 border rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <h4 className="font-semibold text-foreground/90 mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground mb-1">
                  {item.source} - {new Date(item.date).toLocaleDateString()}
                </p>
                <p className="text-sm text-foreground/80 mb-2">{item.summary}</p>
                {item.url && item.url !== '#' && (
                    <Link href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                    Read more
                    </Link>
                )}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
