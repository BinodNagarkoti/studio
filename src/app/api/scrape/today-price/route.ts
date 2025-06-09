
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
    console.log(`Fetching data from ${NEPSE_TODAY_PRICE_URL}`);
    const response = await fetch(NEPSE_TODAY_PRICE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      cache: 'no-store'
    });
    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      fetchError = `Failed to fetch page: ${response.status} ${response.statusText}`;
      console.error(fetchError);
      const responseText = await response.text().catch(() => 'Could not read response text.');
      return NextResponse.json({ error: fetchError, details: responseText }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Target the app-today-price element first, then find the table within it
    const todayPriceElement = $('app-today-price');
    if (todayPriceElement.length === 0) {
      const warningMsg = "The <app-today-price> custom element was not found. The page structure might have changed or the element is not present.";
      console.warn(warningMsg);
      errors.push(warningMsg);
      // Still try the old selector as a fallback, or decide to fail here.
      // For now, let's proceed with a warning and let the next check handle empty tableRows.
    }

    // Try to find the table within app-today-price, or fallback to a general table selector if app-today-price wasn't found or didn't contain it.
    const tableRows = todayPriceElement.length > 0 
      ? todayPriceElement.find('.table-responsive table tbody tr, table tbody tr') // More flexible selector within app-today-price
      : $('.table-responsive table tbody tr, table tbody tr'); // Fallback to general page search if app-today-price is missing

    if (tableRows.length === 0) {
      const warningMsg = "No data rows found in the table. Selectors might be incorrect or the page structure has changed.";
      console.warn(warningMsg);
      if (errors.length === 0) errors.push(warningMsg); // Add if not already added
      // Depending on requirements, you might want to return an error or just an empty success
      return NextResponse.json({ 
        warning: warningMsg, 
        source: NEPSE_TODAY_PRICE_URL,
        htmlChecked: html.substring(0, 500) + "..." // Send a snippet of HTML for debugging
      }, { status: 200 }); // Success, but with a warning
    }

    tableRows.each((index, element) => {
      const columns = $(element).find('td');
      if (columns.length >= 10) { // Assuming at least 10 columns as per previous structure
        const rowData: NepseTodayPriceScrapedRow = {
          s_n: $(columns[0]).text().trim(),
          companySymbol: $(columns[1]).find('a').text().trim() || $(columns[1]).text().trim(), // Handles if symbol is in an <a> tag
          ltp: $(columns[2]).text().trim(),
          changePercent: $(columns[3]).text().trim(), // This is % change, not point change
          openPrice: $(columns[4]).text().trim(),
          highPrice: $(columns[5]).text().trim(),
          lowPrice: $(columns[6]).text().trim(),
          qtyTraded: $(columns[7]).text().trim(),
          turnover: $(columns[8]).text().trim(),
          prevClosing: $(columns[9]).text().trim(),
          differenceRs: $(columns[10]).text().trim(), // This is point change
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
      try {
        detailedErrorMessage += ` | Cause: ${JSON.stringify(error.cause)}`;
      } catch (stringifyError) {
        detailedErrorMessage += ` | Cause: (Could not stringify error.cause: ${stringifyError.message})`;
      }
    }
    fetchError = detailedErrorMessage;
    console.error(fetchError, error.stack, error.cause);
    return NextResponse.json({ 
      error: fetchError, 
      details: error.stack, 
      cause: error.cause ? String(error.cause) : undefined 
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

        if (companySelectError && companySelectError.code !== 'PGRST116') { // PGRST116: no rows found (expected case)
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
            name: `[${item.companySymbol}] New Company (Update Name)`, // Placeholder name
            is_active: true,
            scraped_at: new Date().toISOString(),
            // Other fields like industry_sector, description, etc., would be null or default
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
          close_price: parseFloatOrNull(item.ltp), // Last Traded Price as close_price
          volume: parseIntOrNull(item.qtyTraded),
          turnover: parseFloatOrNull(item.turnover),
          previous_close_price: parseFloatOrNull(item.prevClosing),
          price_change: parseFloatOrNull(item.differenceRs), // Point change
          percent_change: parseFloatOrNull(item.changePercent.replace(/[\s%]+/g, '')), // Percentage change
          scraped_at: new Date().toISOString(),
          // Fields like adjusted_close_price, market_cap, 52w_high/low are not on this page
          // and would be null or populated by other scrapers/calculations.
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
        // Adjust marketDataFailedCount based on how many actually failed from the batch
        // For simplicity, assuming all might have failed if the upsert operation itself errored.
        // A more granular check would require knowing which specific records failed.
        marketDataFailedCount = recordsToUpsert.length; 
      } else {
        marketDataUpsertedCount = recordsToUpsert.length; // Assuming all upserted successfully if no error
        console.log(`Successfully attempted to upsert ${recordsToUpsert.length} market data records.`);
      }
    }
  }

  const totalOperations = scrapedRawData.length + companiesUpsertedCount; // Simplified, as market data depends on raw data.
  const totalFailures = companiesFailedCount + marketDataFailedCount;

  let summaryMessage = `Scraping finished. Raw entries found: ${scrapedRawData.length}.`;
  if (scrapedRawData.length > 0) {
     summaryMessage += ` Companies created: ${companiesUpsertedCount}. Market data entries processed for upsert: ${marketDataUpsertedCount}.`;
  }
  
  const status = totalFailures > 0 && totalFailures === (companiesFailedCount + marketDataFailedCount) && scrapedRawData.length > 0 ? 500 
               : totalFailures > 0 ? 207 // Multi-Status for partial success
               : 200; // OK

  return NextResponse.json({
    message: summaryMessage,
    source: NEPSE_TODAY_PRICE_URL,
    counts: {
      rawDataEntries: scrapedRawData.length,
      companiesNewlyCreated: companiesUpsertedCount,
      marketDataEntriesForUpsert: recordsToUpsert.length, // Number of records prepared for upsert
      marketDataSuccessfullyUpserted: marketDataUpsertedCount - (upsertError ? recordsToUpsert.length : 0), // Adjust if upsert failed
      companiesFailedOperations: companiesFailedCount,
      marketDataFailedOperations: marketDataFailedCount, // This counts items that failed pre-upsert or if upsert failed entirely
    },
    errors: errors.length > 0 ? errors : undefined,
    fetchError: fetchError,
  }, { status });
}

    