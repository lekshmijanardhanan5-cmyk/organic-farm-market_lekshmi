import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApi, apiRequest } from '../services/api'

function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const { user } = useAuth()
  const api = useApi()
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest('/api/products')
        setProducts(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleOrder = async (productId) => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      await api.post('/api/orders', {
        items: [{ product: productId, quantity: Number(quantity) || 1 }],
      })
      alert('Order placed!')
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <p>Loading products...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>

  return (
    <div>
      <h2>Organic Products</h2>
      {products.length === 0 && <p>No products yet.</p>}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {products.map((p) => (
          <div key={p._id} style={{ border: '1px solid #ccc', padding: '0.75rem' }}>
            <h3>{p.title}</h3>
            {p.imageUrl && (
              <img src={p.imageUrl} alt={p.title} style={{ maxWidth: '100%', maxHeight: 150, objectFit: 'cover' }} />
            )}
            <p>{p.description}</p>
            <p>
              <strong>Price:</strong> ₹{p.price}
            </p>
            <p>
              <strong>Category:</strong> {p.category || 'N/A'}
            </p>
            <p>
              <strong>Farmer:</strong> {p.farmer?.name || 'Unknown'}
            </p>
            {user?.role === 'customer' && p.isAvailable && (
              <div style={{ marginTop: '0.5rem' }}>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={{ width: 80, marginRight: 8 }}
                />
                <button onClick={() => handleOrder(p._id)}>Order Now</button>
              </div>
            )}
            {!p.isAvailable && <p style={{ color: 'red' }}>Not available</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProductsPage


