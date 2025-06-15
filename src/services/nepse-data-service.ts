
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
  // FloorSheetTransaction, // Not actively used in current UI functions
  ProcessedStockInfo,
  NepseStockSymbol, 
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
// type FloorSheetTransactionRow = Database['public']['Tables']['floor_sheet_transactions']['Row']; // Not actively used


// Helper to map Supabase row to our Company type
function mapToCompany(row: CompanyRow | null): Company | null {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    ticker_symbol: row.ticker_symbol,
    industry_sector: row.industry_sector, // This uses the manually added `industry_sector` if present.
    industry: row.industry, // This is from the original Supabase schema.
    sector_name: row.sector_name, // This is from the original Supabase schema.
    exchange_listed: row.exchange_listed,
    incorporation_date: row.incorporation_date,
    headquarters_location: row.headquarters_location,
    website_url: row.website_url,
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
    volume: row.volume,
    turnover: row.turnover,
    market_cap: row.market_cap,
    previous_close_price: row.previous_close_price,
    price_change: row.price_change,
    percent_change: row.percent_change,
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
    report_id: row.report_id, 
    company_id: row.company_id,
    report_date: row.report_date,
    fiscal_period: row.fiscal_period as 'quarterly' | 'annual', 
    currency: 'NPR', 
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
    cash_and_equivalents: row.cash_and_equivalents,
    long_term_debt: row.long_term_debt,
    operating_cash_flow: row.operating_cash_flow,
    investing_cash_flow: row.investing_cash_flow,
    financing_cash_flow: row.financing_cash_flow,
    free_cash_flow: row.free_cash_flow,
    source_url: row.source_url,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
    scraped_at: row.scraped_at ?? undefined,
    fiscal_year: row.fiscal_year,
  };
}

// Helper to map Supabase row to our CompanyNewsEvent type
function mapToCompanyNewsEvent(row: NewsEventRow | null): CompanyNewsEvent | null {
  if (!row) return null;
  return {
    id: row.id,
    company_id: row.company_id,
    event_date: row.event_date,
    headline: row.headline,
    source_name: row.source_name,
    summary: row.summary,
    url: row.url,
    event_type: row.event_type as CompanyNewsEvent['event_type'] || 'Other', 
    sentiment_score: row.sentiment_score,
    content: row.content,
    publish_datetime: row.publish_datetime,
    details_json: row.details_json,
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
    ratio_id: row.ratio_id, 
    company_id: row.company_id,
    as_of_date: row.as_of_date,
    report_id: row.report_id,
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
    trade_date: row.trade_date, 
    indicator_name: row.indicator_name,
    value: row.value,
    interpretation: null, 
    parameters: row.parameters,
    created_at: row.created_at ?? undefined,
    // updated_at is not in daily_technical_indicators schema
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
    address: row.address,
    contact_info: row.contact_info,
    is_active: row.is_active ?? undefined,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
    // license_number, website, scraped_at are not in brokers schema
  };
}


/**
 * Fetches comprehensive details for a stock to display on the stock analysis page.
 */
