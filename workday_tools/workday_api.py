#!/usr/bin/env python3
"""Workday OAuth 2.0 Module - Reusable functions for agents"""

import json
import os
import sys
import time
import urllib.parse
import requests
from urllib.parse import urlparse, parse_qs

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import WebDriverException
from webdriver_manager.chrome import ChromeDriverManager


def load_config(config_path):
    """Load configuration from JSON file"""
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Config file not found: {config_path}")
    
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in config file: {e}")
    except Exception as e:
        raise Exception(f"Error reading config file: {e}")


def get_auth_code(config_path=None, auth_url=None, client_id=None, redirect_uri=None, scope=None, response_type="code"):
    """
    Get OAuth authorization code using automated browser
    
    Args:
        config_path: Path to JSON config file (if provided, other args ignored)
        auth_url: Authorization endpoint URL
        client_id: OAuth client ID
        redirect_uri: Redirect URI
        scope: OAuth scope
        response_type: OAuth response type
    
    Returns:
        Authorization code string or None
    """
    config = {}
    if config_path:
        config = load_config(config_path)
    
    auth_url = auth_url or config.get('auth_url')
    client_id = client_id or config.get('client_id')
    redirect_uri = redirect_uri or config.get('redirect_uri')
    scope = scope or config.get('scope')
    response_type = response_type or config.get('response_type', 'code')
    
    if not auth_url or not client_id or not redirect_uri or not scope:
        raise ValueError("Missing required parameters: auth_url, client_id, redirect_uri, scope")
    
    params = {
        'response_type': response_type,
        'client_id': client_id,
        'redirect_uri': redirect_uri,
        'scope': scope
    }
    
    full_auth_url = f"{auth_url}?{urllib.parse.urlencode(params)}"
    
    chrome_options = Options()
    chrome_options.add_argument('--ignore-certificate-errors')
    chrome_options.add_argument('--ignore-ssl-errors')
    chrome_options.add_argument('--allow-insecure-localhost')
    chrome_options.add_argument('--disable-web-security')
    
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        driver.get(full_auth_url)
        
        max_wait_time = 300
        start_time = time.time()
        
        while time.time() - start_time < max_wait_time:
            current_url = driver.current_url
            
            if redirect_uri.split('?')[0] in current_url or 'localhost' in current_url:
                parsed_url = urlparse(current_url)
                query_params = parse_qs(parsed_url.query)
                
                if parsed_url.fragment:
                    fragment_params = parse_qs(parsed_url.fragment)
                    query_params.update(fragment_params)
                
                if 'code' in query_params:
                    auth_code = query_params['code'][0]
                    driver.quit()
                    return auth_code
                elif 'error' in query_params:
                    error = query_params['error'][0]
                    driver.quit()
                    raise Exception(f"Authorization error: {error}")
            
            time.sleep(0.5)
        
        driver.quit()
        raise TimeoutError("Authorization not completed within 5 minutes")
        
    except WebDriverException as e:
        raise Exception(f"Browser error: {e}. Make sure Chrome is installed.")
    except Exception as e:
        raise e


def get_access_token(config_path=None, code=None, token_url=None, grant_type=None, 
                     client_id=None, client_secret=None, redirect_uri=None, scope=None):
    """
    Exchange authorization code for access token
    
    Args:
        config_path: Path to JSON config file
        code: Authorization code (required)
        token_url: Token endpoint URL
        grant_type: OAuth grant type
        client_id: OAuth client ID
        client_secret: OAuth client secret
        redirect_uri: Redirect URI
        scope: OAuth scope
    
    Returns:
        Token response dict with access_token, refresh_token, etc.
    """
    config = {}
    if config_path:
        config = load_config(config_path)
    
    if not code:
        raise ValueError("Authorization code is required")
    
    token_url = token_url or config.get('token_url')
    grant_type = grant_type or config.get('grant_type', 'authorization_code')
    client_id = client_id or config.get('client_id')
    client_secret = client_secret or config.get('client_secret')
    redirect_uri = redirect_uri or config.get('redirect_uri')
    scope = scope or config.get('scope')
    
    if not token_url or not client_id or not client_secret or not redirect_uri:
        raise ValueError("Missing required parameters: token_url, client_id, client_secret, redirect_uri")
    
    data = {
        'grant_type': grant_type,
        'code': code,
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': redirect_uri
    }
    
    if scope:
        data['scope'] = scope
    
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    try:
        response = requests.post(token_url, data=data, headers=headers, timeout=30)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Token request failed with status {response.status_code}: {response.text}")
            
    except requests.exceptions.RequestException as e:
        raise Exception(f"Request error: {e}")


