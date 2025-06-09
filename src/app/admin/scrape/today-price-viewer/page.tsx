
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Tv } from 'lucide-react';
import { AppHeader } from '@/components/layout/Header'; // Assuming you want the same header

const NEPSE_TODAY_PRICE_URL = 'https://nepalstock.com.np/today-price';

export default function ScrapeTodayPriceViewerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    setIsLoading(true);
    setScrapeResult(null);
    setError(null);
    try {
      const response = await fetch('/api/scrape/today-price');
      const data = await response.json();

      if (!response.ok) {
        // Use error message from API response if available, otherwise a generic one
        const errorMessage = data?.error || `Scraping failed with status: ${response.status}`;
        if (data?.details) console.error("Scraping API Error Details:", data.details);
        if (data?.cause) console.error("Scraping API Error Cause:", data.cause);
        throw new Error(errorMessage);
      }
      setScrapeResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while triggering the scrape.');
      console.error("Scraping Trigger Error:", err);
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
              <CardTitle className="text-xl font-semibold font-headline text-primary">NEPSE Today's Price - Live View & Scraper</CardTitle>
            </div>
            <CardDescription>
              This page displays the live NEPSE Today's Price page and allows you to trigger a scrape of its data into the database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Button onClick={handleScrape} disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isLoading ? 'Scraping...' : "Scrape Today's Price Data"}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4 shadow-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Scraping Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {scrapeResult && !error && (
              <Alert variant={scrapeResult.errors && scrapeResult.errors.length > 0 ? "default" : "default"} className={`mb-4 shadow-md ${scrapeResult.errors && scrapeResult.errors.length > 0 ? 'bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300' : 'bg-green-50 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'}`}>
                {scrapeResult.errors && scrapeResult.errors.length > 0 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                <AlertTitle>{scrapeResult.errors && scrapeResult.errors.length > 0 ? 'Scraping Completed with Issues' : 'Scraping Successful'}</AlertTitle>
                <AlertDescription>
                  <p>{scrapeResult.message}</p>
                  {scrapeResult.counts && (
                    <ul className="mt-2 list-disc list-inside text-sm">
                      <li>Raw entries found: {scrapeResult.counts.rawDataEntries}</li>
                      <li>Companies newly created: {scrapeResult.counts.companiesNewlyCreated}</li>
                      <li>Market data entries for upsert: {scrapeResult.counts.marketDataEntriesForUpsert}</li>
                      <li>Market data successfully upserted: {scrapeResult.counts.marketDataSuccessfullyUpserted}</li>
                      {scrapeResult.counts.companiesFailedOperations > 0 && <li className="text-red-600 dark:text-red-400">Company operations failed: {scrapeResult.counts.companiesFailedOperations}</li>}
                      {scrapeResult.counts.marketDataFailedOperations > 0 && <li className="text-red-600 dark:text-red-400">Market data operations failed: {scrapeResult.counts.marketDataFailedOperations}</li>}
                    </ul>
                  )}
                  {scrapeResult.errors && scrapeResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold">Errors encountered:</p>
                      <ul className="list-disc list-inside text-xs max-h-32 overflow-y-auto">
                        {scrapeResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}
                   {scrapeResult.htmlChecked && (
                     <div className="mt-2 text-xs">
                        <p className="font-semibold">HTML Snippet (for debugging if data was not found):</p>
                        <pre className="bg-muted p-2 rounded overflow-x-auto max-h-24">{scrapeResult.htmlChecked}</pre>
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
                sandbox="allow-scripts allow-same-origin" // Restrictive sandbox for security
                onError={(e) => console.error("Iframe loading error:", e)}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Note: The iframe attempts to load the live NEPSE page. If it doesn't load, it might be due to NEPSE's server settings (e.g., X-Frame-Options preventing embedding).
              The scraping functionality will still attempt to fetch the data directly.
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
