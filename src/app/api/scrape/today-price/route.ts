
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
// import { supabase } from '@/lib/supabaseClient'; // Step 1: Uncomment when ready to use Supabase

// Define an interface for the scraped data structure (align with your 'daily_prices' table)
interface ScrapedPriceData {
  companySymbol: string;
  ltp: number | null;
  change: number | null;
  changePercent: number | null;
  openPrice: number | null;
  highPrice: number | null;
  lowPrice: number | null;
  qtyTraded: number | null;
  turnover: number | null;
  // Add other fields as needed from the 'today-price' page and your Supabase table
}

export async function GET() {
  const NEPSE_TODAY_PRICE_URL = 'https://nepalstock.com.np/today-price';
  const scrapedData: ScrapedPriceData[] = [];

  try {
    const response = await fetch(NEPSE_TODAY_PRICE_URL, {
      // NEPSE might block default fetch user-agents, consider adding a common browser user-agent
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      next: { revalidate: 60 } // Revalidate every 60 seconds for this example
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch page: ${response.statusText}` }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Target the main table. The selector might change if NEPSE updates their website.
    // Inspect the page to find the correct table selector. Often it's a table with a specific class or ID.
    // This is a common selector pattern, adjust as needed:
    // const tableRows = $('table.table.table-hover.table-striped.table-bordered tr');
    // For NEPSE, the table seems to be within a div with class 'table-responsive' then table itself.
    // And data rows are `<tbody><tr>`
    
    const tableRows = $('.table-responsive table tbody tr');

    if (tableRows.length === 0) {
        return NextResponse.json({ warning: "No data rows found. The table selector might be incorrect or the page structure has changed." }, { status: 200 });
    }

    tableRows.each((index, element) => {
      const columns = $(element).find('td');
      if (columns.length > 0) { // Ensure it's a data row
        // Extract data based on column index. This is fragile.
        // Column indices:
        // 0: S.N.
        // 1: Symbol
        // 2: LTP
        // 3: % Change
        // 4: Open
        // 5: High
        // 6: Low
        // 7: Qty
        // 8: Turnover
        // 9: Previous Closing
        // 10: Difference Rs.

        const symbol = $(columns[1]).text().trim();
        const ltpText = $(columns[2]).text().trim().replace(/,/g, '');
        const changePercentText = $(columns[3]).text().trim().replace(/%/g, '');
        const openText = $(columns[4]).text().trim().replace(/,/g, '');
        const highText = $(columns[5]).text().trim().replace(/,/g, '');
        const lowText = $(columns[6]).text().trim().replace(/,/g, '');
        const qtyText = $(columns[7]).text().trim().replace(/,/g, '');
        const turnoverText = $(columns[8]).text().trim().replace(/,/g, '');
        const changeText = $(columns[10]).text().trim().replace(/,/g, '');


        if (symbol) { // Only add if symbol is present
          scrapedData.push({
            companySymbol: symbol,
            ltp: parseFloat(ltpText) || null,
            changePercent: parseFloat(changePercentText) || null,
            openPrice: parseFloat(openText) || null,
            highPrice: parseFloat(highText) || null,
            lowPrice: parseFloat(lowText) || null,
            qtyTraded: parseInt(qtyText, 10) || null,
            turnover: parseFloat(turnoverText) || null,
            change: parseFloat(changeText) || null,
          });
        }
      }
    });

    // --- Step 2: Supabase Integration (To be implemented by you) ---
    // if (scrapedData.length > 0) {
    //   // Example: Insert into 'daily_prices' table (you'll need to create this table in Supabase)
    //   // Make sure to handle data mapping, primary key conflicts (e.g., using .upsert)
    //   // and error handling.
    //
    //   // const recordsToInsert = scrapedData.map(item => ({
    //   //   company_symbol: item.companySymbol, // Adjust column names to your Supabase table
    //   //   ltp: item.ltp,
    //   //   change: item.change,
    //   //   change_percent: item.changePercent,
    //   //   open_price: item.openPrice,
    //   //   high_price: item.highPrice,
    //   //   low_price: item.lowPrice,
    //   //   qty_traded: item.qtyTraded,
    //   //   turnover: item.turnover,
    //   //   price_date: new Date().toISOString().split('T')[0], // Or the date from the page if available
    //   //   // Add other fields...
    //   // }));
    //   //
    //   // const { data, error } = await supabase
    //   //   .from('daily_prices') // Replace with your actual table name
    //   //   .upsert(recordsToInsert, { onConflict: 'company_symbol, price_date' }); // Example conflict handling
    //   //
    //   // if (error) {
    //   //   console.error('Supabase insert error:', error);
    //   //   // Potentially return an error response
    //   // } else {
    //   //   console.log('Successfully upserted data to Supabase:', data);
    //   // }
    // }
    // --- End of Supabase Integration ---

    return NextResponse.json({
      message: 'Scraping successful (demonstration).',
      source: NEPSE_TODAY_PRICE_URL,
      count: scrapedData.length,
      data: scrapedData,
    });

  } catch (error) {
    console.error('Scraping error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during scraping.';
    return NextResponse.json({ error: 'Failed to scrape data.', details: errorMessage }, { status: 500 });
  }
}
