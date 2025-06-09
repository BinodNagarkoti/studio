
"use server";

import type {
  StockDisplayProfile,
  NepseStockSymbol,
  Broker,
  ProcessedStockInfo,
  Company // Added for more specific type from service
} from '@/types';
import {
  getStockDisplayProfile, // Renamed from getStockDetails
  getAllBrokers,
  getStocksByBroker,
  getAllCompaniesForSearch // New service function
} from '@/services/nepse-data-service';
import { generateStockReport, type GenerateStockReportInput, type GenerateStockReportOutput } from '@/ai/flows/generate-stock-report';
import { assessConfidenceLevel, type AssessConfidenceLevelInput, type AssessConfidenceLevelOutput } from '@/ai/flows/assess-confidence-level';
import { generateRiskDisclaimer, type GenerateRiskDisclaimerInput, type GenerateRiskDisclaimerOutput } from '@/ai/flows/generate-risk-disclaimer';

// --- Helper function to format data for AI (NEEDS REFACTORING for new data types) ---
/*
function formatDataForAI(data: any, type: 'fundamental' | 'technical' | 'news_summary' | 'company_profile'): string {
  // This function needs a complete overhaul to work with the new, richer data types
  // like StockDisplayProfile, FinancialReport, CompanyNewsEvent, etc.
  // For now, it's heavily simplified or you might pass specific fields directly.
  
  if (type === 'company_profile' && data && data.company) {
    return `Company: ${data.company.name} (${data.company.ticker_symbol}), Industry: ${data.company.industry_sector || 'N/A'}. Description: ${data.company.description || 'N/A'}`;
  }
  if (type === 'fundamental' && data && data.latestFinancialReport) {
    const report = data.latestFinancialReport;
    return `Latest Report (${report.report_date}, ${report.period_type}): Revenue: ${report.revenue || 'N/A'}, Net Income: ${report.net_income || 'N/A'}, EPS: ${report.eps || 'N/A'}`;
  }
  if (type === 'technical' && data && data.technicalIndicators) {
    return (data.technicalIndicators as CompanyTechnicalIndicator[])
      .map(item => `${item.indicator_name}: ${item.value} (${item.interpretation || 'N/A'})`)
      .join(', ');
  }
  if (type === 'news_summary' && data && data.recentNews) {
    return (data.recentNews as CompanyNewsEvent[])
      .slice(0, 3)
      .map(item => `Title: ${item.title}, Summary: ${item.summary || 'No summary'}`)
      .join('; ');
  }
  return JSON.stringify(data); // Fallback, but ideally avoid
}
*/

// --- Data Fetching Actions (Delegating to nepse-data-service) ---

export async function fetchStockDetailsAction(symbol: NepseStockSymbol): Promise<StockDisplayProfile | null> {
  // console.log(`Action: Fetching display profile for ${symbol} via nepse-data-service`);
  return getStockDisplayProfile(symbol);
}

export async function fetchAllCompaniesForSearchAction(): Promise<Pick<Company, 'id' | 'ticker_symbol' | 'name'>[]> {
  // console.log("Action: Fetching all companies for search via nepse-data-service");
  return getAllCompaniesForSearch();
}

export async function fetchAllBrokersAction(): Promise<Broker[]> {
  // console.log("Action: Fetching all brokers via nepse-data-service");
  return getAllBrokers();
}

export async function fetchStocksByBrokerAction(brokerCode: string): Promise<ProcessedStockInfo[]> {
  // console.log(`Action: Fetching stocks for broker code ${brokerCode} via nepse-data-service`);
  return getStocksByBroker(brokerCode);
}


// --- AI-Related Actions (Input formatting needs review based on new StockDisplayProfile) ---

export async function generateAiStockReportAction(stockProfile: StockDisplayProfile): Promise<GenerateStockReportOutput> {
  // TODO: Update input formatting based on the rich StockDisplayProfile
  const fundamentalDataStr = stockProfile.latestFinancialReport 
    ? `Report Date: ${stockProfile.latestFinancialReport.report_date}, Revenue: ${stockProfile.latestFinancialReport.revenue}, Net Income: ${stockProfile.latestFinancialReport.net_income}, EPS: ${stockProfile.latestFinancialReport.eps}`
    : "Not available";
  const technicalIndicatorsStr = stockProfile.technicalIndicators?.map(ti => `${ti.indicator_name}: ${ti.value} (${ti.interpretation})`).join(', ') || "Not available";
  const newsStr = stockProfile.recentNews?.map(n => `${n.title}: ${n.summary}`).join('; ') || "Not available";

  const input: GenerateStockReportInput = {
    fundamentalData: fundamentalDataStr,
    technicalIndicators: technicalIndicatorsStr,
    news: newsStr,
  };
  try {
    return await generateStockReport(input);
  } catch (error) {
    console.error("Error in generateAiStockReportAction:", error);
    throw new Error("Failed to generate AI stock report.");
  }
}

export async function assessAiConfidenceAction(stockProfile: StockDisplayProfile, aiReportText: string): Promise<AssessConfidenceLevelOutput> {
  // TODO: Update sentiment analysis and input formatting
  let newsSentiment = "Neutral"; // Simplified for now
  if (stockProfile.recentNews && stockProfile.recentNews.length > 0) {
      const sentimentKeywords = stockProfile.recentNews.map(n => (n.sentiment || 'Neutral')).join(' ');
      if (sentimentKeywords.includes('Positive')) newsSentiment = 'Positive';
      else if (sentimentKeywords.includes('Negative')) newsSentiment = 'Negative';
      else if (sentimentKeywords.includes('Neutral') && (sentimentKeywords.includes('Positive') || sentimentKeywords.includes('Negative'))) newsSentiment = 'Mixed';
  }


  const fundamentalDataStr = stockProfile.latestFinancialReport
    ? `Report Date: ${stockProfile.latestFinancialReport.report_date}, EPS: ${stockProfile.latestFinancialReport.eps}`
    : "Not available";
  const technicalIndicatorsStr = stockProfile.technicalIndicators?.map(ti => `${ti.indicator_name}: ${ti.interpretation}`).join(', ') || "Not available";

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
