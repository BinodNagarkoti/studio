
"use server";

import type { StockDetails, NepseStockSymbol, ChartDataPoint, BrokerInfo, ProcessedStockInfo } from '@/types';
import { ALL_BROKERS } from '@/lib/constants';
import { generateStockReport, type GenerateStockReportInput, type GenerateStockReportOutput } from '@/ai/flows/generate-stock-report';
import { assessConfidenceLevel, type AssessConfidenceLevelInput, type AssessConfidenceLevelOutput } from '@/ai/flows/assess-confidence-level';
import { generateRiskDisclaimer, type GenerateRiskDisclaimerInput, type GenerateRiskDisclaimerOutput } from '@/ai/flows/generate-risk-disclaimer';

// Mock NEPSE stock data
const mockStockDatabase: Record<NepseStockSymbol, StockDetails> = {
  "NABIL": {
    symbol: "NABIL",
    name: "Nabil Bank Limited",
    lastPrice: 750.50,
    change: 5.20,
    changePercent: 0.70,
    marketCap: "150B NPR",
    volume: "50,000",
    fundamentalData: [
      { metric: "P/E Ratio", value: 18.5, description: "Price-to-Earnings Ratio" },
      { metric: "EPS", value: 40.57, description: "Earnings Per Share (TTM)" },
      { metric: "Book Value", value: 250.10, description: "Book Value Per Share" },
      { metric: "Dividend Yield", value: "5.5%", description: "Annual Dividend Yield" },
    ],
    technicalIndicators: [
      { name: "RSI (14)", value: 62, interpretation: "Neutral to Bullish", chartData: generateMockChartData(62), chartColor: "var(--chart-1)" },
      { name: "MACD", value: "Bullish Crossover", interpretation: "Bullish", chartData: generateMockChartData(0.5, true), chartColor: "var(--chart-2)" },
      { name: "SMA (50)", value: 730.20, chartData: generateMockChartData(730), chartColor: "var(--chart-3)" },
      { name: "Volume", value: "50,000", chartData: generateMockVolumeData(), chartColor: "var(--chart-4)", interpretation: "Avg" }
    ],
    news: [
      { id: "1", title: "Nabil Bank Q3 Profit Up by 15%", source: "Kathmandu Post", date: "2024-04-20", url: "#", summary: "Nabil Bank reported a 15% increase in net profit for the third quarter, driven by strong loan growth and improved net interest margins." },
      { id: "2", title: "Banking Sector Outlook Positive: Analysts", source: "The Himalayan Times", date: "2024-04-18", url: "#", summary: "Financial analysts express optimism for the Nepali banking sector, citing stable economic conditions and regulatory support." },
    ],
  },
  "HDL": {
    symbol: "HDL",
    name: "Himalayan Distillery Limited",
    lastPrice: 2800,
    change: -25,
    changePercent: -0.88,
    marketCap: "30B NPR",
    volume: "10,000",
    fundamentalData: [
      { metric: "P/E Ratio", value: 25.2, description: "Price-to-Earnings Ratio" },
      { metric: "EPS", value: 111.11, description: "Earnings Per Share (TTM)" },
      { metric: "Book Value", value: 450.00, description: "Book Value Per Share" },
      { metric: "Dividend Yield", value: "3.0%", description: "Annual Dividend Yield" },
    ],
    technicalIndicators: [
      { name: "RSI (14)", value: 45, interpretation: "Neutral", chartData: generateMockChartData(45), chartColor: "var(--chart-1)" },
      { name: "MACD", value: "Bearish Divergence", interpretation: "Bearish", chartData: generateMockChartData(-0.2, true), chartColor: "var(--chart-2)" },
      { name: "SMA (20)", value: 2850, chartData: generateMockChartData(2850), chartColor: "var(--chart-3)" },
      { name: "Volume", value: "10,000", chartData: generateMockVolumeData(8000, 15000), chartColor: "var(--chart-4)", interpretation: "Low" }
    ],
    news: [
      { id: "1", title: "HDL Announces New Product Line", source: "ShareSansar", date: "2024-04-15", url: "#", summary: "Himalayan Distillery is expanding its portfolio with a new range of premium beverages, expected to launch next quarter." },
    ],
  },
   "UPPER": {
    symbol: "UPPER",
    name: "Upper Tamakoshi Hydropower Ltd.",
    lastPrice: 450,
    change: 10,
    changePercent: 2.27,
    marketCap: "47B NPR",
    volume: "80,000",
    fundamentalData: [
      { metric: "P/E Ratio", value: "N/A", description: "Not applicable due to recent operations" },
      { metric: "EPS", value: 5.2, description: "Earnings Per Share (Annualized)" },
      { metric: "Book Value", value: 95.5, description: "Book Value Per Share" },
    ],
    technicalIndicators: [
      { name: "RSI (14)", value: 72, interpretation: "Overbought", chartData: generateMockChartData(72), chartColor: "var(--chart-1)" },
      { name: "SMA (200)", value: 400, chartData: generateMockChartData(400), chartColor: "var(--chart-3)" },
      { name: "Volume", value: "80,000", chartData: generateMockVolumeData(60000, 100000), chartColor: "var(--chart-4)", interpretation: "High" }
    ],
    news: [
      { id: "1", title: "Upper Tamakoshi Full Capacity Impact", source: "OnlineKhabar", date: "2024-03-10", url: "#", summary: "The full capacity operation of Upper Tamakoshi is expected to significantly reduce Nepal's electricity import dependency." },
    ],
  },
  "API": {
    symbol: "API",
    name: "Api Power Company Ltd.",
    lastPrice: 210,
    change: -2,
    changePercent: -0.94,
    marketCap: "8B NPR",
    volume: "30,000",
    fundamentalData: [
      { metric: "P/E Ratio", value: 35, description: "Price-to-Earnings Ratio" },
      { metric: "EPS", value: 6, description: "Earnings Per Share (TTM)" },
      { metric: "Book Value", value: 110, description: "Book Value Per Share" },
    ],
    technicalIndicators: [
      { name: "RSI (14)", value: 38, interpretation: "Bearish", chartData: generateMockChartData(38), chartColor: "var(--chart-1)" },
      { name: "MACD", value: "Bearish Crossover", interpretation: "Bearish", chartData: generateMockChartData(-0.1, true), chartColor: "var(--chart-2)" },
      { name: "Volume", value: "30,000", chartData: generateMockVolumeData(20000, 40000), chartColor: "var(--chart-4)", interpretation: "Avg" }
    ],
    news: [
      { id: "1", title: "API Power Announces Right Shares", source: "Mero Lagani", date: "2024-04-01", url: "#", summary: "Api Power Company has proposed a new issuance of right shares to fund its upcoming projects." },
    ],
  },
  "CIT": {
    symbol: "CIT",
    name: "Citizen Investment Trust",
    lastPrice: 2200,
    change: 15,
    changePercent: 0.69,
    marketCap: "25B NPR",
    volume: "5,000",
    fundamentalData: [
      { metric: "P/E Ratio", value: 20, description: "Price-to-Earnings Ratio" },
      { metric: "EPS", value: 110, description: "Earnings Per Share (TTM)" },
      { metric: "Book Value", value: 700, description: "Book Value Per Share" },
    ],
    technicalIndicators: [
      { name: "RSI (14)", value: 55, interpretation: "Neutral", chartData: generateMockChartData(55), chartColor: "var(--chart-1)" },
      { name: "SMA (50)", value: 2150, chartData: generateMockChartData(2150), chartColor: "var(--chart-3)" },
      { name: "Volume", value: "5,000", chartData: generateMockVolumeData(3000, 7000), chartColor: "var(--chart-4)", interpretation: "Low" }
    ],
    news: [
      { id: "1", title: "CIT Declares Dividend", source: "Nepali Paisa", date: "2024-02-20", url: "#", summary: "Citizen Investment Trust has announced a cash dividend and bonus shares for its shareholders from the profits of the last fiscal year." },
    ],
  }
};

