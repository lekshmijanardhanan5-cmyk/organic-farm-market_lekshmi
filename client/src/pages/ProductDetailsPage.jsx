import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApi, apiRequest } from '../services/api'

function ProductDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const api = useApi()
  
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState('')
  const [selectedUpi, setSelectedUpi] = useState('')
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [canReview, setCanReview] = useState(false)
  const [checkingReview, setCheckingReview] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    loadProduct()
    loadReviews()
  }, [id])

  useEffect(() => {
    if (user?.role === 'customer' && product?._id && token) {
      checkCanReview()
    } else {
      setCanReview(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, product?._id, token])

  const loadProduct = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest(`/api/products/${id}`)
      setProduct(data)
    } catch (err) {
      setError(err.message || 'Failed to load product')
      console.error('Error loading product:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadReviews = async () => {
    try {
      const data = await apiRequest(`/api/reviews/product/${id}`)
      setReviews(data || [])
    } catch (err) {
      console.error('Failed to load reviews:', err)
      setReviews([])
    }
  }

  const checkCanReview = async () => {
    if (!user || user.role !== 'customer' || !product?._id) {
      setCanReview(false)
      return
    }
    setCheckingReview(true)
    try {
      const data = await api.get(`/api/reviews/can-review/${product._id}`)
      setCanReview(data?.canReview || false)
      // Auto-show review form if user can review
      if (data?.canReview) {
        setShowReviewForm(true)
      }
    } catch (err) {
      console.error('Failed to check review eligibility:', err)
      setCanReview(false)
    } finally {
      setCheckingReview(false)
    }
  }

  const handleOrder = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      await api.post('/api/orders', {
        items: [{ product: product._id, quantity: Number(quantity) || 1 }],
        paymentMethod,
      })
      alert('Order placed successfully!')
      setQuantity(1)
    } catch (err) {
      alert(err.message || 'Failed to place order')
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!user || user.role !== 'customer') {
      alert('Please login as a customer to submit a review')
      return
    }

    setSubmittingReview(true)
    try {
      await api.post('/api/reviews', {
        productId: product._id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      })
      setShowReviewForm(false)
      setReviewForm({ rating: 5, comment: '' })
      await loadReviews()
      await checkCanReview()
      alert('Review submitted successfully!')
    } catch (err) {
      alert(err.message || 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Loading product details...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'red' }}>{error || 'Product not found'}</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Products
        </Link>
      </div>
    )
  }

  return (
    <>
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/" style={{ color: '#1b4332', textDecoration: 'none', fontWeight: 500 }}>
          ← Back to Products
        </Link>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
          {/* Product Image */}
          <div>
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                aspectRatio: '1',
                backgroundColor: '#faf8f4',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6c757d',
                border: '1px solid #dee2e6'
              }}>
                No Image
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <h1 style={{ margin: '0 0 0.5rem 0', color: '#1b4332' }}>{product.title}</h1>
            
            {avgRating && (
              <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>⭐ {avgRating}</span>
                <span style={{ color: '#6c757d' }}>({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
              </div>
            )}

            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1b4332', margin: '1rem 0' }}>
              ₹{product.price}
            </p>

            <p style={{ color: '#666', margin: '1rem 0', lineHeight: '1.6' }}>
              {product.description}
            </p>

            <div style={{ margin: '1rem 0', padding: '1rem', backgroundColor: '#faf8f4', borderRadius: '6px' }}>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Category:</strong> {product.category || 'Uncategorized'}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Farmer:</strong> {product.farmer?.name || 'Unknown'}{product.farmer?.place ? `, Place: ${product.farmer.place}` : ''}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>Availability:</strong>{' '}
                <span style={{ color: product.isAvailable ? '#1b4332' : 'red', fontWeight: 'bold' }}>
                  {product.isAvailable ? 'Available' : 'Currently Unavailable'}
                </span>
              </p>
            </div>

            {user?.role === 'customer' && product.isAvailable && (
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="input"
                    style={{ width: 100 }}
                  />
                </div>
                <button onClick={() => { setShowPaymentModal(true); setSelectedPayment(''); }} className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
                  Order Now
                </button>
              </div>
            )}

            {!user && product.isAvailable && (
              <div style={{ marginTop: '1.5rem' }}>
                <Link to="/login" className="btn btn-primary">
                  Login to Order
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Review Section - Prominent for logged-in customers */}
      {user?.role === 'customer' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem', color: '#1b4332' }}>Add Your Review</h2>
          
          {checkingReview ? (
            <p style={{ color: '#6c757d' }}>Checking review eligibility...</p>
          ) : canReview ? (
            <div>
              {!showReviewForm ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="btn btn-primary"
                  style={{ marginBottom: '1rem' }}
                >
                  Write a Review
                </button>
              ) : (
                <form onSubmit={handleReviewSubmit} style={{ padding: '1rem', backgroundColor: '#faf8f4', borderRadius: '6px' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Rating:
                    </label>
                    <select
                      value={reviewForm.rating}
                      onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                      className="select"
                      required
                      style={{ minWidth: 200 }}
                    >
                      <option value={5}>5 - Excellent</option>
                      <option value={4}>4 - Very Good</option>
                      <option value={3}>3 - Good</option>
                      <option value={2}>2 - Fair</option>
                      <option value={1}>1 - Poor</option>
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                      Your Review:
                    </label>
                    <textarea
                      placeholder="Share your experience with this product..."
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      className="input"
                      required
                      style={{
                        width: '100%',
                        minHeight: 120,
                        padding: '0.75rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submittingReview}
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewForm(false)
                        setReviewForm({ rating: 5, comment: '' })
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div style={{ padding: '1rem', backgroundColor: '#fdf6e3', borderRadius: '6px', border: '1px solid #e0dcd4' }}>
              <p style={{ margin: 0, color: '#7a6c3a' }}>
                {user ? 'You can review this product after your order has been delivered.' : 'Please login to write a review.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Reviews Display Section */}
      <div className="card">
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>
          Customer Reviews ({reviews.length})
        </h2>
        
        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.map((r) => (
              <div
                key={r._id}
                style={{
                  padding: '1rem',
                  backgroundColor: '#faf8f4',
                  borderRadius: '6px',
                  border: '1px solid #e0dcd4'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <strong style={{ fontSize: '1.1rem' }}>{r.user?.name || 'Anonymous'}</strong>
                    <div style={{ marginTop: '0.25rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>{'⭐'.repeat(r.rating)}</span>
                      <span style={{ marginLeft: '0.5rem', color: '#6c757d', fontSize: '0.9rem' }}>
                        {r.rating}/5
                      </span>
                    </div>
                  </div>
                  <small style={{ color: '#6c757d' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </small>
                </div>
                {r.comment && (
                  <p style={{ margin: '0.5rem 0 0 0', color: '#333', lineHeight: '1.6' }}>
                    {r.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    {/* Payment modal */}
    {showPaymentModal && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}>
        <div className="card" style={{ width: '100%', maxWidth: 480, padding: '1.25rem' }}>
          <h3 style={{ marginTop: 0 }}>Choose Payment Method</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
              <input type="radio" name="pd_payment" value="COD" checked={selectedPayment === 'COD'} onChange={(e) => setSelectedPayment(e.target.value)} />
              <span>Cash on Delivery</span>
            </label>
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
              <input type="radio" name="pd_payment" value="UPI" checked={selectedPayment === 'UPI'} onChange={(e) => setSelectedPayment(e.target.value)} />
              <span>UPI</span>
            </label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
            {selectedPayment === 'UPI' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: 500 }}>Enter UPI ID</label>
                <input
                  type="text"
                  value={selectedUpi}
                  onChange={(e) => setSelectedUpi(e.target.value)}
                  placeholder="example@upi"
                  className="input"
                  style={{ padding: '0.5rem' }}
                />
                {selectedUpi && !/^[^\s@]+@[^\s@]+$/.test(selectedUpi) && (
                  <small style={{ color: '#9b2c2c' }}>Enter a valid UPI ID (e.g., name@upi)</small>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setShowPaymentModal(false); setSelectedPayment(''); setSelectedUpi(''); }}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!selectedPayment || (selectedPayment === 'UPI' && !selectedUpi)}
                onClick={async () => {
                  if (!selectedPayment) return
                  try {
                    if (selectedPayment === 'UPI') {
                      // Simulate demo payment
                      await new Promise((r) => setTimeout(r, 700))
                      alert('Payment successful (Demo Mode)')
                      // Create order with paymentStatus = Paid
                      await api.post('/api/orders', {
                        items: [{ product: product._id, quantity: Number(quantity) || 1 }],
                        paymentMethod: 'UPI',
                        upiId: selectedUpi.trim(),
                        paymentStatus: 'Paid',
                      })
                      alert('Order placed successfully!')
                    } else {
                      await api.post('/api/orders', {
                        items: [{ product: product._id, quantity: Number(quantity) || 1 }],
                        paymentMethod: selectedPayment,
                      })
                      alert('Order placed successfully!')
                    }
                    setQuantity(1)
                    setShowPaymentModal(false)
                    setSelectedUpi('')
                  } catch (err) {
                    alert(err.message || 'Failed to place order')
                  }
                }}
              >
                {selectedPayment === 'UPI' ? 'Pay Now (Demo)' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

export default ProductDetailsPage
