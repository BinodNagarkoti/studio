
"use server";

import type {
  // StockDisplayProfile, // Removed as stock details are no longer fetched from DB for display
  NepseStockSymbol, 
  BrokerSelectItem,
  ProcessedStockInfo,
  CompanySelectItem // Still used by StockSearchForm if it were dynamic
} from '@/types';
import {
  // getStockDisplayProfile, // Removed
  getAllBrokers as getAllBrokersService, 
  getStocksByBroker as getStocksByBrokerService, 
  getAllCompaniesForSearch as getAllCompaniesForSearchService // Kept if StockSearchForm goes dynamic again
} from '@/services/nepse-data-service';
import { getAIWebSearchStockReport, type GetAIWebSearchStockReportInput, type GetAIWebSearchStockReportOutput } from '@/ai/flows/get-ai-web-search-stock-report';


// --- Data Fetching Actions (Delegating to nepse-data-service) ---

// export async function fetchStockDetailsAction(symbol: NepseStockSymbol): Promise<StockDisplayProfile | null> {
//   return getStockDisplayProfile(symbol);
// } // Removed

export async function fetchAllCompaniesForSearchAction(): Promise<CompanySelectItem[]> {
  // This can be used if StockSearchForm switches back to dynamic loading.
  // For now, StockSearchForm uses local stock_data.json
  return getAllCompaniesForSearchService();
}

export async function fetchAllBrokersAction(): Promise<BrokerSelectItem[]> {
  const brokers = await getAllBrokersService();
  return brokers.map(b => ({ id: b.id, broker_code: b.broker_code, name: b.name }));
}

export async function fetchStocksByBrokerAction(brokerId: string): Promise<ProcessedStockInfo[]> {
  return getStocksByBrokerService(brokerId);
}


// --- AI Web Search Action ---
export async function getAiWebSearchReportAction(
  input: GetAIWebSearchStockReportInput
): Promise<GetAIWebSearchStockReportOutput> {
  try {
    const result = await getAIWebSearchStockReport(input);
    return result;
  } catch (error) {
    console.error("Full error in getAiWebSearchReportAction:", error); 
    const errorMessage = error instanceof Error ? error.message : "An unknown AI error occurred during web search report generation.";
    return {
      report: `Failed to generate AI web search report: ${errorMessage}. Check server logs or Genkit dev console for more details.`,
      score: "Error",
      confidence: 0,
      disclaimer: "An error occurred while trying to generate the AI-driven web search report. Please try again later.",
    };
  }
}
