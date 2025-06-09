
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, ListCollapse, Server, PlayCircle, RefreshCw } from 'lucide-react';
import { AppHeader } from '@/components/layout/Header';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { getTodayPriceScrapeStatusAction, type ScrapeStatus } from '@/lib/actions';

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
  const [scrapeStatus, setScrapeStatus] = useState<ScrapeStatus | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);

  const addLog = (message: string, type: LogEntry['type'], details?: any) => {
    setLogs(prevLogs => [{ timestamp: new Date(), message, type, details }, ...prevLogs]);
  };

  const fetchScrapeStatus = async () => {
    setIsStatusLoading(true);
    addLog('Checking data status...', 'info');
    try {
      const status = await getTodayPriceScrapeStatusAction();
      setScrapeStatus(status);
      addLog(`Status check complete: ${status.message}`, status.isUpToDate ? 'success' : 'info');
    } catch (err: any) {
      const errorMsg = `Failed to fetch status: ${err.message}`;
      setScrapeStatus({
        isUpToDate: false,
        lastChecked: new Date().toISOString(),
        message: errorMsg,
      });
      addLog(errorMsg, 'error', err);
    } finally {
      setIsStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchScrapeStatus();
  }, []);

  const handleScrapeNow = async () => {
    setIsLoading(true);
    setScrapeResult(null);
    addLog(`Attempting to scrape: ${SCRAPE_NAME}...`, 'info');

    try {
      const response = await fetch(PYTHON_SCRAPE_API_URL, { method: 'GET' });
      const result = await response.json();
      setScrapeResult(result);

      if (!response.ok || result.error) {
        const errorDetail = result.error || `Scraping trigger API failed with status: ${response.status}`;
        addLog(`Scraping failed for ${SCRAPE_NAME}. API Status: ${response.status}`, 'error', result);
        // Don't throw here, let the UI display the result object's error
      } else {
        addLog(`Scraping process for ${SCRAPE_NAME} API call finished. Result: ${result.message || 'Success'}`, 'success', result);
      }
    } catch (err: any) {
      console.error("Scraping Trigger Error:", err);
      const errorMsg = `Error triggering scrape for ${SCRAPE_NAME}: ${err.message}`;
      addLog(errorMsg, 'error', err);
      setScrapeResult({ error: err.message || 'An unexpected error occurred while triggering scraper.', details: err.cause || err.toString() });
    } finally {
      setIsLoading(false);
      fetchScrapeStatus(); // Refresh status after scraping attempt
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
                Manually trigger data scraping tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-1">Task: {SCRAPE_NAME}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  URL: <a href={SCRAPE_TARGET_URL} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{SCRAPE_TARGET_URL}</a>
                </p>

                <div className="mb-6 p-4 border rounded-md bg-card shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-md text-foreground/90">Data Status</h4>
                    <Button variant="ghost" size="sm" onClick={fetchScrapeStatus} disabled={isStatusLoading || isLoading}>
                      <RefreshCw className={`mr-2 h-4 w-4 ${isStatusLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                  {isStatusLoading && !scrapeStatus && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Checking status...</p>}
                  {scrapeStatus && (
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={scrapeStatus.isUpToDate ? 'default' : 'secondary'}
                        className={`${scrapeStatus.isUpToDate ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700' : 
                                      'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700'}`}
                      >
                        {isStatusLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin"/> : (scrapeStatus.isUpToDate ? <CheckCircle className="mr-1 h-3 w-3"/> : <AlertCircle className="mr-1 h-3 w-3"/>)}
                        {scrapeStatus.isUpToDate ? 'Up to date' : 'Needs Scraping'}
                      </Badge>
                      <p className="text-sm text-muted-foreground">{scrapeStatus.message}</p>
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={handleScrapeNow} disabled={isLoading || isStatusLoading} className="w-full sm:w-auto">
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
                      ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400'
                      : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'
                  }`}
                >
                  {scrapeResult.error || (scrapeResult.storageApiResponse && scrapeResult.storageApiResponse.errors && scrapeResult.storageApiResponse.errors.length > 0) ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  <AlertTitle>
                    {scrapeResult.error ? 'Scraping Operation Error'
                      : (scrapeResult.storageApiResponse && scrapeResult.storageApiResponse.errors && scrapeResult.storageApiResponse.errors.length > 0
                        ? 'Scraping Completed with Issues'
                        : 'Scraping Operation Report')}
                  </AlertTitle>
                  <AlertDescription>
                    <p>{scrapeResult.message || scrapeResult.error}</p>
                    {scrapeResult.details && <p className="text-xs mt-1">Details: {typeof scrapeResult.details === 'object' ? JSON.stringify(scrapeResult.details) : scrapeResult.details}</p>}
                    
                    {(scrapeResult.counts || (scrapeResult.storageApiResponse && scrapeResult.storageApiResponse.counts)) && (
                       <ul className="mt-2 list-disc list-inside text-sm">
                        {scrapeResult.python_records_scraped !== undefined && <li>Python records scraped: {scrapeResult.python_records_scraped}</li>}
                        
                        {scrapeResult.counts && <>
                            <li>Received raw entries: {scrapeResult.counts.rawDataEntries}</li>
                            <li>Companies newly created: {scrapeResult.counts.companiesNewlyCreated}</li>
                            <li>Market data entries for upsert: {scrapeResult.counts.marketDataEntriesForUpsert}</li>
                            <li>Market data successfully upserted: {scrapeResult.counts.marketDataSuccessfullyUpserted}</li>
                            {scrapeResult.counts.companiesFailedOperations > 0 && <li className="text-red-500 dark:text-red-400">Company operations failed: {scrapeResult.counts.companiesFailedOperations}</li>}
                            {scrapeResult.counts.marketDataFailedOperations > 0 && <li className="text-red-500 dark:text-red-400">Market data operations failed: {scrapeResult.counts.marketDataFailedOperations}</li>}
                        </>}
                        
                        {scrapeResult.storageApiResponse && scrapeResult.storageApiResponse.counts && <>
                            <li>Store API - Received raw entries: {scrapeResult.storageApiResponse.counts.rawDataEntries}</li>
                            <li>Store API - Companies newly created: {scrapeResult.storageApiResponse.counts.companiesNewlyCreated}</li>
                            <li>Store API - Market data entries for upsert: {scrapeResult.storageApiResponse.counts.marketDataEntriesForUpsert}</li>
                            <li>Store API - Market data successfully upserted: {scrapeResult.storageApiResponse.counts.marketDataSuccessfullyUpserted}</li>
                            {scrapeResult.storageApiResponse.counts.companiesFailedOperations > 0 && <li className="text-red-500 dark:text-red-400">Store API - Company operations failed: {scrapeResult.storageApiResponse.counts.companiesFailedOperations}</li>}
                            {scrapeResult.storageApiResponse.counts.marketDataFailedOperations > 0 && <li className="text-red-500 dark:text-red-400">Store API - Market data operations failed: {scrapeResult.storageApiResponse.counts.marketDataFailedOperations}</li>}
                        </>}
                      </ul>
                    )}

                     {scrapeResult.python_stderr && (
                       <div className="mt-2">
                          <p className="font-semibold">Python Script Stderr:</p>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto max-h-24">{scrapeResult.python_stderr}</pre>
                      </div>
                    )}
                    {scrapeResult.storageApiResponse && scrapeResult.storageApiResponse.errors && scrapeResult.storageApiResponse.errors.length > 0 && (
                        <div className="mt-2">
                            <p className="font-semibold">Storage API Errors:</p>
                            <ul className="list-disc list-inside text-xs">
                                {scrapeResult.storageApiResponse.errors.map((e: string, i: number) => <li key={`store-err-${i}`}>{e}</li>)}
                            </ul>
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
                Real-time logs for the current scraping session. Logs are cleared on page refresh. Max {logs.length >= 50 ? '50 (latest)' : logs.length} logs shown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/20">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No logs yet. Trigger a scrape to see activity.</p>
                ) : (
                  logs.slice(0, 50).map((log, index) => ( // Display latest 50 logs
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
