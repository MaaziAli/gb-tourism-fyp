import { useState, useEffect } from 'react'
import api from '../api/axios'
import useWindowSize from '../hooks/useWindowSize'

const COUPON_TYPES = [
  { key: 'general', label: '🎟️ General' },
  { key: 'celebrity',
    label: '⭐ Celebrity/Influencer' },
  { key: 'event', label: '🎪 Event Special' },
  { key: 'flash', label: '⚡ Flash Sale' },
  { key: 'first_booking',
    label: '🎉 First Booking' },
  { key: 'vip', label: '💎 VIP Exclusive' },
  { key: 'seasonal', label: '🌸 Seasonal' },
  { key: 'eid', label: '🌙 Eid Special' },
  { key: 'custom', label: '✨ Custom' },
]

export default function MyCoupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const { isMobile } = useWindowSize()

  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [couponType, setCouponType] =
    useState('general')
  const [discountType, setDiscountType] =
    useState('percentage')
  const [discountValue, setDiscountValue] =
    useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxDiscount, setMaxDiscount] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [maxPerUser, setMaxPerUser] = useState('1')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  useEffect(() => { fetchCoupons() }, [])

  function apiErrorDetail(e) {
    const d = e.response?.data?.detail
    if (typeof d === 'string') return d
    if (Array.isArray(d)) {
      return d.map(x =>
        typeof x === 'object' && x?.msg
          ? x.msg
          : String(x)
      ).join(' ')
    }
    if (d && typeof d === 'object') return JSON.stringify(d)
    return 'Failed to create coupon'
  }

  async function fetchCoupons() {
    setLoading(true)
    try {
      const res = await api.get('/coupons/my-coupons')
      setCoupons(res.data || [])
    } catch (e) {
      console.error('Failed to load coupons:', e)
      setCoupons([])
    } finally {
      setLoading(false)
    }
  }

  function resetFormFields() {
    setCode(''); setTitle(''); setDescription('')
    setCouponType('general')
    setDiscountType('percentage')
    setDiscountValue(''); setMinAmount('')
    setMaxDiscount(''); setMaxUses('')
    setMaxPerUser('1'); setValidFrom('')
    setValidUntil(''); setIsPublic(true)
  }

  function resetForm() {
    resetFormFields()
    setFormError('')
    setFormSuccess('')
  }

  function generateCode() {
    const words = title.trim().split(' ')
    let base = words
      .map(w => w[0] || '')
      .join('')
      .toUpperCase()
    if (base.length < 4) base = title
      .replace(/\s/g, '')
      .toUpperCase()
      .slice(0, 8)
    const num = Math.floor(Math.random() * 90) + 10
    setCode(base + num)
  }

  async function handleCreate() {
    if (!code.trim()) {
      setFormError('Coupon code is required')
      return
    }
    if (!title.trim()) {
      setFormError('Title is required')
      return
    }
    if (!discountValue ||
        parseFloat(discountValue) <= 0) {
      setFormError('Discount value is required')
      return
    }
    setFormError('')
    setCreating(true)
    try {
      const res = await api.post('/coupons/', {
        code: code.toUpperCase().trim(),
        title, description,
        coupon_type: couponType,
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        min_booking_amount:
          parseFloat(minAmount) || 0,
        max_discount_amount:
          parseFloat(maxDiscount) || null,
        max_uses: parseInt(maxUses, 10) || null,
        max_uses_per_user:
          parseInt(maxPerUser, 10) || 1,
        valid_from: validFrom || null,
        valid_until: validUntil || null,
        is_public: isPublic,
      })
      setCoupons(prev => [res.data, ...prev])
      resetFormFields()
      setFormError('')
      setFormSuccess(
        `✅ Coupon "${res.data.code}" created!`
      )
      setShowForm(false)
    } catch (e) {
      setFormError(apiErrorDetail(e))
    } finally {
      setCreating(false)
    }
  }

  async function toggleCoupon(id) {
    try {
      const res = await api.patch(
        `/coupons/${id}/toggle`
      )
      setCoupons(prev => prev.map(c =>
        c.id === id
          ? { ...c, is_active: res.data.is_active }
          : c
      ))
    } catch (e) { console.error(e) }
  }

  async function deleteCoupon(id) {
    if (!window.confirm(
      'Delete this coupon?'
    )) return
    try {
      await api.delete(`/coupons/${id}`)
      setCoupons(prev =>
        prev.filter(c => c.id !== id)
      )
    } catch (e) { console.error(e) }
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code)
      .catch(() => {})
  }

  const today = new Date()
    .toISOString().split('T')[0]
  const todayStr = today

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingBottom: '48px',
    }}>

      <div style={{
        background:
          'linear-gradient(135deg, #f59e0b, #d97706)',
        padding: '40px 16px 80px',
      }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap', gap: '16px',
        }}>
          <div>
            <h1 style={{
              color: 'white', margin: '0 0 6px',
              fontSize: '1.8rem', fontWeight: 800,
            }}>
              🎟️ My Coupons
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              margin: 0, fontSize: '0.9rem',
            }}>
              {coupons.length} coupon
              {coupons.length !== 1 ? 's' : ''}
              {' · '}
              {coupons.filter(
                c => c.is_active
              ).length} active
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowForm(true)
              setFormSuccess('')
              setFormError('')
            }}
            style={{
              background: 'white',
              color: '#d97706', border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              cursor: 'pointer', fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            + Create Coupon
          </button>
        </div>
      </div>

      <div style={{
        maxWidth: '900px',
        margin: '-48px auto 0',
        padding: '0 16px',
      }}>

        {formSuccess && (
          <div style={{
            background: '#dcfce7',
            color: '#16a34a', padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontWeight: 600, fontSize: '0.9rem',
          }}>
            {formSuccess}
          </div>
        )}

        {showForm && (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid #f59e0b',
            boxShadow: 'var(--shadow-md)',
            padding: isMobile ? '20px 16px' : '28px',
            marginBottom: '20px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}>
              <h3 style={{
                margin: 0, fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}>
                🎟️ Create New Coupon
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                  setFormError('')
                }}
                style={{
                  background: 'transparent',
                  border: 'none', cursor: 'pointer',
                  fontSize: '1.4rem',
                  color: 'var(--text-muted)',
                }}
              >
                ×
              </button>
            </div>

            {formError && (
              <div style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontWeight: 600, fontSize: '0.875rem',
              }}>
                ⚠️ {formError}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block', fontWeight: 700,
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}>
                Coupon Type
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns:
                  isMobile
                    ? 'repeat(3, 1fr)'
                    : 'repeat(5, 1fr)',
                gap: '6px',
              }}>
                {COUPON_TYPES.map(t => (
                  <div key={t.key}
                    onClick={() =>
                      setCouponType(t.key)
                    }
                    style={{
                      padding: '8px 6px',
                      borderRadius: '8px',
                      border: couponType === t.key
                        ? '2px solid #f59e0b'
                        : '1px solid var(--border-color)',
                      background: couponType === t.key
                        ? '#fef3c7'
                        : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontSize: '0.72rem',
                      fontWeight: couponType === t.key
                        ? 700 : 400,
                      color: couponType === t.key
                        ? '#d97706'
                        : 'var(--text-secondary)',
                    }}
                  >
                    {t.label}
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? '1fr' : '1fr 1fr',
              gap: '14px', marginBottom: '14px',
            }}>
              <div>
                <label style={{
                  display: 'block', fontWeight: 700,
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}>
                  Coupon Code *
                </label>
                <div style={{
                  display: 'flex', gap: '8px',
                }}>
                  <input type="text"
                    value={code}
                    onChange={e => setCode(
                      e.target.value.toUpperCase()
                        .replace(/\s/g, '')
                    )}
                    placeholder="e.g. SUMMER25"
                    style={{
                      flex: 1, padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      fontWeight: 700, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    title="Auto-generate code"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🎲 Auto
                  </button>
                </div>
              </div>
              <div>
                <label style={{
                  display: 'block', fontWeight: 700,
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}>
                  Coupon Title *
                </label>
                <input type="text"
                  value={title}
                  onChange={e =>
                    setTitle(e.target.value)
                  }
                  placeholder="e.g. Maaz Ali Fan Discount"
                  style={{
                    width: '100%', padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{
                display: 'block', fontWeight: 700,
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}>
                Description
                <span style={{
                  fontWeight: 400,
                  color: 'var(--text-muted)',
                  marginLeft: '6px',
                  fontSize: '0.8rem',
                }}>
                  (optional)
                </span>
              </label>
              <input type="text"
                value={description}
                onChange={e =>
                  setDescription(e.target.value)
                }
                placeholder="e.g. Exclusive code for Maaz Ali's followers"
                style={{
                  width: '100%', padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? '1fr' : '1fr 1fr 1fr',
              gap: '14px', marginBottom: '14px',
            }}>
              <div>
                <label style={{
                  display: 'block', fontWeight: 700,
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}>
                  Discount Type *
                </label>
                <div style={{
                  display: 'flex', gap: '8px',
                }}>
                  {[
                    { key: 'percentage',
                      label: '% Percent' },
                    { key: 'flat',
                      label: 'PKR Flat' },
                  ].map(dt => (
                    <div key={dt.key}
                      onClick={() =>
                        setDiscountType(dt.key)
                      }
                      style={{
                        flex: 1, padding: '10px',
                        borderRadius: '8px',
                        border:
                          discountType === dt.key
                            ? '2px solid #f59e0b'
                            : '1px solid var(--border-color)',
                        background:
                          discountType === dt.key
                            ? '#fef3c7'
                            : 'var(--bg-secondary)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontWeight:
                          discountType === dt.key
                            ? 700 : 400,
                        fontSize: '0.82rem',
                        color:
                          discountType === dt.key
                            ? '#d97706'
                            : 'var(--text-secondary)',
                      }}
                    >
                      {dt.label}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label style={{
                  display: 'block', fontWeight: 700,
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}>
                  Discount Value *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    right: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    pointerEvents: 'none',
                  }}>
                    {discountType === 'percentage'
                      ? '%' : 'PKR'}
                  </span>
                  <input type="number"
                    value={discountValue}
                    onChange={e =>
                      setDiscountValue(e.target.value)
                    }
                    placeholder={
                      discountType === 'percentage'
                        ? '20' : '500'
                    }
                    min={1}
                    max={
                      discountType === 'percentage'
                        ? 100 : undefined
                    }
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      fontWeight: 700, outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
              {discountType === 'percentage' && (
                <div>
                  <label style={{
                    display: 'block', fontWeight: 700,
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}>
                    Max Discount (PKR)
                  </label>
                  <input type="number"
                    value={maxDiscount}
                    onChange={e =>
                      setMaxDiscount(e.target.value)
                    }
                    placeholder="e.g. 2000"
                    style={{
                      width: '100%', padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? '1fr 1fr'
                : 'repeat(4, 1fr)',
              gap: '14px', marginBottom: '14px',
            }}>
              <div>
                <label style={{
                  display: 'block', fontWeight: 700,
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}>
                  Min Booking (PKR)
                </label>
                <input type="number"
                  value={minAmount}
                  onChange={e =>
                    setMinAmount(e.target.value)
                  }
                  placeholder="0"
                  style={{
                    width: '100%', padding: '9px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block', fontWeight: 700,
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}>
                  Total Uses
                </label>
                <input type="number"
                  value={maxUses}
                  onChange={e =>
                    setMaxUses(e.target.value)
                  }
                  placeholder="Unlimited"
                  style={{
                    width: '100%', padding: '9px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem', outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block', fontWeight: 700,
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}>
                  Valid From
                </label>
                <input type="date"
                  value={validFrom}
                  min={today}
                  onChange={e =>
                    setValidFrom(e.target.value)
                  }
                  style={{
                    width: '100%', padding: '9px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem', outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'var(--font-primary)',
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block', fontWeight: 700,
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                }}>
                  Valid Until
                </label>
                <input type="date"
                  value={validUntil}
                  min={validFrom || today}
                  onChange={e =>
                    setValidUntil(e.target.value)
                  }
                  style={{
                    width: '100%', padding: '9px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem', outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'var(--font-primary)',
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center',
              gap: '12px', marginBottom: '20px',
              padding: '12px 14px',
              background: 'var(--bg-secondary)',
              borderRadius: '10px',
            }}>
              <div
                onClick={() =>
                  setIsPublic(p => !p)
                }
                style={{
                  width: 44, height: 24,
                  borderRadius: '12px',
                  background: isPublic
                    ? '#f59e0b'
                    : 'var(--border-color)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: '3px',
                  left: isPublic ? '23px' : '3px',
                  width: 18, height: 18,
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.2s',
                  boxShadow:
                    '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </div>
              <div>
                <div style={{
                  fontWeight: 600, fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                }}>
                  {isPublic
                    ? '🌐 Public Coupon'
                    : '🔒 Private Coupon'
                  }
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                }}>
                  {isPublic
                    ? 'Visible on public coupons page'
                    : 'Only works if user knows the code'
                  }
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex', gap: '10px',
            }}>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                style={{
                  flex: 2, padding: '12px',
                  borderRadius: '10px', border: 'none',
                  background:
                    'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white', fontWeight: 700,
                  cursor: 'pointer', fontSize: '0.95rem',
                  opacity: creating ? 0.7 : 1,
                }}
              >
                {creating
                  ? '⏳ Creating...'
                  : '🎟️ Create Coupon'
                }
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                  setFormError('')
                }}
                style={{
                  flex: 1, padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '60px', textAlign: 'center',
            color: 'var(--text-secondary)',
          }}>
            Loading coupons...
          </div>
        ) : coupons.length === 0 && !showForm ? (
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            padding: '60px 20px', textAlign: 'center',
          }}>
            <div style={{
              fontSize: '3rem', marginBottom: '12px',
            }}>
              🎟️
            </div>
            <h2 style={{
              margin: '0 0 8px',
              color: 'var(--text-primary)',
            }}>
              No coupons yet
            </h2>
            <p style={{
              margin: '0 0 24px',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
            }}>
              Create discount codes for seasonal
              deals, celebrities, events & more!
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              style={{
                background:
                  'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white', border: 'none',
                borderRadius: '10px',
                padding: '12px 28px',
                cursor: 'pointer', fontWeight: 700,
              }}
            >
              Create First Coupon →
            </button>
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column',
            gap: '12px',
          }}>
            {coupons.map(c => {
              const expired = Boolean(
                c.valid_until &&
                c.valid_until < todayStr
              )
              const usedUp = c.max_uses &&
                c.used_count >= c.max_uses

              return (
                <div key={c.id} style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                  opacity: (!c.is_active ||
                    expired || usedUp) ? 0.75 : 1,
                }}>
                  <div style={{
                    height: '4px',
                    background: c.is_active &&
                      !expired && !usedUp
                      ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                      : '#e5e7eb',
                  }} />

                  <div style={{
                    padding: '16px 20px',
                    display: 'flex', gap: '16px',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                  }}>
                    <div style={{
                      background: c.is_active &&
                        !expired && !usedUp
                        ? '#fef3c7'
                        : 'var(--bg-secondary)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      textAlign: 'center',
                      minWidth: '120px',
                      flexShrink: 0,
                    }}>
                      <div style={{
                        fontFamily: 'monospace',
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: c.is_active &&
                          !expired && !usedUp
                          ? '#d97706'
                          : 'var(--text-muted)',
                        letterSpacing: '0.05em',
                        marginBottom: '4px',
                      }}>
                        {c.code}
                      </div>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: c.is_active &&
                          !expired && !usedUp
                          ? '#f59e0b'
                          : 'var(--text-muted)',
                      }}>
                        {c.discount_type ===
                          'percentage'
                          ? `${c.discount_value}% OFF`
                          : `PKR ${c.discount_value
                              .toLocaleString('en-PK')
                            } OFF`
                        }
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyCode(c.code)
                        }
                        style={{
                          marginTop: '6px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          color: '#d97706',
                          fontWeight: 600,
                        }}
                      >
                        📋 Copy
                      </button>
                    </div>

                    <div style={{ flex: 1,
                      minWidth: '180px' }}>
                      <div style={{
                        fontWeight: 700,
                        fontSize: '0.975rem',
                        color: 'var(--text-primary)',
                        marginBottom: '3px',
                      }}>
                        {c.title}
                      </div>
                      {c.description && (
                        <div style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '6px',
                        }}>
                          {c.description}
                        </div>
                      )}

                      <div style={{
                        display: 'flex', gap: '6px',
                        flexWrap: 'wrap',
                        marginBottom: '8px',
                      }}>
                        <span style={{
                          background: '#fef3c7',
                          color: '#d97706',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                        }}>
                          {c.coupon_type_label}
                        </span>

                        <span style={{
                          background: expired
                            ? '#fee2e2'
                            : usedUp
                            ? '#fee2e2'
                            : c.is_active
                            ? '#dcfce7' : '#f3f4f6',
                          color: expired || usedUp
                            ? '#dc2626'
                            : c.is_active
                            ? '#16a34a' : '#6b7280',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                        }}>
                          {expired ? '⏰ Expired'
                            : usedUp ? '🚫 Used Up'
                            : c.is_active
                            ? '✅ Active'
                            : '⏸️ Paused'
                          }
                        </span>

                        <span style={{
                          background:
                            'var(--bg-secondary)',
                          color: 'var(--text-muted)',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                        }}>
                          {c.is_public
                            ? '🌐 Public'
                            : '🔒 Private'
                          }
                        </span>
                      </div>

                      <div style={{
                        display: 'flex', gap: '16px',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        flexWrap: 'wrap',
                      }}>
                        <span>
                          📊 {c.used_count}
                          {c.max_uses
                            ? `/${c.max_uses}` : ''
                          } uses
                        </span>
                        {c.min_booking_amount > 0 && (
                          <span>
                            💰 Min PKR {
                              c.min_booking_amount
                                .toLocaleString('en-PK')
                            }
                          </span>
                        )}
                        {c.valid_until && (
                          <span>
                            📅 Until {c.valid_until}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex', gap: '8px',
                      flexShrink: 0,
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                    }}>
                      <button
                        type="button"
                        onClick={() =>
                          toggleCoupon(c.id)
                        }
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: c.is_active
                            ? '1px solid var(--border-color)'
                            : '1px solid #f59e0b',
                          background: c.is_active
                            ? 'var(--bg-secondary)'
                            : '#fef3c7',
                          color: c.is_active
                            ? 'var(--text-secondary)'
                            : '#d97706',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                        }}
                      >
                        {c.is_active
                          ? '⏸️ Pause'
                          : '▶️ Activate'
                        }
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          deleteCoupon(c.id)
                        }
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--danger)',
                          background: 'var(--danger-bg)',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
