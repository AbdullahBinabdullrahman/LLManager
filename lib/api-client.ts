const STORAGE_KEY = 'ollama-dashboard-settings';

/**
 * Get the custom Ollama API URL from localStorage
 */
function getApiUrlFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      return settings.apiUrl || null;
    }
  } catch {
    // Use default
  }
  return null;
}

/**
 * Create headers with the custom API URL
 */
export function getApiHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const apiUrl = getApiUrlFromStorage();
  if (apiUrl) {
    headers['x-ollama-api-url'] = apiUrl;
  }
  
  return headers;
}

/**
 * Make an API call to our Next.js API routes with the custom Ollama URL header
 */
export async function apiCall<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = {
    ...getApiHeaders(),
    ...(options.headers || {}),
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

/**
 * POST request helper
 */
export async function apiPost<T>(url: string, data: unknown): Promise<T> {
  return apiCall<T>(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(url: string, data?: unknown): Promise<T> {
  return apiCall<T>(url, {
    method: 'DELETE',
    body: data ? JSON.stringify(data) : undefined,
  });
}

