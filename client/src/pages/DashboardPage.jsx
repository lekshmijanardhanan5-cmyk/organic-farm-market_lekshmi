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

function CustomerProfile() {
  const api = useApi()
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '' })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const data = await api.put('/api/auth/profile', form)
      setMessage('Profile updated successfully!')
      setUser({ ...user, ...data.user })
    } catch (err) {
      setMessage(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h3>My Profile</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 400 }}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
      {message && <p style={{ color: message.includes('success') ? 'green' : 'red', marginTop: '0.5rem' }}>{message}</p>}
    </div>
  )
}

function CustomerStats() {
  const api = useApi()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/api/customer/stats')
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
      <h3>My Dashboard</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
          <strong>Total Orders</strong>
          <p style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{stats.orders.total}</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
          <strong>Total Reviews</strong>
          <p style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>{stats.reviews.total}</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
          <strong>Total Spent</strong>
          <p style={{ fontSize: '1.5rem', margin: '0.5rem 0', color: 'green' }}>₹{stats.totalSpent}</p>
        </div>
      </div>
      {stats.orders.byStatus && Object.keys(stats.orders.byStatus).length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Orders by Status</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {Object.entries(stats.orders.byStatus).map(([status, count]) => (
              <div key={status} style={{ border: '1px solid #ccc', padding: '0.5rem 1rem', borderRadius: '4px' }}>
                <strong>{status}:</strong> {count}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CustomerOrders() {
  const api = useApi()
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')
  const [expandedOrder, setExpandedOrder] = useState(null)

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

  const getStatusColor = (status) => {
    const colors = {
      Pending: '#ffc107',
      Accepted: '#17a2b8',
      Packed: '#007bff',
      Delivered: '#28a745',
    }
    return colors[status] || '#6c757d'
  }

  const filteredOrders = filter ? orders.filter((o) => o.status === filter) : orders

  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <h3>My Orders</h3>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <label>Filter by status:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Orders</option>
          <option value="Pending">Pending</option>
          <option value="Accepted">Accepted</option>
          <option value="Packed">Packed</option>
          <option value="Delivered">Delivered</option>
        </select>
        <span style={{ marginLeft: '1rem' }}>Total: {filteredOrders.length}</span>
      </div>
      {filteredOrders.length === 0 && <p>No orders found.</p>}
      {filteredOrders.map((o) => (
        <div key={o._id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
            <div>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Order ID:</strong> {o._id.slice(-8)} | <strong>Date:</strong> {new Date(o.createdAt).toLocaleString()}
              </p>
              <p style={{ margin: '0.25rem 0', fontSize: '1.2rem', fontWeight: 'bold' }}>
                Total: ₹{o.totalAmount}
              </p>
            </div>
            <span
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '4px',
                backgroundColor: getStatusColor(o.status),
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              {o.status}
            </span>
          </div>
          <button
            onClick={() => setExpandedOrder(expandedOrder === o._id ? null : o._id)}
            style={{ marginBottom: '0.5rem', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {expandedOrder === o._id ? 'Hide Details' : 'Show Details'}
          </button>
          {expandedOrder === o._id && (
            <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <strong>Items:</strong>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                {o.items.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>
                    {item.product?.title || 'Product removed'} - Qty: {item.quantity} × ₹{item.product?.price || 0} = ₹
                    {(item.quantity * (item.product?.price || 0)).toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function FarmerProfile() {
  const api = useApi()
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '' })
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const data = await api.put('/api/auth/profile', form)
      setMessage('Profile updated successfully!')
      setUser({ ...user, ...data.user })
    } catch (err) {
      setMessage(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h3>My Profile</h3>
      {user?.role === 'farmer' && (
        <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: user?.isApproved ? '#d4edda' : '#fff3cd', border: `1px solid ${user?.isApproved ? '#c3e6cb' : '#ffc107'}` }}>
          <strong>Account Status:</strong> {user?.isApproved ? '✓ Approved' : '⏳ Pending Approval'}
          {!user?.isApproved && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Your account is pending admin approval. You cannot add products until approved.</p>}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 400 }}>
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
      {message && <p style={{ color: message.includes('success') ? 'green' : 'red', marginTop: '0.5rem' }}>{message}</p>}
    </div>
  )
}

function FarmerProducts() {
  const api = useApi()
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ title: '', price: '', description: '', category: '', imageUrl: '', isAvailable: true })
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const data = await api.get('/api/farmer/products')
      setProducts(data)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!user?.isApproved && user?.role === 'farmer') {
      setError('Your account is not approved yet. Please wait for admin approval.')
      return
    }
    try {
      await api.post('/api/products', {
        ...form,
        price: Number(form.price),
        isAvailable: form.isAvailable !== false,
      })
      setForm({ title: '', price: '', description: '', category: '', imageUrl: '', isAvailable: true })
      setError('')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEdit = (product) => {
    setEditing(product._id)
    setForm({
      title: product.title,
      price: product.price,
      description: product.description || '',
      category: product.category || '',
      imageUrl: product.imageUrl || '',
      isAvailable: product.isAvailable !== false,
    })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/api/products/${editing}`, {
        ...form,
        price: Number(form.price),
        isAvailable: form.isAvailable !== false,
      })
      setEditing(null)
      setForm({ title: '', price: '', description: '', category: '', imageUrl: '', isAvailable: true })
      setError('')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await api.delete(`/api/farmer/products/${id}`)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleAvailability = async (id, currentStatus) => {
    try {
      await api.put(`/api/products/${id}`, { isAvailable: !currentStatus })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <h3>My Products</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={editing ? handleUpdate : handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 400, marginBottom: '1rem' }}>
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          type="number"
          placeholder="Price (₹)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <input
          placeholder="Category (e.g., Vegetables, Fruits)"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <input
          placeholder="Image URL (optional)"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={form.isAvailable}
            onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
          />
          Available
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit">{editing ? 'Update Product' : 'Add Product'}</button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm({ title: '', price: '', description: '', category: '', imageUrl: '', isAvailable: true }) }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div style={{ marginTop: '1rem' }}>
        <h4>Your Products ({products.length})</h4>
        {products.length === 0 && <p>No products yet. Add your first product above!</p>}
        {products.map((p) => (
          <div key={p._id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '0.5rem', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '1.1rem' }}>{p.title}</strong>
                <span style={{ marginLeft: '0.5rem', color: p.isAvailable ? 'green' : 'red' }}>
                  ({p.isAvailable ? 'Available' : 'Unavailable'})
                </span>
                <p style={{ margin: '0.25rem 0' }}>₹{p.price} | {p.category || 'Uncategorized'}</p>
                {p.description && <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>{p.description}</p>}
                {p.imageUrl && (
                  <img src={p.imageUrl} alt={p.title} style={{ maxWidth: '200px', maxHeight: '150px', marginTop: '0.5rem', borderRadius: '4px' }} />
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <button onClick={() => handleEdit(p)} style={{ fontSize: '0.9rem' }}>Edit</button>
                <button onClick={() => toggleAvailability(p._id, p.isAvailable)} style={{ fontSize: '0.9rem' }}>
                  {p.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                </button>
                <button onClick={() => handleDelete(p._id)} style={{ fontSize: '0.9rem', backgroundColor: 'darkred', color: 'white' }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FarmerStats() {
  const api = useApi()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/api/farmer/stats')
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
      <h3>My Dashboard</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
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
      {stats.orders.byStatus && Object.keys(stats.orders.byStatus).length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Orders by Status</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {Object.entries(stats.orders.byStatus).map(([status, count]) => (
              <div key={status} style={{ border: '1px solid #ccc', padding: '0.5rem 1rem', borderRadius: '4px' }}>
                <strong>{status}:</strong> {count}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FarmerOrders() {
  const api = useApi()
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const data = await api.get('/api/orders/farmer')
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
      setError(err.message)
    }
  }

  const filteredOrders = filter ? orders.filter((o) => o.status === filter) : orders

  const getStatusColor = (status) => {
    const colors = {
      Pending: '#ffc107',
      Accepted: '#17a2b8',
      Packed: '#007bff',
      Delivered: '#28a745',
    }
    return colors[status] || '#6c757d'
  }

  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <h3>My Orders</h3>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <label>Filter by status:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All Orders</option>
          <option value="Pending">Pending</option>
          <option value="Accepted">Accepted</option>
          <option value="Packed">Packed</option>
          <option value="Delivered">Delivered</option>
        </select>
        <span style={{ marginLeft: '1rem' }}>Total: {filteredOrders.length}</span>
      </div>
      {filteredOrders.length === 0 && <p>No orders found.</p>}
      {filteredOrders.map((o) => (
        <div key={o._id} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
            <div>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Order ID:</strong> {o._id.slice(-8)} | <strong>Customer:</strong> {o.user?.name || 'Unknown'}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Total Amount:</strong> ₹{o.totalAmount} | <strong>Date:</strong> {new Date(o.createdAt).toLocaleString()}
              </p>
            </div>
            <span
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '4px',
                backgroundColor: getStatusColor(o.status),
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              {o.status}
            </span>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <strong>Items:</strong>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
              {o.items.map((item, idx) => (
                <li key={idx}>
                  {item.product?.title || 'Product removed'} - Qty: {item.quantity} × ₹{item.product?.price || 0} = ₹
                  {(item.quantity * (item.product?.price || 0)).toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {o.status === 'Pending' && (
              <button onClick={() => updateStatus(o._id, 'Accepted')} style={{ backgroundColor: '#17a2b8', color: 'white' }}>
                Accept Order
              </button>
            )}
            {(o.status === 'Pending' || o.status === 'Accepted') && (
              <button onClick={() => updateStatus(o._id, 'Packed')} style={{ backgroundColor: '#007bff', color: 'white' }}>
                Mark as Packed
              </button>
            )}
            {(o.status === 'Packed' || o.status === 'Accepted') && (
              <button onClick={() => updateStatus(o._id, 'Delivered')} style={{ backgroundColor: '#28a745', color: 'white' }}>
                Mark as Delivered
              </button>
            )}
          </div>
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
          {user?.role === 'customer' && (
            <>
              <Link to="customer/stats">Dashboard</Link>
              <Link to="customer/profile">Profile</Link>
              <Link to="customer/orders">My Orders</Link>
            </>
          )}
          {user?.role === 'farmer' && (
            <>
              <Link to="farmer/stats">Dashboard</Link>
              <Link to="farmer/profile">Profile</Link>
              <Link to="farmer/products">My Products</Link>
              <Link to="farmer/orders">Orders</Link>
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
              element={
                user?.role === 'farmer' ? (
                  <Navigate to="farmer/stats" replace />
                ) : user?.role === 'admin' ? (
                  <Navigate to="admin/stats" replace />
                ) : (
                  <Navigate to="customer/stats" replace />
                )
              }
            />
            <Route path="customer/stats" element={<CustomerStats />} />
            <Route path="customer/profile" element={<CustomerProfile />} />
            <Route path="customer/orders" element={<CustomerOrders />} />
            <Route path="farmer/stats" element={<FarmerStats />} />
            <Route path="farmer/profile" element={<FarmerProfile />} />
            <Route path="farmer/products" element={<FarmerProducts />} />
            <Route path="farmer/orders" element={<FarmerOrders />} />
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


