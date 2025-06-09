
"use client";

import { useState, useEffect } from 'react';
import type { StockDetails, AIReportData, ConfidenceData, DisclaimerData, NepseStockSymbol, BrokerInfo, ProcessedStockInfo } from '@/types';
import { StockSearchForm } from '@/components/stock/StockSearchForm';
import { StockDataDisplay } from '@/components/stock/StockDataDisplay';
import { AppHeader } from '@/components/layout/Header';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, BarChart3, Briefcase, LineChart, UserRoundSearch } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrokerSelectForm } from '@/components/broker/BrokerSelectForm';
import { BrokerStocksDisplay } from '@/components/broker/BrokerStocksDisplay';
import { 
  fetchStockDetailsAction, 
  generateAiStockReportAction, 
  assessAiConfidenceAction, 
  generateAiRiskDisclaimerAction,
  fetchAllBrokersAction,
  fetchStocksByBrokerAction
} from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  // State for Stock Analysis Tab
  const [stockSymbol, setStockSymbol] = useState<NepseStockSymbol | null>(null);
  const [stockDetails, setStockDetails] = useState<StockDetails | null>(null);
  const [aiReport, setAiReport] = useState<AIReportData | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceData | null>(null);
  const [disclaimer, setDisclaimer] = useState<DisclaimerData | null>(null);
  const [isStockAnalysisLoading, setIsStockAnalysisLoading] = useState(false);
  const [stockAnalysisError, setStockAnalysisError] = useState<string | null>(null);

  // State for Broker Insights Tab
  const [allBrokers, setAllBrokers] = useState<BrokerInfo[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<BrokerInfo | null>(null);
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
      const details = await fetchStockDetailsAction(symbol);
      if (!details) {
        throw new Error(`Stock symbol "${symbol}" not found or an error occurred.`);
      }
      setStockDetails(details);
      toast({ title: "Stock Data Fetched!", description: `Successfully retrieved data for ${details.name}.`, variant: "default" });

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
      toast({ title: "All Stock Insights Ready!", description: `AI analysis for ${details.name} is complete.`, className: "bg-accent text-accent-foreground" });

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
  const handleBrokerSelect = async (brokerId: string) => {
    setIsBrokerStocksLoading(true);
    setBrokerInsightsError(null);
    setBrokerProcessedStocks([]);
    const broker = allBrokers.find(b => b.id === brokerId) || null;
    setSelectedBroker(broker);

    if (!broker) {
      const errMsg = "Selected broker not found.";
      setBrokerInsightsError(errMsg);
      toast({ title: "Broker Selection Error", description: errMsg, variant: "destructive" });
      setIsBrokerStocksLoading(false);
      return;
    }
    
    try {
      toast({ title: "Fetching Broker Activity...", description: `Looking up processed stocks for ${broker.name}.`});
      const stocks = await fetchStocksByBrokerAction(brokerId);
      setBrokerProcessedStocks(stocks);
      if (stocks.length > 0) {
        toast({ title: "Broker Activity Loaded!", description: `Found ${stocks.length} processed stock records for ${broker.name}.`, variant: "default" });
      } else {
        toast({ title: "No Activity Found", description: `No processed stock records found for ${broker.name}.`, variant: "default" });
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
  
  useEffect(() => {
    // Fetch all brokers once when the component mounts or when broker tab becomes active
    const loadAllBrokers = async () => {
        if (allBrokers.length === 0) { // Only fetch if not already fetched
            try {
                const fetchedBrokers = await fetchAllBrokersAction();
                setAllBrokers(fetchedBrokers);
            } catch (error) {
                console.error("Failed to fetch initial list of brokers for page:", error);
                // Error toast for broker list loading is handled in BrokerSelectForm
            }
        }
    };
    loadAllBrokers();
  }, [allBrokers.length]);


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
              {!isStockAnalysisLoading && !stockAnalysisError && stockDetails && (
                <div className="mt-8">
                  <StockDataDisplay 
                    stockDetails={stockDetails}
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
              {!isBrokerStocksLoading && !brokerInsightsError && selectedBroker && (
                 <div className="mt-8">
                  <BrokerStocksDisplay 
                    broker={selectedBroker}
                    stocks={brokerProcessedStocks}
                  />
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
        © {new Date().getFullYear()} ShareScope AI. All rights reserved. Data for informational purposes only.
      </footer>
    </div>
  );
}
