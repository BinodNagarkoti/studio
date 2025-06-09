
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
  // companyName: string; // The 'today-price' page typically doesn't list full company names in the main table, only symbols.
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

  // --- Best Practice Note ---
  // For long-running tasks like scraping multiple pages or extensive data processing,
  // consider using a proper background job/queue system (e.g., BullMQ, Celery with Redis/RabbitMQ)
  // instead of a synchronous Next.js API route. This prevents request timeouts and improves reliability.

  // --- Scraping Etiquette Note ---
  // Be mindful of NEPSE's terms of service. Implement rate limiting and avoid overly aggressive scraping.
  // Use a proper User-Agent string. Consider adding delays between requests if scraping multiple pages.

  try {
    const response = await fetch(NEPSE_TODAY_PRICE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      // Revalidate cache strategy for Next.js fetch, if needed.
      // For a scraping job, you might want 'no-store' or control revalidation carefully.
      next: { revalidate: 300 } // Example: revalidate every 5 minutes. Adjust as needed.
    });

    if (!response.ok) {
      fetchError = `Failed to fetch page: ${response.status} ${response.statusText}`;
      console.error(fetchError);
      return NextResponse.json({ error: fetchError, details: await response.text().catch(() => '') }, { status: response.status });
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
      // Ensure enough columns for the data expected. The "today-price" table usually has around 11-12 columns.
      if (columns.length >= 10) { 
        const rowData: NepseTodayPriceScrapedRow = {
          s_n: $(columns[0]).text().trim(),
          companySymbol: $(columns[1]).find('a').text().trim() || $(columns[1]).text().trim(), // Symbol is often in an <a> tag
          ltp: $(columns[2]).text().trim(),
          changePercent: $(columns[3]).text().trim(), // Sometimes contains " %" or other chars
          openPrice: $(columns[4]).text().trim(),
          highPrice: $(columns[5]).text().trim(),
          lowPrice: $(columns[6]).text().trim(),
          qtyTraded: $(columns[7]).text().trim(),
          turnover: $(columns[8]).text().trim(),
          prevClosing: $(columns[9]).text().trim(),
          differenceRs: $(columns[10]).text().trim(),
        };
        if (rowData.companySymbol) { // Only add if a symbol was found
          scrapedRawData.push(rowData);
        }
      } else {
        console.warn(`Skipping row ${index + 1} due to insufficient columns: ${columns.length}`);
      }
    });

  } catch (error: any) {
    fetchError = `Error during page fetch or initial parsing: ${error.message}`;
    console.error(fetchError, error);
    return NextResponse.json({ error: fetchError, details: error.stack }, { status: 500 });
  }

  if (scrapedRawData.length > 0) {
    const recordsToUpsert: DailyMarketDataInsert[] = [];
    const tradeDate = new Date().toISOString().split('T')[0]; // Assuming scraping for "today"

    // --- Data Assumption Note ---
    // This script assumes the 'today-price' page reflects the current trading day's final data.
    // If it's live and changing intra-day, the 'close_price' (LTP) logic might need adjustment
    // or you might scrape at market close.

    // --- Note on Specific Fields ---
    // Fields like 'market_capitalization', 'fifty_two_week_high', 'fifty_two_week_low',
    // and 'adjusted_close_price' are often NOT available on the main 'today-price' table.
    // They usually come from different pages (e.g., company-specific profile pages) or require calculations.
    // This scraper will primarily populate fields directly available on the 'today-price' table.

    for (const item of scrapedRawData) {
      try {
        // 1. Find or create company_id
        let companyId: string | undefined;
        const { data: existingCompany, error: companySelectError } = await supabase
          .from('companies')
          .select('id')
          .eq('ticker_symbol', item.companySymbol.toUpperCase())
          .single();

        if (companySelectError && companySelectError.code !== 'PGRST116') { // PGRST116: no rows found
          const errMsg = `Supabase error fetching company ID for ${item.companySymbol}: ${companySelectError.message}`;
          console.error(errMsg);
          errors.push(errMsg);
          companiesFailedCount++;
          continue; // Skip this stock item
        }

        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          // Company not found, create it
          console.log(`Company ${item.companySymbol} not found. Creating new entry...`);
          const newCompanyData: CompanyInsert = {
            ticker_symbol: item.companySymbol.toUpperCase(),
            name: `[${item.companySymbol}] New Company (Update Name)`, // Placeholder name
            is_active: true,
            // Other fields like 'description', 'industry_sector' would be null or default
            // and ideally updated by a more specific company information scraper.
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
            continue; // Skip this stock item
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
          close_price: parseFloatOrNull(item.ltp), // LTP is used as close for "today's price"
          volume_traded: parseIntOrNull(item.qtyTraded),
          turnover: parseFloatOrNull(item.turnover),
          previous_close_price: parseFloatOrNull(item.prevClosing),
          price_change: parseFloatOrNull(item.differenceRs),
          // Remove '%' and convert to number for changePercent
          price_change_percent: parseFloatOrNull(item.changePercent.replace(/[\s%]+/g, '')),
          scraped_at: new Date().toISOString(),
          // market_capitalization, fifty_two_week_high/low, adjusted_close_price
          // are typically not on this page. They will default to null if not provided.
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
      // Upsert into Supabase 'daily_market_data' table
      // Using 'company_id' and 'trade_date' as conflict target for upsert
      const { data: upsertData, error: upsertError } = await supabase
        .from('daily_market_data')
        .upsert(recordsToUpsert, { onConflict: 'company_id, trade_date', ignoreDuplicates: false });

      if (upsertError) {
        const errMsg = `Supabase daily_market_data upsert error: ${upsertError.message}`;
        console.error(errMsg, upsertError.details);
        errors.push(errMsg);
        marketDataFailedCount += recordsToUpsert.length; // Assume all failed if upsert block fails
      } else {
        // Supabase upsert doesn't return a count of affected rows directly in the same way as insert/update.
        // We'll infer success based on lack of error for records that made it to `recordsToUpsert`.
        marketDataUpsertedCount = recordsToUpsert.length - marketDataFailedCount; // Adjust count based on prior failures
        console.log(`Successfully attempted to upsert ${recordsToUpsert.length} market data records.`);
      }
    }
  }

  const totalOperations = scrapedRawData.length + companiesUpsertedCount; // Approx.
  const totalFailures = companiesFailedCount + marketDataFailedCount;

  const summaryMessage = `Scraping finished. Raw entries: ${scrapedRawData.length}. Companies created/updated: ${companiesUpsertedCount}. Market data entries processed: ${marketDataUpsertedCount + marketDataFailedCount}.`;
  const status = totalFailures > 0 && totalFailures === totalOperations ? 500 : totalFailures > 0 ? 207 : 200; // 207 Multi-Status if partial success

  return NextResponse.json({
    message: summaryMessage,
    source: NEPSE_TODAY_PRICE_URL,
    counts: {
      rawDataEntries: scrapedRawData.length,
      companiesFoundOrCreated: scrapedRawData.length - companiesFailedCount, // Assuming one company per raw data entry attempt
      companiesNewlyCreated: companiesUpsertedCount, // This is accurate for newly created
      marketDataUpserted: marketDataUpsertedCount,
      companiesFailed: companiesFailedCount,
      marketDataFailed: marketDataFailedCount,
    },
    errors: errors.length > 0 ? errors : undefined,
  }, { status });
}
