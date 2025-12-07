class ApiError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

class ApiClient {
  constructor() {
    this.baseUrl = '/api';
  }

  async request(endpoint, options = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('lenstrack_token') : null;
    
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Get response as text first to check if it's JSON or HTML
      const text = await response.text();
      let data;
      
      // Check if response is HTML (error page)
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        console.error('Server returned HTML error page:', text.substring(0, 500));
        throw new ApiError(
          'SERVER_ERROR',
          `Server returned an error page (HTML). Status: ${response.status}. This usually indicates a server-side error. Check the server console for details.`,
          { status: response.status }
        );
      }
      
      // Try to parse as JSON
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        // If parsing fails, it's not valid JSON
        if (parseError instanceof ApiError) {
          throw parseError;
        }
        console.error('Failed to parse response as JSON:', parseError, 'Response:', text.substring(0, 200));
        throw new ApiError(
          'INVALID_RESPONSE',
          `Server returned invalid JSON. Status: ${response.status}`,
          { status: response.status }
        );
      }

      if (!response.ok) {
        // For 401 errors, throw ApiError but don't crash - let components handle it
        const error = new ApiError(
          data.error?.code || 'UNKNOWN_ERROR',
          data.error?.message || 'An error occurred',
          data.error?.details || null
        );
        // Store status code for handling
        error.status = response.status;
        throw error;
      }

      // Return data.data if it exists, otherwise return the full data object
      // This handles both { data: {...} } and direct response formats
      return data.data !== undefined ? data.data : data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // Handle JSON parsing errors
      if (error.message && error.message.includes('JSON')) {
        throw new ApiError('INVALID_RESPONSE', 'Server returned invalid response format');
      }
      throw new ApiError('NETWORK_ERROR', error.message || 'Network request failed');
    }
  }

  async get(endpoint, params = {}) {
    if (typeof window === 'undefined') {
      // Server-side: build URL manually
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const url = new URL(endpoint, baseUrl + this.baseUrl);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
      return this.request(url.pathname + url.search, { method: 'GET' });
    }
    
    // Client-side: use window.location
    const url = new URL(endpoint, window.location.origin + this.baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    return this.request(url.pathname + url.search, { method: 'GET' });
  }

  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body,
    });
  }

  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body,
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
export { ApiError };

