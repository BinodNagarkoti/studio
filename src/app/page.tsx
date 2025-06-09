
"use client";

import { useState, useEffect } from 'react';
import type { StockDisplayProfile, AIReportData, ConfidenceData, DisclaimerData, NepseStockSymbol, BrokerSelectItem, ProcessedStockInfo } from '@/types';
import { StockSearchForm } from '@/components/stock/StockSearchForm';
import { StockDataDisplay } from '@/components/stock/StockDataDisplay';
import { AppHeader } from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, BarChart3, Briefcase, LineChart, UserRoundSearch, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrokerSelectForm } from '@/components/broker/BrokerSelectForm';
import { BrokerStocksDisplay } from '@/components/broker/BrokerStocksDisplay';
import { 
  fetchStockDetailsAction, 
  generateAiStockReportAction, 
  assessAiConfidenceAction, 
  generateAiRiskDisclaimerAction,
  // fetchAllBrokersAction, // No longer pre-fetched here
  fetchStocksByBrokerAction
} from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  // State for Stock Analysis Tab
  const [stockSymbol, setStockSymbol] = useState<NepseStockSymbol | null>(null); // NepseStockSymbol is now string
  const [stockDetails, setStockDetails] = useState<StockDisplayProfile | null>(null);
  const [aiReport, setAiReport] = useState<AIReportData | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceData | null>(null);
  const [disclaimer, setDisclaimer] = useState<DisclaimerData | null>(null);
  const [isStockAnalysisLoading, setIsStockAnalysisLoading] = useState(false);
  const [stockAnalysisError, setStockAnalysisError] = useState<string | null>(null);

  // State for Broker Insights Tab
  // const [allBrokers, setAllBrokers] = useState<BrokerSelectItem[]>([]); // No longer pre-fetched here
  const [selectedBroker, setSelectedBroker] = useState<BrokerSelectItem | null>(null); // Changed from BrokerInfo
  const [brokerProcessedStocks, setBrokerProcessedStocks] = useState<ProcessedStockInfo[]>([]);
  const [isBrokerStocksLoading, setIsBrokerStocksLoading] = useState(false);
  const [brokerInsightsError, setBrokerInsightsError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState("stock-analysis");
  const { toast } = useToast();

  // Stock Analysis Handler
  const handleStockSearch = async (symbol: NepseStockSymbol) => {
    setIsStockAnalysisLoading(true);
    setStockAnalysisError(null);
    setStockDetails(null);
    setAiReport(null);
    setConfidence(null);
    setDisclaimer(null);
    setStockSymbol(symbol);

    try {
      toast({ title: "Fetching Stock Data...", description: `Looking up details for ${symbol}.`});
      const details = await fetchStockDetailsAction(symbol); // Returns StockDisplayProfile | null
      if (!details || !details.company) {
        // throw new Error(`Stock symbol "${symbol}" not found or an error occurred while fetching data.`);
        const msg = `Data for stock symbol "${symbol}" not found or incomplete. It might not be in the database yet.`;
        setStockAnalysisError(msg);
        toast({ title: "Data Not Found", description: msg, variant: "destructive" });
        setIsStockAnalysisLoading(false);
        return;
      }
      setStockDetails(details);
      toast({ title: "Stock Data Fetched!", description: `Successfully retrieved data for ${details.company.name}.`, variant: "default" });

      toast({ title: "Generating AI Report...", description: "Our AI is analyzing the data." });
      const reportData = await generateAiStockReportAction(details);
      setAiReport(reportData);
      toast({ title: "AI Report Generated!", variant: "default" });

      toast({ title: "Assessing Confidence...", description: "Evaluating the AI's assessment." });
      const confidenceData = await assessAiConfidenceAction(details, reportData.report);
      setConfidence(confidenceData);
      toast({ title: "Confidence Assessed!", variant: "default" });

      toast({ title: "Generating Disclaimer...", description: "Preparing risk information." });
      const disclaimerData = await generateAiRiskDisclaimerAction(details.company.name);
      setDisclaimer(disclaimerData);
      toast({ title: "All Stock Insights Ready!", description: `AI analysis for ${details.company.name} is complete.`, className: "bg-accent text-accent-foreground" });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setStockAnalysisError(errorMessage);
      toast({ title: "Stock Analysis Error", description: errorMessage, variant: "destructive" });
      console.error("Stock Analysis Error:",err);
    } finally {
      setIsStockAnalysisLoading(false);
    }
  };

  // Broker Insights Handler
  // brokerId is now the UUID from the BrokerSelectForm
  const handleBrokerSelect = async (brokerId: string) => {
    setIsBrokerStocksLoading(true);
    setBrokerInsightsError(null);
    setBrokerProcessedStocks([]);
    
    // Find broker details from the list fetched by BrokerSelectForm if needed for display,
    // but for now, we're passing brokerId directly to the action.
    // To display broker name, BrokerSelectForm would need to pass the selected BrokerSelectItem object
    // or HomePage would need to fetch brokers list again (less ideal).
    // For simplicity, we'll just use "Selected Broker" or derive from action if possible.
    // The `fetchAllBrokersAction` is called within BrokerSelectForm.
    // We need to fetch broker name if we want to display it here.
    // For now, let's assume the action takes brokerId (UUID).
    // The selectedBroker state could store the full BrokerSelectItem if passed up from the form.
    // Current BrokerSelectForm passes brokerId (string).
    // TODO: Enhance selectedBroker state if full broker object is needed here. For now, it's just for internal logic.
    setSelectedBroker({ id: brokerId, name: "Selected Broker", broker_code: "" }); // Placeholder name

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
        toast({ title: "Broker Activity Loaded!", description: `Found ${stocks.length} processed stock records.`, variant: "default" });
      } else {
        toast({ title: "No Activity Found", description: `No processed stock records found for the selected broker.`, variant: "default" });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred fetching broker stocks.";
      setBrokerInsightsError(errorMessage);
      toast({ title: "Broker Activity Error", description: errorMessage, variant: "destructive" });
      console.error("Broker Activity Error:", err);
    } finally {
      setIsBrokerStocksLoading(false);
    }
  };
  
  // useEffect to pre-fetch brokers removed as BrokerSelectForm handles its own data fetching.

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
              Comprehensive stock data, AI-driven analysis, and broker activity for the Nepal Stock Exchange.
            </p>
          </div>

          <Alert variant="default" className="shadow-md bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="font-semibold">Data Source Notice</AlertTitle>
            <AlertDescription>
              This application attempts to fetch live data. If data is unavailable, it may indicate missing entries in the database or an issue with data fetching services. The scraping mechanism is still under development.
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
              {!isStockAnalysisLoading && !stockAnalysisError && stockDetails && stockDetails.company && (
                <div className="mt-8">
                  <StockDataDisplay 
                    stockDetails={stockDetails} // Expects StockDisplayProfile
                    aiReport={aiReport ?? undefined}
                    confidence={confidence ?? undefined}
                    disclaimer={disclaimer ?? undefined}
                  />
                </div>
              )}
              {!isStockAnalysisLoading && !stockDetails && !stockAnalysisError && (
                <div className="text-center py-10 mt-6">
                  <BarChart3 className="mx-auto h-16 w-16 text-muted-foreground/50" />
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
              {/* 
                To display broker name in BrokerStocksDisplay, we need to pass the full BrokerSelectItem.
                For now, BrokerStocksDisplay shows a generic title if only ID is known.
              */}
              {!isBrokerStocksLoading && !brokerInsightsError && selectedBroker && brokerProcessedStocks.length > 0 && (
                 <div className="mt-8">
                  <BrokerStocksDisplay 
                    broker={selectedBroker} // Expects BrokerSelectItem | null
                    stocks={brokerProcessedStocks}
                  />
                </div>
              )}
              {!isBrokerStocksLoading && !brokerInsightsError && selectedBroker && brokerProcessedStocks.length === 0 && (
                  <div className="text-center py-10 mt-6">
                    <UserRoundSearch className="mx-auto h-16 w-16 text-muted-foreground/50" />
                    <p className="mt-4 text-lg text-muted-foreground">
                      No processed stock activity found for the selected broker.
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
        © {new Date().getFullYear()} ShareScope AI. All rights reserved. Financial data is for informational purposes only.
      </footer>
    </div>
  );
}

    