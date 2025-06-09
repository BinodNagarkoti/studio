
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
  let html = '';

  try {
    console.log(`Fetching data from ${NEPSE_TODAY_PRICE_URL}`);
    const response = await fetch(NEPSE_TODAY_PRICE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      cache: 'no-store' // Ensure fresh data is fetched
    });
    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      fetchError = `Failed to fetch page: ${response.status} ${response.statusText}`;
      console.error(fetchError);
      const responseText = await response.text().catch(() => 'Could not read response text.');
      return NextResponse.json({ error: fetchError, details: responseText }, { status: response.status });
    }

    html = await response.text();
    const $ = cheerio.load(html);
    
    const todayPriceElement = $('app-today-price');
    if (todayPriceElement.length === 0) {
      const warningMsg = "The <app-today-price> custom element was not found. The page structure might have changed or the element is not present.";
      console.warn(warningMsg);
      errors.push(warningMsg);
    }

    const tableRows = todayPriceElement.length > 0 
      ? todayPriceElement.find('.table-responsive table tbody tr, table tbody tr')
      : $('.table-responsive table tbody tr, table tbody tr');

    if (tableRows.length === 0) {
      const warningMsg = "No data rows found in the table. Selectors might be incorrect or the page structure has changed.";
      console.warn(warningMsg);
      if (errors.length === 0) errors.push(warningMsg); 
      return NextResponse.json({ 
        warning: warningMsg, 
        source: NEPSE_TODAY_PRICE_URL,
        htmlChecked: html.substring(0, 1000) + "..." // Send a larger snippet for debugging
      }, { status: 200 });
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
    let isCertError = false;

    if (error.cause) {
        const causeString = typeof error.cause.toString === 'function' ? error.cause.toString() : JSON.stringify(error.cause);
        detailedErrorMessage += ` | Cause: ${causeString}`;
        if (causeString.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE') || causeString.includes('unable to verify the first certificate')) {
            isCertError = true;
        }
    }
    
    if (isCertError) {
        detailedErrorMessage += `\n\nThis looks like an SSL/TLS certificate verification issue. Your Node.js environment might not trust the certificate from ${NEPSE_TODAY_PRICE_URL}. For development, you might try setting the environment variable NODE_TLS_REJECT_UNAUTHORIZED=0 before running your server (e.g., 'NODE_TLS_REJECT_UNAUTHORIZED=0 npm run dev'). This is insecure and should NOT be used in production.`;
    }

    fetchError = detailedErrorMessage;
    console.error(fetchError, error.stack);
    
    return NextResponse.json({ 
      error: fetchError, 
      details: error.stack, 
      cause: error.cause ? (typeof error.cause.toString === 'function' ? error.cause.toString() : JSON.stringify(error.cause)) : undefined,
      htmlChecked: html ? html.substring(0, 500) + "..." : "HTML not fetched"
    }, { status: 500 });
  }

  const recordsToUpsert: DailyMarketDataInsert[] = [];
  if (scrapedRawData.length > 0) {
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
      const { error: upsertError, count: upsertedActualCount } = await supabase
        .from('daily_market_data')
        .upsert(recordsToUpsert, { onConflict: 'company_id, trade_date', ignoreDuplicates: false, count: 'exact' });

      if (upsertError) {
        const errMsg = `Supabase daily_market_data upsert error: ${upsertError.message}`;
        console.error(errMsg, upsertError.details);
        errors.push(errMsg);
        marketDataFailedCount += recordsToUpsert.length; // Assume all failed if operation fails
      } else {
        marketDataUpsertedCount = upsertedActualCount ?? recordsToUpsert.length; 
        console.log(`Successfully attempted to upsert ${recordsToUpsert.length} market data records. Actual upserted/updated: ${marketDataUpsertedCount}`);
      }
    }
  }

  const totalFailures = companiesFailedCount + marketDataFailedCount;

  let summaryMessage = `Scraping finished. Raw entries found: ${scrapedRawData.length}.`;
  if (scrapedRawData.length > 0) {
     summaryMessage += ` Companies newly created: ${companiesUpsertedCount}. Market data entries processed for upsert: ${recordsToUpsert.length}. Market data actually upserted/updated: ${marketDataUpsertedCount}.`;
  }
  
  const status = totalFailures > 0 && totalFailures === (companiesFailedCount + (scrapedRawData.length > 0 ? recordsToUpsert.length - marketDataUpsertedCount : 0)) && scrapedRawData.length > 0 ? 500 
               : totalFailures > 0 ? 207 // Multi-Status for partial success
               : 200; // OK

  return NextResponse.json({
    message: summaryMessage,
    source: NEPSE_TODAY_PRICE_URL,
    counts: {
      rawDataEntries: scrapedRawData.length,
      companiesNewlyCreated: companiesUpsertedCount,
      marketDataEntriesForUpsert: recordsToUpsert.length,
      marketDataSuccessfullyUpserted: marketDataUpsertedCount,
      companiesFailedOperations: companiesFailedCount,
      marketDataFailedOperations: marketDataFailedCount,
    },
    errors: errors.length > 0 ? errors : undefined,
    fetchError: fetchError, // The original fetch error, if any
    htmlChecked: fetchError && html ? html.substring(0, 500) + "..." : (scrapedRawData.length === 0 && html ? html.substring(0,1000) + "..." : undefined)
  }, { status });
}
