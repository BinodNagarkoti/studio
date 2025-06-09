
"use server";

import type {
  StockDisplayProfile,
  NepseStockSymbol, // is now string
  Broker, // Should be BrokerSelectItem for form usage if directly returned
  BrokerSelectItem,
  ProcessedStockInfo,
  Company,
  CompanySelectItem
} from '@/types';
import {
  getStockDisplayProfile,
  getAllBrokers as getAllBrokersService, // Renamed for clarity
  getStocksByBroker as getStocksByBrokerService, // Renamed for clarity
  getAllCompaniesForSearch as getAllCompaniesForSearchService // New service function
} from '@/services/nepse-data-service';
import { generateStockReport, type GenerateStockReportInput, type GenerateStockReportOutput } from '@/ai/flows/generate-stock-report';
import { assessConfidenceLevel, type AssessConfidenceLevelInput, type AssessConfidenceLevelOutput } from '@/ai/flows/assess-confidence-level';
import { generateRiskDisclaimer, type GenerateRiskDisclaimerInput, type GenerateRiskDisclaimerOutput } from '@/ai/flows/generate-risk-disclaimer';
import { supabase } from '@/lib/supabaseClient';


// --- Data Fetching Actions (Delegating to nepse-data-service) ---

export async function fetchStockDetailsAction(symbol: NepseStockSymbol): Promise<StockDisplayProfile | null> {
  // console.log(`Action: Fetching display profile for ${symbol} via nepse-data-service`);
  return getStockDisplayProfile(symbol);
}

export async function fetchAllCompaniesForSearchAction(): Promise<CompanySelectItem[]> {
  // console.log("Action: Fetching all companies for search via nepse-data-service");
  return getAllCompaniesForSearchService();
}

export async function fetchAllBrokersAction(): Promise<BrokerSelectItem[]> {
  // console.log("Action: Fetching all brokers via nepse-data-service");
  // The service returns Broker[], we might need to map it to BrokerSelectItem if structure differs
  const brokers = await getAllBrokersService();
  return brokers.map(b => ({ id: b.id, broker_code: b.broker_code, name: b.name }));
}

export async function fetchStocksByBrokerAction(brokerId: string): Promise<ProcessedStockInfo[]> {
  // console.log(`Action: Fetching stocks for broker ID ${brokerId} via nepse-data-service`);
  // The service getStocksByBroker now expects brokerId (UUID) instead of brokerCode
  return getStocksByBrokerService(brokerId);
}


// --- AI-Related Actions (Input formatting needs review based on new StockDisplayProfile) ---

export async function generateAiStockReportAction(stockProfile: StockDisplayProfile | null): Promise<GenerateStockReportOutput> {
  if (!stockProfile || !stockProfile.company) {
    // Handle cases where stockProfile might be null or company data is missing
    // This can happen if fetchStockDetailsAction returns null
    console.warn("generateAiStockReportAction: stockProfile or company data is null. Returning default report.");
    return {
      report: "Could not generate AI report: Essential stock data is missing.",
      score: "N/A",
      confidence: 0,
      disclaimer: "Data unavailable, AI analysis cannot be performed.",
    };
  }

  const fundamentalDataStr = stockProfile.latestFinancialReport
    ? `Report Date: ${stockProfile.latestFinancialReport.report_date}, Revenue: ${stockProfile.latestFinancialReport.revenue ?? 'N/A'}, Net Income: ${stockProfile.latestFinancialReport.net_income ?? 'N/A'}, EPS: ${stockProfile.latestFinancialReport.eps ?? 'N/A'}`
    : "Fundamental data not available";
  const technicalIndicatorsStr = stockProfile.technicalIndicators?.map(ti => `${ti.indicator_name}: ${ti.value ?? 'N/A'} (${ti.interpretation ?? 'N/A'})`).join(', ') || "Technical indicators not available";
  const newsStr = stockProfile.recentNews?.map(n => `${n.headline}: ${n.summary ?? 'No summary'}`).join('; ') || "Recent news not available";

  const input: GenerateStockReportInput = {
    fundamentalData: fundamentalDataStr,
    technicalIndicators: technicalIndicatorsStr,
    news: newsStr,
  };
  try {
    return await generateStockReport(input);
  } catch (error) {
    console.error("Error in generateAiStockReportAction:", error);
    // throw new Error("Failed to generate AI stock report.");
     return { // Return a structured error response
      report: `Error generating report: ${error instanceof Error ? error.message : 'Unknown AI error'}`,
      score: "Error",
      confidence: 0,
      disclaimer: "An error occurred during AI report generation.",
    };
  }
}

