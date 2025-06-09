
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
  ProcessedStockInfo,
  NepseStockSymbol, // Kept for form, to be replaced later by dynamic company data
} from '@/types';
import type { Database } from '@/types/supabase'; // Import generated Supabase types
import { supabase } from '@/lib/supabaseClient';

type CompanyRow = Database['public']['Tables']['companies']['Row'];
type DailyMarketDataRow = Database['public']['Tables']['daily_market_data']['Row'];
type FinancialReportRow = Database['public']['Tables']['financial_reports']['Row'];
type NewsEventRow = Database['public']['Tables']['news_and_events']['Row'];
type CompanyRatioRow = Database['public']['Tables']['company_ratios']['Row'];
type TechnicalIndicatorRow = Database['public']['Tables']['daily_technical_indicators']['Row'];
type BrokerRow = Database['public']['Tables']['brokers']['Row'];
type FloorSheetTransactionRow = Database['public']['Tables']['floor_sheet_transactions']['Row'];


// Helper to map Supabase row to our Company type
function mapToCompany(row: CompanyRow | null): Company | null {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    ticker_symbol: row.ticker_symbol,
    industry_sector: row.industry_sector,
    exchange: row.exchange_listed,
    incorporation_date: row.incorporation_date,
    headquarters_location: row.headquarters_location,
    website: row.website_url,
    description: row.description,
    is_active: row.is_active ?? undefined,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
    scraped_at: row.scraped_at ?? undefined,
  };
}

// Helper to map Supabase row to our DailyMarketData type
function mapToDailyMarketData(row: DailyMarketDataRow | null): DailyMarketData | null {
  if (!row) return null;
  return {
    id: row.id,
    company_id: row.company_id,
    trade_date: row.trade_date,
    open_price: row.open_price,
    high_price: row.high_price,
    low_price: row.low_price,
    close_price: row.close_price,
    adjusted_close_price: row.adjusted_close_price,
    volume_traded: row.volume,
    turnover: row.turnover,
    market_capitalization: row.market_cap,
    previous_close_price: row.previous_close_price,
    price_change: row.price_change,
    price_change_percent: row.percent_change,
    fifty_two_week_high: row.fifty_two_week_high,
    fifty_two_week_low: row.fifty_two_week_low,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
    scraped_at: row.scraped_at ?? undefined,
  };
}

// Helper to map Supabase row to our FinancialReport type
function mapToFinancialReport(row: FinancialReportRow | null): FinancialReport | null {
  if (!row) return null;
  return {
    id: row.report_id, // Assuming report_id is the primary key for FinancialReport type
    company_id: row.company_id,
    report_date: row.report_date,
    period_type: row.fiscal_period as 'quarterly' | 'annual', // Ensure fiscal_period matches
    currency: 'NPR', // Assuming NPR, adjust if schema has currency
    revenue: row.revenue,
    net_income: row.net_income,
    gross_profit: row.gross_profit,
    operating_income: row.operating_income,
    eps: row.eps,
    dps: row.dps,
    total_assets: row.total_assets,
    total_liabilities: row.total_liabilities,
    shareholders_equity: row.shareholders_equity,
    current_assets: row.current_assets,
    current_liabilities: row.current_liabilities,
    cash_and_cash_equivalents: row.cash_and_equivalents,
    long_term_debt: row.long_term_debt,
    operating_cash_flow: row.operating_cash_flow,
    investing_cash_flow: row.investing_cash_flow,
    financing_cash_flow: row.financing_cash_flow,
    free_cash_flow: row.free_cash_flow,
    outstanding_shares: null, // This was not in financial_reports table, might be in company_ownership_governance
    source_url: row.source_url,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
    scraped_at: row.scraped_at ?? undefined,
  };
}

// Helper to map Supabase row to our CompanyNewsEvent type
function mapToCompanyNewsEvent(row: NewsEventRow | null): CompanyNewsEvent | null {
  if (!row) return null;
  return {
    id: row.id,
    company_id: row.company_id,
    event_date: row.event_date,
    title: row.headline,
    source: row.source_name,
    summary: row.summary,
    url: row.url,
    category: row.event_type as CompanyNewsEvent['category'] || 'Other', // Cast or map event_type
    sentiment: row.sentiment_score !== null ? (row.sentiment_score > 0 ? 'Positive' : row.sentiment_score < 0 ? 'Negative' : 'Neutral') : null,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
    scraped_at: row.scraped_at ?? undefined,
  };
}

