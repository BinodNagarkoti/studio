
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
    table_found_flag = False # Flag to track if a table structure was found

    # Try to find the <app-today-price> element first
    today_price_element = soup.find('app-today-price')
    
    table_rows = []
    if today_price_element:
        # More specific search within app-today-price
        table_in_app = today_price_element.find('table')
        if table_in_app and table_in_app.find('tbody'):
            table_rows = table_in_app.find('tbody').find_all('tr')
            if table_rows: # Check if rows were actually found
                table_found_flag = True
            elif table_in_app: # Table tag found, but no tbody or no rows
                 table_found_flag = True # Consider table structure found even if empty for now

    # Fallback if <app-today-price> or table within it is not found or empty
    if not table_found_flag:
        table_responsive_div = soup.find('div', class_='table-responsive')
        if table_responsive_div:
            table = table_responsive_div.find('table')
            if table and table.find('tbody'):
                table_rows = table.find('tbody').find_all('tr')
                if table_rows:
                    table_found_flag = True
                elif table:
                    table_found_flag = True


    if not table_found_flag: # Final fallback for any table on the page
        generic_table = soup.find('table')
        if generic_table and generic_table.find('tbody'):
            table_rows = generic_table.find('tbody').find_all('tr')
            if table_rows:
                table_found_flag = True
            elif generic_table:
                table_found_flag = True
            
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
                    "changePercent": change_percent_text, 
                    "openPrice": open_price,
                    "highPrice": high_price,
                    "lowPrice": low_price,
                    "qtyTraded": qty_traded,
                    "turnover": turnover,
                    "prevClosing": prev_closing,
                    "differenceRs": difference_rs, 
                })
    
    if not scraped_data:
        if not table_found_flag:
            # If the table structure itself was not identified by any selector
            # This is a more critical error than an empty table.
            error_output = {
                "error": "Python script: Could not find the data table structure on the page.",
                "details": "HTML structure might have significantly changed, or the page content is unexpected."
            }
            print(json.dumps(error_output), file=sys.stderr)
            sys.exit(1) # Exit with an error code
        else:
            # Table structure was found, but it yielded no processable data rows (e.g., table was empty or rows didn't meet criteria)
            # Output empty list to stdout; Node.js will interpret this as "no data to scrape"
            print(json.dumps([]))
    else:
        print(json.dumps(scraped_data))


if __name__ == '__main__':
    try:
        response = requests.get(NEPSE_TODAY_PRICE_URL, headers=headers, timeout=20)
        response.raise_for_status() 
        
        parse_nepse_today_price(response.text) # Function now handles its own printing or exit
            
    except requests.exceptions.SSLError as e:
        error_output = {
            "error": "Python script: SSL Certificate Verification Failed.",
            "details": str(e),
            "message": "The Python script encountered an SSL error. Your Python environment might be missing updated CA certificates, or you might be behind a proxy. For development, you can try `requests.get(url, verify=False)` but this is insecure and not recommended for production."
        }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)
    except requests.exceptions.RequestException as e:
        error_output = {
            "error": "Python script: Failed to fetch NEPSE page.",
            "details": str(e)
        }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        error_output = {
            "error": "Python script: An unexpected error occurred during parsing or execution.",
            "details": str(e)
        }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)

