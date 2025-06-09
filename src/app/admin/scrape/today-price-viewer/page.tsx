
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Tv, Server, CloudUpload, VenetianMask } from 'lucide-react'; // Added VenetianMask for Python
import { AppHeader } from '@/components/layout/Header';
import * as cheerio from 'cheerio';

const NEPSE_TODAY_PRICE_URL = 'https://nepalstock.com.np/today-price';
const STORE_SCRAPED_DATA_API_URL = '/api/scrape/today-price'; // API to send parsed data
const PYTHON_SCRAPE_API_URL = '/api/scrape-via-python/today-price'; // New API to trigger Python

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


  const handleClientSideScrapeAndStore = async () => {
    setIsLoading(true);
    setScrapeAndStoreResult(null);
    setError(null);
    const scrapedRawData: NepseTodayPriceScrapedRow[] = [];

    try {
      setCurrentStep("Fetching NEPSE page from browser...");
      const response = await fetch(NEPSE_TODAY_PRICE_URL, {
        headers: { 
          'Accept': 'text/html',
          // 'User-Agent': 'ShareScopeAI-ClientScraper/1.0' // Optional: User-Agent for client-side fetch
        },
        // mode: 'no-cors', // This would prevent reading the response for parsing
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch NEPSE page from browser: ${response.status} ${response.statusText}. This often indicates a CORS issue if nepalstock.com.np does not allow requests from this origin, or a network connectivity problem.`);
      }

      const html = await response.text();
      setCurrentStep("Parsing HTML with Cheerio in browser...");

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
            differenceRs: $(columns[10])?.text().trim() || '',
          };
          if (rowData.companySymbol) {
            scrapedRawData.push(rowData);
          }
        }
      });

      if (scrapedRawData.length === 0) {
        setError("Successfully fetched and parsed NEPSE page in browser, but no valid stock data rows were extracted.");
        setIsLoading(false);
        setCurrentStep('');
        return;
      }

      setCurrentStep(`Sending ${scrapedRawData.length} scraped records to server for storage...`);
      const storeResponse = await fetch(STORE_SCRAPED_DATA_API_URL, { // POST to this API
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
      setCurrentStep('Client-side scrape and store complete!');

    } catch (err: any) {
      console.error("Client-Side Scrape and Store Error:", err);
      setError(err.message || 'An unexpected error occurred during the client-side scraping process.');
    } finally {
      setIsLoading(false);
      // setCurrentStep(''); // Keep last step message or clear
    }
  };

  const handlePythonScrapeAndStore = async () => {
    setIsLoading(true);
    setScrapeAndStoreResult(null);
    setError(null);
    setCurrentStep("Triggering Python scraper on server...");

    try {
      const response = await fetch(PYTHON_SCRAPE_API_URL, { method: 'GET' }); // This API will call Python
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Python scraping trigger API failed with status: ${response.status}. Details: ${result.details || 'N/A'}`);
      }
      setScrapeAndStoreResult(result); // This result will contain the response from the Python trigger API
      setCurrentStep('Python scrape and store process initiated. Check results.');

    } catch (err:any) {
      console.error("Python Scrape Trigger Error:", err);
      setError(err.message || 'An unexpected error occurred while triggering Python scraper.');
    } finally {
      setIsLoading(false);
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
              <CardTitle className="text-xl font-semibold font-headline text-primary">NEPSE Today's Price - Scraper Control Panel</CardTitle>
            </div>
            <CardDescription>
              Use the buttons below to scrape NEPSE data. Client-side scraping attempts to fetch and parse directly in your browser (may fail due to CORS). Python scraping triggers a server-side Python script.
              <br /><strong>Note:</strong> Direct client-side fetching from nepalstock.com.np may be blocked by browser CORS policy.
              <br /><strong>Python Scraper Note:</strong> Ensure Python 3 and libraries (requests, beautifulsoup4) are installed on the server.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <Button onClick={handleClientSideScrapeAndStore} disabled={isLoading} className="flex-1">
                {isLoading && currentStep.toLowerCase().includes('client') ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CloudUpload className="mr-2 h-4 w-4" />
                )}
                {isLoading && currentStep.toLowerCase().includes('client') ? currentStep : "Scrape in Browser & Store"}
              </Button>
              <Button onClick={handlePythonScrapeAndStore} disabled={isLoading} className="flex-1" variant="outline">
                 {isLoading && currentStep.toLowerCase().includes('python') ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <VenetianMask className="mr-2 h-4 w-4" /> // Icon for Python
                )}
                {isLoading && currentStep.toLowerCase().includes('python') ? currentStep : "Scrape via Python & Store"}
              </Button>
            </div>
            
            {isLoading && currentStep && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700 flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {currentStep}
                </div>
            )}


            {error && (
              <Alert variant="destructive" className="mb-4 shadow-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {scrapeAndStoreResult && !error && (
              <Alert 
                variant={scrapeAndStoreResult.error || (scrapeAndStoreResult.storageApiResponse && scrapeAndStoreResult.storageApiResponse.errors && scrapeAndStoreResult.storageApiResponse.errors.length > 0) ? "default" : "default"} 
                className={`mb-4 shadow-md ${
                  scrapeAndStoreResult.error || (scrapeAndStoreResult.storageApiResponse && scrapeAndStoreResult.storageApiResponse.errors && scrapeAndStoreResult.storageApiResponse.errors.length > 0)
                    ? 'bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300'
                    : 'bg-green-50 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'
                }`}
              >
                {scrapeAndStoreResult.error || (scrapeAndStoreResult.storageApiResponse && scrapeAndStoreResult.storageApiResponse.errors && scrapeAndStoreResult.storageApiResponse.errors.length > 0) ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                <AlertTitle>
                  {scrapeAndStoreResult.error 
                    ? 'Operation Error' 
                    : (scrapeAndStoreResult.storageApiResponse && scrapeAndStoreResult.storageApiResponse.errors && scrapeAndStoreResult.storageApiResponse.errors.length > 0 
                        ? 'Operation Completed with Issues' 
                        : 'Operation Successful')}
                </AlertTitle>
                <AlertDescription>
                  <p>{scrapeAndStoreResult.message || scrapeAndStoreResult.error}</p>
                  {scrapeAndStoreResult.details && <p className="text-xs mt-1">Details: {typeof scrapeAndStoreResult.details === 'object' ? JSON.stringify(scrapeAndStoreResult.details) : scrapeAndStoreResult.details}</p>}
                  
                  {/* Displaying counts from the data storage API response if available */}
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
                  {/* Displaying counts from the python scraper API response if available (nested under storageApiResponse) */}
                  {scrapeAndStoreResult.storageApiResponse && scrapeAndStoreResult.storageApiResponse.counts && (
                     <ul className="mt-2 list-disc list-inside text-sm">
                      <li>Python records scraped: {scrapeAndStoreResult.python_records_scraped ?? 'N/A'}</li>
                      <li>Received raw entries by store API: {scrapeAndStoreResult.storageApiResponse.counts.rawDataEntries}</li>
                      <li>Companies newly created: {scrapeAndStoreResult.storageApiResponse.counts.companiesNewlyCreated}</li>
                      <li>Market data entries for upsert: {scrapeAndStoreResult.storageApiResponse.counts.marketDataEntriesForUpsert}</li>
                      <li>Market data successfully upserted: {scrapeAndStoreResult.storageApiResponse.counts.marketDataSuccessfullyUpserted}</li>
                      {scrapeAndStoreResult.storageApiResponse.counts.companiesFailedOperations > 0 && <li className="text-red-600 dark:text-red-400">Company operations failed: {scrapeAndStoreResult.storageApiResponse.counts.companiesFailedOperations}</li>}
                      {scrapeAndStoreResult.storageApiResponse.counts.marketDataFailedOperations > 0 && <li className="text-red-600 dark:text-red-400">Market data operations failed: {scrapeAndStoreResult.storageApiResponse.counts.marketDataFailedOperations}</li>}
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
                   {scrapeAndStoreResult.storageApiResponse && scrapeAndStoreResult.storageApiResponse.errors && scrapeAndStoreResult.storageApiResponse.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold">Storage Errors (from Python flow):</p>
                      <ul className="list-disc list-inside text-xs max-h-32 overflow-y-auto">
                        {scrapeAndStoreResult.storageApiResponse.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}
                  {scrapeAndStoreResult.python_stderr && (
                     <div className="mt-2">
                        <p className="font-semibold">Python Script Stderr:</p>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto max-h-24">{scrapeAndStoreResult.python_stderr}</pre>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <p className="text-xs text-muted-foreground mt-4">
              The "Scrape in Browser" button attempts to fetch and parse the NEPSE page directly in your browser, then sends structured data to the server for storage. This may fail due to browser CORS restrictions.
              The "Scrape via Python" button triggers a server-side Python script to perform scraping and then sends structured data for storage. This requires Python and necessary libraries (requests, beautifulsoup4) to be installed on the server.
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
