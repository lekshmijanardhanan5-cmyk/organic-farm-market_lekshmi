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

function AdminStats() {
  const api = useApi()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/api/admin/stats')
        setStats(data)
      } catch (err) {
        setError(err.message)
      }
    }
    load()
  }, [])

  if (error) return <p style={{ color: 'red' }}>{error}</p>
  if (!stats) return <p>Loading...</p>

  return (
    <div>
      <h3>Statistics Overview</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
          <strong>Total Users</strong>
          <p style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{stats.users.total}</p>
          <small>Farmers: {stats.users.farmers} | Customers: {stats.users.customers}</small>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
          <strong>Pending Farmers</strong>
          <p style={{ fontSize: '1.5rem', margin: '0.5rem 0', color: 'orange' }}>{stats.users.pendingFarmers}</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
          <strong>Blocked Users</strong>
          <p style={{ fontSize: '1.5rem', margin: '0.5rem 0', color: 'red' }}>{stats.users.blockedUsers}</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
          <strong>Total Products</strong>
          <p style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{stats.products.total}</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
          <strong>Total Orders</strong>
          <p style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{stats.orders.total}</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
          <strong>Total Revenue</strong>
          <p style={{ fontSize: '1.5rem', margin: '0.5rem 0', color: 'green' }}>₹{stats.revenue}</p>
        </div>
      </div>
    </div>
  )
}

function AdminUsers() {
  const api = useApi()
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState({ role: '', isApproved: '', isBlocked: '' })
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const params = new URLSearchParams()
      if (filter.role) params.append('role', filter.role)
      if (filter.isApproved) params.append('isApproved', filter.isApproved)
      if (filter.isBlocked) params.append('isBlocked', filter.isBlocked)
      const data = await api.get(`/api/admin/users?${params}`)
      setUsers(data)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [filter])

  const handleApprove = async (id, isApproved) => {
    try {
      await api.put(`/api/admin/users/${id}/approve`, { isApproved })
      await load()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleBlock = async (id, isBlocked) => {
    try {
      await api.put(`/api/admin/users/${id}/block`, { isBlocked })
      await load()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await api.delete(`/api/admin/users/${id}`)
      await load()
    } catch (err) {
      alert(err.message)
    }
  }

  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <h3>User Management</h3>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <select value={filter.role} onChange={(e) => setFilter({ ...filter, role: e.target.value })}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="farmer">Farmer</option>
          <option value="customer">Customer</option>
        </select>
        <select value={filter.isApproved} onChange={(e) => setFilter({ ...filter, isApproved: e.target.value })}>
          <option value="">All Approval Status</option>
          <option value="true">Approved</option>
          <option value="false">Pending</option>
        </select>
        <select value={filter.isBlocked} onChange={(e) => setFilter({ ...filter, isBlocked: e.target.value })}>
          <option value="">All Block Status</option>
          <option value="true">Blocked</option>
          <option value="false">Active</option>
        </select>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Name</th>
              <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Email</th>
              <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Role</th>
              <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Approved</th>
              <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Blocked</th>
              <th style={{ padding: '0.5rem', border: '1px solid #ccc' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{u.name}</td>
                <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{u.email}</td>
                <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{u.role}</td>
                <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>
                  {u.role === 'farmer' ? (u.isApproved ? '✓' : '✗') : '-'}
                </td>
                <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>{u.isBlocked ? 'Yes' : 'No'}</td>
                <td style={{ padding: '0.5rem', border: '1px solid #ccc' }}>
                  {u.role === 'farmer' && (
                    <>
                      {!u.isApproved && (
                        <button onClick={() => handleApprove(u._id, true)} style={{ marginRight: '0.25rem' }}>
                          Approve
                        </button>
                      )}
                      {u.isApproved && (
                        <button onClick={() => handleApprove(u._id, false)} style={{ marginRight: '0.25rem' }}>
                          Reject
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => handleBlock(u._id, !u.isBlocked)}
                    style={{ marginRight: '0.25rem', backgroundColor: u.isBlocked ? 'green' : 'red', color: 'white' }}
                  >
                    {u.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                  {u.role !== 'admin' && (
                    <button onClick={() => handleDelete(u._id)} style={{ backgroundColor: 'darkred', color: 'white' }}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AdminProducts() {
  const api = useApi()
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const data = await api.get('/api/admin/products')
      setProducts(data)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await api.delete(`/api/products/${id}`)
      await load()
    } catch (err) {
      alert(err.message)
    }
  }

  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <h3>All Products Management</h3>
      <div style={{ marginTop: '1rem' }}>
        {products.length === 0 && <p>No products found.</p>}
        {products.map((p) => (
          <div key={p._id} style={{ border: '1px solid #ccc', padding: '0.5rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{p.title}</strong> - ₹{p.price} ({p.category})
              <br />
              <small>
                Farmer: {p.farmer?.name || 'Unknown'} ({p.farmer?.isApproved ? 'Approved' : 'Pending'})
                {p.farmer?.isBlocked && <span style={{ color: 'red' }}> - BLOCKED</span>}
              </small>
            </div>
            <button onClick={() => handleDelete(p._id)} style={{ backgroundColor: 'darkred', color: 'white' }}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminOrders() {
  const api = useApi()
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const data = await api.get('/api/admin/orders')
      setOrders(data)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/orders/${id}/status`, { status })
      await load()
    } catch (err) {
      alert(err.message)
    }
  }

  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <h3>All Orders Monitoring</h3>
      <div style={{ marginTop: '1rem' }}>
        {orders.length === 0 && <p>No orders found.</p>}
        {orders.map((o) => (
          <div key={o._id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
            <p>
              <strong>Order ID:</strong> {o._id.slice(-8)} | <strong>Customer:</strong> {o.user?.name} ({o.user?.email}) |{' '}
              <strong>Status:</strong> {o.status} | <strong>Total:</strong> ₹{o.totalAmount}
            </p>
            <p>
              <strong>Items:</strong>
            </p>
            <ul>
              {o.items.map((item, idx) => (
                <li key={idx}>
                  {item.product?.title || 'Product removed'} - Qty: {item.quantity} (Farmer: {item.product?.farmer?.name || 'Unknown'})
                </li>
              ))}
            </ul>
            <div style={{ marginTop: '0.5rem' }}>
              <button onClick={() => updateStatus(o._id, 'Accepted')}>Accept</button>{' '}
              <button onClick={() => updateStatus(o._id, 'Packed')}>Pack</button>{' '}
              <button onClick={() => updateStatus(o._id, 'Delivered')}>Deliver</button>
            </div>
            <small>Created: {new Date(o.createdAt).toLocaleString()}</small>
          </div>
        ))}
      </div>
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
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {user?.role === 'customer' && <Link to="customer-orders">My Orders</Link>}
          {(user?.role === 'farmer' || user?.role === 'admin') && (
            <>
              <Link to="farmer-products">My Products</Link>
              <Link to="farmer-orders">Farmer Orders</Link>
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <Link to="admin/stats">Statistics</Link>
              <Link to="admin/users">Users</Link>
              <Link to="admin/products">Products</Link>
              <Link to="admin/orders">Orders</Link>
            </>
          )}
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
            <Route path="admin/stats" element={<AdminStats />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/products" element={<AdminProducts />} />
            <Route path="admin/orders" element={<AdminOrders />} />
          </Routes>
        </div>
      </div>
    </Protected>
  )
}

export default DashboardPage


