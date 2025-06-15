
"use client";

import { useState, useEffect } from 'react';
import type { NepseStockSymbol, BrokerSelectItem, ProcessedStockInfo } from '@/types';
import type { GetAIWebSearchStockReportOutput } from '@/ai/flows/get-ai-web-search-stock-report';
import { StockSearchForm, type StockSearchFormData } from '@/components/stock/StockSearchForm';
import { StockDataDisplay } from '@/components/stock/StockDataDisplay';
import { AppHeader } from '@/components/layout/Header';
// import { LoadingSpinner } from '@/components/common/LoadingSpinner'; // Replaced by skeletons
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, LineChart, Briefcase, UserRoundSearch, SearchCheck, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrokerSelectForm } from '@/components/broker/BrokerSelectForm';
import { BrokerStocksDisplay } from '@/components/broker/BrokerStocksDisplay';
import { 
  getAiWebSearchReportAction,
  fetchAllBrokersAction,
  fetchStocksByBrokerAction
} from '@/lib/actions';
// import { useToast } from "@/hooks/use-toast"; // Toasts removed

export default function HomePage() {
  const [selectedStock, setSelectedStock] = useState<{symbol: NepseStockSymbol, name: string} | null>(null);
  const [aiWebSearchReport, setAiWebSearchReport] = useState<GetAIWebSearchStockReportOutput | null>(null);
  const [isStockAnalysisLoading, setIsStockAnalysisLoading] = useState(false);
  const [stockAnalysisError, setStockAnalysisError] = useState<string | null>(null);

  const [selectedBroker, setSelectedBroker] = useState<BrokerSelectItem | null>(null);
  const [brokerProcessedStocks, setBrokerProcessedStocks] = useState<ProcessedStockInfo[]>([]);
  const [isBrokerStocksLoading, setIsBrokerStocksLoading] = useState(false);
  const [brokerInsightsError, setBrokerInsightsError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState("stock-analysis");
  // const { toast } = useToast(); // Toasts removed
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);


  const handleStockSearch = async (data: StockSearchFormData) => {
    setIsStockAnalysisLoading(true);
    setStockAnalysisError(null);
    setAiWebSearchReport(null); 
    setSelectedStock(data);

    try {
      // No toast for starting AI report generation
      const reportOutput = await getAiWebSearchReportAction({ stockSymbol: data.symbol, companyName: data.name });
      setAiWebSearchReport(reportOutput);
      
      if (reportOutput.score === "Error") {
         // Error will be displayed by Alert component
         setStockAnalysisError(reportOutput.report || "Could not generate AI report.");
      } 
      // Success is indicated by data appearing

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during stock analysis.";
      setStockAnalysisError(errorMessage);
      // Error will be displayed by Alert component
    } finally {
      setIsStockAnalysisLoading(false);
    }
  };

  const handleBrokerSelect = async (brokerId: string) => {
    setIsBrokerStocksLoading(true);
    setBrokerInsightsError(null);
    setBrokerProcessedStocks([]);
    
    const allBrokers = await fetchAllBrokersAction(); 
    const currentBroker = allBrokers.find(b => b.id === brokerId);
    setSelectedBroker(currentBroker || { id: brokerId, name: `Broker ${brokerId.substring(0,4)}...`, broker_code: "" });


    if (!brokerId) {
      const errMsg = "No broker selected or broker ID is missing.";
      setBrokerInsightsError(errMsg);
      // Error will be displayed by Alert component
      setIsBrokerStocksLoading(false);
      return;
    }
    
    try {
      // No toast for starting fetch
      const stocks = await fetchStocksByBrokerAction(brokerId);
      setBrokerProcessedStocks(stocks);
      // Success is indicated by data appearing or empty message
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred fetching broker stocks.";
      setBrokerInsightsError(errorMessage);
      // Error will be displayed by Alert component
    } finally {
      setIsBrokerStocksLoading(false);
    }
  };
  

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 font-headline">
              ShareScope: NEPSE AI Insights
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              AI-driven analysis for the Nepal Stock Exchange, based on simulated web research.
            </p>
          </div>

          <Alert variant="default" className="shadow-md bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="font-semibold">AI Analysis Notice</AlertTitle>
            <AlertDescription>
              Stock listings are for selection purposes. All analytical insights (reports, scores, confidence, summaries, chart data) are generated by an LLM simulating web research for the selected stock symbol and company name. No live database lookups for fundamentals or market data are performed for this AI analysis.
            </AlertDescription>
          </Alert>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stock-analysis" className="gap-2">
                <LineChart className="h-5 w-5" /> Stock Analysis
              </TabsTrigger>
              <TabsTrigger value="broker-insights" className="gap-2">
                <Briefcase className="h-5 w-5" /> Broker Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stock-analysis" className="mt-6">
              <StockSearchForm onSearch={handleStockSearch} isLoading={isStockAnalysisLoading} />
              
              {stockAnalysisError && !isStockAnalysisLoading && (
                <Alert variant="destructive" className="shadow-md mt-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Analyzing Stock</AlertTitle>
                  <AlertDescription>{stockAnalysisError}</AlertDescription>
                </Alert>
              )}

              {/* Show skeletons or data display */}
              {(selectedStock || isStockAnalysisLoading) && !stockAnalysisError && (
                <div className="mt-8">
                  <StockDataDisplay 
                    stockSymbol={selectedStock?.symbol || "Loading..."}
                    companyName={selectedStock?.name || "Loading..."}
                    aiWebSearchReport={aiWebSearchReport}
                    isLoading={isStockAnalysisLoading}
                  />
                </div>
              )}

              {!isStockAnalysisLoading && !selectedStock && !stockAnalysisError && (
                <div className="text-center py-10 mt-6">
                  <SearchCheck className="mx-auto h-16 w-16 text-muted-foreground/50" />
                  <p className="mt-4 text-lg text-muted-foreground">
                    Select a stock symbol to begin your AI-powered analysis.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="broker-insights" className="mt-6">
              <BrokerSelectForm onBrokerSelect={handleBrokerSelect} isLoading={isBrokerStocksLoading} />
              
              {brokerInsightsError && !isBrokerStocksLoading && (
                <Alert variant="destructive" className="shadow-md mt-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Fetching Broker Data</AlertTitle>
                  <AlertDescription>{brokerInsightsError}</AlertDescription>
                </Alert>
              )}
              
              {/* Show skeletons or data display */}
              {(selectedBroker || isBrokerStocksLoading) && !brokerInsightsError && (
                 <div className="mt-8">
                  <BrokerStocksDisplay 
                    broker={selectedBroker} 
                    stocks={brokerProcessedStocks}
                    isLoading={isBrokerStocksLoading}
                  />
                </div>
              )}
              
              {!isBrokerStocksLoading && !brokerInsightsError && selectedBroker && brokerProcessedStocks.length === 0 && (
                  <div className="text-center py-10 mt-6">
                    <UserRoundSearch className="mx-auto h-16 w-16 text-muted-foreground/50" />
                    <p className="mt-4 text-lg text-muted-foreground">
                      No processed stock activity found for {selectedBroker.name || "the selected broker"}.
                    </p>
                  </div>
              )}
               {!isBrokerStocksLoading && !selectedBroker && !brokerInsightsError && (
                <div className="text-center py-10 mt-6">
                  <UserRoundSearch className="mx-auto h-16 w-16 text-muted-foreground/50" />
                  <p className="mt-4 text-lg text-muted-foreground">
                    Select a broker to view their processed stock activity.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {currentYear ?? new Date().getFullYear()} ShareScope AI. All rights reserved. Financial data is for informational purposes only.
      </footer>
    </div>
  );
}
