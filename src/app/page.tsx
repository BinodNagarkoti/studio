
"use client";

import { useState, useEffect } from 'react';
import type { NepseStockSymbol, BrokerSelectItem, ProcessedStockInfo } from '@/types';
import type { GetAIWebSearchStockReportOutput } from '@/ai/flows/get-ai-web-search-stock-report';
import { StockSearchForm, type StockSearchFormData } from '@/components/stock/StockSearchForm';
import { StockDataDisplay } from '@/components/stock/StockDataDisplay';
import { AppHeader } from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, BarChart3, Briefcase, LineChart, UserRoundSearch, Info, SearchCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrokerSelectForm } from '@/components/broker/BrokerSelectForm';
import { BrokerStocksDisplay } from '@/components/broker/BrokerStocksDisplay';
import { 
  // fetchStockDetailsAction, // Removed
  getAiWebSearchReportAction,
  fetchAllBrokersAction,
  fetchStocksByBrokerAction
} from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const [selectedStock, setSelectedStock] = useState<{symbol: NepseStockSymbol, name: string} | null>(null);
  // const [stockDetails, setStockDetails] = useState<StockDisplayProfile | null>(null); // Removed
  const [aiWebSearchReport, setAiWebSearchReport] = useState<GetAIWebSearchStockReportOutput | null>(null);
  const [isStockAnalysisLoading, setIsStockAnalysisLoading] = useState(false);
  const [stockAnalysisError, setStockAnalysisError] = useState<string | null>(null);

  const [selectedBroker, setSelectedBroker] = useState<BrokerSelectItem | null>(null);
  const [brokerProcessedStocks, setBrokerProcessedStocks] = useState<ProcessedStockInfo[]>([]);
  const [isBrokerStocksLoading, setIsBrokerStocksLoading] = useState(false);
  const [brokerInsightsError, setBrokerInsightsError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState("stock-analysis");
  const { toast } = useToast();
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);


  const handleStockSearch = async (data: StockSearchFormData) => {
    setIsStockAnalysisLoading(true);
    setStockAnalysisError(null);
    // setStockDetails(null); // Removed
    setAiWebSearchReport(null); 
    setSelectedStock(data);

    try {
      // toast({ title: "Fetching Stock Data...", description: `Looking up basic details for ${data.symbol}.`}); // Removed
      // const details = await fetchStockDetailsAction(data.symbol); // Removed
      // if (!details || !details.company) { // Removed
      //   const msg = `Basic data for stock symbol "${data.symbol}" not found. It might not be in the database yet.`; // Removed
      //   setStockAnalysisError(msg); // Removed
      //   toast({ title: "Data Not Found", description: msg, variant: "destructive" }); // Removed
      //   setIsStockAnalysisLoading(false); // Removed
      //   return; // Removed
      // } // Removed
      // setStockDetails(details); // Removed
      // toast({ title: "Stock Data Fetched!", description: `Successfully retrieved basic data for ${details.company.name}.`, variant: "default" }); // Removed

      toast({ title: "Generating AI Web Search Report...", description: `Our AI is 'searching the web' for insights on ${data.symbol} (${data.name}).` });
      const reportOutput = await getAiWebSearchReportAction({ stockSymbol: data.symbol, companyName: data.name });
      setAiWebSearchReport(reportOutput);
      
      if (reportOutput.score === "Error") {
         toast({ title: "AI Report Generation Issue", description: reportOutput.report || "Could not generate AI report.", variant: "destructive" });
      } else {
         toast({ title: "AI Web Search Report Generated!", description: `Analysis for ${data.name} is ready.`, className: "bg-accent text-accent-foreground" });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during stock analysis.";
      setStockAnalysisError(errorMessage);
      toast({ title: "Stock Analysis Error", description: errorMessage, variant: "destructive" });
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
      toast({ title: "Broker Selection Error", description: errMsg, variant: "destructive" });
      setIsBrokerStocksLoading(false);
      return;
    }
    
    try {
      toast({ title: "Fetching Broker Activity...", description: `Looking up processed stocks for broker.`});
      const stocks = await fetchStocksByBrokerAction(brokerId);
      setBrokerProcessedStocks(stocks);
      if (stocks.length > 0) {
        toast({ title: "Broker Activity Loaded!", description: `Found ${stocks.length} processed stock records for ${currentBroker?.name || 'selected broker'}.`, variant: "default" });
      } else {
        toast({ title: "No Activity Found", description: `No processed stock records found for ${currentBroker?.name || 'selected broker'}.`, variant: "default" });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred fetching broker stocks.";
      setBrokerInsightsError(errorMessage);
      toast({ title: "Broker Activity Error", description: errorMessage, variant: "destructive" });
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
              Stock listings are for selection purposes. All analytical insights (reports, scores, confidence) are generated by an LLM simulating web research for the selected stock symbol and company name. No live database lookups for specific stock fundamentals or real-time market data are performed for this AI analysis.
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
              {isStockAnalysisLoading && <LoadingSpinner size="lg" />}
              {stockAnalysisError && !isStockAnalysisLoading && (
                <Alert variant="destructive" className="shadow-md mt-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{stockAnalysisError}</AlertDescription>
                </Alert>
              )}
              {!isStockAnalysisLoading && !stockAnalysisError && selectedStock && aiWebSearchReport && (
                <div className="mt-8">
                  <StockDataDisplay 
                    stockSymbol={selectedStock.symbol}
                    companyName={selectedStock.name}
                    aiWebSearchReport={aiWebSearchReport}
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
              {isBrokerStocksLoading && <LoadingSpinner size="lg" />}
              {brokerInsightsError && !isBrokerStocksLoading && (
                <Alert variant="destructive" className="shadow-md mt-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{brokerInsightsError}</AlertDescription>
                </Alert>
              )}
              {!isBrokerStocksLoading && !brokerInsightsError && selectedBroker && brokerProcessedStocks.length > 0 && (
                 <div className="mt-8">
                  <BrokerStocksDisplay 
                    broker={selectedBroker} 
                    stocks={brokerProcessedStocks}
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