// Helper to map Supabase row to our CompanyRatio type
function mapToCompanyRatio(row: CompanyRatioRow | null): CompanyRatio | null {
  if (!row) return null;
  return {
    id: row.ratio_id, // Assuming ratio_id is the primary key for CompanyRatio type
    company_id: row.company_id,
    report_date: row.as_of_date, // Use as_of_date
    pe_ratio: row.pe_ratio,
    pb_ratio: row.pb_ratio,
    ps_ratio: row.ps_ratio,
    dividend_yield: row.dividend_yield,
    roe: row.roe,
    roa: row.roa,
    net_profit_margin: row.net_profit_margin,
    current_ratio: row.current_ratio,
    quick_ratio: row.quick_ratio,
    debt_to_equity_ratio: row.debt_to_equity_ratio,
    interest_coverage_ratio: row.interest_coverage_ratio,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
    scraped_at: row.scraped_at ?? undefined,
  };
}

// Helper to map Supabase row to our CompanyTechnicalIndicator type
function mapToCompanyTechnicalIndicator(row: TechnicalIndicatorRow | null): CompanyTechnicalIndicator | null {
  if (!row) return null;
  return {
    id: row.id,
    company_id: row.company_id,
    indicator_date: row.trade_date, // Assuming trade_date is the relevant date
    indicator_name: row.indicator_name,
    value: row.value,
    interpretation: null, // Supabase schema for daily_technical_indicators doesn't have interpretation. This needs to be derived or added.
    created_at: row.created_at ?? undefined,
    updated_at: null, // daily_technical_indicators doesn't have updated_at
    scraped_at: row.scraped_at ?? undefined,
  };
}

// Helper to map Supabase row to our Broker type
function mapToBroker(row: BrokerRow | null): Broker | null {
  if (!row) return null;
  return {
    id: row.id,
    broker_code: row.broker_code,
    name: row.name,
    license_number: null, // Schema doesn't have license_number
    address: row.address,
    contact_info: row.contact_info,
    website: null, // Schema doesn't have website for brokers
    is_active: row.is_active ?? undefined,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
    scraped_at: null, // Schema doesn't have scraped_at for brokers
  };
}


/**
 * Fetches comprehensive details for a stock to display on the stock analysis page.
 */
