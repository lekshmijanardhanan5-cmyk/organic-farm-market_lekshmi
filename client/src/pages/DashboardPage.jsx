import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../services/api'
import { useEffect, useState, useRef } from 'react'

function Protected({ children }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

function CustomerProfile() {
  const api = useApi()
  const { user, setUser, token } = useAuth()
  const [form, setForm] = useState({ 
    name: '', 
    phoneNumber: '', 
    address: '', 
    email: '', 
    place: '', 
    landmark: '', 
    pincode: '' 
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [errors, setErrors] = useState({})

  // Fetch full profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setFetching(false)
        return
      }
      try {
        const data = await api.get('/api/auth/profile')
        // Populate all fields from the logged-in user data
        setForm({
          name: data.name || '',
          phoneNumber: data.phoneNumber || '',
          address: data.address || '',
          email: data.email || '',
          place: data.place || '',
          landmark: data.landmark || '',
          pincode: data.pincode || ''
        })
      } catch (err) {
        console.error('Failed to fetch profile:', err)
        setMessage('Failed to load profile data')
      } finally {
        setFetching(false)
      }
    }
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const validateForm = () => {
    const newErrors = {}

    // Validate email
    if (form.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(form.email)) {
        newErrors.email = 'Invalid email format'
      }
    }

    // Validate phone number (10 digits)
    if (form.phoneNumber) {
      const phoneRegex = /^\d{10}$/
      if (!phoneRegex.test(form.phoneNumber)) {
        newErrors.phoneNumber = 'Phone number must be exactly 10 digits'
      }
    }

    // Validate pincode (6 digits)
    if (form.pincode) {
      const pincodeRegex = /^\d{6}$/
      if (!pincodeRegex.test(form.pincode)) {
        newErrors.pincode = 'Pincode must be exactly 6 digits'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setErrors({})

    if (!validateForm()) {
      setMessage('Please fix the validation errors')
      return
    }

    setLoading(true)
    try {
      // Submit all form data including name from user input
      const data = await api.put('/api/auth/profile', form)
      setMessage('Profile updated successfully!')
      setUser({ ...user, ...data.user })
    } catch (err) {
      setMessage(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return <div className="loading">Loading profile...</div>
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0, marginBottom: '2rem' }}>My Profile</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 600 }}>
        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>Name</label>
          <input
            type="text"
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter name"
            required
            style={{ width: '100%', padding: '0.75rem' }}
          />
        </div>

        {/* Phone Number */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>Phone Number</label>
          <input
            type="text"
            className="input"
            value={form.phoneNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '') // Only allow digits
              setForm({ ...form, phoneNumber: value })
              if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' })
            }}
            placeholder="10 digits"
            maxLength={10}
            style={{ width: '100%', padding: '0.75rem' }}
          />
          {errors.phoneNumber && <span style={{ color: '#9b2c2c', fontSize: '0.85rem', marginTop: '-0.25rem' }}>{errors.phoneNumber}</span>}
        </div>

        {/* Address */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>Address</label>
          <textarea
            className="input"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            rows={3}
            style={{ width: '100%', padding: '0.75rem', resize: 'vertical' }}
          />
        </div>

        {/* Email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>Email</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => {
              setForm({ ...form, email: e.target.value })
              if (errors.email) setErrors({ ...errors, email: '' })
            }}
            onFocus={(e) => e.target.select()}
            required
            style={{ width: '100%', padding: '0.75rem' }}
          />
          {errors.email && <span style={{ color: '#9b2c2c', fontSize: '0.85rem', marginTop: '-0.25rem' }}>{errors.email}</span>}
        </div>

        {/* Place */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>Place</label>
          <input
            type="text"
            className="input"
            value={form.place}
            onChange={(e) => setForm({ ...form, place: e.target.value })}
            style={{ width: '100%', padding: '0.75rem' }}
          />
        </div>

        {/* Landmark */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>Landmark</label>
          <input
            type="text"
            className="input"
            value={form.landmark}
            onChange={(e) => setForm({ ...form, landmark: e.target.value })}
            style={{ width: '100%', padding: '0.75rem' }}
          />
        </div>

        {/* Pincode */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>Pincode</label>
          <input
            type="text"
            className="input"
            value={form.pincode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '') // Only allow digits
              setForm({ ...form, pincode: value })
              if (errors.pincode) setErrors({ ...errors, pincode: '' })
            }}
            placeholder="6 digits"
            maxLength={6}
            style={{ width: '100%', padding: '0.75rem' }}
          />
          {errors.pincode && <span style={{ color: '#9b2c2c', fontSize: '0.85rem', marginTop: '-0.25rem' }}>{errors.pincode}</span>}
        </div>

        {/* Update Profile Button */}
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
          style={{ 
            marginTop: '1rem', 
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            alignSelf: 'flex-start'
          }}
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
      {message && (
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '0.75rem 1rem',
          backgroundColor: message.includes('success') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.includes('success') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          color: message.includes('success') ? '#155724' : '#721c24'
        }}>
          {message}
        </div>
      )}
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
          <p style={{ fontSize: '1.5rem', margin: '0.5rem 0', color: '#1b4332' }}>₹{stats.totalSpent}</p>
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
  const { token } = useAuth()
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [reviewingProduct, setReviewingProduct] = useState(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [productReviews, setProductReviews] = useState({}) // { productId: { canReview: bool, hasReviewed: bool } }
  const eventSourcesRef = useRef({}) // orderId -> EventSource

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      // Send status filter to backend if selected
      const url = filter 
        ? `/api/orders/user?status=${encodeURIComponent(filter.trim())}`
        : '/api/orders/user'
      const data = await api.get(url)
      setOrders(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load orders')
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      load()
    }
  }, [token, filter])

  // Subscribe to SSE for real-time order updates for each order (use token in query)
  useEffect(() => {
    if (!token || orders.length === 0) return

    const esMap = eventSourcesRef.current || {}

    orders.forEach((o) => {
      if (esMap[o._id]) return // already subscribed
      try {
        const url = `/api/orders/subscribe/${o._id}?token=${encodeURIComponent(token)}`
        const es = new EventSource(url)
        es.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data || "{}")
            if (!data || !data.orderId) return
            setOrders((prev) => prev.map(ord => ord._id === data.orderId ? { ...ord, ...data } : ord))
          } catch (e) {
            console.error("Failed to handle SSE message", e)
          }
        }
        es.onerror = () => {
          // close on error
          es.close()
          delete esMap[o._id]
        }
        esMap[o._id] = es
      } catch (err) {
        console.error("Failed to create EventSource for order", o._id, err)
      }
    })

    // cleanup on unmount
    return () => {
      Object.values(esMap).forEach((s) => s && s.close())
      eventSourcesRef.current = {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, token])

  // Check review eligibility for products in delivered orders
  useEffect(() => {
    const checkReviews = async () => {
      if (!token || orders.length === 0) {
        return
      }

      const deliveredOrders = orders.filter(o => o.status === 'Delivered')
      if (deliveredOrders.length === 0) {
        setProductReviews({})
        return
      }

      const productIds = new Set()
      deliveredOrders.forEach(order => {
        order.items.forEach(item => {
          // Handle both populated and unpopulated product references
          const productId = item.product?._id || item.product
          if (productId) {
            // Convert to string to ensure consistent key format
            productIds.add(String(productId))
          }
        })
      })

      if (productIds.size === 0) {
        setProductReviews({})
        return
      }

      const reviewStatus = {}
      for (const productId of productIds) {
        try {
          const data = await api.get(`/api/reviews/can-review/${productId}`)
          reviewStatus[productId] = data
        } catch (err) {
          console.error(`Failed to check review for product ${productId}:`, err)
          reviewStatus[productId] = { canReview: false, hasReviewed: false, hasDeliveredOrder: false }
        }
      }
      setProductReviews(reviewStatus)
    }

    checkReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, token])

  const getStatusColor = (status) => {
    const colors = {
      Pending: '#c9a84c',
      Accepted: '#2d6a4f',
      Packed: '#1b4332',
      Delivered: '#1b4332',
    }
    return colors[status] || '#6c757d'
  }

  // Fix filter: ensure exact status match (case-sensitive, trimmed)
  const filteredOrders = filter 
    ? orders.filter((o) => {
        const orderStatus = String(o.status || '').trim();
        const filterStatus = String(filter).trim();
        return orderStatus === filterStatus;
      })
    : orders

  if (loading) return <div className="loading">Loading orders...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>My Orders</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ fontWeight: 500 }}>Filter:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="select" style={{ minWidth: 150 }}>
              <option value="">All Orders</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Packed">Packed</option>
              <option value="Delivered">Delivered</option>
            </select>
            <span style={{ color: '#6c757d', fontWeight: 500 }}>Total: {filteredOrders.length}</span>
          </div>
        </div>
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
            {filter ? `No ${filter} orders found.` : 'No orders found.'}
          </div>
        ) : (
          filteredOrders.map((o) => (
            <div key={o._id} className="card" style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
                    Order #{o._id.slice(-8)} • {new Date(o.createdAt).toLocaleDateString()}
                  </p>
                  <p style={{ margin: '0.5rem 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#1b4332' }}>
                    ₹{o.totalAmount}
                  </p>
                  {o.paymentMethod && (
                    <p style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.95rem' }}>
                      <strong>Payment:</strong> {o.paymentMethod}
                    </p>
                  )}
                  {o.paymentStatus && (
                    <p style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.95rem' }}>
                      <strong>Payment Status:</strong> {o.paymentStatus}
                    </p>
                  )}
                  {o.paymentMethod === 'UPI' && o.upiId && (
                    <p style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.95rem' }}>
                      <strong>UPI ID:</strong> {o.upiId}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <span 
                    className="badge"
                    style={{
                      backgroundColor: getStatusColor(o.status),
                      color: o.status === 'Pending' ? '#000' : 'white'
                    }}
                  >
                    {o.status}
                  </span>
                  
                </div>
              </div>
              <button
                onClick={() => setExpandedOrder(expandedOrder === o._id ? null : o._id)}
                className="btn btn-secondary"
                style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
              >
                {expandedOrder === o._id ? '▼ Hide Details' : '▶ Show Details'}
              </button>
              {expandedOrder === o._id && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#faf8f4', borderRadius: '6px' }}>
                  <strong style={{ display: 'block', marginBottom: '0.75rem' }}>Order Items:</strong>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', listStyle: 'none' }}>
                    {o.items.map((item, idx) => {
                      // Convert product ID to string for consistent matching
                      // Handle both populated and unpopulated product references
                      const rawProductId = item.product?._id || item.product
                      const productId = rawProductId ? String(rawProductId) : null
                      const reviewInfo = productId ? productReviews[productId] : null
                      const canReview = reviewInfo?.canReview || false
                      const hasReviewed = reviewInfo?.hasReviewed || false
                      const isDelivered = o.status === 'Delivered'
                      
                      return (
                        <li key={idx} style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'white', borderRadius: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div style={{ flex: 1 }}>
                              <strong>{item.product?.title || 'Product removed'}</strong>
                              <span style={{ color: '#6c757d', marginLeft: '0.5rem' }}>
                                • Qty: {item.quantity} × ₹{item.product?.price || 0} = ₹{(item.quantity * (item.product?.price || 0)).toFixed(2)}
                              </span>
                            </div>
                            {isDelivered && productId && (
                              <div style={{ marginLeft: '1rem' }}>
                                {hasReviewed ? (
                                  <span style={{ color: '#1b4332', fontSize: '0.9rem' }}>✓ Reviewed</span>
                                ) : reviewInfo ? (
                                  canReview ? (
                                    <button
                                      onClick={() => setReviewingProduct(reviewingProduct === productId ? null : productId)}
                                      className="btn"
                                      style={{ 
                                        backgroundColor: '#1b4332', 
                                        color: 'white', 
                                        fontSize: '0.85rem', 
                                        padding: '0.4rem 0.8rem' 
                                      }}
                                    >
                                      {reviewingProduct === productId ? 'Cancel' : 'Review'}
                                    </button>
                                  ) : (
                                    <span style={{ color: '#6c757d', fontSize: '0.85rem' }}>
                                      {reviewInfo.hasDeliveredOrder ? 'Already reviewed' : 'Cannot review'}
                                    </span>
                                  )
                                ) : (
                                  <span style={{ color: '#6c757d', fontSize: '0.85rem' }}>Checking...</span>
                                )}
                              </div>
                            )}
                          </div>
                          {reviewingProduct === productId && canReview && !hasReviewed && (
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault()
                                try {
                                  await api.post('/api/reviews', {
                                    productId: productId,
                                    rating: reviewForm.rating,
                                    comment: reviewForm.comment,
                                  })
                                  alert('Review submitted successfully!')
                                  setReviewingProduct(null)
                                  setReviewForm({ rating: 5, comment: '' })
                                  // Refresh review status
                                  const data = await api.get(`/api/reviews/can-review/${productId}`)
                                  setProductReviews(prev => ({ ...prev, [productId]: data }))
                                } catch (err) {
                                  alert(err.message || 'Failed to submit review')
                                }
                              }}
                              style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#faf8f4', borderRadius: '4px' }}
                            >
                              <div style={{ marginBottom: '0.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Rating: </label>
                                <select
                                  value={reviewForm.rating}
                                  onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                                  className="select"
                                  required
                                  style={{ width: '100%', maxWidth: 300 }}
                                >
                                  <option value={5}>5 - Excellent</option>
                                  <option value={4}>4 - Very Good</option>
                                  <option value={3}>3 - Good</option>
                                  <option value={2}>2 - Fair</option>
                                  <option value={1}>1 - Poor</option>
                                </select>
                              </div>
                              <div style={{ marginBottom: '0.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Comment: </label>
                                <textarea
                                  placeholder="Write your review..."
                                  value={reviewForm.comment}
                                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                  className="input"
                                  style={{ width: '100%', minHeight: 80, padding: '0.5rem' }}
                                />
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  type="submit"
                                  className="btn"
                                  style={{ backgroundColor: '#1b4332', color: 'white' }}
                                >
                                  Submit Review
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReviewingProduct(null)
                                    setReviewForm({ rating: 5, comment: '' })
                                  }}
                                  className="btn btn-secondary"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function FarmerProfile() {
  const api = useApi()
  const { user, setUser, token } = useAuth()
  const [form, setForm] = useState({ 
    name: '', 
    phoneNumber: '', 
    farmName: '', 
    address: '', 
    place: '', 
    landmark: '', 
    pincode: '', 
    productTypes: [], 
    yearsOfExperience: 0 
  })
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [errors, setErrors] = useState({})

  const productTypeOptions = [
    'Vegetables',
    'Fruits',
    'Grains',
    'Dairy',
    'Poultry',
    'Spices',
    'Herbs',
    'Organic Seeds',
    'Honey',
    'Other'
  ]

  // Fetch full profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setFetching(false)
        return
      }
      try {
        const data = await api.get('/api/auth/profile')
        setEmail(data.email || '')
        setForm({
          name: data.name || '',
          phoneNumber: data.phoneNumber || '',
          farmName: data.farmName || '',
          address: data.address || '',
          place: data.place || '',
          landmark: data.landmark || '',
          pincode: data.pincode || '',
          productTypes: data.productTypes || [],
          yearsOfExperience: data.yearsOfExperience || 0
        })
      } catch (err) {
        console.error('Failed to fetch profile:', err)
        setMessage('Failed to load profile data')
      } finally {
        setFetching(false)
      }
    }
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const validateForm = () => {
    const newErrors = {}

    // Validate phone number (10 digits)
    if (form.phoneNumber) {
      const phoneRegex = /^\d{10}$/
      if (!phoneRegex.test(form.phoneNumber)) {
        newErrors.phoneNumber = 'Phone number must be exactly 10 digits'
      }
    }

    // Validate pincode (6 digits)
    if (form.pincode) {
      const pincodeRegex = /^\d{6}$/
      if (!pincodeRegex.test(form.pincode)) {
        newErrors.pincode = 'Pincode must be exactly 6 digits'
      }
    }

    // Validate years of experience
    if (form.yearsOfExperience < 0) {
      newErrors.yearsOfExperience = 'Years of experience cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProductTypeChange = (productType) => {
    setForm(prev => {
      const currentTypes = prev.productTypes || []
      if (currentTypes.includes(productType)) {
        return { ...prev, productTypes: currentTypes.filter(t => t !== productType) }
      } else {
        return { ...prev, productTypes: [...currentTypes, productType] }
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setErrors({})

    if (!validateForm()) {
      setMessage('Please fix the validation errors')
      return
    }

    setLoading(true)
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

  if (fetching) {
    return <div className="loading">Loading profile...</div>
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 style={{ margin: 0 }}>My Profile</h3>
        {user?.role === 'farmer' && (
          <span
            className="badge"
            style={{
              backgroundColor: user?.isApproved ? '#1b4332' : '#c9a84c',
              color: user?.isApproved ? 'white' : '#000',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              fontWeight: 500
            }}
          >
            {user?.isApproved ? '✓ Approved' : '⏳ Pending Approval'}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 700 }}>
        {/* Personal Info Section */}
        <div>
          <h4 style={{ margin: '0 0 1.5rem 0', color: '#1b4332', fontSize: '1.1rem', fontWeight: 600, paddingBottom: '0.5rem', borderBottom: '2px solid #1b4332' }}>
            Personal Info
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>Full Name</label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.75rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>Phone Number</label>
              <input
                type="text"
                className="input"
                value={form.phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setForm({ ...form, phoneNumber: value })
                  if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' })
                }}
                placeholder="10 digits"
                maxLength={10}
                style={{ width: '100%', padding: '0.75rem' }}
              />
              {errors.phoneNumber && <span style={{ color: '#9b2c2c', fontSize: '0.85rem', marginTop: '-0.25rem' }}>{errors.phoneNumber}</span>}
            </div>
          </div>
        </div>

        {/* Farm Info Section */}
        <div>
          <h4 style={{ margin: '0 0 1.5rem 0', color: '#1b4332', fontSize: '1.1rem', fontWeight: 600, paddingBottom: '0.5rem', borderBottom: '2px solid #1b4332' }}>
            Farm Info
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>Farm Name</label>
              <input
                type="text"
                className="input"
                value={form.farmName}
                onChange={(e) => setForm({ ...form, farmName: e.target.value })}
                style={{ width: '100%', padding: '0.75rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>Product Types</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', padding: '1rem', backgroundColor: '#faf8f4', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                {productTypeOptions.map((type) => (
                  <label
                    key={type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '0.5rem 1rem',
                      backgroundColor: form.productTypes.includes(type) ? '#1b4332' : 'white',
                      color: form.productTypes.includes(type) ? 'white' : '#333',
                      border: `1px solid ${form.productTypes.includes(type) ? '#1b4332' : '#dee2e6'}`,
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.productTypes.includes(type)}
                      onChange={() => handleProductTypeChange(type)}
                      style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>Years of Experience</label>
              <input
                type="number"
                className="input"
                value={form.yearsOfExperience}
                onChange={(e) => {
                  const value = Math.max(0, parseInt(e.target.value) || 0)
                  setForm({ ...form, yearsOfExperience: value })
                  if (errors.yearsOfExperience) setErrors({ ...errors, yearsOfExperience: '' })
                }}
                min="0"
                style={{ width: '100%', padding: '0.75rem' }}
              />
              {errors.yearsOfExperience && <span style={{ color: '#9b2c2c', fontSize: '0.85rem', marginTop: '-0.25rem' }}>{errors.yearsOfExperience}</span>}
            </div>
          </div>
        </div>

        {/* Contact Info Section */}
        <div>
          <h4 style={{ margin: '0 0 1.5rem 0', color: '#1b4332', fontSize: '1.1rem', fontWeight: 600, paddingBottom: '0.5rem', borderBottom: '2px solid #1b4332' }}>
            Contact Info
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>Address</label>
              <textarea
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '0.75rem', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>Place</label>
              <input
                type="text"
                className="input"
                value={form.place}
                onChange={(e) => setForm({ ...form, place: e.target.value })}
                style={{ width: '100%', padding: '0.75rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>Landmark</label>
              <input
                type="text"
                className="input"
                value={form.landmark}
                onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                style={{ width: '100%', padding: '0.75rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>Pincode</label>
              <input
                type="text"
                className="input"
                value={form.pincode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setForm({ ...form, pincode: value })
                  if (errors.pincode) setErrors({ ...errors, pincode: '' })
                }}
                placeholder="6 digits"
                maxLength={6}
                style={{ width: '100%', padding: '0.75rem' }}
              />
              {errors.pincode && <span style={{ color: '#9b2c2c', fontSize: '0.85rem', marginTop: '-0.25rem' }}>{errors.pincode}</span>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>Email</label>
              <input
                type="email"
                className="input"
                value={email || user?.email || ''}
                readOnly
                onFocus={(e) => e.target.select()}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem',
                  backgroundColor: '#e9ecef',
                  cursor: 'text'
                }}
              />
              <span style={{ fontSize: '0.85rem', color: '#6c757d', marginTop: '-0.25rem' }}>Email cannot be changed</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 500, color: '#333', fontSize: '0.95rem' }}>Account Status</label>
              <div style={{ padding: '0.75rem', backgroundColor: '#faf8f4', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                <span
                  className="badge"
                  style={{
                    backgroundColor: user?.isApproved ? '#1b4332' : '#c9a84c',
                    color: user?.isApproved ? 'white' : '#000',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    fontWeight: 500,
                    display: 'inline-block'
                  }}
                >
                  {user?.isApproved ? '✓ Approved' : '⏳ Pending Approval'}
                </span>
                {!user?.isApproved && (
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#6c757d' }}>
                    Your account is pending admin approval. You cannot add products until approved.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Update Profile Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ 
              padding: '0.75rem 3rem',
              fontSize: '1rem',
              minWidth: 200
            }}
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>

      {message && (
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '0.75rem 1rem',
          backgroundColor: message.includes('success') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.includes('success') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          color: message.includes('success') ? '#155724' : '#721c24',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}
    </div>
  )
}

function FarmerProducts() {
  const api = useApi()
  const { user, token, refreshUser } = useAuth()
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ title: '', price: '', description: '', category: '', imageUrl: '', isAvailable: true })
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  // Refresh user data when component mounts to get latest approval status
  useEffect(() => {
    if (token && user?.role === 'farmer' && refreshUser) {
      refreshUser(token)
    }
  }, [token, user?.role, refreshUser])

  const load = async () => {
    try {
      const data = await api.get('/api/farmer/products')
      setProducts(data)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      load()
    }
  }, [token])

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

  return (
    <div style={{ padding: '2rem 1rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ 
          fontSize: '2rem', 
          fontWeight: '700', 
          color: '#1a1a1a', 
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em'
        }}>
          My Products
        </h2>
        <p style={{ color: '#6b7280', fontSize: '1rem' }}>
          Manage your product catalog and inventory
        </p>
      </div>

      {error && (
        <div style={{
          padding: '0.875rem 1rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#991b1b',
          marginBottom: '1.5rem',
          fontSize: '0.875rem'
        }}>
          {error}
        </div>
      )}

      {/* Add/Edit Product Form */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '3rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#1a1a1a',
          marginBottom: '1.5rem'
        }}>
          {editing ? 'Edit Product' : 'Add New Product'}
        </h3>
        <form onSubmit={editing ? handleUpdate : handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Product Title *
            </label>
            <input
              placeholder="e.g., Fresh Organic Tomatoes"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1b4332'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Price (₹) *
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
              min="0"
              step="0.01"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1b4332'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Category
            </label>
            <input
              placeholder="e.g., Vegetables, Fruits"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1b4332'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Image URL
            </label>
            <input
              placeholder="https://example.com/image.jpg"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1b4332'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Description
            </label>
            <textarea
              placeholder="Describe your product..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                transition: 'all 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1b4332'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="checkbox"
              id="isAvailable"
              checked={form.isAvailable}
              onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
              style={{
                width: '1.125rem',
                height: '1.125rem',
                cursor: 'pointer'
              }}
            />
            <label htmlFor="isAvailable" style={{
              fontSize: '0.9375rem',
              color: '#374151',
              cursor: 'pointer',
              fontWeight: '500'
            }}>
              Product is available for purchase
            </label>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#1b4332',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flex: '0 0 auto'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2d6a4f'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#1b4332'}
            >
              {editing ? 'Update Product' : 'Add Product'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => { setEditing(null); setForm({ title: '', price: '', description: '', category: '', imageUrl: '', isAvailable: true }) }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.target.style.backgroundColor = '#f9fafb'; e.target.style.borderColor = '#9ca3af' }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = '#ffffff'; e.target.style.borderColor = '#d1d5db' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Products Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1a1a1a'
          }}>
            Your Products
          </h3>
          <span style={{
            padding: '0.375rem 0.875rem',
            backgroundColor: '#f0fdf4',
            color: '#14532d',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            {products.length} {products.length === 1 ? 'product' : 'products'}
          </span>
        </div>

        {products.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            backgroundColor: '#f9fafb',
            border: '1px dashed #d1d5db',
            borderRadius: '12px',
            color: '#6b7280'
          }}>
            <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No products yet</p>
            <p style={{ fontSize: '0.875rem' }}>Add your first product using the form above!</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {products.map((p) => (
              <div
                key={p._id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Product Image */}
                <div style={{
                  width: '100%',
                  height: '200px',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
                    display: p.imageUrl ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    color: '#9ca3af',
                    fontSize: '3rem'
                  }}>
                    📦
                  </div>
                  {/* Availability Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backgroundColor: p.isAvailable ? '#dcfce7' : '#fee2e2',
                    color: p.isAvailable ? '#166534' : '#991b1b',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}>
                    {p.isAvailable ? 'Available' : 'Unavailable'}
                  </div>
                </div>

                {/* Product Info */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1a1a1a',
                    marginBottom: '0.5rem',
                    lineHeight: '1.4'
                  }}>
                    {p.title}
                  </h4>

                  {p.category && (
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.625rem',
                      backgroundColor: '#f0fdf4',
                      color: '#14532d',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      marginBottom: '0.75rem',
                      width: 'fit-content'
                    }}>
                      {p.category}
                    </span>
                  )}

                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#1b4332',
                    marginBottom: '0.75rem'
                  }}>
                    ₹{Number(p.price).toFixed(2)}
                  </div>

                  {p.description && (
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      lineHeight: '1.5',
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {p.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginTop: 'auto',
                    paddingTop: '1rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <button
                      onClick={() => handleEdit(p)}
                      style={{
                        flex: 1,
                        padding: '0.625rem 1rem',
                        backgroundColor: '#ffffff',
                        color: '#1b4332',
                        border: '1px solid #1b4332',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f0fdf4';
                        e.target.style.borderColor = '#2d6a4f';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#ffffff';
                        e.target.style.borderColor = '#1b4332';
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      style={{
                        flex: 1,
                        padding: '0.625rem 1rem',
                        backgroundColor: '#ffffff',
                        color: '#9b2c2c',
                        border: '1px solid #9b2c2c',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#fee2e2';
                        e.target.style.borderColor = '#822727';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#ffffff';
                        e.target.style.borderColor = '#9b2c2c';
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
          <p style={{ fontSize: '1.5rem', margin: '0.5rem 0', color: '#1b4332' }}>₹{stats.revenue}</p>
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
  const { token, user } = useAuth()
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      // Send status filter to backend if selected
      const url = filter 
        ? `/api/orders/farmer?status=${encodeURIComponent(filter.trim())}`
        : '/api/orders/farmer'
      const data = await api.get(url)
      setOrders(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load orders')
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      load()
    }
  }, [token, filter])

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/orders/${id}/status`, { status })
      await load()
    } catch (err) {
      alert(err.message || 'Failed to update order status')
    }
  }

  // Filter items in each order to only show products from this farmer
  const getFarmerItems = (order) => {
    if (!user?.id) return []
    const farmerId = String(user.id)
    return order.items.filter((item) => {
      const product = item.product
      if (!product) return false
      // Check if product has farmer populated or is a reference
      // Handle different cases: populated object, ObjectId, or string
      let productFarmerId = null
      if (product.farmer) {
        if (typeof product.farmer === 'object') {
          productFarmerId = product.farmer._id?.toString() || product.farmer.toString()
        } else {
          productFarmerId = String(product.farmer)
        }
      }
      return productFarmerId === farmerId
    })
  }

  // Calculate subtotal for farmer's products in the order
  const calculateFarmerSubtotal = (order) => {
    const farmerItems = getFarmerItems(order)
    return farmerItems.reduce((sum, item) => {
      const price = item.product?.price || 0
      return sum + (item.quantity * price)
    }, 0)
  }

  // Fix filter: ensure exact status match (case-sensitive, trimmed)
  const filteredOrders = filter 
    ? orders.filter((o) => {
        const orderStatus = String(o.status || '').trim();
        const filterStatus = String(filter).trim();
        return orderStatus === filterStatus;
      })
    : orders

  const getStatusColor = (status) => {
    const colors = {
      Pending: '#c9a84c',
      Accepted: '#2d6a4f',
      Packed: '#1b4332',
      Delivered: '#1b4332',
    }
    return colors[status] || '#6c757d'
  }

  if (loading) return <div className="loading">Loading orders...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>My Orders</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ fontWeight: 500 }}>Filter:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="select" style={{ minWidth: 150 }}>
              <option value="">All Orders</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Packed">Packed</option>
              <option value="Delivered">Delivered</option>
            </select>
            <span style={{ color: '#6c757d', fontWeight: 500 }}>Total: {filteredOrders.length}</span>
          </div>
        </div>
        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
            {filter ? `No ${filter} orders found.` : 'No orders found.'}
          </div>
        ) : (
          filteredOrders
            .map((o) => {
              const farmerItems = getFarmerItems(o)
              const farmerSubtotal = calculateFarmerSubtotal(o)
              return { order: o, farmerItems, farmerSubtotal }
            })
            .filter(({ farmerItems }) => farmerItems.length > 0)
            .map(({ order: o, farmerItems, farmerSubtotal }) => (
              <div key={o._id} className="card" style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
                      Order #{o._id.slice(-8)} • {new Date(o.createdAt).toLocaleDateString()}
                    </p>
                    <p style={{ margin: '0.5rem 0', fontSize: '1.1rem', fontWeight: 'bold' }}>
                      Customer: <span style={{ color: '#1b4332' }}>{o.user?.name || 'Unknown'}</span>
                      {o.user?.email && (
                        <span style={{ color: '#6c757d', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                          ({o.user.email})
                        </span>
                      )}
                    </p>
                    <p style={{ margin: '0.5rem 0', fontSize: '1.25rem', fontWeight: 'bold', color: '#1b4332' }}>
                      My Products Subtotal: ₹{farmerSubtotal.toFixed(2)}
                    </p>
                    {o.paymentMethod && (
                      <p style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.95rem' }}>
                        <strong>Payment:</strong> {o.paymentMethod}
                      </p>
                    )}
                  </div>
                  <span 
                    className="badge"
                    style={{
                      backgroundColor: getStatusColor(o.status),
                      color: o.status === 'Pending' ? '#000' : 'white',
                      fontSize: '1rem',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    {o.status}
                  </span>
                </div>
                <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#faf8f4', borderRadius: '6px', marginBottom: '1rem' }}>
                  <strong style={{ display: 'block', marginBottom: '0.75rem', fontSize: '1.1rem' }}>My Products in This Order:</strong>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', listStyle: 'none' }}>
                    {farmerItems.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'white', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '0.25rem' }}>
                              {item.product?.title || 'Product removed'}
                            </strong>
                            <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                              <span>Quantity: <strong>{item.quantity}</strong></span>
                              <span style={{ marginLeft: '1rem' }}>Price: ₹<strong>{item.product?.price || 0}</strong> per unit</span>
                              <span style={{ marginLeft: '1rem', color: '#1b4332', fontWeight: 'bold' }}>
                                Subtotal: ₹{(item.quantity * (item.product?.price || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                  {o.status === 'Pending' && (
                    <button onClick={() => updateStatus(o._id, 'Accepted')} className="btn" style={{ backgroundColor: '#2d6a4f', color: 'white' }}>
                      Accept Order
                    </button>
                  )}
                  {(o.status === 'Pending' || o.status === 'Accepted') && (
                    <button onClick={() => updateStatus(o._id, 'Packed')} className="btn" style={{ backgroundColor: '#1b4332', color: 'white' }}>
                      Mark as Packed
                    </button>
                  )}
                  {(o.status === 'Packed' || o.status === 'Accepted') && (
                    <button onClick={() => updateStatus(o._id, 'Delivered')} className="btn btn-primary">
                      Mark as Delivered
                    </button>
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}

// Admin Layout Component with Sidebar and Header
function AdminLayout({ children, pageTitle }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = [
    { path: '/dashboard/admin/stats', label: 'Dashboard', icon: '📊' },
    { path: '/dashboard/admin/users', label: 'Users', icon: '👥' },
    { path: '/dashboard/admin/products', label: 'Products', icon: '📦' },
    { path: '/dashboard/admin/orders', label: 'Orders', icon: '🛒' },
    { path: '/dashboard/admin/transactions', label: 'Transactions', icon: '💳' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 1001,
          padding: '0.5rem',
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '1.25rem'
        }}
        className="mobile-menu-btn"
      >
        ☰
      </button>

      {/* Sidebar Overlay (mobile only) */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            display: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          className="sidebar-overlay"
        />
      )}

      {/* Fixed Left Sidebar */}
      <aside
        className={sidebarOpen ? 'mobile-open' : ''}
        style={{
          // Desktop: keep sidebar in the normal layout flow so it never overlaps page content.
          // Mobile: we switch to `position: fixed` via the media-query below for the slide-in behavior.
          position: 'sticky',
          top: 0,
          width: '260px',
          height: '100vh',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          zIndex: 1000,
          boxShadow: '2px 0 4px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.3s ease'
        }}
      >
        {/* Sidebar Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1a1a1a',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            Admin Panel
          </h2>
        </div>

        {/* Navigation Links */}
        <nav style={{
          flex: 1,
          padding: '1rem 0',
          overflowY: 'auto'
        }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1.5rem',
                margin: '0.25rem 0.75rem',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive(item.path) ? '#1b4332' : '#6b7280',
                backgroundColor: isActive(item.path) ? '#f0fdf4' : 'transparent',
                fontWeight: isActive(item.path) ? '600' : '500',
                fontSize: '0.9375rem',
                transition: 'all 0.2s',
                border: isActive(item.path) ? '1px solid #bbf7d0' : '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                  e.currentTarget.style.color = '#374151'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#6b7280'
                }
              }}
            >
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div
        className="admin-main-content"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease'
        }}
      >
        {/* Top Header */}
        <header style={{
          position: 'sticky',
          top: 0,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 100,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: 0,
            flex: 1,
            textAlign: 'center'
          }}>
            {pageTitle || 'Dashboard'}
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <span style={{
              fontSize: '0.9375rem',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              {user?.name || 'Admin'}
            </span>
            <button
              onClick={logout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#9b2c2c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#822727'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#9b2c2c'}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main style={{
          flex: 1,
          padding: '2rem',
          overflowY: 'auto'
        }}>
          {children}
        </main>
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn {
            display: block !important;
          }
          .sidebar-overlay {
            display: block !important;
          }
          aside {
            position: fixed;
            top: 0;
            left: 0;
          }
          aside {
            transform: translateX(-100%);
          }
          aside.mobile-open {
            transform: translateX(0);
          }
        }
        @media (max-width: 768px) {
          /* Make stats grid 2 columns on tablet */
          .admin-stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 1rem !important;
          }
        }
        @media (max-width: 480px) {
          .admin-main-content header {
            padding: 1rem !important;
            flex-direction: column;
            gap: 0.75rem;
          }
          .admin-main-content header h1 {
            font-size: 1.25rem !important;
          }
          .admin-main-content main {
            padding: 1rem !important;
          }
          /* Make stats grid single column on very small screens */
          .admin-stats-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          /* Ensure cards maintain equal height on mobile */
          .admin-stats-grid > div {
            height: 160px !important;
          }
        }
      `}</style>
    </div>
  )
}

function AdminStats() {
  const api = useApi()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await api.get('/api/admin/stats')
        setStats(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
        <p>Loading statistics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#fee2e2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        color: '#991b1b'
      }}>
        {error}
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users.total,
      icon: '👥',
      color: '#2d6a4f', // Blue
      bgColor: '#f0fdf4',
      borderColor: '#bfdbfe',
      label: `Farmers: ${stats.users.farmers} • Customers: ${stats.users.customers}`,
      onClick: () => window.location.href = '/dashboard/admin/users'
    },
    {
      title: 'Total Orders',
      value: stats.orders.total,
      icon: '🛒',
      color: '#2d6a4f', // Blue
      bgColor: '#f0fdf4',
      borderColor: '#bfdbfe',
      onClick: () => window.location.href = '/dashboard/admin/orders'
    },
    {
      title: 'Total Revenue',
      value: `₹${Number(stats.revenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: '💰',
      color: '#1b4332', // Green
      bgColor: '#dcfce7',
      borderColor: '#bbf7d0',
      onClick: () => window.location.href = '/dashboard/admin/orders'
    },
    {
      title: 'Total Products',
      value: stats.products.total,
      icon: '📦',
      color: '#2d6a4f', // Blue (can be changed if needed)
      bgColor: '#f0fdf4',
      borderColor: '#bfdbfe',
      onClick: () => window.location.href = '/dashboard/admin/products'
    },
    {
      title: 'Pending Farmers',
      value: stats.users.pendingFarmers,
      icon: '⏳',
      color: '#ea580c', // Orange
      bgColor: '#fff7ed',
      borderColor: '#fed7aa',
      isCritical: stats.users.pendingFarmers > 0,
      onClick: () => window.location.href = '/dashboard/admin/users?filter=pending'
    },
    {
      title: 'Blocked Users',
      value: stats.users.blockedUsers,
      icon: '🚫',
      color: '#9b2c2c', // Red
      bgColor: '#fee2e2',
      borderColor: '#fecaca',
      isCritical: stats.users.blockedUsers > 0,
      onClick: () => window.location.href = '/dashboard/admin/users?filter=blocked'
    },
  ]

  return (
    <AdminLayout pageTitle="Dashboard Overview">
      <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '0.375rem',
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            System Overview
          </h2>
          <p style={{
            color: '#6b7280',
            fontSize: '0.9375rem',
            margin: 0
          }}>
            Monitor your platform's key metrics at a glance
          </p>
        </div>

        {/* Statistics Grid - Equal sized cards */}
        <div 
          className="admin-stats-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem'
          }}>
          {statCards.map((card, index) => (
            <div
              key={index}
              onClick={card.onClick}
              style={{
                backgroundColor: card.bgColor,
                border: `1px solid ${card.borderColor}`,
                borderRadius: '10px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                overflow: 'hidden',
                height: '160px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
                e.currentTarget.style.borderColor = card.color
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.borderColor = card.borderColor
              }}
            >
              {/* Icon and Critical Indicator Row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                {/* Icon */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  flexShrink: 0,
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}>
                  {card.icon}
                </div>

                {/* Critical Indicator */}
                {card.isCritical && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: card.color,
                    animation: 'pulse 2s infinite',
                    flexShrink: 0
                  }} />
                )}
              </div>

              {/* Value - Large, Bold Number */}
              <div style={{
                fontSize: '2.25rem',
                fontWeight: '800',
                color: card.color,
                marginBottom: '0.5rem',
                lineHeight: '1',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                letterSpacing: '-0.02em'
              }}>
                {card.value}
              </div>

              {/* Title - Medium */}
              <div style={{
                fontSize: '0.9375rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: card.label ? '0.25rem' : '0',
                letterSpacing: '-0.01em',
                lineHeight: '1.3'
              }}>
                {card.title}
              </div>

              {/* Label - Small Description */}
              {card.label && (
                <div style={{
                  fontSize: '0.8125rem',
                  color: '#6b7280',
                  lineHeight: '1.4',
                  marginTop: '0.25rem'
                }}>
                  {card.label}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1.75rem',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '1.25rem',
            letterSpacing: '-0.01em'
          }}>
            Quick Actions
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <Link
              to="/dashboard/admin/users"
              style={{
                padding: '0.875rem 1rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                textDecoration: 'none',
                color: '#374151',
                fontSize: '0.9375rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'block',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
                e.currentTarget.style.borderColor = '#d1d5db'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            >
              Manage Users
            </Link>
            <Link
              to="/dashboard/admin/products"
              style={{
                padding: '0.875rem 1rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                textDecoration: 'none',
                color: '#374151',
                fontSize: '0.9375rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'block',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
                e.currentTarget.style.borderColor = '#d1d5db'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            >
              View Products
            </Link>
            <Link
              to="/dashboard/admin/orders"
              style={{
                padding: '0.875rem 1rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                textDecoration: 'none',
                color: '#374151',
                fontSize: '0.9375rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                display: 'block',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
                e.currentTarget.style.borderColor = '#d1d5db'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            >
              View Orders
            </Link>
          </div>
        </div>
      </div>

      {/* Pulse Animation for Critical Indicators */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

function AdminUsers() {
  const api = useApi()
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [filter, setFilter] = useState({ role: '', isApproved: '', isBlocked: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const loadRoles = async () => {
    try {
      const data = await api.get('/api/admin/roles')
      setRoles(data || [])
    } catch (err) {
      console.error('Error loading roles:', err)
    // Fallback to default roles if API fails
      setRoles(['admin', 'farmer', 'customer'])
    }
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filter.role) params.append('role', filter.role)
      if (filter.isApproved) params.append('isApproved', filter.isApproved)
      if (filter.isBlocked) params.append('isBlocked', filter.isBlocked)
      const queryString = params.toString()
      const url = `/api/admin/users${queryString ? `?${queryString}` : ''}`
      const data = await api.get(url)
      setUsers(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load users')
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadRoles()
      load()
    }
  }, [filter, token])

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

  if (loading) {
    return (
      <AdminLayout pageTitle="Users">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <p>Loading users...</p>
        </div>
      </AdminLayout>
    )
  }
  if (error) {
    return (
      <AdminLayout pageTitle="Users">
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#991b1b'
        }}>
          Error: {error}
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout pageTitle="User Management">
      <div>
      {users.length === 0 && !loading && <p>No users found.</p>}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <select value={filter.role} onChange={(e) => setFilter({ ...filter, role: e.target.value })} className="select">
          <option value="">All Roles</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </option>
          ))}
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
    </AdminLayout>
  )
}

function AdminProducts() {
  const api = useApi()
  const { token } = useAuth()
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get('/api/admin/products')
      setProducts(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load products')
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      load()
    }
  }, [token])

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await api.delete(`/api/products/${id}`)
      await load()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) {
    return (
      <AdminLayout pageTitle="Products">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <p>Loading products...</p>
        </div>
      </AdminLayout>
    )
  }
  if (error) {
    return (
      <AdminLayout pageTitle="Products">
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#991b1b'
        }}>
          Error: {error}
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout pageTitle="Product Management">
      <div>
      <div style={{ marginTop: '1rem' }}>
        {products.length === 0 && !loading && <p>No products found.</p>}
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
    </AdminLayout>
  )
}

function AdminOrders() {
  const api = useApi()
  const { token } = useAuth()
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const ordersData = await api.get('/api/admin/orders')
      setOrders(ordersData || [])
    } catch (err) {
      setError(err.message || 'Failed to load orders')
      console.error('Error loading orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      load()
    }
  }, [token])

  if (loading) {
    return (
      <AdminLayout pageTitle="Orders">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <p>Loading orders...</p>
        </div>
      </AdminLayout>
    )
  }
  if (error) {
    return (
      <AdminLayout pageTitle="Orders">
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#991b1b'
        }}>
          Error: {error}
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout pageTitle="Order Management">
      <div>
      <div style={{ marginTop: '1rem' }}>
        {orders.length === 0 && !loading && <p>No orders found.</p>}
        {orders.map((o) => (
          <div key={o._id} className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0.25rem 0' }}>
                  <strong>Order ID:</strong> {o._id.slice(-8)} | <strong>Customer:</strong> {o.user?.name} ({o.user?.email}) |{' '}
                  <strong>Status:</strong> {o.status} | <strong>Total:</strong> ₹{o.totalAmount}
                </p>
                {o.paymentMethod && (
                  <p style={{ margin: '0.25rem 0', color: '#6c757d' }}>
                    <strong>Payment:</strong> {o.paymentMethod}
                  </p>
                )}
                {o.paymentMethod === 'UPI' && o.upiId && (
                  <p style={{ margin: '0.25rem 0', color: '#6c757d' }}>
                    <strong>UPI ID:</strong> {o.upiId}
                  </p>
                )}
                
              </div>
            </div>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Items:</strong>
            </p>
            <ul style={{ marginBottom: '1rem' }}>
              {o.items.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '0.25rem' }}>
                  {item.product?.title || 'Product removed'} - Qty: {item.quantity} (Farmer: {item.product?.farmer?.name || 'Unknown'})
                </li>
              ))}
            </ul>
            <small style={{ color: '#6c757d' }}>Created: {new Date(o.createdAt).toLocaleString()}</small>
          </div>
        ))}
      </div>
      </div>
    </AdminLayout>
  )
}

 

function TransactionList({ title, transactions, loading, error, showFarmerBreakdown }) {
  if (loading) return <div className="loading">Loading transactions...</div>
  if (error) return <div className="error">Error: {error}</div>

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {transactions.length === 0 ? (
        <div style={{ color: '#6c757d', padding: '1rem 0' }}>No transactions found.</div>
      ) : (
        transactions.map((tx) => (
          <div key={tx._id} className="card" style={{ marginTop: '1rem' }}>
            <p style={{ margin: '0.25rem 0', color: '#6c757d' }}>
              TXN #{String(tx._id).slice(-8)} • {new Date(tx.createdAt).toLocaleString()}
            </p>
            <p style={{ margin: '0.25rem 0', fontWeight: 700, fontSize: '1.05rem', color: '#1b4332' }}>
              ₹{tx.totalAmount} • {tx.paymentMethod} • {tx.paymentStatus}
            </p>
            <p style={{ margin: '0.25rem 0', color: '#374151' }}>
              Customer: {tx.customer?.name || 'Unknown'} {tx.customer?.email ? `(${tx.customer.email})` : ''}
            </p>
            {tx.upiId && (
              <p style={{ margin: '0.25rem 0', color: '#6c757d' }}>
                UPI: {tx.upiId}
              </p>
            )}
            {tx.cardLast4 && (
              <p style={{ margin: '0.25rem 0', color: '#6c757d' }}>
                Card ending: {tx.cardLast4}
              </p>
            )}
            {showFarmerBreakdown && (
              <p style={{ margin: '0.25rem 0', color: '#6c757d' }}>
                Farmers: {(tx.farmers || []).map((f) => f.name).filter(Boolean).join(', ') || 'N/A'}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  )
}

function CustomerTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const api = useApi()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/api/transactions/customer')
        setTransactions(data || [])
      } catch (err) {
        setError(err.message || 'Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return <TransactionList title="My Transactions" transactions={transactions} loading={loading} error={error} showFarmerBreakdown />
}

function FarmerTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const api = useApi()
  const { user } = useAuth()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/api/transactions/farmer')
        setTransactions(data || [])
      } catch (err) {
        setError(err.message || 'Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const mapped = transactions.map((tx) => ({
    ...tx,
    items: (tx.items || []).filter((item) => {
      const farmerId = item.farmer?._id || item.farmer
      return String(farmerId) === String(user?._id || user?.id)
    }),
  }))

  return <TransactionList title="Farmer Transaction History" transactions={mapped} loading={loading} error={error} showFarmerBreakdown={false} />
}

function AdminTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const api = useApi()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/api/transactions/admin')
        setTransactions(data || [])
      } catch (err) {
        setError(err.message || 'Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <AdminLayout pageTitle="Transactions">
      <TransactionList title="All Transactions" transactions={transactions} loading={loading} error={error} showFarmerBreakdown />
    </AdminLayout>
  )
}

function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <Protected>
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        {/* Header and navigation - hidden for admin (they have sidebar) */}
        {user?.role !== 'admin' && (
          <>
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Dashboard</h2>
              <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
                Logged in as <strong style={{ color: '#212529' }}>{user?.name}</strong> ({user?.role})
              </p>
              <button 
                onClick={logout}
                className="btn btn-danger"
                style={{
                  marginTop: '0.5rem'
                }}
              >
                Logout
              </button>
            </div>
            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {user?.role === 'customer' && (
                  <>
                    <Link to="/dashboard/customer/stats" className="nav-link">Dashboard</Link>
                    <Link to="/dashboard/customer/profile" className="nav-link">Profile</Link>
                    <Link to="/dashboard/customer/orders" className="nav-link">My Orders</Link>
                    <Link to="/dashboard/customer/transactions" className="nav-link">Transactions</Link>
                  </>
                )}
                {user?.role === 'farmer' && (
                  <>
                    <Link to="/dashboard/farmer/stats" className="nav-link">Dashboard</Link>
                    <Link to="/dashboard/farmer/profile" className="nav-link">Profile</Link>
                    <Link to="/dashboard/farmer/products" className="nav-link">My Products</Link>
                    <Link to="/dashboard/farmer/orders" className="nav-link">Orders</Link>
                    <Link to="/dashboard/farmer/transactions" className="nav-link">Transactions</Link>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: '1rem' }}>
          <Routes>
            <Route
              index
              element={
                user?.role === 'farmer' ? (
                  <Navigate to="/dashboard/farmer/stats" replace />
                ) : user?.role === 'admin' ? (
                  <Navigate to="/dashboard/admin/stats" replace />
                ) : (
                  <Navigate to="/dashboard/customer/stats" replace />
                )
              }
            />
            <Route path="customer/stats" element={<CustomerStats />} />
            <Route path="customer/profile" element={<CustomerProfile />} />
            <Route path="customer/orders" element={<CustomerOrders />} />
            <Route path="customer/transactions" element={<CustomerTransactions />} />
            <Route path="farmer/stats" element={<FarmerStats />} />
            <Route path="farmer/profile" element={<FarmerProfile />} />
            <Route path="farmer/products" element={<FarmerProducts />} />
            <Route path="farmer/orders" element={<FarmerOrders />} />
            <Route path="farmer/transactions" element={<FarmerTransactions />} />
            <Route path="admin/stats" element={<AdminStats />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/products" element={<AdminProducts />} />
            <Route path="admin/orders" element={<AdminOrders />} />
            <Route path="admin/transactions" element={<AdminTransactions />} />
            
          </Routes>
        </div>
      </div>
    </Protected>
  )
}

export default DashboardPage


