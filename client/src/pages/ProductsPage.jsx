import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApi, apiRequest } from '../services/api'

function ProductCard({ product, user, api, onOrderSuccess }) {
  const { token } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState('')
  const [selectedUpi, setSelectedUpi] = useState('')
  const [reviews, setReviews] = useState([])
  const [showReviews, setShowReviews] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [canReview, setCanReview] = useState(false)
  const [checkingReview, setCheckingReview] = useState(false)

  useEffect(() => {
    if (showReviews) {
      loadReviews()
    }
  }, [showReviews])

  useEffect(() => {
    if (user?.role === 'customer' && product._id && token) {
      checkCanReview()
    } else {
      setCanReview(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, product._id, token])

  const loadReviews = async () => {
    setLoadingReviews(true)
    try {
      const data = await apiRequest(`/api/reviews/product/${product._id}`)
      setReviews(data)
    } catch (err) {
      console.error('Failed to load reviews:', err)
    } finally {
      setLoadingReviews(false)
    }
  }

  const checkCanReview = async () => {
    if (!user || user.role !== 'customer' || !product._id) {
      setCanReview(false)
      return
    }
    setCheckingReview(true)
    try {
      const data = await api.get(`/api/reviews/can-review/${product._id}`)
      setCanReview(data?.canReview || false)
    } catch (err) {
      console.error('Failed to check review eligibility:', err)
      setCanReview(false)
    } finally {
      setCheckingReview(false)
    }
  }

  const handleOrder = async () => {
    if (!user) {
      return
    }
    // Open payment modal to select payment method
    setSelectedPayment('')
    setShowPaymentModal(true)
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/reviews', {
        productId: product._id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      })
      setShowReviewForm(false)
      setReviewForm({ rating: 5, comment: '' })
      await loadReviews()
      await checkCanReview() // Refresh canReview status
      alert('Review submitted!')
    } catch (err) {
      alert(err.message || 'Failed to submit review')
    }
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        {product.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.title}
            style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: '4px', marginBottom: '0.5rem', cursor: 'pointer' }}
          />
        )}
        <h3 style={{ margin: '0.5rem 0', cursor: 'pointer', color: '#1b4332' }}>{product.title}</h3>
      </Link>
      {avgRating && (
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 'bold' }}>⭐ {avgRating}</span>
          <span style={{ marginLeft: '0.5rem', color: '#666', fontSize: '0.9rem' }}>({reviews.length} reviews)</span>
        </div>
      )}
      <p style={{ color: '#666', margin: '0.5rem 0' }}>{product.description}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <div>
          <p style={{ margin: '0.25rem 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#1b4332' }}>
            ₹{product.price}
          </p>
          <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
            {product.category || 'Uncategorized'} | Farmer: {product.farmer?.name || 'Unknown'}{product.farmer?.place ? `, Place: ${product.farmer.place}` : ''}
          </p>
        </div>
      </div>
      {user?.role === 'customer' && product.isAvailable && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input"
              style={{ width: 80 }}
            />
          </div>
          <button onClick={handleOrder} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Order Now
          </button>
        </div>
      )}
      {/* Payment modal for quick order */}
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
          <div className="card" style={{ width: '100%', maxWidth: 420, padding: '1rem' }}>
            <h4 style={{ marginTop: 0 }}>Select Payment Method</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                <input type="radio" name={`modal-payment-${product._id}`} value="COD" checked={selectedPayment === 'COD'} onChange={(e) => setSelectedPayment(e.target.value)} />
                <span>Cash on Delivery</span>
              </label>
              <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer' }}>
                <input type="radio" name={`modal-payment-${product._id}`} value="UPI" checked={selectedPayment === 'UPI'} onChange={(e) => setSelectedPayment(e.target.value)} />
                <span>UPI</span>
              </label>
              {selectedPayment === 'UPI' && (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setShowPaymentModal(false); setSelectedPayment(''); setSelectedUpi(''); }}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!selectedPayment || (selectedPayment === 'UPI' && !selectedUpi)}
                onClick={async () => {
                  try {
                    if (selectedPayment === 'UPI') {
                      // Simulate demo payment
                      await new Promise((r) => setTimeout(r, 700))
                      alert('Payment successful (Demo Mode)')
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
                    if (onOrderSuccess) onOrderSuccess()
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
      )}
      {!product.isAvailable && <p style={{ color: 'red', marginTop: '0.5rem' }}>Currently unavailable</p>}
      <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
        <button
          onClick={() => setShowReviews(!showReviews)}
          style={{ background: 'none', border: 'none', color: '#1b4332', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }}
        >
          {showReviews ? 'Hide Reviews' : `View Reviews (${reviews.length})`}
        </button>
        {user?.role === 'customer' && canReview && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            style={{ marginLeft: '1rem', background: 'none', border: 'none', color: '#1b4332', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {showReviewForm ? 'Cancel Review' : 'Write Review'}
          </button>
        )}
        {user?.role === 'customer' && !canReview && !checkingReview && (
          <span style={{ marginLeft: '1rem', color: '#6c757d', fontSize: '0.9rem' }}>
            (Review after delivery)
          </span>
        )}
      </div>
      {showReviewForm && user?.role === 'customer' && (
        <form onSubmit={handleReviewSubmit} style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#faf8f4', borderRadius: '4px' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <label>Rating: </label>
            <select
              value={reviewForm.rating}
              onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
              required
            >
              <option value={5}>5 - Excellent</option>
              <option value={4}>4 - Very Good</option>
              <option value={3}>3 - Good</option>
              <option value={2}>2 - Fair</option>
              <option value={1}>1 - Poor</option>
            </select>
          </div>
          <textarea
            placeholder="Write your review..."
            value={reviewForm.comment}
            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
            style={{ width: '100%', minHeight: 60, padding: '0.25rem', marginBottom: '0.5rem' }}
          />
          <button type="submit" style={{ padding: '0.25rem 0.5rem', backgroundColor: '#1b4332', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Submit Review
          </button>
        </form>
      )}
      {showReviews && (
        <div style={{ marginTop: '0.5rem', maxHeight: 200, overflowY: 'auto' }}>
          {loadingReviews ? (
            <p>Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p style={{ color: '#666', fontSize: '0.9rem' }}>No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map((r) => (
              <div key={r._id} style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: '#faf8f4', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <strong>{r.user?.name || 'Anonymous'}</strong>
                    <span style={{ marginLeft: '0.5rem' }}>{'⭐'.repeat(r.rating)}</span>
                  </div>
                  <small style={{ color: '#666' }}>{new Date(r.createdAt).toLocaleDateString()}</small>
                </div>
                {r.comment && <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{r.comment}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function HeroSection() {
  const navigate = useNavigate()
  return (
    <section style={{ marginBottom: '3rem' }}>
      {/* Hero Text Area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '0',
        backgroundColor: '#f0ede6',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '0'
      }}>
        {/* Left: Heading */}
        <div style={{
          padding: '3.5rem 3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          borderRight: '1px solid #e0dcd4'
        }}>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
            fontWeight: 700,
            color: '#1b4332',
            lineHeight: 1.1,
            margin: '0 0 2rem 0'
          }}>
            Grow <em style={{ fontStyle: 'italic' }}>Smarter</em><br />
            Harvest <em style={{ fontStyle: 'italic' }}>Better</em>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>Est. 2024</span>
            <span style={{ width: '1px', height: '20px', backgroundColor: '#c9a84c' }} />
            <span style={{ fontWeight: 500 }}>Supported 500+ Farmers</span>
          </div>
        </div>

        {/* Right: Description + CTA */}
        <div style={{
          padding: '3.5rem 3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '1.5rem'
        }}>
          <p style={{
            fontSize: '1rem',
            color: '#4a4a4a',
            lineHeight: 1.7,
            margin: 0
          }}>
            Embrace fresh organic produce, connect directly with local farmers,
            and experience transparent pricing for a healthier, sustainable lifestyle.
          </p>
          <div>
            <button
              onClick={() => {
                document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 2rem',
                backgroundColor: '#1b4332',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.25s',
                letterSpacing: '0.02em'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2d6a4f'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1b4332'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <span style={{ fontSize: '0.8rem' }}>●</span> Buy Products Now
            </button>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div style={{
        position: 'relative',
        borderRadius: '0 0 12px 12px',
        overflow: 'hidden',
        marginTop: '-1px'
      }}>
        <img
          src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&h=500&fit=crop&crop=center"
          alt="Lush green farmland with rows of crops stretching into the distance"
          style={{
            width: '100%',
            height: '420px',
            objectFit: 'cover',
            display: 'block'
          }}
        />
        {/* Inset card image */}
        <div style={{
          position: 'absolute',
          bottom: '1.5rem',
          right: '1.5rem',
          width: '220px',
          height: '160px',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          border: '3px solid rgba(255,255,255,0.6)'
        }}>
          <img
            src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&h=300&fit=crop"
            alt="Modern farming technology with tablet in field"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        {/* Gradient overlay at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '120px',
          background: 'linear-gradient(transparent, rgba(27,67,50,0.15))',
          pointerEvents: 'none'
        }} />
      </div>

      {/* Responsive override for mobile */}
      <style>{`
        @media (max-width: 768px) {
          section > div:first-child {
            grid-template-columns: 1fr !important;
          }
          section > div:first-child > div:first-child {
            border-right: none !important;
            border-bottom: 1px solid #e0dcd4;
            padding: 2rem 1.5rem 1.5rem !important;
          }
          section > div:first-child > div:last-child {
            padding: 1.5rem !important;
          }
          section > div:nth-child(2) img:first-child {
            height: 260px !important;
          }
        }
      `}</style>
    </section>
  )
}

function ProductsPage() {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [categories, setCategories] = useState([])
  const { user } = useAuth()
  const api = useApi()
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest('/api/products')
        setProducts(data)
        setFilteredProducts(data)
        // Extract unique categories
        const cats = [...new Set(data.map((p) => p.category).filter(Boolean))]
        setCategories(cats)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let filtered = products

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter) {
      filtered = filtered.filter((p) => p.category === categoryFilter)
    }

    setFilteredProducts(filtered)
  }, [searchTerm, categoryFilter, products])

  if (loading) return <p>Loading products...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <HeroSection />

      <div id="products-section" className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#1b4332' }}>Organic Products</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
            style={{ flex: 1, minWidth: 200 }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="select"
            style={{ minWidth: 180 }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {(searchTerm || categoryFilter) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setCategoryFilter('')
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
      {filteredProducts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#6c757d' }}>
          <p style={{ fontSize: '1.1rem', margin: 0 }}>
            {products.length === 0 ? 'No products available. Check back later!' : 'No products match your filters. Try adjusting your search.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {filteredProducts.map((p) => (
            <ProductCard key={p._id} product={p} user={user} api={api} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductsPage


