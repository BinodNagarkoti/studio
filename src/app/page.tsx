
"use client";

import { useState } from 'react';
import type { StockDetails, AIReportData, ConfidenceData, DisclaimerData, NepseStockSymbol } from '@/types';
import { StockSearchForm } from '@/components/stock/StockSearchForm';
import { StockDataDisplay } from '@/components/stock/StockDataDisplay';
import { AppHeader } from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, BarChart3 } from "lucide-react"; // Added BarChart3
import { 
  fetchStockDetailsAction, 
  generateAiStockReportAction, 
  assessAiConfidenceAction, 
  generateAiRiskDisclaimerAction 
} from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";


export default function HomePage() {
  const [stockSymbol, setStockSymbol] = useState<NepseStockSymbol | null>(null);
  const [stockDetails, setStockDetails] = useState<StockDetails | null>(null);
  const [aiReport, setAiReport] = useState<AIReportData | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceData | null>(null);
  const [disclaimer, setDisclaimer] = useState<DisclaimerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async (symbol: NepseStockSymbol) => {
    setIsLoading(true);
    setError(null);
    setStockDetails(null);
    setAiReport(null);
    setConfidence(null);
    setDisclaimer(null);
    setStockSymbol(symbol);

    try {
      toast({ title: "Fetching Stock Data...", description: `Looking up details for ${symbol}.`});
      const details = await fetchStockDetailsAction(symbol);
      if (!details) {
        throw new Error(`Stock symbol "${symbol}" not found or an error occurred.`);
      }
      setStockDetails(details);
      toast({ title: "Stock Data Fetched!", description: `Successfully retrieved data for ${details.name}.`, variant: "default" });

      // Trigger AI flows sequentially
      toast({ title: "Generating AI Report...", description: "Our AI is analyzing the data." });
      const reportData = await generateAiStockReportAction(details);
      setAiReport(reportData);
      toast({ title: "AI Report Generated!", variant: "default" });

      toast({ title: "Assessing Confidence...", description: "Evaluating the AI's assessment." });
      const confidenceData = await assessAiConfidenceAction(details, reportData.report);
      setConfidence(confidenceData);
      toast({ title: "Confidence Assessed!", variant: "default" });

      toast({ title: "Generating Disclaimer...", description: "Preparing risk information." });
      const disclaimerData = await generateAiRiskDisclaimerAction(details.name);
      setDisclaimer(disclaimerData);
      toast({ title: "All Insights Ready!", description: `AI analysis for ${details.name} is complete.`,className: "bg-accent text-accent-foreground" });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 font-headline">
              AI-Powered NEPSE Stock Insights
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Enter a NEPSE stock symbol to get comprehensive data and AI-driven analysis.
            </p>
          </div>
          
          <StockSearchForm onSearch={handleSearch} isLoading={isLoading} />

          {isLoading && <LoadingSpinner size="lg" />}
          
          {error && !isLoading && (
            <Alert variant="destructive" className="shadow-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isLoading && !error && stockDetails && (
            <StockDataDisplay 
              stockDetails={stockDetails}
              aiReport={aiReport ?? undefined}
              confidence={confidence ?? undefined}
              disclaimer={disclaimer ?? undefined}
            />
          )}

          {!isLoading && !stockDetails && !error && (
            <div className="text-center py-10">
              <BarChart3 className="mx-auto h-16 w-16 text-muted-foreground/50" />
              <p className="mt-4 text-lg text-muted-foreground">
                Select a stock symbol to begin your analysis.
              </p>
            </div>
          )}
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} ShareScope AI. All rights reserved. Data for informational purposes only.
      </footer>
    </div>
  );
}
