// Implementation of entities to communicate with the real backend API
import config from '@/config';

const apiRequest = async (endpoint, options = {}, baseUrl = config.apiBaseUrl) => {
  const token = localStorage.getItem('auth_token'); // Assuming token is stored in localStorage

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Error: ${response.statusText}`);
  }
  const data = await response.json();
  return data;
};

export const ChatSession = {
  create: async (data) => {
    // Mapping frontend data to backend expectation
    const payload = {
      agent_name: data.agent_name || config.agentName,
      name: data.name,
      user_name: data.user_name,
      initial_message: data.initial_message // Pass this if available for initial greeting
    };
    const response = await apiRequest('/chat/session', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    // Ensure we return an object with an 'id' property, mapping from 'session_id' if needed
    return {
      ...response,
      id: response.session_id || response.id
    };
  },
  list: async (sort, limit) => {
    // For now returning mock list or implement if backend has list endpoint
    console.log('Mock List ChatSession:', { sort, limit });
    return [
      {
        id: 'mock-session-1',
        name: 'Previous Chat 1',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        agent_name: config.agentName
      }
    ];
  },
  get: async (id) => {
    // For now return mock or implement get endpoint if available
     console.log('Mock Get ChatSession:', id);
    return {
      id: id,
      name: 'Active Chat',
      created_at: new Date().toISOString(),
      agent_name: config.agentName
    };
  }
};

export const Message = {
  list: async (sort, limit, offset, filters) => {
     void sort;
     void limit;
     void offset;
     void filters;
     // TODO: Implement list messages from backend if available
    // For now returning empty or mock as the chat flow is driven by creating messages and getting responses
     return [];
  },
  create: async (data) => {
    const payload = {
      session_id: data.chat_session_id,
      content: data.content,
      file_urls: data.file_urls
    };
    
    // Log payload for debugging
    // console.log('Creating message with payload:', payload);

    const response = await apiRequest('/chat/message', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    // console.log('Message creation response:', response);
    return response;
  },
  update: async (id, data) => {
    console.log('Mock Update Message:', id, data);
    return { id, ...data };
  }
};

// Workday tools (separate FastAPI service)
// WorkdayTools proxy is handled server-side; client always calls chat/message now.

export const LeaveRequest = {
  filter: async (filters, sort, limit) => {
    console.log('Mock Filter LeaveRequest:', { filters, sort, limit });
    return [
      {
        id: 'lr-1',
        leave_type: 'vacation',
        start_date: '2024-06-01',
        end_date: '2024-06-05',
        status: 'approved',
        created_date: new Date().toISOString()
      },
      {
        id: 'lr-2',
        leave_type: 'sick',
        start_date: '2024-05-10',
        end_date: '2024-05-11',
        status: 'approved',
        created_date: new Date().toISOString()
      }
    ];
  }
};

// Auth mock
export const User = {
  me: async () => ({
    id: 'demo-user',
    full_name: 'Demo Employee',
    email: 'demo@michaels.com'
  }),
  logout: async () => {
    console.log('Mock Logout');
    window.location.reload();
  }
};