function generateMockChartData(baseValue: number, isMACD: boolean = false, points: number = 30): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - points);

  for (let i = 0; i < points; i++) {
    currentDate.setDate(currentDate.getDate() + 1);
    let value;
    if (isMACD) {
      value = baseValue + (Math.random() - 0.5) * (baseValue * 0.5); 
    } else {
      value = baseValue + (Math.random() - 0.5) * (baseValue * 0.1); 
      value = Math.max(0, value); 
    }
    data.push({
      date: currentDate.toISOString().split('T')[0],
      value: parseFloat(value.toFixed(2)),
    });
  }
  return data;
}

function generateMockVolumeData(minVol: number = 10000, maxVol: number = 100000, points: number = 30): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - points);
  for (let i = 0; i < points; i++) {
    currentDate.setDate(currentDate.getDate() + 1);
    const value = Math.floor(Math.random() * (maxVol - minVol + 1)) + minVol;
    data.push({
      date: currentDate.toISOString().split('T')[0],
      value: value,
    });
  }
  return data;
}


export async function fetchStockDetailsAction(symbol: NepseStockSymbol): Promise<StockDetails | null> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const stock = mockStockDatabase[symbol.toUpperCase() as NepseStockSymbol];
  if (stock) {
    return stock;
  }
  return null;
}

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

// Mock Broker Data
const mockBrokerProcessedStocksData: Record<string, ProcessedStockInfo[]> = {
  "B58": [ // Imperial Securities Co. Pvt. Ltd.
    { symbol: "NABIL", companyName: "Nabil Bank Limited", lastProcessedDate: "2024-07-29", volumeTraded: 1500, transactionType: "Buy" },
    { symbol: "HDL", companyName: "Himalayan Distillery Limited", lastProcessedDate: "2024-07-28", volumeTraded: 750, transactionType: "Sell" },
    { symbol: "UPPER", companyName: "Upper Tamakoshi Hydropower Ltd.", lastProcessedDate: "2024-07-29", volumeTraded: 2200, transactionType: "Buy" },
  ],
  "B45": [ // Naasa Securities Co. Ltd.
    { symbol: "API", companyName: "Api Power Company Ltd.", lastProcessedDate: "2024-07-27", volumeTraded: 3000, transactionType: "Match" },
    { symbol: "CIT", companyName: "Citizen Investment Trust", lastProcessedDate: "2024-07-29", volumeTraded: 500, transactionType: "Buy" },
    { symbol: "NABIL", companyName: "Nabil Bank Limited", lastProcessedDate: "2024-07-26", volumeTraded: 1200, transactionType: "Sell" },
  ],
  "B10": [ // Pragyan Securities Pvt. Ltd.
    { symbol: "HDL", companyName: "Himalayan Distillery Limited", lastProcessedDate: "2024-07-29", volumeTraded: 900, transactionType: "Buy" },
    { symbol: "UPPER", companyName: "Upper Tamakoshi Hydropower Ltd.", lastProcessedDate: "2024-07-25", volumeTraded: 1800, transactionType: "Sell" },
  ],
  // Add more mock data for other brokers if needed
};

// Action to fetch all brokers
export async function fetchAllBrokersAction(): Promise<BrokerInfo[]> {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  return ALL_BROKERS;
}

// Action to fetch stocks processed by a specific broker
export async function fetchStocksByBrokerAction(brokerId: string): Promise<ProcessedStockInfo[]> {
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
  const stocks = mockBrokerProcessedStocksData[brokerId];
  
  // Simulate some randomness or dynamic data generation
  if (stocks) {
    const transactionTypes: ('Buy' | 'Sell' | 'Match')[] = ['Buy', 'Sell', 'Match'];
    return stocks.map(stock => ({
      ...stock,
      // Randomly change transaction type for demo
      transactionType: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
      // Randomly adjust volume slightly
      volumeTraded: stock.volumeTraded + Math.floor((Math.random() - 0.5) * 200) 
    })).sort((a,b) => new Date(b.lastProcessedDate).getTime() - new Date(a.lastProcessedDate).getTime());
  }
  return []; // Return empty array if broker not found or no stocks
}
