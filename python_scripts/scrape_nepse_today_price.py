
import sys
import json
import os # For checking PATH

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
except ImportError:
    error_output = {
        "error": "Python script: Missing 'selenium' dependency.",
        "details": "The 'selenium' library is not installed in your Python environment.",
        "message": "Please install it by running: pip install selenium"
    }
    print(json.dumps(error_output), file=sys.stderr)
    sys.exit(1)

# Target URL for NEPSE Today's Price
NEPSE_TODAY_PRICE_URL = 'https://nepalstock.com.np/today-price'

def is_chromedriver_in_path():
    """Check if chromedriver is in the PATH."""
    paths = os.environ['PATH'].split(os.pathsep)
    for path_dir in paths:
        if os.path.exists(os.path.join(path_dir, 'chromedriver')) or \
           os.path.exists(os.path.join(path_dir, 'chromedriver.exe')): # for Windows
            return True
    return False

def scrape_with_selenium():
    scraped_data = []
    
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("window-size=1920,1080")
    # Selenium by default might have issues with SSL certs in some environments.
    # This is less common with Selenium itself vs raw requests, but can be an issue.
    # chrome_options.add_argument('--ignore-certificate-errors')
    # chrome_options.add_argument('--allow-insecure-localhost')


    driver = None  # Initialize driver to None for the finally block
    try:
        # Attempt to initialize WebDriver
        # For a more robust setup, especially in CI/CD or varied environments,
        // consider using webdriver_manager:
        // from webdriver_manager.chrome import ChromeDriverManager
        // driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
        # However, for now, we'll stick to expecting chromedriver in PATH or specified.
        driver = webdriver.Chrome(options=chrome_options)

    except WebDriverException as e:
        details = str(e)
        error_msg = "Python script (Selenium): Failed to initialize WebDriver."
        user_message = "Ensure chromedriver is installed, compatible with your Chrome version, and in your system's PATH. "
        
        if "executable needs to be in PATH" in details.lower():
            user_message += "Specifically, 'chromedriver' was not found. "
            if not is_chromedriver_in_path():
                 user_message += "It does not appear to be in your current PATH. "
        elif "version" in details.lower():
            user_message += "There might be a version mismatch between Chrome browser and chromedriver. "
            
        error_output = {
            "error": error_msg,
            "details": details,
            "message": user_message
        }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)
    except Exception as e: # Catch any other potential errors during driver init
        error_output = {
            "error": "Python script (Selenium): An unexpected error occurred during WebDriver initialization.",
            "details": str(e),
            "message": "Please check your Selenium and ChromeDriver setup."
        }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)


    try:
        driver.get(NEPSE_TODAY_PRICE_URL)
        
        wait = WebDriverWait(driver, 30) 
        
        app_today_price_element = wait.until(
            EC.presence_of_element_located((By.TAG_NAME, 'app-today-price'))
        )

        table_element = None
        possible_table_locators = [
            (By.CSS_SELECTOR, 'table.table'), 
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
            raise NoSuchElementException("Could not find the main data table within app-today-price element on the page.")

        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'app-today-price table tbody tr')))
        
        table_rows = table_element.find_elements(By.CSS_SELECTOR, 'tbody tr')

        if not table_rows:
            # This case means the table structure was found, but it's empty or no rows matched.
            # It's not necessarily an error with the scraper itself, could be no data on the page.
            pass # Output empty list later

        for row_element in table_rows:
            columns = row_element.find_elements(By.TAG_NAME, 'td')
            
            if len(columns) >= 10: # Ensure we have enough columns
                s_n = columns[0].text.strip()
                
                company_symbol_element = None
                try:
                    company_symbol_element = columns[1].find_element(By.TAG_NAME, 'a')
                    company_symbol = company_symbol_element.text.strip()
                except NoSuchElementException:
                    company_symbol = columns[1].text.strip()
                
                ltp = columns[2].text.strip()
                change_percent_text = columns[3].text.strip() # Keep as text, might contain % or be just a number
                open_price = columns[4].text.strip()
                high_price = columns[5].text.strip()
                low_price = columns[6].text.strip()
                qty_traded = columns[7].text.strip()
                turnover = columns[8].text.strip()
                prev_closing = columns[9].text.strip()
                difference_rs = columns[10].text.strip() if len(columns) > 10 else ''

                if company_symbol: 
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
            "message": "The page structure might have changed, or selectors need adjustment. Check if 'app-today-price' or its table structure is present."
        }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        error_output = {
            "error": "Python script (Selenium): An unexpected error occurred during scraping.",
            "details": str(e)
        }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)
    finally:
        if driver:
            driver.quit()

if __name__ == '__main__':
    scrape_with_selenium()
