import sys
import json
from pathlib import Path
import google.generativeai as genai

# Add workday_tools to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from workday_api import complete_oauth_flow

# Configure Gemini with your API key (ensure GOOGLE_API_KEY env var is set)
genai.configure()

# Cache for OAuth result to avoid re-authenticating for every question
_cached_workday_data = None

def get_workday_id():
    """Get the current user's Workday ID, name, email, title, and organization"""
    global _cached_workday_data
    
    # Return cached data if available
    if _cached_workday_data is not None:
        return json.dumps(_cached_workday_data)
    
    try:
        result = complete_oauth_flow(config_path=str(Path(__file__).parent.parent.parent / "config.json"))
        # Cache the result for future requests
        _cached_workday_data = result
        return json.dumps(result) if result else json.dumps({"error": "Failed to retrieve Workday info"})
    except Exception as e:
        return json.dumps({"error": str(e)})

# Define tools for Gemini using proper FunctionDeclaration format
tools = [
    genai.protos.Tool(
        function_declarations=[
            genai.protos.FunctionDeclaration(
                name="get_workday_id",
                description="Get the current user's Workday ID, name, email, title, and organization through OAuth 2.0 authentication",
                parameters=genai.protos.Schema(
                    type=genai.protos.Type.OBJECT,
                    properties={}
                )
            )
        ]
    )
]

# Create Gemini model with tool use
model = genai.GenerativeModel(
    "gemini-2.0-flash",
    tools=tools,
    system_instruction="""You are a helpful Workday HR assistant. 

**On first contact or greeting:**
- Warmly greet the user and introduce yourself
- Present a numbered menu of options they can choose from:
  1. Personal information (name, ID, email)
  2. Job details (title, department, manager)
  3. Service dates and tenure
  4. Leave/absence balances
  5. Organization and location info
  6. Show all information
- Tell them they can enter a number (1-6) or ask questions naturally

**When user selects a number or asks a question:**
- If they enter "1", "2", etc., understand which category they want and retrieve/display ONLY that information
- For natural questions, identify what specific information they're asking for
- Call get_workday_id tool to retrieve data when needed (it's cached, so subsequent calls are instant)

**Answering questions intelligently:**
- Use the retrieved data to answer specific questions conversationally
- Examples:
  - "Who is my manager?" → Extract supervisor name from the data and answer naturally
  - "How long have I worked here?" → Calculate tenure from service dates
  - "How much PTO do I have?" → Extract specific PTO balance
  - "What's my job title?" → Extract and state the title
  - "Where do I work?" → Extract location
- Answer the question directly in a conversational way, not just by showing raw data
- If you need to show multiple fields, use the simple format

**Response formatting - IMPORTANT:**
- For simple questions, answer conversationally without formatting (e.g., "Your manager is John Smith")
- When showing multiple fields, use: **Field Name:** Value on each line
- Example:
  **Name:** John Doe
  **Email:** john@company.com
  **Worker ID:** 12345
- For leave balances, format as:
  **PTO Available:** 120 hours
  **Sick Leave:** 40 hours
- Use section headers when appropriate (## Header)
- Only show the specific information requested. Don't dump all data unless option 6 or "all" is selected.
- Be concise and direct
- If data is missing, acknowledge it

Be warm, conversational, and intelligent. Answer questions naturally using the data you have."""
)

# Chat function to interact with the model
def chat_with_workday(user_message):
    """Send a message to Gemini and get a response"""
    response = model.generate_content(user_message)
    
    # Check if model wants to call a function
    while response.candidates and response.candidates[0].content.parts:
        for part in response.candidates[0].content.parts:
            if hasattr(part, 'function_call') and part.function_call:
                function_name = part.function_call.name
                if function_name == "get_workday_id":
                    result = get_workday_id()
                    # Send result back to model using proper format
                    response = model.generate_content([
                        genai.protos.Content(role="user", parts=[genai.protos.Part(text=user_message)]),
                        response.candidates[0].content,
                        genai.protos.Content(
                            role="user",
                            parts=[
                                genai.protos.Part(
                                    function_response=genai.protos.FunctionResponse(
                                        name="get_workday_id",
                                        response=json.loads(result) if isinstance(result, str) else result
                                    )
                                )
                            ]
                        )
                    ])
                    # Continue looping in case there are more function calls
                    break
        else:
            # No function call found, break the while loop
            break
    
    return response.text


