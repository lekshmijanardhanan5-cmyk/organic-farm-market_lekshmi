import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../services/api'

function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('customer')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: { name, email, password, role },
      })
      login(data)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 450, margin: '2rem auto' }}>
      <div className="card">
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center', color: '#28a745' }}>Register</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
          />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="select">
            <option value="customer">Customer</option>
            <option value="farmer">Farmer</option>
            <option value="admin">Admin (for demo)</option>
          </select>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: '#6c757d' }}>
          Already have an account? <Link to="/login" style={{ color: '#28a745', fontWeight: 500 }}>Login here</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage


