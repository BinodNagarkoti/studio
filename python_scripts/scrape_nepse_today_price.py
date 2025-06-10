
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
        "message": (
            "Please install it. The recommended approach is to use a virtual environment:\n"
            "1. Ensure 'python3-venv' is installed (e.g., `sudo apt install python3-venv` on Debian/Ubuntu).\n"
            "2. Create and activate a virtual environment in your project directory:\n"
            "   `python3 -m venv venv`\n"
            "   `source venv/bin/activate` (on Linux/macOS) or `venv\\Scripts\\activate` (on Windows)\n"
            "3. Install selenium within the activated environment:\n"
            "   `pip install selenium`\n"
            "If you are not using a virtual environment (not recommended for projects), you can try installing it globally:\n"
            "   `pip3 install selenium` or `pip install selenium`"
        )
    }
    print(json.dumps(error_output), file=sys.stderr)
    sys.exit(1)

# Target URL for NEPSE Today's Price
NEPSE_TODAY_PRICE_URL = 'https://nepalstock.com.np/today-price'

def is_chromedriver_in_path():
    """Check if chromedriver is in the PATH."""
    paths = os.environ.get('PATH', '').split(os.pathsep)
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
    # SSL verification is handled by ChromeDriver/Chrome itself.
    # To disable SSL checks in Chrome (highly unrecommended, for extreme dev cases):
    # chrome_options.add_argument('--ignore-certificate-errors')
    # chrome_options.add_argument('--allow-insecure-localhost')


    driver = None
    try:
        driver = webdriver.Chrome(options=chrome_options)

    except WebDriverException as e:
        details = str(e)
        error_msg = "Python script (Selenium): Failed to initialize WebDriver."
        user_message = (
            "This usually means ChromeDriver is not set up correctly. Please ensure:\n"
            "1. ChromeDriver is installed.\n"
            "2. The version of ChromeDriver matches your installed Chrome browser version.\n"
            "3. The ChromeDriver executable is in your system's PATH.\n\n"
            "Steps to fix:\n"
            "  a. Download ChromeDriver: Go to https://chromedriver.chromium.org/downloads and download the version corresponding to your Chrome browser.\n"
            "  b. Place ChromeDriver: Extract the 'chromedriver' (or 'chromedriver.exe' on Windows) executable and place it in a directory that is part of your system's PATH (e.g., /usr/local/bin on macOS/Linux, or a specific folder added to PATH on Windows).\n"
            "  c. Verify PATH: You can check if it's in PATH by typing 'chromedriver --version' in your terminal. If it's not found, your PATH is not configured correctly for it.\n\n"
        )
        
        if "executable needs to be in path" in details.lower():
            user_message += "Specific error: 'chromedriver' executable was not found in your system's PATH. "
            if not is_chromedriver_in_path():
                 user_message += "A quick check confirms it's not in the current PATH directories. "
        elif "version" in details.lower(): # Heuristic for version mismatch
            user_message += "Specific error: There might be a version mismatch between your Chrome browser and ChromeDriver. Please download a compatible version. "
            
        error_output = {
            "error": error_msg,
            "details": details,
            "message": user_message
        }
        print(json.dumps(error_output), file=sys.stderr)
        if driver: driver.quit()
        sys.exit(1)
    except Exception as e: 
        error_output = {
            "error": "Python script (Selenium): An unexpected error occurred during WebDriver initialization.",
            "details": str(e),
            "message": "Please check your Selenium and ChromeDriver setup. Ensure ChromeDriver is in your PATH and compatible with your Chrome version. Detailed instructions can be found by re-running after ensuring 'selenium' is installed."
        }
        print(json.dumps(error_output), file=sys.stderr)
        if driver: driver.quit()
        sys.exit(1)


    try:
        driver.get(NEPSE_TODAY_PRICE_URL)
        
        wait = WebDriverWait(driver, 30) 
        
        app_today_price_element = wait.until(
            EC.presence_of_element_located((By.TAG_NAME, 'app-today-price')),
            "Timed out waiting for the 'app-today-price' element to load. The page might be slow or the element is missing."
        )

        table_element = None
        possible_table_locators = [
            (By.CSS_SELECTOR, 'table.table'), 
            (By.TAG_NAME, 'table')          
        ]
        
        for by_type, selector in possible_table_locators:
            try:
                table_element = wait.until(
                    EC.presence_of_element_located((by_type, selector)),
                    f"Timed out waiting for table with selector '{selector}' within 'app-today-price'."
                )
                if table_element:
                    break 
            except (NoSuchElementException, TimeoutException):
                continue
        
        if not table_element:
            error_output = {
                "error": "Python script (Selenium): Main data table structure not found.",
                "details": "Could not find the main data table within the 'app-today-price' element on the page using common selectors.",
                "message": "The page structure (nepalstock.com.np/today-price) might have changed significantly, or the selectors need adjustment. Verify the presence of 'app-today-price' and its table."
            }
            print(json.dumps(error_output), file=sys.stderr)
            driver.quit()
            sys.exit(1)

        wait.until(
            EC.presence_of_all_elements_located((By.CSS_SELECTOR, 'tbody tr')),
            "Timed out waiting for table rows ('tbody tr') to load within the data table."
        )
        
        table_rows = table_element.find_elements(By.CSS_SELECTOR, 'tbody tr')

        if not table_rows:
            pass # Will output empty list later.

        for row_element in table_rows:
            columns = row_element.find_elements(By.TAG_NAME, 'td')
            
            if len(columns) >= 10:
                s_n = columns[0].text.strip()
                
                company_symbol = ""
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

    except TimeoutException as e:
        error_output = {
            "error": "Python script (Selenium): Timed out waiting for page elements to load.",
            "details": f"The page at {NEPSE_TODAY_PRICE_URL} might be slow, or key elements did not appear within the timeout. Original error: {str(e)}"
        }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)
    except NoSuchElementException as e:
        error_output = {
            "error": "Python script (Selenium): Could not find a required HTML element during data extraction.",
            "details": str(e),
            "message": "The page structure for individual rows/cells might have changed, or selectors need adjustment. This usually happens after successfully finding the main table."
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

    