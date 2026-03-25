import { useEffect, useMemo, useState } from 'react'

function CardPaymentSimulationModal({
  isOpen,
  onClose,
  totalAmount,
  product,
  quantity,
}) {
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery')
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolderName, setCardHolderName] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')

  const computedAmount = useMemo(() => {
    if (typeof totalAmount === 'number' && !Number.isNaN(totalAmount)) return totalAmount
    return (product?.price || 0) * (Number(quantity) || 1)
  }, [totalAmount, product?.price, quantity])

  useEffect(() => {
    if (!isOpen) {
      setPaymentMethod('Cash on Delivery')
      setCardNumber('')
      setCardHolderName('')
      setExpiryDate('')
      setCvv('')
    }
  }, [isOpen])

  const handlePay = () => {
    if (paymentMethod === 'Cash on Delivery') {
      alert('Order placed successfully')
      onClose?.()
      return
    }

    if (paymentMethod === 'Debit/Credit Card') {
      alert('Card payment successful')
      onClose?.()
      return
    }

    alert('Online payment successful')
    onClose?.()
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Payment Modal"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: 460, padding: '1.25rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, marginBottom: '0.75rem', color: '#1b4332', textAlign: 'center' }}>
          Total Amount: ₹{computedAmount.toFixed(2)}
        </h3>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
            Payment Method
          </label>
          <select
            className="select"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ width: '100%' }}
          >
            <option>Cash on Delivery</option>
            <option>Debit/Credit Card</option>
            <option>Online Payment</option>
          </select>
        </div>

        {paymentMethod === 'Debit/Credit Card' && (
          <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                Card Number
              </label>
              <input
                className="input"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                Card Holder Name
              </label>
              <input
                className="input"
                type="text"
                placeholder="John Doe"
                value={cardHolderName}
                onChange={(e) => setCardHolderName(e.target.value)}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Expiry Date (MM/YY)
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="08/29"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                  CVV
                </label>
                <input
                  className="input"
                  type="password"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'Online Payment' && (
          <p style={{ marginBottom: '1rem', color: '#6c757d' }}>
            Redirecting to payment gateway...
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handlePay}>
            Pay
          </button>
        </div>
      </div>
    </div>
  )
}

export default CardPaymentSimulationModal

