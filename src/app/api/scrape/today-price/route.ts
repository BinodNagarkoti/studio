
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';

type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
type DailyMarketDataInsert = Database['public']['Tables']['daily_market_data']['Insert'];

// Expected shape of data from the client-side scraper
interface NepseTodayPriceScrapedRow {
  s_n: string;
  companySymbol: string;
  ltp: string;
  changePercent: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  qtyTraded: string;
  turnover: string;
  prevClosing: string;
  differenceRs: string;
}

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


export async function POST(request: Request) {
  let scrapedRawData: NepseTodayPriceScrapedRow[];
  try {
    scrapedRawData = await request.json();
    if (!Array.isArray(scrapedRawData) || scrapedRawData.length === 0) {
      return NextResponse.json({ error: "Invalid or empty data received from client.", counts: { rawDataEntries: 0 } }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: "Failed to parse request body.", details: (e as Error).message }, { status: 400 });
  }

  let companiesNewlyCreated = 0;
  let marketDataSuccessfullyUpserted = 0;
  let companiesFailedOperations = 0;
  let marketDataFailedOperations = 0;
  const errors: string[] = [];
  
  const recordsToUpsert: DailyMarketDataInsert[] = [];
  const tradeDate = new Date().toISOString().split('T')[0]; // Use current date as trade date

  for (const item of scrapedRawData) {
    try {
      let companyId: string | undefined;

      // 1. Find Company ID by ticker_symbol
      const { data: existingCompany, error: companySelectError } = await supabase
        .from('companies')
        .select('id')
        .eq('ticker_symbol', item.companySymbol.toUpperCase())
        .single();

      if (companySelectError && companySelectError.code !== 'PGRST116') { // PGRST116: no rows found
        const errMsg = `Supabase error fetching company ID for ${item.companySymbol}: ${companySelectError.message}`;
        console.error(errMsg);
        errors.push(errMsg);
        companiesFailedOperations++;
        continue; 
      }

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        // 2. Create new company if not found
        console.log(`Company ${item.companySymbol} not found. Creating new entry...`);
        const newCompanyData: CompanyInsert = {
          ticker_symbol: item.companySymbol.toUpperCase(),
          name: `[${item.companySymbol}] New Company (Update Name)`, // Placeholder name
          is_active: true,
          scraped_at: new Date().toISOString(),
          // Other fields like description, industry_sector would be null or default
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
          companiesFailedOperations++;
          continue; 
        }
        if (newCompany) {
          companyId = newCompany.id;
          companiesNewlyCreated++;
          console.log(`Created new company ${item.companySymbol} with ID ${companyId}`);
        } else {
          const errMsg = `Failed to create or retrieve ID for new company ${item.companySymbol}.`;
          console.error(errMsg);
          errors.push(errMsg);
          companiesFailedOperations++;
          continue;
        }
      }

      if (!companyId) {
        const errMsg = `Could not determine company_id for symbol: ${item.companySymbol}. Skipping market data for this record.`;
        console.warn(errMsg);
        errors.push(errMsg);
        marketDataFailedOperations++; // Count this as a failure for market data
        continue;
      }

      // 3. Prepare market data record
      const marketDataRecord: DailyMarketDataInsert = {
        company_id: companyId,
        trade_date: tradeDate,
        open_price: parseFloatOrNull(item.openPrice),
        high_price: parseFloatOrNull(item.highPrice),
        low_price: parseFloatOrNull(item.lowPrice),
        close_price: parseFloatOrNull(item.ltp), // LTP is considered close for "Today's Price"
        volume: parseIntOrNull(item.qtyTraded),
        turnover: parseFloatOrNull(item.turnover),
        previous_close_price: parseFloatOrNull(item.prevClosing),
        price_change: parseFloatOrNull(item.differenceRs),
        percent_change: parseFloatOrNull(item.changePercent.replace(/[\s%]+/g, '')), // Remove % and spaces
        scraped_at: new Date().toISOString(),
        // market_cap, fifty_two_week_high/low, adjusted_close_price are not typically on "Today's Price" page
        // and would be null or populated by other scrapers/processes.
      };
      recordsToUpsert.push(marketDataRecord);

    } catch (loopError: any) {
      const errMsg = `Error processing item ${item.companySymbol}: ${loopError.message}`;
      console.error(errMsg, loopError);
      errors.push(errMsg);
      marketDataFailedOperations++;
    }
  }

  // 4. Batch Upsert Market Data
  if (recordsToUpsert.length > 0) {
    const { error: upsertError, count: upsertedActualCount } = await supabase
      .from('daily_market_data')
      .upsert(recordsToUpsert, { onConflict: 'company_id, trade_date', ignoreDuplicates: false, count: 'exact' });

    if (upsertError) {
      const errMsg = `Supabase daily_market_data upsert error: ${upsertError.message}`;
      console.error(errMsg, upsertError.details);
      errors.push(errMsg);
      // If batch upsert fails, assume all market data records in this batch failed
      marketDataFailedOperations += recordsToUpsert.length - (upsertedActualCount || 0);
      marketDataSuccessfullyUpserted = upsertedActualCount || 0;
    } else {
      marketDataSuccessfullyUpserted = upsertedActualCount ?? recordsToUpsert.length; // If count is null, assume all attempted were successful (optimistic for some DBs)
      console.log(`Successfully attempted to upsert ${recordsToUpsert.length} market data records. Actual upserted/updated: ${marketDataSuccessfullyUpserted}`);
      // Adjust marketDataFailedOperations if upsertedActualCount is less than recordsToUpsert.length
      if (upsertedActualCount !== null && upsertedActualCount < recordsToUpsert.length) {
         marketDataFailedOperations += (recordsToUpsert.length - upsertedActualCount);
      }
    }
  }

  const totalFailures = companiesFailedOperations + marketDataFailedOperations;
  let summaryMessage = `Data processing finished. Records received: ${scrapedRawData.length}.`;
  
  const status = totalFailures > 0 && totalFailures === (companiesFailedOperations + recordsToUpsert.length) && scrapedRawData.length > 0 ? 500 
               : totalFailures > 0 ? 207 // Multi-Status for partial success
               : 200; // OK

  return NextResponse.json({
    message: summaryMessage,
    counts: {
      rawDataEntries: scrapedRawData.length,
      companiesNewlyCreated: companiesNewlyCreated,
      marketDataEntriesForUpsert: recordsToUpsert.length,
      marketDataSuccessfullyUpserted: marketDataSuccessfullyUpserted,
      companiesFailedOperations: companiesFailedOperations,
      marketDataFailedOperations: marketDataFailedOperations,
    },
    errors: errors.length > 0 ? errors : undefined,
  }, { status });
}

    