export async function getStockDisplayProfile(symbol: NepseStockSymbol): Promise<StockDisplayProfile | null> {
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

  const { data: marketData, error: marketError } = await supabase
    .from('daily_market_data')
    .select('*')
    .eq('company_id', company.id)
    .order('trade_date', { ascending: false })
    .limit(1)
    .single();
  if (marketError && marketError.code !== 'PGRST116') { // PGRST116 means no rows found, not necessarily an error for optional data
     console.warn(`Supabase warning fetching market data for ${symbol}:`, marketError.message);
  }

  let financialReport: FinancialReport | null = null;
  const { data: annualReport, error: annualReportError } = await supabase
    .from('financial_reports')
    .select('*')
    .eq('company_id', company.id)
    .eq('fiscal_period', 'annual') 
    .order('report_date', { ascending: false })
    .limit(1)
    .single();
  
  if (annualReport) {
    financialReport = mapToFinancialReport(annualReport);
  } else {
    if (annualReportError && annualReportError.code !== 'PGRST116') {
         console.warn(`Supabase warning fetching annual report for ${symbol}:`, annualReportError.message);
    }
    const { data: quarterlyReport, error: quarterlyReportError } = await supabase
      .from('financial_reports')
      .select('*')
      .eq('company_id', company.id)
      .order('report_date', { ascending: false }) // Takes latest if annual not found
      .limit(1)
      .single();
    if (quarterlyReport) {
      financialReport = mapToFinancialReport(quarterlyReport);
    } else if (quarterlyReportError && quarterlyReportError.code !== 'PGRST116') {
        console.warn(`Supabase warning fetching quarterly report for ${symbol}:`, quarterlyReportError.message);
    }
  }
  
  const { data: newsData, error: newsError } = await supabase
    .from('news_and_events')
    .select('*')
    .eq('company_id', company.id)
    .order('event_date', { ascending: false })
    .limit(5);
  if (newsError) console.warn(`Supabase warning fetching news for ${symbol}:`, newsError.message);
  const recentNews = newsData?.map(mapToCompanyNewsEvent).filter(n => n !== null) as CompanyNewsEvent[] || [];

  const { data: ratiosData, error: ratiosError } = await supabase
    .from('company_ratios')
    .select('*')
    .eq('company_id', company.id)
    .order('as_of_date', { ascending: false })
    .limit(1)
    .single();
  if (ratiosError && ratiosError.code !== 'PGRST116') console.warn(`Supabase warning fetching ratios for ${symbol}:`, ratiosError.message);

  const { data: techIndicatorsData, error: techIndicatorsError } = await supabase
    .from('daily_technical_indicators')
    .select('*')
    .eq('company_id', company.id)
    .order('trade_date', { ascending: false })
    .limit(10); 
  
  if (techIndicatorsError) console.warn(`Supabase warning fetching tech indicators for ${symbol}:`, techIndicatorsError.message);
  
  const distinctIndicators: CompanyTechnicalIndicator[] = [];
  if (techIndicatorsData) {
    const seenIndicators = new Set<string>();
    for (const row of techIndicatorsData) {
      const indicator = mapToCompanyTechnicalIndicator(row);
      if (indicator && !seenIndicators.has(indicator.indicator_name)) {
        distinctIndicators.push(indicator);
        seenIndicators.add(indicator.indicator_name);
      }
      if (distinctIndicators.length >= 5) break; 
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


export async function getAllCompaniesForSearch(): Promise<Pick<Company, 'id' | 'ticker_symbol' | 'name'>[]> {
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

export async function getAllBrokers(): Promise<Broker[]> {
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

export async function getStocksByBroker(brokerId: string): Promise<ProcessedStockInfo[]> { // brokerId is now the UUID
  const { data: transactions, error: transactionsError } = await supabase
    .from('floor_sheet_transactions')
    .select('stock_symbol, trade_date, quantity, buyer_broker_id, seller_broker_id, companies (name)') // Join to get company name
    .or(`buyer_broker_id.eq.${brokerId},seller_broker_id.eq.${brokerId}`)
    .order('trade_date', { ascending: false })
    .limit(100); 

  if (transactionsError) {
    console.error(`Supabase error fetching transactions for broker ID ${brokerId}:`, transactionsError.message);
    return [];
  }
  if (!transactions || transactions.length === 0) {
    return [];
  }
  
  const processedMap = new Map<string, ProcessedStockInfo>();
  
  for (const t of transactions) {
    const symbol = t.stock_symbol as NepseStockSymbol;
    // Access company name via the join: (t.companies as {name: string} | null)?.name
    const companyName = (t.companies as { name: string } | null)?.name || symbol; 


    let transactionType: ProcessedStockInfo['transactionType'];
    if (t.buyer_broker_id === brokerId && t.seller_broker_id === brokerId) {
      transactionType = 'Match'; 
    } else if (t.buyer_broker_id === brokerId) {
      transactionType = 'Buy';
    } else if (t.seller_broker_id === brokerId) {
      transactionType = 'Sell';
    } else {
      continue; 
    }
    
    const key = `${symbol}-${transactionType}`;

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


// --- Legacy getStockDetails - Kept for reference, but not actively used ---
// export async function getStockDetails(symbol: NepseStockSymbol): Promise<any | null> {
//   // console.warn(`Service: Legacy getStockDetails called for ${symbol}. This function is deprecated and uses mock data. Use getStockDisplayProfile instead.`);
  
//   const profile = await getStockDisplayProfile(symbol);
//   if (!profile || !profile.company) return null; // Added null check for profile.company

//   return {
//      symbol: profile.company.ticker_symbol,
//      name: profile.company.name,
//      lastPrice: profile.latestMarketData?.close_price,
//      change: profile.latestMarketData?.price_change,
//      changePercent: profile.latestMarketData?.percent_change, // Corrected from price_change_percent
//      marketCap: profile.latestMarketData?.market_cap?.toString(), // Corrected from market_capitalization
//      volume: profile.latestMarketData?.volume?.toString(), // Corrected from volume_traded
//      fundamentalData: [
//        { metric: "P/E Ratio", value: profile.ratios?.pe_ratio ?? "N/A", description: "Price-to-Earnings Ratio" },
//        { metric: "EPS", value: profile.latestFinancialReport?.eps ?? "N/A", description: "Earnings Per Share" },
//      ],
//      technicalIndicators: profile.technicalIndicators?.map(ti => ({
//          name: ti.indicator_name,
//          value: ti.value ?? "N/A",
//          interpretation: ti.interpretation ?? undefined,
//          // chartData: [] 
//      })) || [],
//      news: profile.recentNews?.map(n => ({
//          id: n.id,
//          title: n.headline, // Using headline from CompanyNewsEvent
//          source: n.source_name ?? "Unknown", // Using source_name
//          date: n.event_date,
//          summary: n.summary ?? "",
//          url: n.url ?? "#"
//      })) || []
//    };
// }
