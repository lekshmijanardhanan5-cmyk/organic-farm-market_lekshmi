import { Routes, Route, Link, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProductsPage from './pages/ProductsPage'
import DashboardPage from './pages/DashboardPage'

import { useAuth } from './context/AuthContext'

function App() {
  const { user, logout } = useAuth()

  return (
    <div className="container">
      <header style={{ 
        background: 'white', 
        padding: '1rem 1.5rem', 
        marginBottom: '2rem', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, color: '#28a745', fontSize: '1.5rem' }}>🌱 Organic Farm Market</h1>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Products</Link>
          {user ? (
            <>
              <Link to="/dashboard" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Dashboard</Link>
              <span style={{ color: '#6c757d' }}>{user.name}</span>
              <button 
                onClick={logout} 
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                Logout
        </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ textDecoration: 'none', color: '#333', fontWeight: 500 }}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                Register
              </Link>
            </>
          )}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<ProductsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard/*" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
  )
}

export default App
