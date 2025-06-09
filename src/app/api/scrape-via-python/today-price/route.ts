
import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// Define the path to your Python script
// Assumes the script is in a 'python_scripts' directory at the project root
const PYTHON_SCRIPT_PATH = path.join(process.cwd(), 'python_scripts', 'scrape_nepse_today_price.py');
const PYTHON_COMMAND = process.platform === 'win32' ? 'python' : 'python3'; // Or just 'python'

// Define the type for the data expected from the Python script
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

export async function GET(request: Request) {
  // Determine the base URL for the internal API call
  // In development, it's likely http://localhost:PORT
  // In production, it would be your deployed app's URL
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const internalApiBaseUrl = `${protocol}://${host}`;

  try {
    console.log(`Attempting to spawn Python: Command='${PYTHON_COMMAND}', Script='${PYTHON_SCRIPT_PATH}'`);
    const pythonProcess = spawn(PYTHON_COMMAND, [PYTHON_SCRIPT_PATH]);

    let scriptOutput = '';
    let scriptError = '';

    pythonProcess.stdout.on('data', (data) => {
      scriptOutput += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      scriptError += data.toString();
    });

    const executionResult = await new Promise<{ success: boolean; data?: any; error?: string, details?: any }>((resolve) => {
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const jsonData = JSON.parse(scriptOutput);
            resolve({ success: true, data: jsonData });
          } catch (parseError: any) {
            resolve({ success: false, error: 'Failed to parse JSON output from Python script.', details: parseError.message + " Raw output: " + scriptOutput.substring(0, 500) });
          }
        } else {
           let errorMessage = `Python script exited with code ${code}.`;
           let errorDetails = scriptError;
           // Try to parse scriptError if it looks like JSON (our Python script outputs JSON errors to stderr)
           try {
                const parsedStderr = JSON.parse(scriptError);
                if (parsedStderr.error) errorMessage = parsedStderr.error;
                if (parsedStderr.details) errorDetails = parsedStderr.details;
                if (parsedStderr.message) errorMessage += " Message: " + parsedStderr.message;
           } catch (e) { /* ignore if stderr is not JSON */ }
           
          resolve({ success: false, error: errorMessage, details: errorDetails });
        }
      });

      pythonProcess.on('error', (err: NodeJS.ErrnoException) => { // Handle errors like script not found
        if (err.code === 'ENOENT') {
            resolve({ success: false, error: `Failed to start Python script: Command '${PYTHON_COMMAND}' not found. Please ensure Python 3 is installed and in your system's PATH.`, details: err.message });
        } else {
            resolve({ success: false, error: 'Failed to start Python script.', details: err.message });
        }
      });
    });

    if (!executionResult.success) {
      console.error('Python script execution failed:', executionResult.error, executionResult.details);
      return NextResponse.json({ error: executionResult.error, details: executionResult.details, python_stderr: scriptError.substring(0, 500) }, { status: 500 });
    }
    
    const scrapedDataFromPython = executionResult.data as NepseTodayPriceScrapedRow[];

    if (!Array.isArray(scrapedDataFromPython)) {
        return NextResponse.json({ error: "Data from Python script was not an array.", received: scrapedDataFromPython, python_stderr: scriptError.substring(0, 500) }, { status: 500 });
    }
    if (scrapedDataFromPython.length === 0) {
      // Check if the Python script might have "signaled" an error by returning an empty array after printing to stderr
      if (scriptError) {
         console.warn('Python script returned empty data but had stderr output:', scriptError);
         // Potentially parse scriptError if it's JSON for a more specific message
         try {
            const parsedErr = JSON.parse(scriptError);
            if (parsedErr.error) {
                 return NextResponse.json({ message: "Python script reported an issue.", details: parsedErr, python_stderr: scriptError.substring(0, 500) }, { status: 200 });
            }
         } catch(e) {/* ignore */}
         return NextResponse.json({ message: "Python script returned no data, potentially with errors (check server logs for stderr).", python_stderr: scriptError.substring(0,500) }, { status: 200 });
      }
      return NextResponse.json({ message: "Python script executed successfully but found no data to scrape." }, { status: 200 });
    }

    // Now, POST this data to your existing /api/scrape/today-price endpoint
    const storeResponse = await fetch(`${internalApiBaseUrl}/api/scrape/today-price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
         // Add any necessary auth headers if your internal API is protected
      },
      body: JSON.stringify(scrapedDataFromPython),
    });

    const storeResult = await storeResponse.json();

    if (!storeResponse.ok) {
      // The call to the storing API failed
      console.error('Failed to store data via internal API:', storeResult);
      return NextResponse.json({ 
        error: "Data scraped via Python, but failed to store it.", 
        details: storeResult.error || `Storing API responded with status ${storeResponse.status}` ,
        python_data_sample: scrapedDataFromPython.slice(0,2),
        python_stderr: scriptError.substring(0, 500),
        storageApiResponse: storeResult // Include the full response from the storage API for debugging
      }, { status: storeResponse.status });
    }

    // Successfully scraped via Python and sent to store API
    return NextResponse.json({ 
      message: "Data successfully scraped via Python and sent for storage.", 
      storageApiResponse: storeResult,
      python_records_scraped: scrapedDataFromPython.length,
      python_stderr: scriptError ? scriptError.substring(0, 500) : undefined
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in Python scraping trigger API:', error);
    return NextResponse.json({ error: 'An unexpected error occurred in the Python trigger API.', details: error.message }, { status: 500 });
  }
}
