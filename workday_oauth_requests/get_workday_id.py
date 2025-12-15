#!/usr/bin/env python3
"""Get Workday user information using access token"""

import argparse
import json
import sys
import requests


def get_workday_user_info(base_url, tenant, access_token):
    print("\n" + "=" * 60)
    print("Fetching Workday User Information")
    print("=" * 60)
    
    endpoints = [
        f"{base_url}/ccx/api/v1/{tenant}/workers/me",
        f"{base_url}/ccx/api/v1/{tenant}/workers",
        f"{base_url}/ccx/oauth2/userinfo"
    ]
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Accept': 'application/json'
    }
    
    for url in endpoints:
        print(f"\nTrying: {url}")
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            
            print(f"Response Status: {response.status_code}")
            
            if response.status_code == 200:
                user_data = response.json()
                print(f"✓ Success with endpoint: {url}")
                return user_data
            else:
                print(f"✗ Failed")
                
        except requests.exceptions.RequestException as e:
            print(f"✗ Request error: {e}")
            continue
    
    return None


def main():
    parser = argparse.ArgumentParser(
        description='Get Workday user information using access token',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  %(prog)s --base-url https://wd5-impl-services1.workday.com --tenant michaels1 --token YOUR_ACCESS_TOKEN
        '''
    )
    
    parser.add_argument('--base-url', required=True, help='Workday base URL (e.g., https://wd5-impl-services1.workday.com)')
    parser.add_argument('--tenant', required=True, help='Workday tenant name (e.g., michaels1)')
    parser.add_argument('--token', required=True, help='Access token')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Workday User Information Retrieval")
    print("=" * 60)
    
    user_data = get_workday_user_info(
        base_url=args.base_url,
        tenant=args.tenant,
        access_token=args.token
    )
    
    if user_data:
        print("\n" + "=" * 60)
        print("SUCCESS!")
        print("=" * 60)
        print("\nUser Information:")
        print(json.dumps(user_data, indent=2))
        
        if 'sub' in user_data:
            print("\n" + "=" * 60)
            print(f"Workday ID: {user_data['sub']}")
            print("=" * 60)
        
        if 'workday_id' in user_data:
            print("\n" + "=" * 60)
            print(f"Workday ID: {user_data['workday_id']}")
            print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("FAILED!")
        print("=" * 60)
        print("\nFailed to get user information")
        sys.exit(1)


if __name__ == "__main__":
    main()
