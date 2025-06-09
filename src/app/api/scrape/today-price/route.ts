
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { supabase } from '@/lib/supabaseClient'; // Ensure this path is correct

// Define an interface for the shape of data scraped from NEPSE for 'today-price'
// This should align with how you want to temporarily store/process it before mapping to Supabase table structure
interface NepseTodayPriceScrapedRow {
  s_n: string;
  companySymbol: string;
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

// Helper function to parse string to number or null
const parseFloatOrNull = (val: string): number | null => {
  const cleanedVal = val.replace(/,/g, '');
  const num = parseFloat(cleanedVal);
  return isNaN(num) ? null : num;
};

const parseIntOrNull = (val: string): number | null => {
  const cleanedVal = val.replace(/,/g, '');
  const num = parseInt(cleanedVal, 10);
  return isNaN(num) ? null : num;
};


export async function GET() {
  const NEPSE_TODAY_PRICE_URL = 'https://nepalstock.com.np/today-price';
  const scrapedRawData: NepseTodayPriceScrapedRow[] = [];

  try {
    const response = await fetch(NEPSE_TODAY_PRICE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      next: { revalidate: 3600 } // Revalidate every hour for this example
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch page: ${response.statusText}` }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const tableRows = $('.table-responsive table tbody tr');

    if (tableRows.length === 0) {
        return NextResponse.json({ warning: "No data rows found. The table selector might be incorrect or the page structure has changed." }, { status: 200 });
    }

    tableRows.each((index, element) => {
      const columns = $(element).find('td');
      if (columns.length >= 10) { // Ensure enough columns for the data expected
        const rowData: NepseTodayPriceScrapedRow = {
          s_n: $(columns[0]).text().trim(),
          companySymbol: $(columns[1]).text().trim(),
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
      }
    });

    if (scrapedRawData.length > 0) {
      // --- Supabase Integration ---
      // 1. Fetch all company_ids and their ticker_symbols from your 'companies' table
      //    to map symbols to foreign keys.
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, ticker_symbol');

      if (companiesError) {
        console.error('Supabase error fetching companies:', companiesError);
        return NextResponse.json({ error: 'Failed to fetch company mappings for Supabase insert.', details: companiesError.message }, { status: 500 });
      }

      const companySymbolToIdMap = new Map<string, string>();
      companies?.forEach(c => {
        if (c.ticker_symbol) companySymbolToIdMap.set(c.ticker_symbol, c.id);
      });

      // 2. Transform scrapedRawData into the structure for 'daily_market_data' table
      const recordsToUpsert = scrapedRawData.map(item => {
        const companyId = companySymbolToIdMap.get(item.companySymbol);
        if (!companyId) {
          console.warn(`No company_id found for symbol: ${item.companySymbol}. Skipping this record.`);
          return null; // Skip if no matching company ID (or handle company creation)
        }

        const tradeDate = new Date().toISOString().split('T')[0]; // Assuming scraping for "today"

        return {
          company_id: companyId,
          trade_date: tradeDate, // Or parse from page if available and reliable
          open_price: parseFloatOrNull(item.openPrice),
          high_price: parseFloatOrNull(item.highPrice),
          low_price: parseFloatOrNull(item.lowPrice),
          close_price: parseFloatOrNull(item.ltp), // LTP is usually the close for "today's price"
          // adjusted_close_price: // Needs calculation if not directly available
          volume_traded: parseIntOrNull(item.qtyTraded),
          turnover: parseFloatOrNull(item.turnover),
          // market_capitalization: // Needs to be scraped from elsewhere or calculated
          previous_close_price: parseFloatOrNull(item.prevClosing),
          price_change: parseFloatOrNull(item.differenceRs),
          price_change_percent: parseFloatOrNull(item.changePercent.replace('%', '')),
          // fifty_two_week_high: // Needs to be scraped from elsewhere
          // fifty_two_week_low: // Needs to be scraped from elsewhere
          scraped_at: new Date().toISOString(),
        };
      }).filter(record => record !== null); // Remove any null records (skipped due to missing company_id)


      if (recordsToUpsert.length > 0) {
        // 3. Upsert into Supabase 'daily_market_data' table
        //    Using 'company_id' and 'trade_date' as conflict target for upsert
        const { data: upsertData, error: upsertError } = await supabase
          .from('daily_market_data')
          .upsert(recordsToUpsert as any[], { onConflict: 'company_id, trade_date' }); // Adjust onConflict as per your table's unique constraints

        if (upsertError) {
          console.error('Supabase upsert error:', upsertError);
          return NextResponse.json({ error: 'Failed to save scraped data to Supabase.', details: upsertError.message }, { status: 500 });
        } else {
          console.log('Successfully upserted data to Supabase daily_market_data:', upsertData);
        }
      }
    }
    // --- End of Supabase Integration ---

    return NextResponse.json({
      message: `Scraping successful. Found ${scrapedRawData.length} raw entries. Upserted ${recordsToUpsert.length} records.`,
      source: NEPSE_TODAY_PRICE_URL,
      // data: scrapedRawData, // Optionally return raw data for debugging
      // upsertedData: recordsToUpsert // Optionally return transformed data
    });

  } catch (error) {
    console.error('Scraping API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during scraping.';
    return NextResponse.json({ error: 'Failed to scrape data.', details: errorMessage }, { status: 500 });
  }
}

// Note: For a production scraper:
// - Implement more robust error handling for network issues, Cheerio parsing, and Supabase operations.
// - Consider a queue or background job for scraping and Supabase inserts to avoid long-running API requests.
// - Handle cases where company symbols might not yet exist in your 'companies' table (e.g., create new company entries).
// - Be mindful of NEPSE's terms of service and scraping etiquette (rate limits, etc.).
// - This script assumes the 'today-price' page reflects the current trading day's final data. If it's live and changing, the 'close_price' logic might need adjustment.
// - Market cap, 52-week high/low, and adjusted close often come from different pages or require calculations.
```

