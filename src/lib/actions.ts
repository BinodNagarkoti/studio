
"use server";

import type { StockDetails, NepseStockSymbol, BrokerInfo, ProcessedStockInfo } from '@/types';
import {
  getStockDetails,
  getAllBrokers,
  getStocksByBroker
} from '@/services/nepse-data-service'; // New import
import { generateStockReport, type GenerateStockReportInput, type GenerateStockReportOutput } from '@/ai/flows/generate-stock-report';
import { assessConfidenceLevel, type AssessConfidenceLevelInput, type AssessConfidenceLevelOutput } from '@/ai/flows/assess-confidence-level';
import { generateRiskDisclaimer, type GenerateRiskDisclaimerInput, type GenerateRiskDisclaimerOutput } from '@/ai/flows/generate-risk-disclaimer';

// --- Helper function to format data for AI (remains in actions.ts) ---
function formatDataForAI(data: any[] | object, type: 'fundamental' | 'technical' | 'news'): string {
  if (type === 'fundamental') {
    return (data as StockDetails['fundamentalData']).map(item => `${item.metric}: ${item.value}`).join(', ');
  }
  if (type === 'technical') {
    return (data as StockDetails['technicalIndicators']).map(item => `${item.name}: ${item.value} (${item.interpretation || 'N/A'})`).join(', ');
  }
  if (type === 'news') {
    return (data as StockDetails['news']).slice(0, 3).map(item => `Title: ${item.title}, Summary: ${item.summary}`).join('; ');
  }
  return JSON.stringify(data);
}

// --- Data Fetching Actions (Now delegating to nepse-data-service) ---

export async function fetchStockDetailsAction(symbol: NepseStockSymbol): Promise<StockDetails | null> {
  // This action now calls the service layer, which currently handles mock data.
  // Eventually, the service layer will fetch from Supabase.
  // console.log(`Action: Fetching details for ${symbol} via nepse-data-service`);
  return getStockDetails(symbol);
}

export async function fetchAllBrokersAction(): Promise<BrokerInfo[]> {
  // This action now calls the service layer.
  // console.log("Action: Fetching all brokers via nepse-data-service");
  return getAllBrokers();
}

export async function fetchStocksByBrokerAction(brokerId: string): Promise<ProcessedStockInfo[]> {
  // This action now calls the service layer.
  // console.log(`Action: Fetching stocks for broker ${brokerId} via nepse-data-service`);
  return getStocksByBroker(brokerId);
}


// --- AI-Related Actions (Remain unchanged as they call Genkit flows) ---

export async function generateAiStockReportAction(stockDetails: StockDetails): Promise<GenerateStockReportOutput> {
  const input: GenerateStockReportInput = {
    fundamentalData: formatDataForAI(stockDetails.fundamentalData, 'fundamental'),
    technicalIndicators: formatDataForAI(stockDetails.technicalIndicators, 'technical'),
    news: formatDataForAI(stockDetails.news, 'news'),
  };
  try {
    return await generateStockReport(input);
  } catch (error) {
    console.error("Error in generateAiStockReportAction:", error);
    throw new Error("Failed to generate AI stock report.");
  }
}

export async function assessAiConfidenceAction(stockDetails: StockDetails, aiReportText: string): Promise<AssessConfidenceLevelOutput> {
  const positiveKeywords = ['up', 'profit', 'growth', 'positive', 'optimistic', 'exceeded', 'strong', 'stable', 'support', 'new product', 'full capacity'];
  const negativeKeywords = ['down', 'loss', 'decline', 'negative', 'bearish', 'concern'];
  let sentimentScore = 0;
  const newsSummaryForSentiment = stockDetails.news.map(n => n.title.toLowerCase() + " " + n.summary.toLowerCase()).join(' ');
  
  positiveKeywords.forEach(kw => {
    if (newsSummaryForSentiment.includes(kw)) sentimentScore++;
  });
  negativeKeywords.forEach(kw => {
    if (newsSummaryForSentiment.includes(kw)) sentimentScore--;
  });

  let newsSentiment = "Neutral";
  if (sentimentScore > 1) newsSentiment = "Positive";
  else if (sentimentScore < -1) newsSentiment = "Negative";
  else if (sentimentScore !== 0) newsSentiment = "Mixed";

  const input: AssessConfidenceLevelInput = {
    fundamentalData: formatDataForAI(stockDetails.fundamentalData, 'fundamental'),
    technicalIndicators: formatDataForAI(stockDetails.technicalIndicators, 'technical'),
    newsSentiment: newsSentiment,
    aiAssessment: aiReportText,
  };
  try {
    return await assessConfidenceLevel(input);
  } catch (error) {
    console.error("Error in assessAiConfidenceAction:", error);
    throw new Error("Failed to assess AI confidence.");
  }
}

export async function generateAiRiskDisclaimerAction(stockName: string): Promise<GenerateRiskDisclaimerOutput> {
  const input: GenerateRiskDisclaimerInput = {
    stockName: stockName,
  };
  try {
    return await generateRiskDisclaimer(input);
  } catch (error) {
    console.error("Error in generateAiRiskDisclaimerAction:", error);
    throw new Error("Failed to generate AI risk disclaimer.");
  }
}
