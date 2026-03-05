import { useAuth } from '../context/AuthContext'

// Normalize BASE_URL: remove trailing slashes and /api if present
// since all API paths already start with /api/
let BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
BASE_URL = BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '')

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const options = {
    method,
    headers,
  }

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body)
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, options)
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      const message = data?.message || `Request failed with status ${res.status}`
      throw new Error(message)
    }
    return data
  } catch (err) {
    // Network error or other fetch error
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      throw new Error('Cannot connect to server. Make sure the backend is running on port 5000.')
    }
    throw err
  }
}

// Small hook for components to use with auth context
export function useApi() {
  const { token } = useAuth()
  
  const makeRequest = async (method, path, body) => {
    if (!token) {
      throw new Error('Not authenticated. Please log in again.')
    }
    return apiRequest(path, { method, body, token })
  }
  
  return {
    get: (path) => makeRequest('GET', path),
    post: (path, body) => makeRequest('POST', path, body),
    put: (path, body) => makeRequest('PUT', path, body),
    delete: (path) => makeRequest('DELETE', path),
  }
}