def extract_workday_id(user_data):
    """Extract a Workday ID from a user payload."""
    if not isinstance(user_data, dict):
        return None
    return (
        user_data.get('id')
        or user_data.get('workerId')
        or user_data.get('worker_id')
        or user_data.get('workdayId')
        or user_data.get('workday_id')
    )


def get_workday_data_merged(base_url, tenant, access_token, endpoints):
    """Fetch data from multiple endpoints and merge into single response
    
    Args:
        base_url: Workday base URL
        tenant: Workday tenant name
        access_token: OAuth access token
        endpoints: List of endpoint URLs to fetch
    
    Returns:
        Merged dict with data from all successful endpoints
    """
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json'
    }
    
    merged_data = {}
    errors = {}
    endpoint_responses = {}
    
    for url in endpoints:
        try:
            response = requests.get(url, headers=headers, timeout=30)
            if response.status_code == 200:
                data = response.json()
                endpoint_name = url.split('/')[-1] if '/' in url else url
                endpoint_responses[endpoint_name] = data
                # Merge, with later endpoints overwriting earlier ones for duplicate keys
                merged_data.update(data)
            else:
                errors[url] = f"Status {response.status_code}"
        except requests.exceptions.RequestException as e:
            errors[url] = str(e)
    
    if not merged_data:
        detail = "; ".join([f"{url} -> {err}" for url, err in errors.items()])
        raise Exception(f"Failed to get data from any endpoint. Attempts: {detail}")
    
    # Add debug info about which endpoints succeeded/failed and their individual responses
    merged_data['_fetch_errors'] = errors if errors else None
    merged_data['_endpoint_responses'] = endpoint_responses
    
    return merged_data


def complete_oauth_flow(config_path):
    """
    Complete OAuth flow in one function
    
    Args:
        config_path: Path to JSON config file
    
    Returns:
        Dict with auth_code, access_token, refresh_token, user_data
    """
    config = load_config(config_path)
    
    # Step 1: Get auth code
    auth_code = get_auth_code(config_path=config_path)
    
    # Step 2: Get access token
    token_data = get_access_token(config_path=config_path, code=auth_code)
    access_token = token_data['access_token']
    
    # Step 3: Get user info
    base_url = config.get('base_url')
    tenant = config.get('tenant')

    if not base_url or not tenant:
        token_url = config.get('token_url', '')
        if '/ccx/' in token_url:
            base_url = base_url or token_url.split('/ccx')[0]
            parts = token_url.split('/')
            tenant = tenant or (parts[-2] if len(parts) >= 2 else None)

    if not base_url or not tenant:
        raise ValueError("Missing base_url or tenant in config; please set them explicitly")

    # Keep endpoint selection in code (not config) to avoid drift
    primary_endpoints = [
        f"{base_url}/api/staffing/v7/{tenant}/workers/me",
        f"{base_url}/api/staffing/v7/{tenant}/workers/me/serviceDates",
        f"{base_url}/api/person/v4/{tenant}/people/me/legalName",
    ]

    # Fetch and merge data from all endpoints
    user_data = get_workday_data_merged(base_url, tenant, access_token, primary_endpoints)
    workday_id = extract_workday_id(user_data)
    
    # Fetch absence data if workday_id is available
    if workday_id:
        absence_endpoints = [
            f"{base_url}/api/absenceManagement/v3/{tenant}/balances?worker={workday_id}",
        ]
        try:
            absence_data = get_workday_data_merged(base_url, tenant, access_token, absence_endpoints)
            # Merge absence data into user_data
            user_data['absence_balances'] = absence_data
        except Exception as e:
            user_data['absence_error'] = str(e)
    
    return {
        'auth_code': auth_code,
        'access_token': access_token,
        'refresh_token': token_data.get('refresh_token'),
        'user_data': user_data,
        'workday_id': workday_id,
        'debug': {
            'primary_endpoints': primary_endpoints,
            'base_url': base_url,
            'tenant': tenant
        }
    }
