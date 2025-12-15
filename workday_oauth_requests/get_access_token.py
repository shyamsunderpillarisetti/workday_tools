#!/usr/bin/env python3
"""Get OAuth 2.0 access token using authorization code"""

import argparse
import json
import os
import sys
import requests


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


def get_access_token(token_url, grant_type, code, client_id, client_secret, redirect_uri, scope=None):
    print("\n" + "=" * 60)
    print("Exchanging Authorization Code for Access Token")
    print("=" * 60)
    
    data = {
        'grant_type': grant_type,
        'code': code,
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': redirect_uri
    }
    
    if scope:
        data['scope'] = scope
    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    print(f"\nToken URL: {token_url}")
    print(f"Grant Type: {grant_type}")
    print(f"Client ID: {client_id}")
    print(f"Redirect URI: {redirect_uri}")
    if scope:
        print(f"Scope: {scope}")
    print("\nSending token request...")
    
    try:
        response = requests.post(token_url, data=data, headers=headers, timeout=30)
        
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            return token_data
        else:
            print(f"\nError Response:")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2))
            except:
                print(response.text)
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"\nRequest error: {e}")
        return None
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    parser = argparse.ArgumentParser(
        description='Get OAuth 2.0 access token using authorization code',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
    %(prog)s --config config.json --code YOUR_AUTH_CODE
  %(prog)s --token-url https://example.com/token --code CODE --client-id ID --client-secret SECRET --redirect-uri URI
        '''
    )
    
    parser.add_argument('--config', help='Path to JSON configuration file')
    parser.add_argument('--token-url', help='Token endpoint URL')
    parser.add_argument('--grant-type', help='OAuth grant type (default: authorization_code)')
    parser.add_argument('--code', required=True, help='Authorization code from previous step')
    parser.add_argument('--client-id', help='OAuth client ID')
    parser.add_argument('--client-secret', help='OAuth client secret')
    parser.add_argument('--redirect-uri', help='Redirect URI (must match the one used in authorization)')
    parser.add_argument('--scope', help='OAuth scope (space-separated)')
    
    args = parser.parse_args()
    
    config = {}
    if args.config:
        config = load_config_file(args.config)
        print(f"Loaded configuration from: {args.config}\n")
    
    token_url = args.token_url or config.get('token_url')
    grant_type = args.grant_type or config.get('grant_type', 'authorization_code')
    client_id = args.client_id or config.get('client_id')
    client_secret = args.client_secret or config.get('client_secret')
    redirect_uri = args.redirect_uri or config.get('redirect_uri')
    scope = args.scope or config.get('scope')
    
    if not token_url:
        print("Error: --token-url is required")
        sys.exit(1)
    if not client_id:
        print("Error: --client-id is required")
        sys.exit(1)
    if not client_secret:
        print("Error: --client-secret is required")
        sys.exit(1)
    if not redirect_uri:
        print("Error: --redirect-uri is required")
        sys.exit(1)
    
    print("=" * 60)
    print("OAuth 2.0 Token Exchange")
    print("=" * 60)
    
    token_data = get_access_token(
        token_url=token_url,
        grant_type=grant_type,
        code=args.code,
        client_id=client_id,
        client_secret=client_secret,
        redirect_uri=redirect_uri,
        scope=scope
    )
    
    if token_data:
        print("\n" + "=" * 60)
        print("SUCCESS!")
        print("=" * 60)
        print("\nToken Response:")
        print(json.dumps(token_data, indent=2))
        
        if 'access_token' in token_data:
            print("\n" + "=" * 60)
            print(f"Access Token: {token_data['access_token']}")
            if 'refresh_token' in token_data:
                print(f"Refresh Token: {token_data['refresh_token']}")
            if 'expires_in' in token_data:
                print(f"Expires In: {token_data['expires_in']} seconds")
            print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("FAILED!")
        print("=" * 60)
        print("\nFailed to get access token")
        sys.exit(1)


if __name__ == "__main__":
    main()
