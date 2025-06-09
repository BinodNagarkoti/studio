
// src/services/nepse-data-service.ts
import type {
  Company,
  DailyMarketData,
  FinancialReport,
  CompanyNewsEvent,
  CompanyRatio,
  CompanyTechnicalIndicator,
  StockDisplayProfile,
  Broker,
  FloorSheetTransaction,
  ProcessedStockInfo, // Kept for broker tab functionality
  NepseStockSymbol // Kept for form, to be replaced later
} from '@/types';
import { ALL_BROKERS as MOCK_BROKERS_FROM_CONSTANTS, ALL_NEPSE_SYMBOLS as MOCK_SYMBOLS_FROM_CONSTANTS } from '@/lib/constants';
import { supabase } from '@/lib/supabaseClient';

// --- Helper function to generate mock chart data (can be removed once real data is used) ---
function generateMockChartData(baseValue: number, points: number = 30): any[] {
  const data: any[] = [];
  let currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - points);
  for (let i = 0; i < points; i++) {
    currentDate.setDate(currentDate.getDate() + 1);
    const value = baseValue + (Math.random() - 0.5) * (baseValue * 0.1);
    data.push({
      date: currentDate.toISOString().split('T')[0],
      value: parseFloat(value.toFixed(2)),
    });
  }
  return data;
}
// --- End of Mock Data Helpers ---

// --- Service Functions ---

/**
 * Fetches comprehensive details for a stock to display on the stock analysis page.
 * This will involve querying multiple tables and aggregating data.
 */
export async function getStockDisplayProfile(symbol: NepseStockSymbol): Promise<StockDisplayProfile | null> {
  console.log(`Service: Fetching display profile for ${symbol}`);
  
  // TODO: Implement Supabase query to fetch and aggregate data for StockDisplayProfile
  // This will involve multiple queries or a complex join:
  // 1. Fetch company details from 'companies' table by ticker_symbol.
  // 2. Fetch latest market data from 'daily_market_data'.
  // 3. Fetch latest financial report summary from 'financial_reports'.
  // 4. Fetch recent news from 'company_news_events'.
  // 5. Fetch latest ratios from 'company_ratios'.
  // 6. Fetch key technical indicators from 'company_technical_indicators'.

  /* Example structure for fetching company info:
  const { data: companyData, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('ticker_symbol', symbol.toUpperCase())
    .single();

  if (companyError) {
    console.error('Supabase error fetching company:', companyError);
    return null;
  }
  if (!companyData) return null;
  
  // ... then fetch other related data using companyData.id ...
  */

  // Returning mock data structure for now to keep UI working
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

  // Find a mock company (this part is highly simplified and needs to be replaced)
   const mockCompany: Company | undefined = MOCK_SYMBOLS_FROM_CONSTANTS.includes(symbol) ? {
      id: symbol + '_id',
      ticker_symbol: symbol,
      name: `${symbol} Company Ltd. (Mock)`,
      industry_sector: 'Mock Sector',
      exchange: 'NEPSE',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      scraped_at: new Date().toISOString(),
   } : undefined;

  if (!mockCompany) return null;

  return {
    company: mockCompany,
    latestMarketData: {
      id: 'market_data_id_mock',
      company_id: mockCompany.id,
      trade_date: new Date().toISOString().split('T')[0],
      open_price: Math.random() * 1000,
      high_price: Math.random() * 1000 + 50,
      low_price: Math.random() * 1000 - 50,
      close_price: Math.random() * 1000,
      volume_traded: Math.floor(Math.random() * 100000),
      market_capitalization: Math.random() * 1e12,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(), scraped_at: new Date().toISOString()
    },
    latestFinancialReport: {
      id: 'fr_id_mock',
      company_id: mockCompany.id,
      report_date: '2023-12-31',
      period_type: 'annual',
      currency: 'NPR',
      revenue: Math.random() * 1e9,
      net_income: Math.random() * 1e8,
      eps: Math.random() * 50,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(), scraped_at: new Date().toISOString()
    },
    recentNews: [
      { id: 'news1_mock', company_id: mockCompany.id, event_date: '2024-07-01', title: 'Mock News Title 1 for ' + symbol, summary: 'This is a mock summary.', category: 'Other', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), scraped_at: new Date().toISOString() },
    ],
    ratios: {
      id: 'ratio1_mock', company_id: mockCompany.id, report_date: '2023-12-31', pe_ratio: Math.random()*20, pb_ratio: Math.random()*2, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), scraped_at: new Date().toISOString()
    },
    technicalIndicators: [
      { id: 'tech1_mock', company_id: mockCompany.id, indicator_date: new Date().toISOString().split('T')[0], indicator_name: 'RSI_14', value: Math.random()*100, interpretation: 'Neutral', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), scraped_at: new Date().toISOString() },
      { id: 'tech2_mock', company_id: mockCompany.id, indicator_date: new Date().toISOString().split('T')[0], indicator_name: 'SMA_50', value: Math.random()*1000, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), scraped_at: new Date().toISOString() },
    ]
  };
}


/**
 * Fetches a list of all companies for selection UI.
 * Eventually, this should fetch from the 'companies' table.
 */
export async function getAllCompaniesForSearch(): Promise<Pick<Company, 'id' | 'ticker_symbol' | 'name'>[]> {
  console.log("Service: Fetching all companies for search");
  // TODO: Implement Supabase query to fetch companies
  /*
  const { data, error } = await supabase
    .from('companies')
    .select('id, ticker_symbol, name')
    .eq('is_active', true)
    .order('ticker_symbol');

  if (error) {
    console.error('Supabase error fetching companies for search:', error);
    return [];
  }
  return data || [];
  */
  await new Promise(resolve => setTimeout(resolve, 200));
  return MOCK_SYMBOLS_FROM_CONSTANTS.map(symbol => ({
    id: symbol + "_id_mock",
    ticker_symbol: symbol,
    name: `${symbol} Company Ltd. (Mock)`
  }));
}

