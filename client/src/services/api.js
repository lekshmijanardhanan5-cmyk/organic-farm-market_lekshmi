import { useAuth } from '../context/AuthContext'

const BASE_URL = 'http://localhost:5000'

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data?.message || 'Request failed'
    throw new Error(message)
  }
  return data
}

// Small hook for components to use with auth context
export function useApi() {
  const { token } = useAuth()
  return {
    get: (path) => apiRequest(path, { token }),
    post: (path, body) => apiRequest(path, { method: 'POST', body, token }),
    put: (path, body) => apiRequest(path, { method: 'PUT', body, token }),
  }
}


