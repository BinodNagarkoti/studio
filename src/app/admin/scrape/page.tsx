
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, ListCollapse, Server, PlayCircle } from 'lucide-react';
import { AppHeader } from '@/components/layout/Header';
import { ScrollArea } from '@/components/ui/scroll-area';

const PYTHON_SCRAPE_API_URL = '/api/scrape-via-python/today-price';
const SCRAPE_NAME = "NEPSE Today's Price";
const SCRAPE_TARGET_URL = "https://nepalstock.com.np/today-price";

interface LogEntry {
  timestamp: Date;
  message: string;
  type: 'info' | 'error' | 'success';
  details?: any;
}

export default function ScrapeAdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<any>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (message: string, type: LogEntry['type'], details?: any) => {
    setLogs(prevLogs => [...prevLogs, { timestamp: new Date(), message, type, details }]);
  };

  const handleScrapeNow = async () => {
    setIsLoading(true);
    setScrapeResult(null);
    addLog(`Attempting to scrape: ${SCRAPE_NAME}...`, 'info');

    try {
      const response = await fetch(PYTHON_SCRAPE_API_URL, { method: 'GET' });
      const result = await response.json();
      setScrapeResult(result);

      if (!response.ok) {
        addLog(`Scraping failed for ${SCRAPE_NAME}. API Status: ${response.status}`, 'error', result);
        throw new Error(result.error || `Scraping trigger API failed with status: ${response.status}`);
      }
      
      addLog(`Scraping process for ${SCRAPE_NAME} finished successfully.`, 'success', result);

    } catch (err: any) {
      console.error("Scraping Trigger Error:", err);
      addLog(`Error triggering scrape for ${SCRAPE_NAME}: ${err.message}`, 'error', err);
      // Set scrapeResult to show the error in the main result area as well
      setScrapeResult({ error: err.message || 'An unexpected error occurred while triggering scraper.', details: err.cause || err.toString() });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Server className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl font-semibold font-headline text-primary">Scraping Control</CardTitle>
              </div>
              <CardDescription>
                Manually trigger data scraping tasks. Currently configured for NEPSE Today's Price.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-1">Task: {SCRAPE_NAME}</h3>
                <p className="text-sm text-muted-foreground">
                  URL: <a href={SCRAPE_TARGET_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{SCRAPE_TARGET_URL}</a>
                </p>
              </div>
              <Button onClick={handleScrapeNow} disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlayCircle className="mr-2 h-4 w-4" />
                )}
                {isLoading ? "Scraping..." : `Scrape ${SCRAPE_NAME} Now`}
              </Button>

              {scrapeResult && (
                <Alert
                  variant={scrapeResult.error || (scrapeResult.storageApiResponse && scrapeResult.storageApiResponse.errors && scrapeResult.storageApiResponse.errors.length > 0) ? "destructive" : "default"}
                  className={`mt-6 shadow-md ${
                    scrapeResult.error || (scrapeResult.storageApiResponse && scrapeResult.storageApiResponse.errors && scrapeResult.storageApiResponse.errors.length > 0)
                      ? 'bg-red-50 border-red-300 text-red-800 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400'
                      : 'bg-green-50 border-green-300 text-green-800 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'
                  }`}
                >
                  {scrapeResult.error || (scrapeResult.storageApiResponse && scrapeResult.storageApiResponse.errors && scrapeResult.storageApiResponse.errors.length > 0) ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  <AlertTitle>
                    {scrapeResult.error ? 'Operation Error'
                      : (scrapeResult.storageApiResponse && scrapeResult.storageApiResponse.errors && scrapeResult.storageApiResponse.errors.length > 0
                        ? 'Operation Completed with Issues'
                        : 'Operation Report')}
                  </AlertTitle>
                  <AlertDescription>
                    <p>{scrapeResult.message || scrapeResult.error}</p>
                    {scrapeResult.details && <p className="text-xs mt-1">Details: {typeof scrapeResult.details === 'object' ? JSON.stringify(scrapeResult.details) : scrapeResult.details}</p>}
                    {scrapeResult.counts && (
                      <ul className="mt-2 list-disc list-inside text-sm">
                        <li>Received raw entries: {scrapeResult.counts.rawDataEntries}</li>
                        <li>Companies newly created: {scrapeResult.counts.companiesNewlyCreated}</li>
                        <li>Market data entries for upsert: {scrapeResult.counts.marketDataEntriesForUpsert}</li>
                        <li>Market data successfully upserted: {scrapeResult.counts.marketDataSuccessfullyUpserted}</li>
                        {scrapeResult.counts.companiesFailedOperations > 0 && <li className="text-red-600 dark:text-red-400">Company operations failed: {scrapeResult.counts.companiesFailedOperations}</li>}
                        {scrapeResult.counts.marketDataFailedOperations > 0 && <li className="text-red-600 dark:text-red-400">Market data operations failed: {scrapeResult.counts.marketDataFailedOperations}</li>}
                      </ul>
                    )}
                    {scrapeResult.storageApiResponse && scrapeResult.storageApiResponse.counts && (
                       <ul className="mt-2 list-disc list-inside text-sm">
                        <li>Python records scraped: {scrapeResult.python_records_scraped ?? 'N/A'}</li>
                        <li>Received raw entries by store API: {scrapeResult.storageApiResponse.counts.rawDataEntries}</li>
                        <li>Companies newly created: {scrapeResult.storageApiResponse.counts.companiesNewlyCreated}</li>
                        <li>Market data entries for upsert: {scrapeResult.storageApiResponse.counts.marketDataEntriesForUpsert}</li>
                        <li>Market data successfully upserted: {scrapeResult.storageApiResponse.counts.marketDataSuccessfullyUpserted}</li>
                        {scrapeResult.storageApiResponse.counts.companiesFailedOperations > 0 && <li className="text-red-600 dark:text-red-400">Company operations failed: {scrapeResult.storageApiResponse.counts.companiesFailedOperations}</li>}
                        {scrapeResult.storageApiResponse.counts.marketDataFailedOperations > 0 && <li className="text-red-600 dark:text-red-400">Market data operations failed: {scrapeResult.storageApiResponse.counts.marketDataFailedOperations}</li>}
                      </ul>
                    )}
                     {scrapeResult.python_stderr && (
                       <div className="mt-2">
                          <p className="font-semibold">Python Script Stderr:</p>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto max-h-24">{scrapeResult.python_stderr}</pre>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ListCollapse className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl font-semibold font-headline text-primary">Scraping Logs</CardTitle>
              </div>
              <CardDescription>
                Real-time logs for the current scraping session. Logs are cleared on page refresh.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/20">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No logs yet. Trigger a scrape to see activity.</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className={`mb-2 p-2 rounded-md text-sm ${
                      log.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                      log.type === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                      'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    }`}>
                      <span className="font-mono text-xs mr-2">{log.timestamp.toLocaleTimeString()}</span>
                      <span>{log.message}</span>
                      {log.details && typeof log.details === 'object' && (
                         <pre className="mt-1 text-xs bg-black/5 dark:bg-white/5 p-1.5 rounded overflow-x-auto max-h-40">
                           {JSON.stringify(log.details, null, 2)}
                         </pre>
                      )}
                       {log.details && typeof log.details !== 'object' && (
                         <p className="mt-1 text-xs italic">Details: {String(log.details)}</p>
                      )}
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} ShareScope AI - Admin Panel
      </footer>
    </div>
  );
}
    
    