/**
 * Fetches a list of all brokers for selection UI.
 * Eventually, this should fetch from the 'brokers' table.
 */
export async function getAllBrokers(): Promise<Broker[]> {
  console.log("Service: Fetching all brokers");
  // TODO: Implement Supabase query to fetch brokers
  /*
  const { data, error } = await supabase
    .from('brokers')
    .select('*')
    .eq('is_active', true)
    .order('broker_code');

  if (error) {
    console.error('Supabase error fetching brokers:', error);
    return [];
  }
  return data || [];
  */
  await new Promise(resolve => setTimeout(resolve, 200));
   // Using imported MOCK_BROKERS_FROM_CONSTANTS which aligns with old BrokerInfo type
   // This needs to be mapped to the new Broker type if structures differ significantly
   // For now, assume MOCK_BROKERS_FROM_CONSTANTS needs 'id' to be 'broker_code' for example
  return MOCK_BROKERS_FROM_CONSTANTS.map(b => ({
    id: b.id, // This assumes constant's `id` is the broker's primary key
    broker_code: b.code,
    name: b.name,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    scraped_at: new Date().toISOString(),
  }));
}


/**
 * Fetches processed stock information for a given broker.
 * This might involve querying 'floor_sheet_transactions' and aggregating.
 * The current ProcessedStockInfo type might need adjustment.
 */
export async function getStocksByBroker(brokerCode: string): Promise<ProcessedStockInfo[]> {
  console.log(`Service: Fetching stocks for broker code ${brokerCode}`);

  // TODO: Implement Supabase query. This is complex as 'ProcessedStockInfo' is an aggregation.
  // You might need to:
  // 1. Query 'floor_sheet_transactions' for the given broker_code (as buyer or seller).
  // 2. Group by stock_symbol and transaction_type.
  // 3. Aggregate volume and find the latest date.
  // 4. Join with 'companies' table to get company_name.
  /*
  const { data, error } = await supabase.rpc('get_processed_stocks_by_broker', { p_broker_code: brokerCode });

  if (error) {
    console.error('Supabase error fetching stocks by broker:', error);
    return [];
  }
  return data || []; // Assuming the RPC returns data in ProcessedStockInfo format
  */

  await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API delay
  
  // Mocking based on old structure, this needs significant update
  const mockDataForBroker: Record<string, Pick<ProcessedStockInfo, 'symbol'|'companyName'>[]> = {
      "58": [{ symbol: "NABIL", companyName: "Nabil Bank Limited"}, {symbol: "HDL", companyName: "Himalayan Distillery Ltd."}],
      "45": [{ symbol: "API", companyName: "Api Power Company Ltd."}, {symbol: "CIT", companyName: "Citizen Investment Trust"}],
  };

  const selectedBrokerStocks = mockDataForBroker[brokerCode] || [];
  if (!selectedBrokerStocks.length) return [];

  const transactionTypes: ('Buy' | 'Sell' | 'Match')[] = ['Buy', 'Sell', 'Match'];
  
  return selectedBrokerStocks.map(stock => ({
    symbol: stock.symbol as NepseStockSymbol, // Casting for now
    companyName: stock.companyName,
    lastProcessedDate: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    volumeTraded: Math.floor(Math.random() * 5000) + 500,
    transactionType: transactionTypes[Math.floor(Math.random() * transactionTypes.length)],
  })).sort((a,b) => new Date(b.lastProcessedDate).getTime() - new Date(a.lastProcessedDate).getTime());
}


// --- Legacy getStockDetails - to be removed or fully refactored to getStockDisplayProfile ---
// Keeping a simplified version for now if any part of the app still uses StockDetails directly
export async function getStockDetails(symbol: NepseStockSymbol): Promise<any | null> {
  console.warn(`Service: Legacy getStockDetails called for ${symbol}. Prefer getStockDisplayProfile.`);
  
  // This should ideally call getStockDisplayProfile and then map to the old StockDetails format
  // For now, returning a very simplified mock
  const profile = await getStockDisplayProfile(symbol);
  if (!profile) return null;

  // Map profile to old StockDetails structure (highly simplified)
  return {
    symbol: profile.company.ticker_symbol,
    name: profile.company.name,
    lastPrice: profile.latestMarketData?.close_price,
    change: profile.latestMarketData?.price_change,
    changePercent: profile.latestMarketData?.price_change_percent,
    marketCap: profile.latestMarketData?.market_capitalization?.toString(),
    volume: profile.latestMarketData?.volume_traded?.toString(),
    fundamentalData: [
      { metric: "P/E Ratio", value: profile.ratios?.pe_ratio ?? "N/A" },
      { metric: "EPS", value: profile.latestFinancialReport?.eps ?? "N/A" },
    ],
    technicalIndicators: profile.technicalIndicators?.map(ti => ({
        name: ti.indicator_name,
        value: ti.value ?? "N/A",
        interpretation: ti.interpretation ?? undefined,
        chartData: generateMockChartData(ti.value ?? 50) // Mock chart data
    })) || [],
    news: profile.recentNews?.map(n => ({
        id: n.id,
        title: n.title,
        source: n.source ?? "Unknown",
        date: n.event_date,
        summary: n.summary ?? "",
        url: n.url ?? "#"
    })) || []
  };
}
