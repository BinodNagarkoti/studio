"use client";

import type { StockDetails, AIReportData, ConfidenceData, DisclaimerData, TechnicalIndicator } from '@/types';
import { SectionCard } from '@/components/common/SectionCard';
import { TechnicalIndicatorChart } from '@/components/charts/TechnicalIndicatorChart';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, BarChart3, Brain, FileText, Gauge, Newspaper, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';

interface StockDataDisplayProps {
  stockDetails: StockDetails;
  aiReport?: AIReportData;
  confidence?: ConfidenceData;
  disclaimer?: DisclaimerData;
}

export function StockDataDisplay({ stockDetails, aiReport, confidence, disclaimer }: StockDataDisplayProps) {
  const { symbol, name, fundamentalData, technicalIndicators, news, lastPrice, change, changePercent } = stockDetails;

  const getChangeIcon = () => {
    if (change === undefined || change === null) return <Minus className="h-5 w-5 text-muted-foreground" />;
    if (change > 0) return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-5 w-5 text-red-500" />;
    return <Minus className="h-5 w-5 text-muted-foreground" />;
  };
  
  const getChangeColorClass = () => {
    if (change === undefined || change === null) return 'text-muted-foreground';
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionCard title={`${name} (${symbol})`} icon={BarChart3} defaultOpen={true}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          {lastPrice !== undefined && (
            <div>
              <p className="font-medium text-muted-foreground">Last Price</p>
              <p className="text-lg font-semibold">{lastPrice.toFixed(2)} NPR</p>
            </div>
          )}
          {(change !== undefined && changePercent !== undefined) && (
             <div className={`${getChangeColorClass()}`}>
              <p className="font-medium">Change</p>
              <div className="flex items-center gap-1">
                 {getChangeIcon()}
                <p className="text-lg font-semibold">
                  {change.toFixed(2)} ({changePercent.toFixed(2)}%)
                </p>
              </div>
            </div>
          )}
           {stockDetails.marketCap && (
            <div>
              <p className="font-medium text-muted-foreground">Market Cap</p>
              <p className="text-lg font-semibold">{stockDetails.marketCap}</p>
            </div>
          )}
          {stockDetails.volume && (
            <div>
              <p className="font-medium text-muted-foreground">Volume</p>
              <p className="text-lg font-semibold">{stockDetails.volume}</p>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Fundamental Data" icon={FileText}>
        <ul className="space-y-3">
          {fundamentalData.map((item) => (
            <li key={item.metric} className="flex justify-between items-center p-2 bg-secondary/30 rounded-md">
              <span className="font-medium text-foreground/80" title={item.description}>{item.metric}:</span>
              <span className="font-semibold text-primary">{item.value}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Technical Indicators" icon={TrendingUp}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {technicalIndicators.map((indicator: TechnicalIndicator) => (
            <div key={indicator.name} className="p-4 border rounded-lg bg-secondary/30">
              <div className="flex justify-between items-baseline mb-2">
                <h4 className="text-md font-semibold text-foreground/90">{indicator.name}</h4>
                <Badge variant={indicator.interpretation?.includes('Bullish') ? 'default' : indicator.interpretation?.includes('Bearish') ? 'destructive' : 'secondary'}
                 className={indicator.interpretation?.includes('Bullish') ? 'bg-accent text-accent-foreground' : ''}
                >
                  {indicator.value} {indicator.interpretation && `(${indicator.interpretation})`}
                </Badge>
              </div>
              {indicator.chartData && indicator.chartData.length > 0 && (
                <TechnicalIndicatorChart
                  data={indicator.chartData}
                  dataKey="value"
                  name={indicator.name}
                  color={indicator.chartColor || 'var(--chart-1)'}
                  type={indicator.name.toLowerCase().includes('volume') ? 'bar' : 'line'}
                />
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Recent News" icon={Newspaper}>
        <ul className="space-y-4">
          {news.slice(0,3).map((item) => (
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
      </SectionCard>

      {aiReport && (
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

      {confidence && (
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

      {disclaimer && (
        <SectionCard title="Risk Disclaimer" icon={AlertTriangle}>
          <div className="prose prose-sm max-w-none text-destructive-foreground/80 p-3 bg-destructive/80 rounded-md">
            <p className="whitespace-pre-wrap text-destructive-foreground">{disclaimer.disclaimer}</p>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
