import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('ofm_auth')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setUser(parsed.user)
        setToken(parsed.token)
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
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}


