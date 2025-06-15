
"use client";

import type { GetAIWebSearchStockReportOutput, AITechnicalIndicatorChartInfo } from '@/types';
import { SectionCard } from '@/components/common/SectionCard';
import { TechnicalIndicatorChart } from '@/components/charts/TechnicalIndicatorChart';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { SearchCheck, FileText, BarChart3, NewspaperIcon, AlertTriangle, Activity, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from "@/components/ui/alert";


interface StockDataDisplayProps {
  stockSymbol: string;
  companyName: string;
  aiWebSearchReport: GetAIWebSearchStockReportOutput | null;
}

export function StockDataDisplay({ stockSymbol, companyName, aiWebSearchReport }: StockDataDisplayProps) {

  if (!aiWebSearchReport) {
    return (
       <SectionCard title={`AI Analysis for ${companyName} (${stockSymbol})`} icon={SearchCheck} defaultOpen={true}>
        <p className="text-muted-foreground">AI report is not available.</p>
      </SectionCard>
    );
  }

  const {
    report,
    score,
    confidence,
    disclaimer,
    fundamental_summary,
    technical_summary,
    news_summary,
    technical_indicators_chart_data = []
  } = aiWebSearchReport;


  if (score === "Error") {
    return (
      <SectionCard title={`AI Analysis Error for ${companyName} (${stockSymbol})`} icon={AlertTriangle} defaultOpen={true}>
        <div className="prose prose-sm max-w-none text-destructive p-3 bg-destructive/10 rounded-md">
          <h5 className="font-medium mb-1 text-destructive flex items-center gap-2"><AlertTriangle size={18}/> AI Report Error:</h5>
          <p className="whitespace-pre-wrap">{report || "The AI failed to generate a report."}</p>
          {disclaimer && (
            <p className="whitespace-pre-wrap mt-2"><strong>Note:</strong> {disclaimer}</p>
          )}
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionCard
        title={`AI Stock Report for ${companyName} (${stockSymbol})`}
        icon={SearchCheck}
        defaultOpen={true}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold text-accent">AI Outlook Score:</h4>
            <Badge variant="default" className="text-lg bg-accent text-accent-foreground">{score}</Badge>
          </div>
          <div className="prose prose-sm max-w-none text-foreground/90 p-3 bg-secondary/30 rounded-md">
            <h5 className="font-medium mb-1 text-primary">AI Generated "Weather Report":</h5>
            <p className="whitespace-pre-wrap">{report}</p>
          </div>
        </div>
      </SectionCard>

      {fundamental_summary && (
        <SectionCard title="AI Fundamental Summary" icon={FileText} defaultOpen={false}>
          <div className="prose prose-sm max-w-none text-foreground/90 p-3 bg-secondary/30 rounded-md">
            <p className="whitespace-pre-wrap">{fundamental_summary}</p>
          </div>
        </SectionCard>
      )}

      {technical_summary && (
         <SectionCard title="AI Technical Summary" icon={Activity} defaultOpen={false}>
           <div className="prose prose-sm max-w-none text-foreground/90 p-3 bg-secondary/30 rounded-md">
            <p className="whitespace-pre-wrap">{technical_summary}</p>
          </div>
        </SectionCard>
      )}

      {technical_indicators_chart_data && technical_indicators_chart_data.length > 0 && (
        <SectionCard title="AI Technical Indicators & Charts" icon={BarChart3} defaultOpen={true}>
          <div className="space-y-6">
            {technical_indicators_chart_data.map((indicator, index) => (
              <Card key={index} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-primary">{indicator.indicator_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p><strong className="text-muted-foreground">Current Value:</strong> {indicator.current_value}</p>
                  <p><strong className="text-muted-foreground">Interpretation:</strong> {indicator.interpretation}</p>
                  {indicator.chart_data && indicator.chart_data.length > 0 ? (
                    <TechnicalIndicatorChart
                      data={indicator.chart_data}
                      dataKey="value"
                      name={indicator.indicator_name}
                      type={indicator.chart_type || 'line'}
                      color={`var(--chart-${(index % 5) + 1})`}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">No chart data provided for this indicator.</p>
                  )}
                </CardContent>
              </Card>
            ))}
             <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription>
                Technical indicator values and chart data are simulated by AI based on general knowledge and typical patterns. They are not based on real-time or exact historical market data.
              </AlertDescription>
            </Alert>
          </div>
        </SectionCard>
      )}

      {news_summary && (
        <SectionCard title="AI News Summary" icon={NewspaperIcon} defaultOpen={false}>
          <div className="prose prose-sm max-w-none text-foreground/90 p-3 bg-secondary/30 rounded-md">
            <p className="whitespace-pre-wrap">{news_summary}</p>
          </div>
        </SectionCard>
      )}

      <SectionCard title="AI Confidence & Disclaimer" icon={AlertTriangle} defaultOpen={true}>
         <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-md font-semibold text-primary">AI Confidence Level:</p>
                <span className="text-xl font-bold text-primary">{(confidence * 100).toFixed(0)}%</span>
              </div>
              <Progress value={confidence * 100} className="w-full h-3 [&>div]:bg-primary" />
              <p className="text-xs text-muted-foreground mt-1">Justification for this confidence level is included in the main AI Stock Report above.</p>
            </div>

            {disclaimer && (
              <div className="prose prose-sm max-w-none text-destructive-foreground/90 p-3 bg-destructive/80 rounded-md mt-4">
                <h5 className="font-medium mb-1 text-destructive-foreground flex items-center gap-2"><AlertTriangle size={18}/> Risk Disclaimer:</h5>
                <p className="whitespace-pre-wrap text-destructive-foreground">{disclaimer}</p>
              </div>
            )}
          </div>
      </SectionCard>
    </div>
  );
}
