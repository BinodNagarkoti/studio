
"use client";

// import type { StockDisplayProfile } from '@/types'; // Removed
import type { GetAIWebSearchStockReportOutput } from '@/ai/flows/get-ai-web-search-stock-report';
import { SectionCard } from '@/components/common/SectionCard';
// import { TechnicalIndicatorChart } from '@/components/charts/TechnicalIndicatorChart'; // Removed
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, SearchCheck } from 'lucide-react'; // Simplified imports
// import Link from 'next/link'; // Removed
// import { Alert, AlertDescription } from '@/components/ui/alert'; // Removed, unless AI report needs alerts

interface StockDataDisplayProps {
  // stockDetails: StockDisplayProfile; // Removed
  stockSymbol: string;
  companyName: string;
  aiWebSearchReport: GetAIWebSearchStockReportOutput; // aiWebSearchReport is now mandatory
}

export function StockDataDisplay({ stockSymbol, companyName, aiWebSearchReport }: StockDataDisplayProps) {
  // const { company, latestMarketData } = stockDetails; // Removed

  // const getChangeIcon = () => { ... }; // Removed
  // const getChangeColorClass = () => { ... }; // Removed
  // const fundamentalDataForDisplay: FundamentalDataItem[] = []; // Removed
  // const technicalIndicatorsForDisplay: OldTechnicalIndicatorType[] = []; // Removed
  // const newsForDisplay: NewsItem[] = []; // Removed

  return (
    <div className="space-y-6 sm:space-y-8">
      <SectionCard 
        title={`AI Analysis for ${companyName} (${stockSymbol})`} 
        icon={SearchCheck} 
        defaultOpen={true}
      >
        {aiWebSearchReport && aiWebSearchReport.report && aiWebSearchReport.score !== "Error" && (
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
        )}
        {aiWebSearchReport && aiWebSearchReport.score === "Error" && (
            <div className="prose prose-sm max-w-none text-destructive p-3 bg-destructive/10 rounded-md">
                <h5 className="font-medium mb-1 text-destructive flex items-center gap-2"><AlertTriangle size={18}/> AI Report Error:</h5>
                <p className="whitespace-pre-wrap">{aiWebSearchReport.report || "The AI failed to generate a report."}</p>
                 {aiWebSearchReport.disclaimer && (
                     <p className="whitespace-pre-wrap mt-2"><strong>Note:</strong> {aiWebSearchReport.disclaimer}</p>
                 )}
            </div>
        )}
      </SectionCard>

      {/* 
        All sections previously showing data from stockDetails (DB) are removed.
        - Company basic info and market data card
        - Fundamental Data (from DB) section
        - Technical Indicators (from DB) section (including charts)
        - Recent News (from DB) section
        
        The UI now solely relies on the aiWebSearchReport for content.
        If charts or specific data cards are desired, the AI flow's output schema
        and the prompt would need to be significantly changed to output structured data,
        and this component would need to be updated to render it.
        Currently, any such information is expected to be part of the AI's textual report.
      */}
    </div>
  );
}
