import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApi, apiRequest } from '../services/api'

function ProductCard({ product, user, api, onOrderSuccess }) {
  const [quantity, setQuantity] = useState(1)
  const [reviews, setReviews] = useState([])
  const [showReviews, setShowReviews] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [loadingReviews, setLoadingReviews] = useState(false)

  useEffect(() => {
    if (showReviews) {
      loadReviews()
    }
  }, [showReviews])

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

  const handleOrder = async () => {
    if (!user) {
      return
    }
    try {
      await api.post('/api/orders', {
        items: [{ product: product._id, quantity: Number(quantity) || 1 }],
      })
      alert('Order placed successfully!')
      setQuantity(1)
      if (onOrderSuccess) onOrderSuccess()
    } catch (err) {
      alert(err.message || 'Failed to place order')
    }
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
      alert('Review submitted!')
    } catch (err) {
      alert(err.message || 'Failed to submit review')
    }
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px', backgroundColor: '#fff' }}>
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.title}
          style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: '4px', marginBottom: '0.5rem' }}
        />
      )}
      <h3 style={{ margin: '0.5rem 0' }}>{product.title}</h3>
      {avgRating && (
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 'bold' }}>⭐ {avgRating}</span>
          <span style={{ marginLeft: '0.5rem', color: '#666', fontSize: '0.9rem' }}>({reviews.length} reviews)</span>
        </div>
      )}
      <p style={{ color: '#666', margin: '0.5rem 0' }}>{product.description}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <div>
          <p style={{ margin: '0.25rem 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>
            ₹{product.price}
          </p>
          <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
            {product.category || 'Uncategorized'} | Farmer: {product.farmer?.name || 'Unknown'}
          </p>
        </div>
      </div>
      {user?.role === 'customer' && product.isAvailable && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={{ width: 80, padding: '0.25rem' }}
          />
          <button onClick={handleOrder} style={{ flex: 1, padding: '0.5rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Order Now
          </button>
        </div>
      )}
      {!product.isAvailable && <p style={{ color: 'red', marginTop: '0.5rem' }}>Currently unavailable</p>}
      <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
        <button
          onClick={() => setShowReviews(!showReviews)}
          style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {showReviews ? 'Hide Reviews' : `View Reviews (${reviews.length})`}
        </button>
        {user?.role === 'customer' && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            style={{ marginLeft: '1rem', background: 'none', border: 'none', color: '#28a745', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {showReviewForm ? 'Cancel Review' : 'Write Review'}
          </button>
        )}
      </div>
      {showReviewForm && user?.role === 'customer' && (
        <form onSubmit={handleReviewSubmit} style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
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
          <button type="submit" style={{ padding: '0.25rem 0.5rem', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
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
              <div key={r._id} style={{ marginBottom: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
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
    <div style={{ padding: '1rem' }}>
      <h2>Organic Products</h2>
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
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
            style={{ padding: '0.5rem 1rem', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Clear Filters
          </button>
        )}
      </div>
      {filteredProducts.length === 0 ? (
        <p>No products found. {products.length === 0 ? 'Check back later!' : 'Try adjusting your filters.'}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filteredProducts.map((p) => (
            <ProductCard key={p._id} product={p} user={user} api={api} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ProductsPage


