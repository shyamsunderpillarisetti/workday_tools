const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  agentName: import.meta.env.VITE_AGENT_NAME || 'askhr_agent',
  workdayToolsBaseUrl: import.meta.env.VITE_WORKDAY_API_BASE_URL || 'http://localhost:5000',
};

export default config;
