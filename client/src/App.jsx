import { Routes, Route, Link, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProductsPage from './pages/ProductsPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '1rem' }}>
      <header style={{ marginBottom: '1rem' }}>
        <h1>Organic Farm Market</h1>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/">Products</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/dashboard">Dashboard</Link>
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
