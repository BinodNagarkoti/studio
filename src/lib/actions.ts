
"use server";

import type {
  StockDisplayProfile,
  NepseStockSymbol, 
  BrokerSelectItem,
  ProcessedStockInfo,
  CompanySelectItem
} from '@/types';
import {
  getStockDisplayProfile,
  getAllBrokers as getAllBrokersService, 
  getStocksByBroker as getStocksByBrokerService, 
  getAllCompaniesForSearch as getAllCompaniesForSearchService
} from '@/services/nepse-data-service';
// Removed unused AI flows that depended on detailed StockDisplayProfile
// import { generateStockReport, type GenerateStockReportInput, type GenerateStockReportOutput } from '@/ai/flows/generate-stock-report';
// import { assessConfidenceLevel, type AssessConfidenceLevelInput, type AssessConfidenceLevelOutput } from '@/ai/flows/assess-confidence-level';
// import { generateRiskDisclaimer, type GenerateRiskDisclaimerInput, type GenerateRiskDisclaimerOutput } from '@/ai/flows/generate-risk-disclaimer';
import { getAIWebSearchStockReport, type GetAIWebSearchStockReportInput, type GetAIWebSearchStockReportOutput } from '@/ai/flows/get-ai-web-search-stock-report';


// --- Data Fetching Actions (Delegating to nepse-data-service) ---

export async function fetchStockDetailsAction(symbol: NepseStockSymbol): Promise<StockDisplayProfile | null> {
  return getStockDisplayProfile(symbol);
}

export async function fetchAllCompaniesForSearchAction(): Promise<CompanySelectItem[]> {
  return getAllCompaniesForSearchService();
}

export async function fetchAllBrokersAction(): Promise<BrokerSelectItem[]> {
  const brokers = await getAllBrokersService();
  return brokers.map(b => ({ id: b.id, broker_code: b.broker_code, name: b.name }));
}

export async function fetchStocksByBrokerAction(brokerId: string): Promise<ProcessedStockInfo[]> {
  return getStocksByBrokerService(brokerId);
}


// --- New AI Web Search Action ---
export async function getAiWebSearchReportAction(
  input: GetAIWebSearchStockReportInput
): Promise<GetAIWebSearchStockReportOutput> {
  try {
    // console.log(`Action: Calling getAIWebSearchStockReport flow for symbol ${input.stockSymbol}`);
    const result = await getAIWebSearchStockReport(input);
    // console.log(`Action: Received response from getAIWebSearchStockReport flow`, result);
    return result;
  } catch (error) {
    console.error("Error in getAiWebSearchReportAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown AI error occurred during web search report generation.";
    // Return a structured error response matching the expected output schema
    return {
      report: `Failed to generate AI web search report: ${errorMessage}`,
      score: "Error",
      confidence: 0,
      disclaimer: "An error occurred while trying to generate the AI-driven web search report. Please try again later.",
    };
  }
}

// --- Removed Scrape Status Action ---
// The getTodayPriceScrapeStatusAction has been removed as scraping functionality is deprecated.
