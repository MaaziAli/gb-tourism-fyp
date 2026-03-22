export default function PriceBreakdown({
  pricePerNight,
  nights = 1,
  groupSize = 1,
  serviceType = 'hotel',
  couponDiscount = 0,
  loyaltyDiscount = 0,
  groupDiscount = 0,
  compact = false
}) {
  const isPerPerson = [
    'tour', 'activity', 'horse_riding',
    'guide', 'boat_trip', 'restaurant'
  ].includes(serviceType)

  const isPerRoom = [
    'hotel', 'camping'
  ].includes(serviceType)

  // Base calculation
  let baseAmount = pricePerNight * nights
  if (isPerPerson) {
    baseAmount = pricePerNight *
      groupSize * nights
  } else if (isPerRoom) {
    const rooms = Math.ceil(groupSize / 2)
    baseAmount = pricePerNight * rooms * nights
  }

  const taxes = Math.round(baseAmount * 0.10)
  const serviceFee = Math.round(baseAmount * 0.05)
  const subtotal = baseAmount + taxes + serviceFee
  const totalDiscounts = couponDiscount +
    loyaltyDiscount + groupDiscount
  const finalTotal = Math.max(
    0, subtotal - totalDiscounts
  )

  const rows = [
    {
      label: isPerPerson
        ? `PKR ${pricePerNight?.toLocaleString(
            'en-PK')} × ${groupSize} people`
          + ` × ${nights} night${nights>1?'s':''}`
        : isPerRoom
        ? `PKR ${pricePerNight?.toLocaleString(
            'en-PK')} × ${
            Math.ceil(groupSize/2)
          } room${
            Math.ceil(groupSize/2)>1?'s':''
          } × ${nights} night${nights>1?'s':''}`
        : `PKR ${pricePerNight?.toLocaleString(
            'en-PK')} × ${nights} night${
            nights>1?'s':''}`,
      value: baseAmount,
      type: 'base'
    },
    {
      label: `🏛️ GST (10%)`,
      value: taxes,
      type: 'tax'
    },
    {
      label: `⚙️ Service Fee (5%)`,
      value: serviceFee,
      type: 'fee'
    },
    groupDiscount > 0 && {
      label: `👥 Group Discount`,
      value: -groupDiscount,
      type: 'discount'
    },
    couponDiscount > 0 && {
      label: `🎟️ Coupon`,
      value: -couponDiscount,
      type: 'discount'
    },
    loyaltyDiscount > 0 && {
      label: `⭐ Loyalty Points`,
      value: -loyaltyDiscount,
      type: 'discount'
    }
  ].filter(Boolean)

  if (compact) {
    return (
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '10px', padding: '12px',
        fontSize: '0.82rem'
      }}>
        {rows.map((row, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '3px 0',
            color: row.type === 'discount'
              ? '#16a34a' : 'var(--text-secondary)'
          }}>
            <span>{row.label}</span>
            <span style={{fontWeight: 600}}>
              {row.value < 0 ? '-' : ''}
              PKR {Math.abs(row.value)
                .toLocaleString('en-PK')}
            </span>
          </div>
        ))}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '2px solid var(--border-color)',
          marginTop: '8px', paddingTop: '8px',
          fontWeight: 800, fontSize: '0.95rem',
          color: 'var(--text-primary)'
        }}>
          <span>Total</span>
          <span style={{color: '#0ea5e9'}}>
            PKR {finalTotal.toLocaleString('en-PK')}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background:
          'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
        padding: '12px 16px'
      }}>
        <div style={{
          fontWeight: 700, color: 'white',
          fontSize: '0.875rem'
        }}>
          💰 Price Breakdown
        </div>
        <div style={{
          fontSize: '0.72rem',
          color: 'rgba(255,255,255,0.7)',
          marginTop: '2px'
        }}>
          No hidden fees — exactly what you pay
        </div>
      </div>

      {/* Rows */}
      <div style={{padding: '12px 16px'}}>
        {rows.map((row, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: i < rows.length - 1
              ? '1px dashed var(--border-color)'
              : 'none',
            fontSize: '0.85rem'
          }}>
            <span style={{
              color: row.type === 'discount'
                ? '#16a34a'
                : row.type === 'tax' ||
                  row.type === 'fee'
                ? 'var(--text-muted)'
                : 'var(--text-secondary)'
            }}>
              {row.label}
            </span>
            <span style={{
              fontWeight: 600,
              color: row.type === 'discount'
                ? '#16a34a'
                : 'var(--text-primary)'
            }}>
              {row.value < 0 ? (
                <span>
                  - PKR {Math.abs(row.value)
                    .toLocaleString('en-PK')}
                </span>
              ) : (
                <span>
                  PKR {row.value
                    .toLocaleString('en-PK')}
                </span>
              )}
            </span>
          </div>
        ))}

        {/* Total */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '10px', paddingTop: '10px',
          borderTop: '2px solid var(--border-color)',
          fontWeight: 800, fontSize: '1.1rem'
        }}>
          <span style={{
            color: 'var(--text-primary)'
          }}>
            Total
          </span>
          <span style={{color: '#0ea5e9'}}>
            PKR {finalTotal.toLocaleString('en-PK')}
          </span>
        </div>

        {totalDiscounts > 0 && (
          <div style={{
            marginTop: '8px',
            background: '#dcfce7',
            borderRadius: '8px',
            padding: '7px 10px',
            fontSize: '0.78rem',
            color: '#16a34a', fontWeight: 700,
            textAlign: 'center'
          }}>
            🎉 You save PKR{' '}
            {totalDiscounts.toLocaleString('en-PK')}
            {' '}on this booking!
          </div>
        )}

        <div style={{
          marginTop: '8px', fontSize: '0.68rem',
          color: 'var(--text-muted)',
          textAlign: 'center'
        }}>
          🔒 Secure payment · Instant confirmation
        </div>
      </div>
    </div>
  )
}
