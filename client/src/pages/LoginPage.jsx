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
    <div style={{ maxWidth: 450, margin: '2rem auto' }}>
      <div className="card">
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center', color: '#28a745' }}>Login</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="input"
          />
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: '#6c757d' }}>
          Don't have an account? <Link to="/register" style={{ color: '#28a745', fontWeight: 500 }}>Register here</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage


