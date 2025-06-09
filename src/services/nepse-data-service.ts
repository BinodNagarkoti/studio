
// src/services/nepse-data-service.ts
import type { StockDetails, NepseStockSymbol, ChartDataPoint, BrokerInfo, ProcessedStockInfo } from '@/types';
import { ALL_BROKERS } from '@/lib/constants'; // For mock getAllBrokers
import { supabase } from '@/lib/supabaseClient'; // Import Supabase client

// --- Mock Data Section (Will be phased out as Supabase integration progresses) ---
// IMPORTANT: This section will be replaced with Supabase calls.

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

const mockBrokerProcessedStocksData: Record<string, ProcessedStockInfo[]> = {
  "B58": [
    { symbol: "NABIL", companyName: "Nabil Bank Limited", lastProcessedDate: "2024-07-29", volumeTraded: 1500, transactionType: "Buy" },
    { symbol: "HDL", companyName: "Himalayan Distillery Limited", lastProcessedDate: "2024-07-28", volumeTraded: 750, transactionType: "Sell" },
    { symbol: "UPPER", companyName: "Upper Tamakoshi Hydropower Ltd.", lastProcessedDate: "2024-07-29", volumeTraded: 2200, transactionType: "Buy" },
  ],
  "B45": [
    { symbol: "API", companyName: "Api Power Company Ltd.", lastProcessedDate: "2024-07-27", volumeTraded: 3000, transactionType: "Match" },
    { symbol: "CIT", companyName: "Citizen Investment Trust", lastProcessedDate: "2024-07-29", volumeTraded: 500, transactionType: "Buy" },
    { symbol: "NABIL", companyName: "Nabil Bank Limited", lastProcessedDate: "2024-07-26", volumeTraded: 1200, transactionType: "Sell" },
  ],
  "B10": [
    { symbol: "HDL", companyName: "Himalayan Distillery Limited", lastProcessedDate: "2024-07-29", volumeTraded: 900, transactionType: "Buy" },
    { symbol: "UPPER", companyName: "Upper Tamakoshi Hydropower Ltd.", lastProcessedDate: "2024-07-25", volumeTraded: 1800, transactionType: "Sell" },
  ],
  // Add more mock data for other brokers if needed
};
// --- End of Mock Data Section ---


// --- Service Functions ---

export async function getStockDetails(symbol: NepseStockSymbol): Promise<StockDetails | null> {
  // console.log(`Service: Fetching details for ${symbol} (currently mock)`);

  // TODO: Replace mock data with Supabase call
  // Example Supabase Query (assuming you have a 'stocks_details' table):
  /*
  const { data, error } = await supabase
    .from('stocks_details') // Replace 'stocks_details' with your actual table name
    .select(`
      symbol,
      name,
      last_price,
      change,
      change_percent,
      market_cap,
      volume,
      fundamental_data, 
      technical_indicators,
      news
    `) // Adjust columns as per your schema
    .eq('symbol', symbol.toUpperCase())
    .single();

  if (error) {
    console.error('Supabase error fetching stock details:', error);
    return null;
  }
  if (data) {
    // You'll need to transform the data from Supabase to match the StockDetails type
    // This might involve parsing JSONB columns for fundamentalData, technicalIndicators, news
    return {
        symbol: data.symbol,
        name: data.name,
        lastPrice: data.last_price,
        change: data.change,
        changePercent: data.change_percent,
        marketCap: data.market_cap,
        volume: data.volume,
        fundamentalData: data.fundamental_data || [], // Assuming JSONB or similar
        technicalIndicators: data.technical_indicators || [], // Assuming JSONB or similar
        news: data.news || [], // Assuming JSONB or similar
    } as StockDetails; 
  }
  */
  
  // Returning mock data for now
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  const stock = mockStockDatabase[symbol.toUpperCase() as NepseStockSymbol];
  if (stock) {
    return stock;
  }
  return null;
}

export async function getAllBrokers(): Promise<BrokerInfo[]> {
  // console.log("Service: Fetching all brokers (currently mock from constants)");

  // TODO: Replace mock data with Supabase call if brokers are stored in DB
  // Example Supabase Query (assuming you have a 'brokers' table):
  /*
  const { data, error } = await supabase
    .from('brokers') // Replace 'brokers' with your actual table name
    .select('id, name, code'); // Adjust columns as per your schema

  if (error) {
    console.error('Supabase error fetching brokers:', error);
    return [];
  }
  return data || [];
  */

  // Returning mock data for now
  await new Promise(resolve => setTimeout(resolve, 200));
  return ALL_BROKERS; // Using imported ALL_BROKERS from constants.ts for now
}

export async function getStocksByBroker(brokerId: string): Promise<ProcessedStockInfo[]> {
  // console.log(`Service: Fetching stocks for broker ${brokerId} (currently mock)`);

  // TODO: Replace mock data with Supabase call
  // Example Supabase Query (assuming you have a 'broker_processed_stocks' table):
  /*
  const { data, error } = await supabase
    .from('broker_processed_stocks') // Replace 'broker_processed_stocks' with your actual table name
    .select('symbol, company_name, last_processed_date, volume_traded, transaction_type') // Adjust columns
    .eq('broker_id', brokerId)
    .order('last_processed_date', { ascending: false });

  if (error) {
    console.error('Supabase error fetching stocks by broker:', error);
    return [];
  }
  
  if (data) {
      return data.map(item => ({
        symbol: item.symbol,
        companyName: item.company_name,
        lastProcessedDate: item.last_processed_date,
        volumeTraded: item.volume_traded,
        transactionType: item.transaction_type,
      })) as ProcessedStockInfo[];
  }
  return [];
  */

  // Returning mock data for now
  await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API delay
  const stocks = mockBrokerProcessedStocksData[brokerId];

  if (stocks) {
    const transactionTypes: ('Buy' | 'Sell' | 'Match')[] = ['Buy', 'Sell', 'Match'];
    return stocks.map(stock => ({
      ...stock,
      transactionType: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
      volumeTraded: stock.volumeTraded + Math.floor((Math.random() - 0.5) * 200)
    })).sort((a,b) => new Date(b.lastProcessedDate).getTime() - new Date(a.lastProcessedDate).getTime());
  }
  return [];
}

    