export async function getStockDisplayProfile(symbol: NepseStockSymbol): Promise<StockDisplayProfile | null> {
  console.log(`Service: Attempting to fetch display profile for ${symbol} from Supabase`);

  const { data: companyData, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('ticker_symbol', symbol.toUpperCase())
    .single();

  if (companyError || !companyData) {
    console.error(`Supabase error fetching company ${symbol}:`, companyError?.message);
    return null;
  }
  const company = mapToCompany(companyData);
  if (!company) return null;

  // Fetch latest market data
  const { data: marketData, error: marketError } = await supabase
    .from('daily_market_data')
    .select('*')
    .eq('company_id', company.id)
    .order('trade_date', { ascending: false })
    .limit(1)
    .single();
  if (marketError) console.warn(`Supabase warning fetching market data for ${symbol}:`, marketError.message);

  // Fetch latest financial report (try annual, then quarterly)
  let financialReport: FinancialReport | null = null;
  const { data: annualReport, error: annualReportError } = await supabase
    .from('financial_reports')
    .select('*')
    .eq('company_id', company.id)
    .eq('fiscal_period', 'annual') // Prefer annual
    .order('report_date', { ascending: false })
    .limit(1)
    .single();
  
  if (annualReport) {
    financialReport = mapToFinancialReport(annualReport);
  } else {
    if (annualReportError && annualReportError.code !== 'PGRST116') { // PGRST116: no rows found
         console.warn(`Supabase warning fetching annual report for ${symbol}:`, annualReportError.message);
    }
    const { data: quarterlyReport, error: quarterlyReportError } = await supabase
      .from('financial_reports')
      .select('*')
      .eq('company_id', company.id)
      .order('report_date', { ascending: false })
      .limit(1)
      .single();
    if (quarterlyReport) {
      financialReport = mapToFinancialReport(quarterlyReport);
    } else if (quarterlyReportError && quarterlyReportError.code !== 'PGRST116') {
        console.warn(`Supabase warning fetching quarterly report for ${symbol}:`, quarterlyReportError.message);
    }
  }
  
  // Fetch recent news
  const { data: newsData, error: newsError } = await supabase
    .from('news_and_events')
    .select('*')
    .eq('company_id', company.id)
    .order('event_date', { ascending: false })
    .limit(5);
  if (newsError) console.warn(`Supabase warning fetching news for ${symbol}:`, newsError.message);
  const recentNews = newsData?.map(mapToCompanyNewsEvent).filter(n => n !== null) as CompanyNewsEvent[] || [];

  // Fetch latest ratios
  const { data: ratiosData, error: ratiosError } = await supabase
    .from('company_ratios')
    .select('*')
    .eq('company_id', company.id)
    .order('as_of_date', { ascending: false })
    .limit(1)
    .single();
  if (ratiosError && ratiosError.code !== 'PGRST116') console.warn(`Supabase warning fetching ratios for ${symbol}:`, ratiosError.message);

  // Fetch key technical indicators (latest for distinct names)
  // This is a bit simplified; a real scenario might want specific indicators or more history.
  const { data: techIndicatorsData, error: techIndicatorsError } = await supabase
    .from('daily_technical_indicators')
    .select('*')
    .eq('company_id', company.id)
    .order('trade_date', { ascending: false })
    // .distinctOn(['indicator_name']) // distinctOn is not directly supported like this, would need an RPC or more complex query
    .limit(10); // Fetch last 10 indicator records and process client-side for distinctness if needed
  
  if (techIndicatorsError) console.warn(`Supabase warning fetching tech indicators for ${symbol}:`, techIndicatorsError.message);
  
  // Simple client-side distinct for indicators (if multiple entries for same day/indicator exist)
  const distinctIndicators: CompanyTechnicalIndicator[] = [];
  if (techIndicatorsData) {
    const seenIndicators = new Set<string>();
    for (const row of techIndicatorsData) {
      const indicator = mapToCompanyTechnicalIndicator(row);
      if (indicator && !seenIndicators.has(indicator.indicator_name)) {
        distinctIndicators.push(indicator);
        seenIndicators.add(indicator.indicator_name);
      }
      if (distinctIndicators.length >= 5) break; // Limit to 5 distinct indicators for display
    }
  }

  return {
    company: company,
    latestMarketData: mapToDailyMarketData(marketData),
    latestFinancialReport: financialReport,
    recentNews: recentNews,
    ratios: mapToCompanyRatio(ratiosData),
    technicalIndicators: distinctIndicators,
  };
}


/**
 * Fetches a list of all companies for selection UI.
 */
export async function getAllCompaniesForSearch(): Promise<Pick<Company, 'id' | 'ticker_symbol' | 'name'>[]> {
  console.log("Service: Fetching all companies for search from Supabase");
  const { data, error } = await supabase
    .from('companies')
    .select('id, ticker_symbol, name')
    .eq('is_active', true)
    .order('ticker_symbol');

  if (error) {
    console.error('Supabase error fetching companies for search:', error.message);
    return [];
  }
  return data?.map(c => ({ id: c.id, ticker_symbol: c.ticker_symbol, name: c.name })) || [];
}

/**
 * Fetches a list of all brokers for selection UI.
 */
export async function getAllBrokers(): Promise<Broker[]> {
  console.log("Service: Fetching all brokers from Supabase");
  const { data, error } = await supabase
    .from('brokers')
    .select('*')
    .eq('is_active', true)
    .order('broker_code');

  if (error) {
    console.error('Supabase error fetching brokers:', error.message);
    return [];
  }
  return data?.map(mapToBroker).filter(b => b !== null) as Broker[] || [];
}


/**
 * Fetches processed stock information for a given broker code.
 * This is a simplified implementation. A more robust solution might use a database RPC.
 */
export async function getStocksByBroker(brokerCode: string): Promise<ProcessedStockInfo[]> {
  console.log(`Service: Fetching stocks for broker code ${brokerCode} from Supabase`);

  // 1. Find the broker_id for the given brokerCode
  const { data: brokerData, error: brokerError } = await supabase
    .from('brokers')
    .select('id')
    .eq('broker_code', brokerCode)
    .single();

  if (brokerError || !brokerData) {
    console.error(`Supabase error fetching broker ID for code ${brokerCode}:`, brokerError?.message);
    return [];
  }
  const brokerId = brokerData.id;

  // 2. Fetch recent floor sheet transactions involving this broker (as buyer or seller)
  const { data: transactions, error: transactionsError } = await supabase
    .from('floor_sheet_transactions')
    .select('stock_symbol, trade_date, quantity, buyer_broker_id, seller_broker_id')
    .or(`buyer_broker_id.eq.${brokerId},seller_broker_id.eq.${brokerId}`)
    .order('trade_date', { ascending: false })
    .limit(100); // Limit to recent 100 transactions for performance

  if (transactionsError) {
    console.error(`Supabase error fetching transactions for broker ${brokerCode}:`, transactionsError.message);
    return [];
  }
  if (!transactions || transactions.length === 0) {
    return [];
  }

  // 3. Process transactions to get ProcessedStockInfo
  const processedMap = new Map<string, ProcessedStockInfo>();
  const companySymbols = new Set<string>();
  transactions.forEach(t => companySymbols.add(t.stock_symbol));

  // 4. Fetch company names for these symbols
  const { data: companiesData, error: companiesError } = await supabase
    .from('companies')
    .select('ticker_symbol, name')
    .in('ticker_symbol', Array.from(companySymbols));

  if (companiesError) {
    console.error('Supabase error fetching company names for broker stocks:', companiesError.message);
    // Continue without company names if this fails, or handle differently
  }
  const companyNameMap = new Map<string, string>();
  companiesData?.forEach(c => companyNameMap.set(c.ticker_symbol, c.name));
  
  for (const t of transactions) {
    const symbol = t.stock_symbol as NepseStockSymbol; // Assuming symbols are in this enum for now
    const companyName = companyNameMap.get(symbol) || symbol; // Fallback to symbol if name not found

    let transactionType: ProcessedStockInfo['transactionType'];
    if (t.buyer_broker_id === brokerId && t.seller_broker_id === brokerId) {
      transactionType = 'Match'; // Or could be split into Buy and Sell entries
    } else if (t.buyer_broker_id === brokerId) {
      transactionType = 'Buy';
    } else if (t.seller_broker_id === brokerId) {
      transactionType = 'Sell';
    } else {
      continue; // Should not happen based on query
    }
    
    const key = `${symbol}-${transactionType}`; // Group by symbol and type

    if (processedMap.has(key)) {
      const existing = processedMap.get(key)!;
      existing.volumeTraded += t.quantity;
      if (new Date(t.trade_date) > new Date(existing.lastProcessedDate)) {
        existing.lastProcessedDate = t.trade_date;
      }
    } else {
      processedMap.set(key, {
        symbol: symbol,
        companyName: companyName,
        lastProcessedDate: t.trade_date,
        volumeTraded: t.quantity,
        transactionType: transactionType,
      });
    }
  }
  
  return Array.from(processedMap.values()).sort((a,b) => new Date(b.lastProcessedDate).getTime() - new Date(a.lastProcessedDate).getTime());
}


// --- Legacy getStockDetails - to be refactored or removed ---
export async function getStockDetails(symbol: NepseStockSymbol): Promise<any | null> {
  console.warn(`Service: Legacy getStockDetails called for ${symbol}. This function is deprecated and uses mock data. Use getStockDisplayProfile instead.`);
  
  // This function should be removed. For now, return a simple mock structure
  // or call getStockDisplayProfile and transform its output if strictly needed.
  // For this exercise, returning null to encourage migration.
  
  // To keep the app from completely breaking if this is still called somewhere unexpectedly:
   const profile = await getStockDisplayProfile(symbol);
   if (!profile) return null;

   return {
     symbol: profile.company.ticker_symbol,
     name: profile.company.name,
     lastPrice: profile.latestMarketData?.close_price,
     change: profile.latestMarketData?.price_change,
     changePercent: profile.latestMarketData?.price_change_percent,
     marketCap: profile.latestMarketData?.market_capitalization?.toString(),
     volume: profile.latestMarketData?.volume_traded?.toString(),
     fundamentalData: [
       { metric: "P/E Ratio", value: profile.ratios?.pe_ratio ?? "N/A", description: "Price-to-Earnings Ratio" },
       { metric: "EPS", value: profile.latestFinancialReport?.eps ?? "N/A", description: "Earnings Per Share" },
     ],
     technicalIndicators: profile.technicalIndicators?.map(ti => ({
         name: ti.indicator_name,
         value: ti.value ?? "N/A",
         interpretation: ti.interpretation ?? undefined,
         // chartData: [] // No mock chart data generation here anymore
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
