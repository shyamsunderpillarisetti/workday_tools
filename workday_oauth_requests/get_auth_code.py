

#!/usr/bin/env python3
"""Automated OAuth Authorization Code Flow using Selenium"""

import argparse
import json
import os
import sys
import time
import urllib.parse
from urllib.parse import urlparse, parse_qs

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import WebDriverException
from webdriver_manager.chrome import ChromeDriverManager


def load_config_file(config_path):
    if not os.path.exists(config_path):
        print(f"Error: Config file not found: {config_path}")
        sys.exit(1)
    
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in config file: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading config file: {e}")
        sys.exit(1)


def get_authorization_code_with_browser(auth_url, response_type, client_id, redirect_uri, scope, state=None, headless=False):
    params = {
        'response_type': response_type,
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'scope': scope
    }
    
    if state:
        params['state'] = state
    
    full_auth_url = f"{auth_url}?{urllib.parse.urlencode(params)}"
    
    print("\n" + "=" * 60)
    print("Starting Automated Browser OAuth Flow")
    print("=" * 60)
    print(f"\nAuthorization URL: {full_auth_url}\n")
    
    chrome_options = Options()
    chrome_options.add_argument('--ignore-certificate-errors')
    chrome_options.add_argument('--ignore-ssl-errors')
    chrome_options.add_argument('--allow-insecure-localhost')
    chrome_options.add_argument('--disable-web-security')
    
    if headless:
        chrome_options.add_argument('--headless')
    
    try:
        print("Initializing Chrome browser...")
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        print("Browser opened. Navigating to authorization URL...")
        print("\nPLEASE LOG IN AND AUTHORIZE in the browser window that opened.\n")
        
        driver.get(full_auth_url)
        
        print("Waiting for authorization and redirect...")
        print("(Monitoring URL for authorization code...)\n")
        
        max_wait_time = 300
        start_time = time.time()
        auth_code = None
        
        while time.time() - start_time < max_wait_time:
            current_url = driver.current_url
            
            if redirect_uri.split('?')[0] in current_url or 'localhost' in current_url:
                print(f"Callback detected: {current_url}")
                
                parsed_url = urlparse(current_url)
                query_params = parse_qs(parsed_url.query)
                
                if parsed_url.fragment:
                    fragment_params = parse_qs(parsed_url.fragment)
                    query_params.update(fragment_params)
                
                if 'code' in query_params:
                    auth_code = query_params['code'][0]
                    print(f"\n✓ Authorization code captured successfully!")
                    break
                elif 'error' in query_params:
                    error = query_params['error'][0]
                    error_desc = query_params.get('error_description', ['Unknown error'])[0]
                    print(f"\n✗ Authorization error: {error}")
                    print(f"Description: {error_desc}")
                    break
            
            time.sleep(0.5)
        
        driver.quit()
        
        if not auth_code:
            if time.time() - start_time >= max_wait_time:
                print("\n✗ Timeout: Authorization not completed within 5 minutes")
            else:
                print("\n✗ No authorization code received")
        
        return auth_code
        
    except WebDriverException as e:
        print(f"\nBrowser error: {e}")
        print("\nMake sure Chrome browser is installed on your system.")
        return None
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    parser = argparse.ArgumentParser(
        description='Get OAuth authorization code with automated browser',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  %(prog)s --config config.json
  %(prog)s --auth-url https://example.com/oauth/authorize --client-id YOUR_ID --scope "read write" --redirect-uri https://localhost:8443/callback
        '''
    )
    
    parser.add_argument('--config', help='Path to JSON configuration file')
    parser.add_argument('--auth-url', help='Authorization endpoint URL')
    parser.add_argument('--response-type', help='OAuth response type (default: code)')
    parser.add_argument('--client-id', help='OAuth client ID')
    parser.add_argument('--redirect-uri', help='Redirect URI')
    parser.add_argument('--scope', help='OAuth scope (space-separated)')
    parser.add_argument('--state', help='Optional state parameter for CSRF protection')
    parser.add_argument('--headless', action='store_true', help='Run browser in headless mode (no UI)')
    
    args = parser.parse_args()
    
    config = {}
    if args.config:
        config = load_config_file(args.config)
        print(f"Loaded configuration from: {args.config}\n")
    
    auth_url = args.auth_url or config.get('auth_url')
    response_type = args.response_type or config.get('response_type', 'code')
    client_id = args.client_id or config.get('client_id')
    redirect_uri = args.redirect_uri or config.get('redirect_uri')
    scope = args.scope or config.get('scope')
    state = args.state or config.get('state')
    
    if not auth_url:
        print("Error: --auth-url is required")
        sys.exit(1)
    if not client_id:
        print("Error: --client-id is required")
        sys.exit(1)
    if not redirect_uri:
        print("Error: --redirect-uri is required")
        sys.exit(1)
    if not scope:
        print("Error: --scope is required")
        sys.exit(1)
    
    print("=" * 60)
    print("OAuth Authorization Code Flow (Automated)")
    print("=" * 60)
    print(f"\nConfiguration:")
    print(f"  Authorization URL: {auth_url}")
    print(f"  Response Type: {response_type}")
    print(f"  Client ID: {client_id}")
    print(f"  Redirect URI: {redirect_uri}")
    print(f"  Scope: {scope}")
    if state:
        print(f"  State: {state}")
    
    auth_code = get_authorization_code_with_browser(
        auth_url=auth_url,
        response_type=response_type,
        client_id=client_id,
        redirect_uri=redirect_uri,
        scope=scope,
        state=state,
        headless=args.headless
    )
    
    if auth_code:
        print("\n" + "=" * 60)
        print("SUCCESS!")
        print("=" * 60)
        print(f"\nAuthorization Code: {auth_code}")
        print("\n" + "=" * 60)
    else:
        print("\n" + "=" * 60)
        print("FAILED!")
        print("=" * 60)
        print("\nFailed to get authorization code")
        sys.exit(1)


if __name__ == "__main__":
    main()

