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
  const [originalName, setOriginalName] = useState('')
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
        setOriginalName(data.name || '')
        setForm({
          name: '', // Name field will show placeholder only
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
      // Use original name if name field is empty, otherwise use entered name
      const submitData = {
        ...form,
        name: form.name.trim() || originalName
      }
      const data = await api.put('/api/auth/profile', submitData)
      setMessage('Profile updated successfully!')
      setUser({ ...user, ...data.user })
      // Update original name if name was changed
      if (form.name.trim()) {
        setOriginalName(form.name.trim())
      }
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
          {errors.phoneNumber && <span style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '-0.25rem' }}>{errors.phoneNumber}</span>}
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
          {errors.email && <span style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '-0.25rem' }}>{errors.email}</span>}
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
          {errors.pincode && <span style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '-0.25rem' }}>{errors.pincode}</span>}
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
  const { token } = useAuth()
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [reviewingProduct, setReviewingProduct] = useState(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [productReviews, setProductReviews] = useState({}) // { productId: { canReview: bool, hasReviewed: bool } }

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
      Pending: '#ffc107',
      Accepted: '#17a2b8',
      Packed: '#007bff',
      Delivered: '#28a745',
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
                  <p style={{ margin: '0.5rem 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                    ₹{o.totalAmount}
                  </p>
                </div>
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
              <button
                onClick={() => setExpandedOrder(expandedOrder === o._id ? null : o._id)}
                className="btn btn-secondary"
                style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
              >
                {expandedOrder === o._id ? '▼ Hide Details' : '▶ Show Details'}
              </button>
              {expandedOrder === o._id && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
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
                                  <span style={{ color: '#28a745', fontSize: '0.9rem' }}>✓ Reviewed</span>
                                ) : reviewInfo ? (
                                  canReview ? (
                                    <button
                                      onClick={() => setReviewingProduct(reviewingProduct === productId ? null : productId)}
                                      className="btn"
                                      style={{ 
                                        backgroundColor: '#28a745', 
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
                              style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}
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
                                  style={{ backgroundColor: '#28a745', color: 'white' }}
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
              backgroundColor: user?.isApproved ? '#28a745' : '#ffc107',
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
          <h4 style={{ margin: '0 0 1.5rem 0', color: '#28a745', fontSize: '1.1rem', fontWeight: 600, paddingBottom: '0.5rem', borderBottom: '2px solid #28a745' }}>
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
              {errors.phoneNumber && <span style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '-0.25rem' }}>{errors.phoneNumber}</span>}
            </div>
          </div>
        </div>

        {/* Farm Info Section */}
        <div>
          <h4 style={{ margin: '0 0 1.5rem 0', color: '#28a745', fontSize: '1.1rem', fontWeight: 600, paddingBottom: '0.5rem', borderBottom: '2px solid #28a745' }}>
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                {productTypeOptions.map((type) => (
                  <label
                    key={type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '0.5rem 1rem',
                      backgroundColor: form.productTypes.includes(type) ? '#28a745' : 'white',
                      color: form.productTypes.includes(type) ? 'white' : '#333',
                      border: `1px solid ${form.productTypes.includes(type) ? '#28a745' : '#dee2e6'}`,
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
              {errors.yearsOfExperience && <span style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '-0.25rem' }}>{errors.yearsOfExperience}</span>}
            </div>
          </div>
        </div>

        {/* Contact Info Section */}
        <div>
          <h4 style={{ margin: '0 0 1.5rem 0', color: '#28a745', fontSize: '1.1rem', fontWeight: 600, paddingBottom: '0.5rem', borderBottom: '2px solid #28a745' }}>
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
              {errors.pincode && <span style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: '-0.25rem' }}>{errors.pincode}</span>}
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
              <div style={{ padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                <span
                  className="badge"
                  style={{
                    backgroundColor: user?.isApproved ? '#28a745' : '#ffc107',
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
  const { token } = useAuth()
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    try {
      // Send status filter to backend if selected
      const url = filter 
        ? `/api/orders/farmer?status=${encodeURIComponent(filter.trim())}`
        : '/api/orders/farmer'
      const data = await api.get(url)
      setOrders(data || [])
    } catch (err) {
      setError(err.message)
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
      setError(err.message)
    }
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
      Pending: '#ffc107',
      Accepted: '#17a2b8',
      Packed: '#007bff',
      Delivered: '#28a745',
    }
    return colors[status] || '#6c757d'
  }

  if (error) return <div className="error">{error}</div>

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
                  Order #{o._id.slice(-8)} • Customer: {o.user?.name || 'Unknown'} • {new Date(o.createdAt).toLocaleDateString()}
                </p>
                <p style={{ margin: '0.5rem 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                  ₹{o.totalAmount}
                </p>
              </div>
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
            <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '6px', marginBottom: '1rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Items:</strong>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', listStyle: 'none' }}>
                {o.items.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem', padding: '0.5rem', background: 'white', borderRadius: '4px' }}>
                    <strong>{item.product?.title || 'Product removed'}</strong>
                    <span style={{ color: '#6c757d', marginLeft: '0.5rem' }}>
                      • Qty: {item.quantity} × ₹{item.product?.price || 0} = ₹{(item.quantity * (item.product?.price || 0)).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {o.status === 'Pending' && (
                <button onClick={() => updateStatus(o._id, 'Accepted')} className="btn" style={{ backgroundColor: '#17a2b8', color: 'white' }}>
                  Accept Order
                </button>
              )}
              {(o.status === 'Pending' || o.status === 'Accepted') && (
                <button onClick={() => updateStatus(o._id, 'Packed')} className="btn" style={{ backgroundColor: '#007bff', color: 'white' }}>
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
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState({ role: '', isApproved: '', isBlocked: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

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

  if (loading) return <p>Loading users...</p>
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>

  return (
    <div>
      <h3>User Management</h3>
      {users.length === 0 && !loading && <p>No users found.</p>}
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

  if (loading) return <p>Loading products...</p>
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>

  return (
    <div>
      <h3>All Products Management</h3>
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
      const data = await api.get('/api/admin/orders')
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
  }, [token])

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/orders/${id}/status`, { status })
      await load()
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <p>Loading orders...</p>
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>

  return (
    <div>
      <h3>All Orders Monitoring</h3>
      <div style={{ marginTop: '1rem' }}>
        {orders.length === 0 && !loading && <p>No orders found.</p>}
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
              <Link to="/dashboard/customer/stats">Dashboard</Link>
              <Link to="/dashboard/customer/profile">Profile</Link>
              <Link to="/dashboard/customer/orders">My Orders</Link>
            </>
          )}
          {user?.role === 'farmer' && (
            <>
              <Link to="/dashboard/farmer/stats">Dashboard</Link>
              <Link to="/dashboard/farmer/profile">Profile</Link>
              <Link to="/dashboard/farmer/products">My Products</Link>
              <Link to="/dashboard/farmer/orders">Orders</Link>
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <Link to="/dashboard/admin/stats">Statistics</Link>
              <Link to="/dashboard/admin/users">Users</Link>
              <Link to="/dashboard/admin/products">Products</Link>
              <Link to="/dashboard/admin/orders">Orders</Link>
            </>
          )}
        </div>

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


