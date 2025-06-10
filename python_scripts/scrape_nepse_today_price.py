
import sys
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Target URL for NEPSE Today's Price
NEPSE_TODAY_PRICE_URL = 'https://nepalstock.com.np/today-price'

def scrape_with_selenium():
    scraped_data = []
    
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in headless mode
    chrome_options.add_argument("--disable-gpu") # Optional, recommended for headless
    chrome_options.add_argument("--no-sandbox") # Bypass OS security model, required on Linux if running as root
    chrome_options.add_argument("--disable-dev-shm-usage") # Overcome limited resource problems
    chrome_options.add_argument("window-size=1920,1080") # Specify window size

    # Ensure chromedriver is in your PATH or provide the explicit path to the executable
    # Example: service = Service(executable_path='/path/to/chromedriver')
    # If chromedriver is in PATH, Service() is often enough or can be omitted in newer Selenium versions
    try:
        driver = webdriver.Chrome(options=chrome_options)
    except Exception as e:
        error_output = {
            "error": "Python script (Selenium): Failed to initialize WebDriver.",
            "details": str(e),
            "message": "Ensure chromedriver is installed, compatible with your Chrome version, and in your system's PATH or specified."
        }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)

    try:
        driver.get(NEPSE_TODAY_PRICE_URL)
        
        # Wait for the main table within app-today-price to be present
        # Increased timeout for potentially slow-loading JS-heavy pages
        wait = WebDriverWait(driver, 30) 
        
        # Locate the app-today-price element first
        app_today_price_element = wait.until(
            EC.presence_of_element_located((By.TAG_NAME, 'app-today-price'))
        )

        # Then find the table within it. Try a few common structures.
        table_element = None
        possible_table_locators = [
            (By.CSS_SELECTOR, 'table.table'), # More specific if it has 'table' class
            (By.TAG_NAME, 'table')
        ]
        
        for by_type, selector in possible_table_locators:
            try:
                table_element = app_today_price_element.find_element(by_type, selector)
                if table_element:
                    break
            except NoSuchElementException:
                continue
        
        if not table_element:
            raise NoSuchElementException("Could not find the main data table within app-today-price.")

        # Wait for table body rows to be loaded, identified by at least one `<tr>` in `<tbody>`
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'app-today-price table tbody tr')))
        
        table_rows = table_element.find_elements(By.CSS_SELECTOR, 'tbody tr')

        if not table_rows:
            # Table structure found, but no data rows
            print(json.dumps([])) # Output empty list as per previous script's behavior
            return

        for row_element in table_rows:
            columns = row_element.find_elements(By.TAG_NAME, 'td')
            
            if len(columns) >= 10:
                s_n = columns[0].text.strip()
                
                # Company symbol might be in an anchor tag
                company_symbol_element = None
                try:
                    company_symbol_element = columns[1].find_element(By.TAG_NAME, 'a')
                    company_symbol = company_symbol_element.text.strip()
                except NoSuchElementException:
                    company_symbol = columns[1].text.strip()
                
                ltp = columns[2].text.strip()
                change_percent_text = columns[3].text.strip()
                open_price = columns[4].text.strip()
                high_price = columns[5].text.strip()
                low_price = columns[6].text.strip()
                qty_traded = columns[7].text.strip()
                turnover = columns[8].text.strip()
                prev_closing = columns[9].text.strip()
                difference_rs = columns[10].text.strip() if len(columns) > 10 else ''

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
        
        print(json.dumps(scraped_data))

    except TimeoutException:
        error_output = {
            "error": "Python script (Selenium): Timed out waiting for page elements to load.",
            "details": f"Check if the page structure of {NEPSE_TODAY_PRICE_URL} has changed or if the page is very slow."
        }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)
    except NoSuchElementException as e:
        error_output = {
            "error": "Python script (Selenium): Could not find a required HTML element.",
            "details": str(e),
            "message": "The page structure might have changed, or selectors need adjustment."
        }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        error_output = {
            "error": "Python script (Selenium): An unexpected error occurred.",
            "details": str(e)
        }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)
    finally:
        if 'driver' in locals() and driver is not None:
            driver.quit()

if __name__ == '__main__':
    scrape_with_selenium()

    