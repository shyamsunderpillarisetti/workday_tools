# AskHR AI Agent

A conversational AI assistant that helps you interact with your Workday HR information through natural language chat.

## What Does It Do?

AskHR AI lets you:
- Ask questions about your personal information, job details, and service dates
- Check your leave balances (vacation, sick leave, etc.)
- Request time off through natural conversation
- Get answers without navigating through Workday's interface

## How It Works

### The Big Picture

```
User → Web Browser → Flask Server → Gemini AI Agent → Workday API
                                           ↓
                                    Your HR Data
```

1. **You type a question** in the web interface
2. **Flask server** receives your message and passes it to the AI agent
3. **Gemini AI** understands your question and decides what information it needs
4. **Workday API** is called to fetch your actual HR data (using OAuth authentication)
5. **AI formats the response** in natural language and sends it back to you
6. **You see the answer** in the chat interface

### Key Components

#### 1. **Web Interface** (`templates/index.html`)
- The chat window you see in your browser
- Sends your messages to the server
- Displays AI responses with nice formatting
- Handles loading animations while waiting for responses

#### 2. **Flask Server** (`flask_server.py`)
- The web server that runs on your computer (port 5000)
- Receives messages from the browser
- Passes them to the AI agent
- Sends responses back to the browser
- **Simple role**: Just a messenger between the web page and the AI

#### 3. **AI Agent** (`agent.py`)
- **The brain of the system**
- Uses Google's Gemini AI model to understand your questions
- Has access to three "tools" (functions it can call):
  - `get_workday_id()` - Gets your complete HR profile
  - `check_valid_dates()` - Validates dates for time-off requests
  - `submit_time_off()` - Submits time-off requests
- Maintains conversation history so it remembers what you talked about
- Follows guidelines on how to respond (friendly, professional, helpful)

#### 4. **Workday API Module** (`../workday_api.py`)
- Handles all communication with Workday
- **OAuth Authentication**: Securely logs you into Workday
  - Opens a browser window for you to log in
  - Gets an access token to make API calls
  - Caches the token so you don't have to log in repeatedly
- **API Calls**: Fetches your data from Workday's servers
- **Error Handling**: Deals with expired tokens, network issues, etc.

## File Structure

```
ask_hr_ai_agent/
├── agent.py              # AI agent with Gemini and tool definitions
├── flask_server.py       # Web server
├── templates/
│   └── index.html        # Chat interface
└── .env                  # Your API keys (keep secret!)

workday_tools/
├── workday_api.py        # Workday API integration
└── config.json           # Workday OAuth credentials
```

## How the AI Makes Decisions

The AI agent follows this thought process:

1. **Read your message**: "What's my vacation balance?"
2. **Decide what to do**: "I need to call `get_workday_id()` to get leave balances"
3. **Call the tool**: Executes `get_workday_id()` which fetches data from Workday
4. **Process the result**: Receives JSON with all your HR data
5. **Extract relevant info**: Finds vacation balance in the data
6. **Respond naturally**: "You have 15 days of vacation available"

### Example: Requesting Time Off

**You**: "I want to take vacation December 20-22"

**Agent's thought process**:
1. User wants time off → I need to help with a time-off request
2. First, get their eligible absence types → Call `get_workday_id()`
3. Find "Vacation" in their eligible types → Got the time_off_type_id
4. Validate those dates are available → Call `check_valid_dates()`
5. Show validation results → "Those dates are available (24 hours total)"
6. Ask for confirmation → "Would you like me to submit this request?"
7. If user confirms → Call `submit_time_off()`
8. Report success → "Your vacation request has been submitted!"

## Key Technologies

- **Python**: The programming language everything is written in
- **Flask**: Web framework for the server
- **Google Gemini AI**: The language model that understands your questions
- **Workday REST API**: How we get your HR data
- **OAuth 2.0**: Secure authentication with Workday
- **Selenium**: Automates the browser login for OAuth

## How OAuth Works (Simplified)

1. **You start a request** that needs Workday data
2. **Agent checks cache**: "Do I have a valid token?" 
   - If yes → Use it to call Workday API
   - If no → Start OAuth flow:
3. **Browser opens** to Workday login page
4. **You log in** with your Workday credentials
5. **Workday redirects back** with an authorization code
6. **Agent exchanges code** for an access token
7. **Token is cached** for future requests (1 hour typically)
8. **API call proceeds** with the token

## Chat Sessions

The agent maintains conversation context using "chat sessions":
- Each browser session has its own chat history
- The AI remembers what you discussed earlier
- Example: If you asked about vacation, it knows "time off" means vacation later
- Sessions persist until you refresh the page or close the browser

## Running the Agent

```powershell
# Activate virtual environment
& C:/Users/wwwsh/Documents/GitHub/.venv/Scripts/Activate.ps1

# Navigate to agent folder
cd C:\Users\wwwsh\Documents\GitHub\workday_tools\ask_hr_ai_agent

# Start the server
python flask_server.py
```

Then open: http://127.0.0.1:5000

## Configuration

- **`.env`**: Contains your Google API key for Gemini
- **`config.json`**: Contains Workday OAuth credentials (client ID, secret, URLs)

## Error Handling

The agent handles common errors gracefully:
- **Token expired**: Clears cache and prompts you to try again (will re-authenticate)
- **Network issues**: Shows error message asking you to retry
- **Missing data**: Handles incomplete API responses
- **Invalid dates**: Validates date formats and availability

## Code Philosophy

The code is designed to be:
- **Clean**: No unnecessary comments or unused code
- **Type-safe**: Uses type hints for better code quality
- **Cached**: Avoids redundant OAuth flows
- **Error-resilient**: Specific exception handling for different failure modes
- **Maintainable**: Clear separation of concerns (web server, AI logic, API calls)

## What Makes This Different?

Traditional Workday interaction:
1. Log into Workday portal
2. Navigate through multiple menus
3. Find the right form
4. Fill in fields
5. Submit

With AskHR AI:
1. Type: "Request 3 days vacation starting next Monday"
2. Confirm
3. Done!

The AI handles all the navigation, form-filling, and API calls for you.
