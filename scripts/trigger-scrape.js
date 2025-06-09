// scripts/trigger-scrape.js
const http = require('http');

// Ensure this port matches your Next.js development server port
const port = process.env.PORT || 9002; 
const endpoint = '/api/scrape/today-price'; // The specific endpoint to call

const options = {
  hostname: 'localhost',
  port: port,
  path: endpoint,
  method: 'GET',
  headers: {
    'User-Agent': 'npm-script-scraper-trigger/1.0' // Good practice to set a User-Agent
  }
};

console.log(`Triggering scraper at http://localhost:${port}${endpoint} ...`);

const req = http.request(options, (res) => {
  console.log(`\nResponse Status: ${res.statusCode}`);
  
  let rawData = '';
  res.setEncoding('utf8');
  
  res.on('data', (chunk) => {
    rawData += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse Body:');
    try {
      // Attempt to parse if JSON, otherwise print raw
      const parsedData = JSON.parse(rawData);
      console.log(JSON.stringify(parsedData, null, 2));
    } catch (e) {
      // If not JSON, print as is
      console.log(rawData);
    }
    
    console.log('\nScraping trigger finished.');
    // Exit with an error code if the status code indicates failure
    if (res.statusCode !== 200 && res.statusCode !== 207) { // 207 is Multi-Status for partial success
        console.error(`Scraping process might have encountered issues. Status: ${res.statusCode}`);
        process.exit(1); 
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
  console.error('Please ensure your Next.js development server is running and accessible.');
  process.exit(1); // Exit with error code
});

// End the request
req.end();
