import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../services/api'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validate inputs
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!password.trim()) {
      setError('Password is required')
      return
    }
    
    setLoading(true)
    try {
      const data = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { email: email.trim(), password },
      })
      if (data && data.token && data.user) {
        login(data)
        navigate('/dashboard')
      } else {
        setError('Invalid response from server')
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 450, margin: '3rem auto' }}>
      <div className="card">
        <h2 style={{ marginTop: 0, marginBottom: '2rem', textAlign: 'center', color: '#1b4332' }}>Login</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <input
              type="email"
              name="email"
              autoComplete="username"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="input"
            />
          </div>
          <div>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{ marginTop: '2rem', textAlign: 'center', color: '#6c757d', fontSize: '0.95rem' }}>
          Don't have an account? <Link to="/register" style={{ color: '#c9a84c', fontWeight: 600, textDecoration: 'none' }}>Register here</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage


