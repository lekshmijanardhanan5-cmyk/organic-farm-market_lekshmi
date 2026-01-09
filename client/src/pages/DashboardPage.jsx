import { Link, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../services/api'
import { useEffect, useState } from 'react'

function Protected({ children }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

function CustomerOrders() {
  const api = useApi()
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/api/orders/user')
        setOrders(data)
      } catch (err) {
        setError(err.message)
      }
    }
    load()
  }, [])

  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <h3>My Orders</h3>
      {orders.length === 0 && <p>No orders yet.</p>}
      {orders.map((o) => (
        <div key={o._id} style={{ border: '1px solid #ccc', padding: '0.5rem', marginBottom: '0.5rem' }}>
          <p>
            <strong>Status:</strong> {o.status}
          </p>
          <p>
            <strong>Total:</strong> ₹{o.totalAmount}
          </p>
        </div>
      ))}
    </div>
  )
}

function FarmerProducts() {
  const api = useApi()
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ title: '', price: '', description: '', category: '' })

  const load = async () => {
    const data = await api.get('/api/products')
    setProducts(data)
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    await api.post('/api/products', {
      ...form,
      price: Number(form.price),
    })
    setForm({ title: '', price: '', description: '', category: '' })
    await load()
  }

  return (
    <div>
      <h3>My Products</h3>
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 320 }}>
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <input
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button type="submit">Add Product</button>
      </form>

      <div style={{ marginTop: '1rem' }}>
        {products.map((p) => (
          <div key={p._id} style={{ border: '1px solid #ccc', padding: '0.5rem', marginBottom: '0.5rem' }}>
            <strong>{p.title}</strong> - ₹{p.price} ({p.category})
          </div>
        ))}
      </div>
    </div>
  )
}

function FarmerOrders() {
  const api = useApi()
  const [orders, setOrders] = useState([])

  const load = async () => {
    const data = await api.get('/api/orders/farmer')
    setOrders(data)
  }

  useEffect(() => {
    load()
  }, [])

  const updateStatus = async (id, status) => {
    await api.put(`/api/orders/${id}/status`, { status })
    await load()
  }

  return (
    <div>
      <h3>Farmer Orders</h3>
      {orders.length === 0 && <p>No orders yet.</p>}
      {orders.map((o) => (
        <div key={o._id} style={{ border: '1px solid #ccc', padding: '0.5rem', marginBottom: '0.5rem' }}>
          <p>
            <strong>Status:</strong> {o.status}
          </p>
          <button onClick={() => updateStatus(o._id, 'Accepted')}>Accept</button>{' '}
          <button onClick={() => updateStatus(o._id, 'Packed')}>Pack</button>{' '}
          <button onClick={() => updateStatus(o._id, 'Delivered')}>Deliver</button>
        </div>
      ))}
    </div>
  )
}

function AdminOverview() {
  const api = useApi()
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const load = async () => {
      const prods = await api.get('/api/products')
      const ords = await api.get('/api/orders/farmer')
      setProducts(prods)
      setOrders(ords)
    }
    load()
  }, [])

  return (
    <div>
      <h3>Admin Overview</h3>
      <p>Products: {products.length}</p>
      <p>Orders: {orders.length}</p>
    </div>
  )
}

function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <Protected>
      <div>
        <h2>Dashboard</h2>
        <p>
          Logged in as <strong>{user?.name}</strong> ({user?.role})
        </p>
        <button onClick={logout}>Logout</button>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          {user?.role === 'customer' && <Link to="customer-orders">My Orders</Link>}
          {(user?.role === 'farmer' || user?.role === 'admin') && (
            <>
              <Link to="farmer-products">My Products</Link>
              <Link to="farmer-orders">Farmer Orders</Link>
            </>
          )}
          {user?.role === 'admin' && <Link to="admin">Admin Overview</Link>}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <Routes>
            <Route
              index
              element={<p>Select an option above based on your role to view details.</p>}
            />
            <Route path="customer-orders" element={<CustomerOrders />} />
            <Route path="farmer-products" element={<FarmerProducts />} />
            <Route path="farmer-orders" element={<FarmerOrders />} />
            <Route path="admin" element={<AdminOverview />} />
          </Routes>
        </div>
      </div>
    </Protected>
  )
}

export default DashboardPage


