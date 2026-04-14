import { useEffect, useMemo, useState } from 'react'
import { fetchListingAddons } from '../api/addons'

function diffNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const ms = end - start
  return Math.max(1, Math.round(ms / 86400000))
}

function multiplierForType(priceType, nights, guests) {
  if (priceType === 'per_night') return nights
  if (priceType === 'per_person') return guests
  return 1
}

function formatPriceLabel(addon) {
  if (addon.price_type === 'per_night') return 'per night'
  if (addon.price_type === 'per_person') return 'per person'
  return 'per booking'
}

export default function AddonSelector({
  listingId,
  roomTypeId,
  checkIn,
  checkOut,
  guests = 1,
  onAddonsChange,
}) {
  const [addons, setAddons] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quantities, setQuantities] = useState({})

  const nights = useMemo(() => diffNights(checkIn, checkOut), [checkIn, checkOut])
  const safeGuests = Math.max(1, Number(guests) || 1)

  useEffect(() => {
    if (!listingId) return
    setLoading(true)
    setError('')
    fetchListingAddons(listingId, roomTypeId || null)
      .then(data => {
        setAddons(data)
        setQuantities(prev => {
          const next = { ...prev }
          data.forEach(addon => {
            if (!addon.is_optional) {
              next[addon.id] = Math.max(1, next[addon.id] || 1)
            }
          })
          return next
        })
      })
      .catch(err => {
        setAddons([])
        setError(err.response?.data?.detail || 'Failed to load add-ons')
      })
      .finally(() => setLoading(false))
  }, [listingId, roomTypeId])

  const selectedAddons = useMemo(() => {
    const rows = []
    addons.forEach(addon => {
      const qty = Number(quantities[addon.id] || 0)
      const isSelected = qty > 0 || !addon.is_optional
      if (!isSelected) return

      const quantity = Math.max(1, qty || 1)
      const multiplier = multiplierForType(addon.price_type, nights, safeGuests)
      const total = Number((addon.price * quantity * multiplier).toFixed(2))
      rows.push({
        id: addon.id,
        addon_id: addon.id,
        name: addon.name,
        description: addon.description,
        price: total,
        total,
        unit_price: addon.price,
        quantity,
        price_type: addon.price_type,
        is_optional: addon.is_optional,
      })
    })
    return rows
  }, [addons, quantities, nights, safeGuests])

  const addonsTotal = useMemo(
    () => selectedAddons.reduce((sum, item) => sum + Number(item.total || item.price || 0), 0),
    [selectedAddons],
  )

  useEffect(() => {
    onAddonsChange?.({
      addons: selectedAddons,
      total: Number(addonsTotal.toFixed(2)),
    })
  }, [selectedAddons, addonsTotal, onAddonsChange])

  function toggleAddon(addon) {
    setQuantities(prev => {
      const exists = Number(prev[addon.id] || 0) > 0
      if (!addon.is_optional) return prev
      return {
        ...prev,
        [addon.id]: exists ? 0 : 1,
      }
    })
  }

  function changeQuantity(addon, rawValue) {
    const maxQuantity = Math.max(1, addon.max_quantity || 1)
    let value = Number(rawValue)
    if (!Number.isFinite(value)) value = 1
    value = Math.max(1, Math.min(maxQuantity, Math.floor(value)))
    setQuantities(prev => ({
      ...prev,
      [addon.id]: value,
    }))
  }

  if (loading) {
    return <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading add-ons...</p>
  }

  if (error) {
    return <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--danger)' }}>{error}</p>
  }

  if (!addons.length) {
    return <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>No add-ons available for this booking.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {addons.map(addon => {
        const maxQuantity = Math.max(1, addon.max_quantity || 1)
        const selectedQty = Number(quantities[addon.id] || 0)
        const checked = selectedQty > 0 || !addon.is_optional
        const quantity = Math.max(1, selectedQty || 1)
        const multiplier = multiplierForType(addon.price_type, nights, safeGuests)
        const lineTotal = Number((addon.price * quantity * multiplier).toFixed(2))

        return (
          <div
            key={addon.id}
            style={{
              border: checked ? '2px solid var(--accent, #2563eb)' : '2px solid var(--border-color)',
              borderRadius: 10,
              background: checked ? 'var(--accent-light, #eff6ff)' : 'var(--bg-secondary)',
              padding: '12px 14px',
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                checked={checked}
                disabled={!addon.is_optional}
                onChange={() => toggleAddon(addon)}
                style={{ marginTop: 2, width: 17, height: 17 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {addon.name} {!addon.is_optional && <span style={{ fontSize: '0.72rem', color: '#a16207' }}>(required)</span>}
                    </div>
                    {addon.description && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{addon.description}</div>
                    )}
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      PKR {Number(addon.price || 0).toLocaleString('en-PK')} {formatPriceLabel(addon)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--accent, #2563eb)', whiteSpace: 'nowrap' }}>
                    PKR {lineTotal.toLocaleString('en-PK')}
                  </div>
                </div>

                {checked && maxQuantity > 1 && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Quantity</span>
                    <input
                      type="number"
                      min={1}
                      max={maxQuantity}
                      value={quantity}
                      onChange={e => changeQuantity(addon, e.target.value)}
                      style={{
                        width: 70,
                        padding: '6px 8px',
                        borderRadius: 7,
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>max {maxQuantity}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
