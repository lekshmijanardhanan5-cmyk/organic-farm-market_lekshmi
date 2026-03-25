/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../services/api'

const AuthContext = createContext(null)

function getInitialAuth() {
  try {
    const saved = localStorage.getItem('ofm_auth')
    if (!saved) return { user: null, token: null }
    const parsed = JSON.parse(saved)
    return { user: parsed.user ?? null, token: parsed.token ?? null }
  } catch {
    return { user: null, token: null }
  }
}

export function AuthProvider({ children }) {
  const initialAuth = useMemo(getInitialAuth, [])
  const [user, setUser] = useState(initialAuth.user)
  const [token, setToken] = useState(initialAuth.token)

  const refreshUser = async (authToken) => {
    try {
      const userData = await apiRequest('/api/auth/profile', { token: authToken })
      setUser(userData)
      // Update localStorage with fresh user data
      const saved = localStorage.getItem('ofm_auth')
      if (saved) {
        const parsed = JSON.parse(saved)
        localStorage.setItem('ofm_auth', JSON.stringify({ ...parsed, user: userData }))
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err)
    }
  }

  useEffect(() => {
    // Refresh user data from server to get latest approval status.
    if (token) refreshUser(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const login = (data) => {
    setUser(data.user)
    setToken(data.token)
    localStorage.setItem('ofm_auth', JSON.stringify(data))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('ofm_auth')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}


