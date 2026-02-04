import { createContext, useContext, useEffect, useState } from 'react'
import { apiRequest } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

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
    const saved = localStorage.getItem('ofm_auth')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setUser(parsed.user)
        setToken(parsed.token)
        // Refresh user data from server to get latest approval status
        if (parsed.token) {
          refreshUser(parsed.token)
        }
      } catch {
        // ignore
      }
    }
  }, [])

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


