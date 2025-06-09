
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Tv, Server, CloudUpload } from 'lucide-react';
import { AppHeader } from '@/components/layout/Header';
import * as cheerio from 'cheerio'; // Import cheerio

const NEPSE_TODAY_PRICE_URL = 'https://nepalstock.com.np/today-price';
const STORE_SCRAPED_DATA_API_URL = '/api/scrape/today-price'; // API to send parsed data

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

export default function ScrapeTodayPriceViewerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [scrapeAndStoreResult, setScrapeAndStoreResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');


  const handleScrapeAndStore = async () => {
    setIsLoading(true);
    setScrapeAndStoreResult(null);
    setError(null);
    const scrapedRawData: NepseTodayPriceScrapedRow[] = [];

    try {
      setCurrentStep("Fetching NEPSE page from browser...");
      // 1. Fetch HTML from client-side
      const response = await fetch(NEPSE_TODAY_PRICE_URL, {
        // Adding headers might help, but CORS is the main concern
        headers: { 
          'Accept': 'text/html',
        },
        // mode: 'no-cors', // This would prevent reading the response, so not useful for scraping
      });

      if (!response.ok) {
        // This error will likely be a CORS error if NEPSE doesn't allow cross-origin requests
        // or a network error if the user has no internet / NEPSE is down.
        throw new Error(`Failed to fetch NEPSE page from browser: ${response.status} ${response.statusText}. This might be a CORS issue if nepalstock.com.np does not allow requests from this origin.`);
      }

      const html = await response.text();
      setCurrentStep("Parsing HTML with Cheerio...");

      // 2. Parse HTML using Cheerio
      const $ = cheerio.load(html);
      
      const todayPriceElement = $('app-today-price');
      const tableRows = todayPriceElement.length > 0 
        ? todayPriceElement.find('.table-responsive table tbody tr, table tbody tr')
        : $('.table-responsive table tbody tr, table tbody tr');

      if (tableRows.length === 0) {
        setError("No data rows found in the table on NEPSE page. Selectors might be incorrect or the page structure has changed.");
        setIsLoading(false);
        setCurrentStep('');
        return;
      }

      tableRows.each((index, element) => {
        const columns = $(element).find('td');
        if (columns.length >= 10) { // Expecting at least 10 columns for the data
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
            differenceRs: $(columns[10])?.text().trim() || '', // Added optional chaining for safety
          };
          if (rowData.companySymbol) {
            scrapedRawData.push(rowData);
          }
        }
      });

      if (scrapedRawData.length === 0) {
        setError("Successfully fetched and parsed NEPSE page, but no valid stock data rows were extracted.");
        setIsLoading(false);
        setCurrentStep('');
        return;
      }

      setCurrentStep(`Sending ${scrapedRawData.length} scraped records to server for storage...`);
      // 3. Send parsed data to our API route for storage
      const storeResponse = await fetch(STORE_SCRAPED_DATA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scrapedRawData),
      });

      const storeResult = await storeResponse.json();

      if (!storeResponse.ok) {
        throw new Error(storeResult.error || `Storing data failed with status: ${storeResponse.status}`);
      }
      setScrapeAndStoreResult(storeResult);

    } catch (err: any) {
      console.error("Scrape and Store Error:", err);
      setError(err.message || 'An unexpected error occurred during the process.');
    } finally {
      setIsLoading(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Tv className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl font-semibold font-headline text-primary">NEPSE Today's Price - Client-Side Scraper</CardTitle>
            </div>
            <CardDescription>
              This page attempts to fetch and parse NEPSE data directly in your browser, then sends it to the server for storage.
              <br /><strong>Note:</strong> This client-side fetch may fail due to CORS restrictions from nepalstock.com.np.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Button onClick={handleScrapeAndStore} disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CloudUpload className="mr-2 h-4 w-4" />
                )}
                {isLoading ? currentStep || 'Processing...' : "Scrape in Browser & Store in DB"}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4 shadow-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {scrapeAndStoreResult && !error && (
              <Alert variant={scrapeAndStoreResult.errors && scrapeAndStoreResult.errors.length > 0 ? "default" : "default"} className={`mb-4 shadow-md ${scrapeAndStoreResult.errors && scrapeAndStoreResult.errors.length > 0 ? 'bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300' : 'bg-green-50 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'}`}>
                {scrapeAndStoreResult.errors && scrapeAndStoreResult.errors.length > 0 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                <AlertTitle>{scrapeAndStoreResult.errors && scrapeAndStoreResult.errors.length > 0 ? 'Data Storage Completed with Issues' : 'Data Storage Successful'}</AlertTitle>
                <AlertDescription>
                  <p>{scrapeAndStoreResult.message}</p>
                  {scrapeAndStoreResult.counts && (
                    <ul className="mt-2 list-disc list-inside text-sm">
                      <li>Received raw entries: {scrapeAndStoreResult.counts.rawDataEntries}</li>
                      <li>Companies newly created: {scrapeAndStoreResult.counts.companiesNewlyCreated}</li>
                      <li>Market data entries for upsert: {scrapeAndStoreResult.counts.marketDataEntriesForUpsert}</li>
                      <li>Market data successfully upserted: {scrapeAndStoreResult.counts.marketDataSuccessfullyUpserted}</li>
                      {scrapeAndStoreResult.counts.companiesFailedOperations > 0 && <li className="text-red-600 dark:text-red-400">Company operations failed: {scrapeAndStoreResult.counts.companiesFailedOperations}</li>}
                      {scrapeAndStoreResult.counts.marketDataFailedOperations > 0 && <li className="text-red-600 dark:text-red-400">Market data operations failed: {scrapeAndStoreResult.counts.marketDataFailedOperations}</li>}
                    </ul>
                  )}
                  {scrapeAndStoreResult.errors && scrapeAndStoreResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold">Storage Errors encountered:</p>
                      <ul className="list-disc list-inside text-xs max-h-32 overflow-y-auto">
                        {scrapeAndStoreResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="aspect-video w-full border rounded-md shadow-inner">
              <iframe
                src={NEPSE_TODAY_PRICE_URL}
                title="NEPSE Today's Price Live View"
                className="w-full h-full"
                sandbox="allow-scripts allow-same-origin"
                onError={(e) => console.error("Iframe loading error:", e)}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note: The iframe attempts to load the live NEPSE page. The button above tries to fetch and parse this page directly in your browser.
            </p>
          </CardContent>
        </Card>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} ShareScope AI - Admin Panel
      </footer>
    </div>
  );
}

    