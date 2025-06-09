
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';

type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
type DailyMarketDataInsert = Database['public']['Tables']['daily_market_data']['Insert'];

// Define an interface for the shape of data scraped from NEPSE for 'today-price'
interface NepseTodayPriceScrapedRow {
  s_n: string;
  companySymbol: string; // This is the Ticker Symbol
  ltp: string; // Last Traded Price
  changePercent: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  qtyTraded: string; // Quantity Traded
  turnover: string;
  prevClosing: string;
  differenceRs: string;
}

// Helper function to parse string to number or null, handling commas
const parseFloatOrNull = (val: string): number | null => {
  if (!val || typeof val !== 'string') return null;
  const cleanedVal = val.replace(/,/g, '');
  const num = parseFloat(cleanedVal);
  return isNaN(num) ? null : num;
};

const parseIntOrNull = (val: string): number | null => {
  if (!val || typeof val !== 'string') return null;
  const cleanedVal = val.replace(/,/g, '');
  const num = parseInt(cleanedVal, 10);
  return isNaN(num) ? null : num;
};


export async function GET() {
  const NEPSE_TODAY_PRICE_URL = 'https://nepalstock.com.np/today-price';
  const scrapedRawData: NepseTodayPriceScrapedRow[] = [];
  let fetchError: string | null = null;
  let companiesUpsertedCount = 0;
  let marketDataUpsertedCount = 0;
  let companiesFailedCount = 0;
  let marketDataFailedCount = 0;
  const errors: string[] = [];

  try {
    const response = await fetch(NEPSE_TODAY_PRICE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      cache: 'no-store' // Changed from next: { revalidate: 300 } to ensure fresh fetch
    });

    if (!response.ok) {
      fetchError = `Failed to fetch page: ${response.status} ${response.statusText}`;
      console.error(fetchError);
      const responseText = await response.text().catch(() => 'Could not read response text.');
      return NextResponse.json({ error: fetchError, details: responseText }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const tableRows = $('.table-responsive table tbody tr');

    if (tableRows.length === 0) {
      const warningMsg = "No data rows found on the page. The table selector might be incorrect or the page structure has changed.";
      console.warn(warningMsg);
      return NextResponse.json({ warning: warningMsg, source: NEPSE_TODAY_PRICE_URL }, { status: 200 });
    }

    tableRows.each((index, element) => {
      const columns = $(element).find('td');
      if (columns.length >= 10) { 
        const rowData: NepseTodayPriceScrapedRow = {
          s_n: $(columns[0]).text().trim(),
          companySymbol: $(columns[1]).find('a').text().trim() || $(columns[1]).text().trim(),
          ltp: $(columns[2]).text().trim(),
          changePercent: $(columns[3]).text().trim(),
          openPrice: $(columns[4]).text().trim(),
          highPrice: $(columns[5]).text().trim(),
          lowPrice: $(columns[6]).text().trim(),
          qtyTraded: $(columns[7]).text().trim(),
          turnover: $(columns[8]).text().trim(),
          prevClosing: $(columns[9]).text().trim(),
          differenceRs: $(columns[10]).text().trim(),
        };
        if (rowData.companySymbol) {
          scrapedRawData.push(rowData);
        }
      } else {
        console.warn(`Skipping row ${index + 1} due to insufficient columns: ${columns.length}`);
      }
    });

  } catch (error: any) {
    let detailedErrorMessage = `Error during page fetch or initial parsing: ${error.message}`;
    if (error.cause) {
      // Attempt to stringify error.cause, but handle potential circular references or complex objects
      try {
        detailedErrorMessage += ` | Cause: ${JSON.stringify(error.cause)}`;
      } catch (stringifyError) {
        detailedErrorMessage += ` | Cause: (Could not stringify error.cause: ${stringifyError.message})`;
      }
    }
    fetchError = detailedErrorMessage;
    console.error(fetchError, error, error.cause); // Log the cause too
    return NextResponse.json({ 
      error: fetchError, 
      details: error.stack, 
      cause: error.cause ? String(error.cause) : undefined // Send string representation of cause
    }, { status: 500 });
  }

  if (scrapedRawData.length > 0) {
    const recordsToUpsert: DailyMarketDataInsert[] = [];
    const tradeDate = new Date().toISOString().split('T')[0]; 

    for (const item of scrapedRawData) {
      try {
        let companyId: string | undefined;
        const { data: existingCompany, error: companySelectError } = await supabase
          .from('companies')
          .select('id')
          .eq('ticker_symbol', item.companySymbol.toUpperCase())
          .single();

        if (companySelectError && companySelectError.code !== 'PGRST116') { 
          const errMsg = `Supabase error fetching company ID for ${item.companySymbol}: ${companySelectError.message}`;
          console.error(errMsg);
          errors.push(errMsg);
          companiesFailedCount++;
          continue; 
        }

        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          console.log(`Company ${item.companySymbol} not found. Creating new entry...`);
          const newCompanyData: CompanyInsert = {
            ticker_symbol: item.companySymbol.toUpperCase(),
            name: `[${item.companySymbol}] New Company (Update Name)`, 
            is_active: true,
            scraped_at: new Date().toISOString(),
          };
          const { data: newCompany, error: companyInsertError } = await supabase
            .from('companies')
            .insert(newCompanyData)
            .select('id')
            .single();

          if (companyInsertError) {
            const errMsg = `Supabase error creating new company ${item.companySymbol}: ${companyInsertError.message}`;
            console.error(errMsg);
            errors.push(errMsg);
            companiesFailedCount++;
            continue; 
          }
          if (newCompany) {
            companyId = newCompany.id;
            companiesUpsertedCount++;
            console.log(`Created new company ${item.companySymbol} with ID ${companyId}`);
          } else {
            const errMsg = `Failed to create or retrieve ID for new company ${item.companySymbol}.`;
            console.error(errMsg);
            errors.push(errMsg);
            companiesFailedCount++;
            continue;
          }
        }

        if (!companyId) {
          const errMsg = `Could not determine company_id for symbol: ${item.companySymbol}. Skipping this record.`;
          console.warn(errMsg);
          errors.push(errMsg);
          marketDataFailedCount++;
          continue;
        }

        const marketDataRecord: DailyMarketDataInsert = {
          company_id: companyId,
          trade_date: tradeDate,
          open_price: parseFloatOrNull(item.openPrice),
          high_price: parseFloatOrNull(item.highPrice),
          low_price: parseFloatOrNull(item.lowPrice),
          close_price: parseFloatOrNull(item.ltp), 
          volume: parseIntOrNull(item.qtyTraded),
          turnover: parseFloatOrNull(item.turnover),
          previous_close_price: parseFloatOrNull(item.prevClosing),
          price_change: parseFloatOrNull(item.differenceRs),
          percent_change: parseFloatOrNull(item.changePercent.replace(/[\s%]+/g, '')),
          scraped_at: new Date().toISOString(),
        };
        recordsToUpsert.push(marketDataRecord);

      } catch (loopError: any) {
        const errMsg = `Error processing item ${item.companySymbol}: ${loopError.message}`;
        console.error(errMsg, loopError);
        errors.push(errMsg);
        marketDataFailedCount++;
      }
    }

    if (recordsToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('daily_market_data')
        .upsert(recordsToUpsert, { onConflict: 'company_id, trade_date', ignoreDuplicates: false });

      if (upsertError) {
        const errMsg = `Supabase daily_market_data upsert error: ${upsertError.message}`;
        console.error(errMsg, upsertError.details);
        errors.push(errMsg);
        marketDataFailedCount += recordsToUpsert.length; 
      } else {
        marketDataUpsertedCount = recordsToUpsert.length - marketDataFailedCount;
        console.log(`Successfully attempted to upsert ${recordsToUpsert.length} market data records.`);
      }
    }
  }

  const totalOperations = scrapedRawData.length + companiesUpsertedCount;
  const totalFailures = companiesFailedCount + marketDataFailedCount;

  const summaryMessage = `Scraping finished. Raw entries: ${scrapedRawData.length}. Companies created/updated: ${companiesUpsertedCount}. Market data entries processed: ${marketDataUpsertedCount + marketDataFailedCount}.`;
  const status = totalFailures > 0 && totalFailures === (marketDataFailedCount + companiesFailedCount) && scrapedRawData.length > 0 ? 500 : totalFailures > 0 ? 207 : 200; 

  return NextResponse.json({
    message: summaryMessage,
    source: NEPSE_TODAY_PRICE_URL,
    counts: {
      rawDataEntries: scrapedRawData.length,
      companiesFoundOrCreated: scrapedRawData.length - companiesFailedCount,
      companiesNewlyCreated: companiesUpsertedCount,
      marketDataUpserted: marketDataUpsertedCount,
      companiesFailed: companiesFailedCount,
      marketDataFailed: marketDataFailedCount,
    },
    errors: errors.length > 0 ? errors : undefined,
    fetchError: fetchError, // Also include the initial fetchError if it occurred
  }, { status });
}