export async function assessAiConfidenceAction(stockProfile: StockDisplayProfile | null, aiReportText: string): Promise<AssessConfidenceLevelOutput> {
   if (!stockProfile || !stockProfile.company) {
    console.warn("assessAiConfidenceAction: stockProfile or company data is null. Returning default confidence.");
    return {
      confidenceLevel: 0,
      reasoning: "Could not assess confidence: Essential stock data is missing.",
    };
  }

  let newsSentiment = "Neutral";
  if (stockProfile.recentNews && stockProfile.recentNews.length > 0) {
      const sentimentKeywords = stockProfile.recentNews.map(n => (n.sentiment_score !== null && n.sentiment_score !== undefined ? (n.sentiment_score > 0 ? 'Positive' : n.sentiment_score < 0 ? 'Negative' : 'Neutral') : 'Neutral')).join(' ');
      if (sentimentKeywords.includes('Positive') && !sentimentKeywords.includes('Negative')) newsSentiment = 'Positive';
      else if (sentimentKeywords.includes('Negative') && !sentimentKeywords.includes('Positive')) newsSentiment = 'Negative';
      else if (sentimentKeywords.includes('Positive') && sentimentKeywords.includes('Negative')) newsSentiment = 'Mixed';
      else newsSentiment = 'Neutral'; // Default if only neutral or no clear signals
  }

  const fundamentalDataStr = stockProfile.latestFinancialReport
    ? `Report Date: ${stockProfile.latestFinancialReport.report_date}, EPS: ${stockProfile.latestFinancialReport.eps ?? 'N/A'}`
    : "Fundamental data not available";
  const technicalIndicatorsStr = stockProfile.technicalIndicators?.map(ti => `${ti.indicator_name}: ${ti.interpretation ?? 'N/A'}`).join(', ') || "Technical indicators not available";

  const input: AssessConfidenceLevelInput = {
    fundamentalData: fundamentalDataStr,
    technicalIndicators: technicalIndicatorsStr,
    newsSentiment: newsSentiment,
    aiAssessment: aiReportText,
  };
  try {
    return await assessConfidenceLevel(input);
  } catch (error) {
    console.error("Error in assessAiConfidenceAction:", error);
    // throw new Error("Failed to assess AI confidence.");
    return { // Return a structured error response
      confidenceLevel: 0,
      reasoning: `Error assessing confidence: ${error instanceof Error ? error.message : 'Unknown AI error'}`,
    };
  }
}

export async function generateAiRiskDisclaimerAction(stockName: string | undefined): Promise<GenerateRiskDisclaimerOutput> {
  const input: GenerateRiskDisclaimerInput = {
    stockName: stockName || "the stock market", // Handle undefined stockName
  };
  try {
    return await generateRiskDisclaimer(input);
  } catch (error) {
    console.error("Error in generateAiRiskDisclaimerAction:", error);
    // throw new Error("Failed to generate AI risk disclaimer.");
    return { // Return a structured error response
      disclaimer: `Error generating disclaimer: ${error instanceof Error ? error.message : 'Unknown AI error'}`,
    };
  }
}

// --- Scrape Status Action ---
export interface ScrapeStatus {
  isUpToDate: boolean;
  lastChecked: string; // ISO string of when this check was performed
  message: string;
}

export async function getTodayPriceScrapeStatusAction(): Promise<ScrapeStatus> {
  try {
    const today = new Date();
    // IMPORTANT: This creates a date string based on the server's local timezone.
    // For consistency with NEPSE (NPT), you might need to adjust this.
    // For now, we use the server's local concept of "today".
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const todayDateString = `${year}-${month}-${day}`;

    // Check if there's any data for today's trade_date
    const { error, count } = await supabase
      .from('daily_market_data')
      .select('trade_date', { count: 'exact', head: true }) // only need count, head:true is efficient
      .eq('trade_date', todayDateString);

    const checkTimestamp = new Date().toLocaleString(); // For user-friendly display

    if (error) {
      console.error("Error fetching scrape status:", error.message);
      return {
        isUpToDate: false,
        lastChecked: new Date().toISOString(),
        message: `Error checking status: ${error.message}. (Checked: ${checkTimestamp})`,
      };
    }

    if (count && count > 0) {
      return {
        isUpToDate: true,
        lastChecked: new Date().toISOString(),
        message: `Data for ${todayDateString} is present. (Checked: ${checkTimestamp})`,
      };
    } else {
      return {
        isUpToDate: false,
        lastChecked: new Date().toISOString(),
        message: `No data found for ${todayDateString}. Needs scraping. (Checked: ${checkTimestamp})`,
      };
    }
  } catch (err: any) {
    console.error("Unexpected error in getTodayPriceScrapeStatusAction:", err.message);
    return {
      isUpToDate: false,
      lastChecked: new Date().toISOString(),
      message: `Failed to determine scrape status: ${err.message}. (Checked: ${new Date().toLocaleString()})`,
    };
  }
}
