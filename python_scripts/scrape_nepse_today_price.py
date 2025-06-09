
import sys
import json
import requests
from bs4 import BeautifulSoup

# Target URL for NEPSE Today's Price
NEPSE_TODAY_PRICE_URL = 'https://nepalstock.com.np/today-price'

# Standard User-Agent
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def parse_nepse_today_price(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    scraped_data = []

    # Try to find the <app-today-price> element first
    today_price_element = soup.find('app-today-price')
    
    table_rows = []
    if today_price_element:
        # More specific search within app-today-price
        # Common patterns: table directly inside, or inside a table-responsive div
        table_in_app = today_price_element.find('table')
        if table_in_app:
            table_rows = table_in_app.find('tbody').find_all('tr') if table_in_app.find('tbody') else []
    
    # Fallback if <app-today-price> or table within it is not found by specific selectors
    if not table_rows:
        table_responsive_div = soup.find('div', class_='table-responsive')
        if table_responsive_div:
            table = table_responsive_div.find('table')
            if table and table.find('tbody'):
                table_rows = table.find('tbody').find_all('tr')

    if not table_rows: # Final fallback for any table on the page
        generic_table = soup.find('table')
        if generic_table and generic_table.find('tbody'):
            table_rows = generic_table.find('tbody').find_all('tr')
            
    for row in table_rows:
        columns = row.find_all('td')
        if len(columns) >= 10: # Expecting at least 10 columns
            # Extract text and clean up whitespace
            s_n = columns[0].get_text(strip=True)
            # For company symbol, try to get from <a> tag if present, otherwise direct text
            company_anchor = columns[1].find('a')
            company_symbol = company_anchor.get_text(strip=True) if company_anchor else columns[1].get_text(strip=True)
            ltp = columns[2].get_text(strip=True)
            change_percent_text = columns[3].get_text(strip=True) # This is '% Change', not 'Difference Rs'
            open_price = columns[4].get_text(strip=True)
            high_price = columns[5].get_text(strip=True)
            low_price = columns[6].get_text(strip=True)
            qty_traded = columns[7].get_text(strip=True)
            turnover = columns[8].get_text(strip=True)
            prev_closing = columns[9].get_text(strip=True)
            # 'Difference Rs' might be in the 11th column (index 10) if it exists
            difference_rs = columns[10].get_text(strip=True) if len(columns) > 10 else ''

            if company_symbol: # Ensure company symbol is present
                scraped_data.append({
                    "s_n": s_n,
                    "companySymbol": company_symbol,
                    "ltp": ltp,
                    "changePercent": change_percent_text, # From column 3 ('% Change')
                    "openPrice": open_price,
                    "highPrice": high_price,
                    "lowPrice": low_price,
                    "qtyTraded": qty_traded,
                    "turnover": turnover,
                    "prevClosing": prev_closing,
                    "differenceRs": difference_rs, # From column 10 if exists
                })
    return scraped_data

if __name__ == '__main__':
    try:
        # Note: For SSL issues like UNABLE_TO_VERIFY_LEAF_SIGNATURE in Python requests,
        # you might need to handle it (e.g., for dev: verify=False, but this is insecure).
        # Or ensure your Python environment's certificate store is up-to-date.
        response = requests.get(NEPSE_TODAY_PRICE_URL, headers=headers, timeout=20)
        response.raise_for_status() # Raises an HTTPError for bad responses (4XX or 5XX)
        
        parsed_data = parse_nepse_today_price(response.text)
        
        if not parsed_data:
            # Output an error message to stderr if no data was parsed, but still exit cleanly for Node.js
            # print(json.dumps({"error": "No data parsed from the page. HTML structure might have changed."}), file=sys.stderr)
            # For simplicity, if no data, output empty list to stdout, Node.js can check for empty
            print(json.dumps([]))
        else:
            print(json.dumps(parsed_data))
            
    except requests.exceptions.SSLError as e:
        error_output = {
            "error": "SSL Certificate VerificationFailed in Python script.",
            "details": str(e),
            "message": "The Python script encountered an SSL error. Your Python environment might be missing updated CA certificates, or you might be behind a proxy. For development, you can try `requests.get(url, verify=False)` but this is insecure and not recommended for production."
        }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)
    except requests.exceptions.RequestException as e:
        error_output = {
            "error": "Failed to fetch NEPSE page in Python script.",
            "details": str(e)
        }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        error_output = {
            "error": "An unexpected error occurred in the Python script.",
            "details": str(e)
        }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)
