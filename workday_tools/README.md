# Workday Tools

A collection of Python tools for interacting with Workday HR systems via OAuth 2.0 and REST APIs.

## What's Inside

### Core Components

- **`workday_api.py`** - Reusable Workday OAuth and API functions
  - OAuth 2.0 authentication flow with browser automation
  - Token caching for efficient re-use
  - REST API calls for worker info, time-off, and absence management
  
- **`ask_hr_ai_agent/`** - Conversational AI assistant for Workday
  - Natural language chat interface powered by Google Gemini
  - Web-based UI for asking HR questions
  - Automatic time-off request handling

### Configuration

- **`config.json`** - Workday OAuth credentials (client ID, secret, tenant, etc.)
- **`.env`** - API keys (Google Gemini, etc.) - not committed to repo

## Quick Start

### Prerequisites

```bash
# Python 3.8+
pip install -r requirements.txt
```

### Setup

1. **Configure Workday OAuth**
   - Update `config.json` with your Workday tenant credentials

2. **Set API Keys**
   - Create `ask_hr_ai_agent/.env` with:
     ```
     GOOGLE_API_KEY=your_key_here
     ```

### Running the AI Agent

```bash
cd ask_hr_ai_agent
python flask_server.py
```

Open http://localhost:5000 in your browser.

## Features

### Workday API Module

- ✅ OAuth 2.0 authorization code flow with automatic browser login
- ✅ Access token management and caching
- ✅ Worker profile API (personal info, job details, service dates)
- ✅ Absence/leave balances
- ✅ Time-off request validation and submission
- ✅ Error handling for expired tokens and API failures

### AskHR AI Agent

- ✅ Natural language queries: "What's my vacation balance?"
- ✅ Conversational time-off requests: "I want to take vacation Dec 20-22"
- ✅ Context-aware responses with conversation memory
- ✅ Web-based chat interface with markdown formatting
- ✅ Automatic OAuth authentication when needed

## Project Structure

```
workday_tools/
├── workday_api.py           # Core Workday API functions
├── config.json              # OAuth credentials
├── requirements.txt         # Python dependencies
├── .gitignore              # Exclude sensitive files
│
└── ask_hr_ai_agent/
    ├── agent.py            # Gemini AI agent with tool use
    ├── flask_server.py     # Web server
    ├── .env               # API keys (not in repo)
    ├── README.md          # Detailed agent documentation
    └── templates/
        └── index.html     # Chat UI
```

## Dependencies

**Core:**
- `requests` - HTTP client for Workday APIs
- `selenium` + `webdriver-manager` - Browser automation for OAuth
- `flask` - Web server for AI agent

**AI Agent:**
- `google-generativeai` - Gemini AI with function calling

## Security Notes

- ⚠️ `.env` and `config.json` contain sensitive credentials
- ✅ `.env` is gitignored by default
- ⚠️ `config.json` is currently tracked (uncomment in .gitignore if needed)
- 🔒 OAuth tokens are cached in memory only (not persisted to disk)

## Contributing

When making changes:
1. Test OAuth flow with your Workday tenant
2. Verify AI agent responses are accurate
3. Update documentation for new features
4. Keep sensitive data out of commits

## License

Private repository - internal use only.
