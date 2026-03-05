import { Routes, Route, Link, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailsPage from './pages/ProductDetailsPage'
import DashboardPage from './pages/DashboardPage'

import { useAuth } from './context/AuthContext'

function App() {
  const { user, logout } = useAuth()

  return (
    <div className="container">
      <header style={{ 
        background: '#1b4332', 
        padding: '1rem 2rem', 
        marginBottom: '2rem', 
        borderRadius: '0',
        boxShadow: '0 2px 12px rgba(27,67,50,0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: 'none',
        marginLeft: '-1.5rem',
        marginRight: '-1.5rem',
        marginTop: '-1.5rem'
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ margin: 0, color: '#ffffff', fontSize: '1.4rem', fontWeight: 700, fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '0.02em' }}>Organico</h1>
        </Link>
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.85)', fontWeight: 500, fontSize: '0.9rem', padding: '0.5rem 0', transition: 'color 0.2s', textTransform: 'uppercase', letterSpacing: '0.08em' }} onMouseEnter={(e) => { e.target.style.color = '#ffffff' }} onMouseLeave={(e) => { e.target.style.color = 'rgba(255,255,255,0.85)' }}>Shop</Link>
          {user ? (
            <>
              <Link to="/dashboard" style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.85)', fontWeight: 500, fontSize: '0.9rem', padding: '0.5rem 0', transition: 'color 0.2s', textTransform: 'uppercase', letterSpacing: '0.08em' }} onMouseEnter={(e) => { e.target.style.color = '#ffffff' }} onMouseLeave={(e) => { e.target.style.color = 'rgba(255,255,255,0.85)' }}>Dashboard</Link>
              <span style={{ color: 'rgba(255,255,255,0.65)', padding: '0 0.25rem', fontSize: '0.9rem' }}>{user.name}</span>
              <button 
                onClick={logout} 
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}
                onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.target.style.borderColor = 'rgba(255,255,255,0.5)' }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.borderColor = 'rgba(255,255,255,0.3)' }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={{ textDecoration: 'none', color: 'rgba(255,255,255,0.85)', fontWeight: 500, fontSize: '0.9rem', padding: '0.5rem 0', transition: 'color 0.2s', textTransform: 'uppercase', letterSpacing: '0.08em' }} onMouseEnter={(e) => { e.target.style.color = '#ffffff' }} onMouseLeave={(e) => { e.target.style.color = 'rgba(255,255,255,0.85)' }}>Login</Link>
              <Link to="/register" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', backgroundColor: '#c9a84c', color: '#ffffff', borderRadius: '4px', textDecoration: 'none', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.target.style.backgroundColor = '#b8963a' }} onMouseLeave={(e) => { e.target.style.backgroundColor = '#c9a84c' }}>
                Get Started
              </Link>
            </>
          )}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<ProductsPage />} />
        <Route path="/product/:id" element={<ProductDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard/*" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
  )
}

export default App
