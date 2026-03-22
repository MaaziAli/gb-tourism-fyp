import { useState, useEffect } from 'react'
import {
  useParams,
  useNavigate,
  useSearchParams,
} from 'react-router-dom'
import api from '../api/axios'
import GroupSizeSelector from '../components/GroupSizeSelector'
import CouponInput from '../components/CouponInput'
import useWindowSize from '../hooks/useWindowSize'

const GROUP_TIER_ROWS = [
  { min: 5, label: '5+ people', disc: '5% off' },
  { min: 10, label: '10+ people', disc: '10% off' },
  { min: 20, label: '20+ people', disc: '20% off' },
  { min: 50, label: '50+ people', disc: '30% off' },
]

export default function GroupBookingForm() {
  const { listingId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()

  const roomTypeIdParam = searchParams.get('room_type_id')
    ? parseInt(searchParams.get('room_type_id'), 10)
    : null

  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)

  const [checkIn, setCheckIn] = useState(
    searchParams.get('check_in') || ''
  )
  const [checkOut, setCheckOut] = useState(
    searchParams.get('check_out') || ''
  )
  const [groupSize, setGroupSize] = useState(
    parseInt(searchParams.get('group_size'), 10) || 2
  )
  const [groupLeadName, setGroupLeadName] = useState('')
  const [specialReqs, setSpecialReqs] = useState('')
  const [applyDiscount, setApplyDiscount] = useState(true)

  const [priceCalc, setPriceCalc] = useState(null)
  const [calculating, setCalculating] = useState(false)

  const [couponDiscount, setCouponDiscount] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState(null)

  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  const [step, setStep] = useState(1)
  const [payMethod, setPayMethod] = useState('card')
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const today = new Date()
    .toISOString().split('T')[0]

  function formatCard(val) {
    return val.replace(/\D/g, '').slice(0, 16)
      .replace(/(.{4})/g, '$1 ').trim()
  }

  function formatExpiry(val) {
    const c = val.replace(/\D/g, '').slice(0, 4)
    return c.length >= 2
      ? c.slice(0, 2) + '/' + c.slice(2) : c
  }

  async function calculatePrice() {
    if (!checkIn || !checkOut || groupSize < 1) return
    setCalculating(true)
    try {
      const payload = {
        listing_id: parseInt(listingId, 10),
        room_type_id: roomTypeIdParam,
        check_in: checkIn,
        check_out: checkOut,
        group_size: parseInt(groupSize, 10),
        apply_group_discount: applyDiscount,
      }
      console.log('Calculating price:', payload)
      const res = await api.post(
        '/group-bookings/calculate',
        payload
      )
      console.log('Price result:', res.data)
      setPriceCalc(res.data)
    } catch (e) {
      console.error(
        'Calculate error:',
        e.response?.data || e.message
      )
      const basePrice =
        (listing?.price_per_night || 0)
      const nightsCount = Math.max(1, Math.ceil(
        (new Date(checkOut) - new Date(checkIn))
        / (1000 * 60 * 60 * 24)
      ))
      const discountRate = applyDiscount
        ? groupSize >= 50 ? 30
          : groupSize >= 30 ? 25
          : groupSize >= 20 ? 20
          : groupSize >= 15 ? 15
          : groupSize >= 10 ? 10
          : groupSize >= 5 ? 5 : 0
        : 0
      const base = basePrice * nightsCount
      const discountAmt = Math.round(
        base * discountRate / 100
      )
      const total = base - discountAmt

      setPriceCalc({
        listing_title: listing?.title || '',
        price_per_night: basePrice,
        nights: nightsCount,
        check_in: checkIn,
        check_out: checkOut,
        group_size: groupSize,
        base_price: base,
        discount_rate: discountRate,
        discount_amount: discountAmt,
        total_price: total,
        price_per_person: Math.round(
          total / groupSize
        ),
        breakdown: {
          base: `PKR ${basePrice.toLocaleString(
            'en-PK'
          )} × ${nightsCount} night(s)`,
          subtotal: `PKR ${base.toLocaleString(
            'en-PK'
          )}`,
          group_discount: discountRate > 0
            ? `-${discountRate}% = PKR -${
                discountAmt.toLocaleString('en-PK')
              }`
            : null,
          total: `PKR ${total.toLocaleString(
            'en-PK'
          )}`,
          per_person: `PKR ${Math.round(
            total / groupSize
          ).toLocaleString('en-PK')} per person`,
        },
      })
    } finally {
      setCalculating(false)
    }
  }

  useEffect(() => {
    api.get(`/listings/${listingId}`)
      .then(r => setListing(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [listingId])

  useEffect(() => {
    if (checkIn && checkOut &&
        checkOut > checkIn &&
        groupSize > 0) {
      calculatePrice()
    }
  }, [checkIn, checkOut, groupSize, applyDiscount, roomTypeIdParam])

  useEffect(() => {
    if (listing && checkIn && checkOut &&
        checkOut > checkIn) {
      calculatePrice()
    }
  }, [listing])

  function proceedToPayment() {
    if (!checkIn || !checkOut) {
      setError('Please select check-in and check-out')
      return
    }
    if (checkOut <= checkIn) {
      setError('Check-out must be after check-in')
      return
    }
    if (!groupSize || groupSize < 1) {
      setError('Group size must be at least 1')
      return
    }
    setError('')
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function detailFromError(err) {
    const d = err.response?.data?.detail
    if (typeof d === 'string') return d
    if (Array.isArray(d)) {
      return d.map(x =>
        typeof x === 'object' && x?.msg
          ? x.msg
          : String(x)
      ).join(' ')
    }
    return 'Booking failed. Please try again.'
  }

  async function handleBook() {
    if (payMethod === 'card') {
      if (!cardName.trim()) {
        setError('Enter cardholder name')
        return
      }
      const clean = cardNumber.replace(/\s/g, '')
      if (clean.length !== 16) {
        setError('Enter valid 16-digit card number')
        return
      }
      if (cardExpiry.length < 5) {
        setError('Enter valid expiry MM/YY')
        return
      }
      if (cardCvv.length < 3) {
        setError('Enter valid CVV')
        return
      }
      if (clean === '4000000000000002') {
        setError('Payment declined. Try another card.')
        return
      }
    } else {
      if (!phoneNumber.trim()) {
        setError('Enter mobile number')
        return
      }
    }

    setError('')
    setBooking(true)

    await new Promise(r => setTimeout(r, 1500))

    try {
      const res = await api.post(
        '/group-bookings/book',
        {
          listing_id: parseInt(listingId, 10),
          room_type_id: roomTypeIdParam,
          check_in: checkIn,
          check_out: checkOut,
          group_size: parseInt(groupSize, 10),
          group_lead_name:
            groupLeadName || null,
          special_requirements:
            specialReqs || null,
          apply_group_discount: applyDiscount,
          coupon_code: appliedCoupon?.code || null,
        }
      )
      setSuccess(res.data)
      setStep(1)
    } catch (e) {
      console.error(
        'Booking error:',
        e.response?.data || e.message
      )
      setError(detailFromError(e))
    } finally {
      setBooking(false)
    }
  }

  const nights = checkIn && checkOut
    ? Math.max(0, Math.ceil(
        (new Date(checkOut) - new Date(checkIn))
        / (1000 * 60 * 60 * 24)
      ))
    : 0

  const finalTotal = priceCalc
    ? Math.max(
        0,
        priceCalc.total_price - couponDiscount
      )
    : 0

  useEffect(() => {
    setCouponDiscount(0)
    setAppliedCoupon(null)
  }, [checkIn, checkOut, groupSize, applyDiscount])

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px',
      }}>
        <div style={{
          maxWidth: '500px', width: '100%',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden',
        }}>
          <div style={{
            background:
              'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
            padding: '36px 24px', textAlign: 'center',
          }}>
            <div style={{
              fontSize: '3.5rem', marginBottom: '12px',
            }}>
              👥
            </div>
            <h2 style={{
              color: 'white', margin: '0 0 6px',
              fontSize: '1.5rem', fontWeight: 800,
            }}>
              Group Booking Confirmed!
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              margin: 0, fontSize: '0.9rem',
            }}>
              Your group is all set 🎉
            </p>
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: '16px', marginBottom: '20px',
            }}>
              {[
                {
                  label: 'Service',
                  value: success.listing_title,
                },
                {
                  label: 'Check-In',
                  value: success.check_in,
                },
                {
                  label: 'Check-Out',
                  value: success.check_out,
                },
                {
                  label: 'Group Size',
                  value: `${success.group_size} people`,
                },
                success.discount_applied > 0 && {
                  label: 'Group Discount',
                  value: `-PKR ${success
                    .discount_applied
                    .toLocaleString('en-PK')}`,
                  color: '#16a34a',
                },
                {
                  label: 'Per Person',
                  value: `PKR ${success
                    .price_per_person
                    ?.toLocaleString('en-PK')}`,
                },
              ].filter(Boolean).map((item, idx) => (
                <div key={`${item.label}-${idx}`} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '7px 0',
                  borderBottom:
                    '1px solid var(--border-color)',
                  fontSize: '0.875rem',
                }}>
                  <span style={{
                    color: 'var(--text-secondary)',
                  }}>
                    {item.label}
                  </span>
                  <span style={{
                    fontWeight: 600,
                    color: item.color ||
                      'var(--text-primary)',
                  }}>
                    {item.value}
                  </span>
                </div>
              ))}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0 0',
                fontSize: '1rem',
              }}>
                <span style={{
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}>
                  Total
                </span>
                <span style={{
                  fontWeight: 800,
                  color: 'var(--accent)',
                  fontSize: '1.2rem',
                }}>
                  PKR {success.total_price
                    ?.toLocaleString('en-PK')}
                </span>
              </div>
            </div>

            {success.discount_applied > 0 && (
              <div style={{
                background: '#dcfce7',
                borderRadius: '10px',
                padding: '12px', textAlign: 'center',
                marginBottom: '16px',
                color: '#16a34a', fontWeight: 700,
              }}>
                🎉 You saved PKR{' '}
                {success.discount_applied
                  .toLocaleString('en-PK')}
                {' '}with group discount (
                {success.discount_rate}% off)!
              </div>
            )}

            <div style={{
              display: 'flex', gap: '10px',
            }}>
              <button
                type="button"
                onClick={() =>
                  navigate('/my-bookings')
                }
                style={{
                  flex: 1, padding: '12px',
                  borderRadius: '10px', border: 'none',
                  background:
                    'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                  color: 'white', fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                My Bookings
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                style={{
                  flex: 1, padding: '12px',
                  borderRadius: '10px',
                  border:
                    '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600, cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Browse More
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '2rem', marginBottom: '12px',
        }}>
          👥
        </div>
        Loading...
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingBottom: '48px',
    }}>

      <div style={{
        background:
          'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
        padding: '32px 16px 80px',
      }}>
        <div style={{
          maxWidth: '760px', margin: '0 auto',
        }}>
          <button
            type="button"
            onClick={() =>
              navigate(`/listing/${listingId}`)
            }
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', borderRadius: '8px',
              padding: '7px 16px', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            ← Back
          </button>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '999px',
            padding: '6px 16px', marginBottom: '12px',
            color: 'white', fontSize: '0.8rem',
            fontWeight: 700,
          }}>
            👥 Group Booking
          </div>
          <h1 style={{
            color: 'white', margin: '0 0 6px',
            fontSize: isMobile ? '1.3rem' : '1.7rem',
            fontWeight: 800,
          }}>
            Book for Your Group
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.75)',
            margin: 0, fontSize: '0.9rem',
          }}>
            {listing?.title}
          </p>
        </div>
      </div>

      <div style={{
        maxWidth: '760px',
        margin: '-56px auto 0',
        padding: '0 16px',
        display: 'grid',
        gridTemplateColumns: isMobile
          ? '1fr' : '1fr 280px',
        gap: '20px', alignItems: 'start',
      }}>

        <div>

          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            padding: '24px', marginBottom: '16px',
          }}>
            <h3 style={{
              margin: '0 0 16px', fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              📅 Select Dates
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.78rem', fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}>
                  Check-In
                </label>
                <input
                  type="date"
                  value={checkIn} min={today}
                  onChange={e =>
                    setCheckIn(e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'var(--font-primary)',
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.78rem', fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                }}>
                  Check-Out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || today}
                  onChange={e =>
                    setCheckOut(e.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'var(--font-primary)',
                  }}
                />
              </div>
            </div>
            {nights > 0 && (
              <div style={{
                marginTop: '10px', fontSize: '0.85rem',
                color: 'var(--accent)', fontWeight: 600,
              }}>
                🌙 {nights} night
                {nights > 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            padding: '24px', marginBottom: '16px',
          }}>
            <h3 style={{
              margin: '0 0 16px', fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              👥 Group Size
            </h3>
            <GroupSizeSelector
              value={groupSize}
              onChange={setGroupSize}
              basePrice={listing?.price_per_night || 0}
              nights={nights}
            />
            <label style={{
              display: 'flex', alignItems: 'center',
              gap: '10px', marginTop: '12px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={applyDiscount}
                onChange={e =>
                  setApplyDiscount(e.target.checked)
                }
              />
              Apply group volume discount
            </label>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            padding: '24px', marginBottom: '16px',
          }}>
            <h3 style={{
              margin: '0 0 16px', fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              📋 Group Details
            </h3>

            <div style={{ marginBottom: '14px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.82rem', fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}>
                Group Lead Name
              </label>
              <input
                type="text"
                value={groupLeadName}
                onChange={e =>
                  setGroupLeadName(e.target.value)
                }
                placeholder="Name of group organizer"
                style={{
                  width: '100%', padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem', outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-primary)',
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.82rem', fontWeight: 700,
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}>
                Special Requirements
                <span style={{
                  fontWeight: 400,
                  color: 'var(--text-muted)',
                  marginLeft: '6px',
                  fontSize: '0.78rem',
                }}>
                  (dietary, accessibility, etc.)
                </span>
              </label>
              <textarea
                value={specialReqs}
                onChange={e =>
                  setSpecialReqs(e.target.value)
                }
                placeholder="e.g. 3 vegetarians, 1 wheelchair user, need ground floor rooms..."
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  resize: 'vertical', outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-primary)',
                }}
              />
            </div>
          </div>

          {checkIn && checkOut && checkOut > checkIn &&
            listing && priceCalc && (
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              padding: '24px', marginBottom: '16px',
            }}>
              <CouponInput
                key={`${priceCalc.total_price}-${listingId}`}
                listingId={parseInt(listingId, 10)}
                bookingAmount={
                  priceCalc.total_price
                }
                onApply={(data) => {
                  setCouponDiscount(data.discount_amount)
                  setAppliedCoupon(data)
                }}
                onRemove={() => {
                  setCouponDiscount(0)
                  setAppliedCoupon(null)
                }}
              />
            </div>
          )}

          {error && (
            <div style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '12px 16px',
              borderRadius: '10px',
              fontWeight: 600, fontSize: '0.875rem',
              marginBottom: '16px',
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        <div style={{
          position: isMobile ? 'relative' : 'sticky',
          top: '20px',
          order: isMobile ? -1 : 0,
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}>
            <div style={{
              background:
                'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
              padding: '16px 20px',
            }}>
              <div style={{
                color: 'white', fontWeight: 800,
                fontSize: '1.4rem', marginBottom: '2px',
              }}>
                PKR {(listing?.price_per_night || 0)
                  .toLocaleString('en-PK')}
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 400, opacity: 0.8,
                  marginLeft: '4px',
                }}>
                  /night
                </span>
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.75)',
                fontSize: '0.82rem',
              }}>
                {listing?.title}
              </div>
            </div>

            <div style={{ padding: '16px 20px' }}>
              {checkIn && checkOut && checkOut > checkIn ? (
                calculating ? (
                  <div style={{
                    textAlign: 'center', padding: '16px',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem', marginBottom: '16px',
                  }}>
                    ⏳ Calculating...
                  </div>
                ) : priceCalc ? (
                  <div style={{ marginBottom: '16px' }}>
                    {[
                      {
                        l: `PKR ${(priceCalc.price_per_night
                          || listing?.price_per_night || 0)
                          .toLocaleString('en-PK')} × ${
                          priceCalc.nights || nights} night(s)`,
                        v: `PKR ${(priceCalc.base_price || 0)
                          .toLocaleString('en-PK')}`,
                      },
                      {
                        l: `${groupSize} people`,
                        v: null,
                      },
                      priceCalc.discount_rate > 0 && {
                        l: `Group discount (${
                          priceCalc.discount_rate}%)`,
                        v: `-PKR ${(priceCalc.discount_amount
                          || 0).toLocaleString('en-PK')}`,
                        color: '#16a34a',
                      },
                      couponDiscount > 0 && {
                        l: '🎟️ Coupon',
                        v: `-PKR ${couponDiscount
                          .toLocaleString('en-PK')}`,
                        color: '#16a34a',
                      },
                    ].filter(Boolean).map((row, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '5px 0',
                        fontSize: '0.82rem',
                        color: row.color ||
                          'var(--text-secondary)',
                      }}>
                        <span>{row.l}</span>
                        {row.v && (
                          <span style={{ fontWeight: 600 }}>
                            {row.v}
                          </span>
                        )}
                      </div>
                    ))}

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px 0 4px',
                      borderTop:
                        '2px solid var(--border-color)',
                      marginTop: '4px',
                    }}>
                      <span style={{
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                      }}>
                        Total
                      </span>
                      <span style={{
                        fontWeight: 800,
                        color: 'var(--accent)',
                        fontSize: '1.2rem',
                      }}>
                        PKR {finalTotal.toLocaleString('en-PK')}
                      </span>
                    </div>

                    <div style={{
                      textAlign: 'center',
                      background: 'var(--accent-light)',
                      borderRadius: '8px', padding: '10px',
                      fontSize: '0.85rem',
                      color: 'var(--accent)', fontWeight: 700,
                      marginTop: '6px',
                    }}>
                      <div>
                        PKR {Math.round(
                          finalTotal / groupSize
                        ).toLocaleString('en-PK')}/person
                      </div>
                      <div style={{
                        fontSize: '0.72rem', fontWeight: 400,
                        color: 'var(--text-secondary)',
                        marginTop: '2px',
                      }}>
                        Total for {groupSize} people:
                        PKR {finalTotal.toLocaleString('en-PK')}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center', padding: '16px',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem', marginBottom: '16px',
                  }}>
                    ⏳ Loading price...
                  </div>
                )
              ) : (
                <div style={{
                  textAlign: 'center', padding: '20px',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem', marginBottom: '16px',
                }}>
                  Select dates to see price
                </div>
              )}

              <button
                type="button"
                onClick={proceedToPayment}
                disabled={
                  !checkIn || !checkOut ||
                  checkOut <= checkIn
                }
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: '12px', border: 'none',
                  background: (!checkIn || !checkOut)
                    ? 'var(--border-color)'
                    : 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                  color: (!checkIn || !checkOut)
                    ? 'var(--text-muted)' : 'white',
                  fontWeight: 800, fontSize: '1rem',
                  cursor: (!checkIn || !checkOut)
                    ? 'not-allowed' : 'pointer',
                  opacity: booking ? 0.75 : 1,
                }}
              >
                {booking
                  ? '⏳ Booking...'
                  : `👥 Continue for ${groupSize} People`
                }
              </button>

              <p style={{
                textAlign: 'center',
                margin: '8px 0 0',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
              }}>
                Review details, then pay securely in the next step
              </p>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            padding: '14px 16px', marginTop: '12px',
          }}>
            <div style={{
              fontWeight: 700, fontSize: '0.85rem',
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}>
              👥 Group Discounts
            </div>
            {GROUP_TIER_ROWS.map(t => (
              <div key={t.min} style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.78rem', padding: '3px 0',
                color: groupSize >= t.min
                  ? '#16a34a'
                  : 'var(--text-secondary)',
                fontWeight: groupSize >= t.min
                  ? 700 : 400,
              }}>
                <span>{t.label}</span>
                <span>{t.disc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {step === 2 && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 1000, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            width: '100%', maxWidth: '480px',
            maxHeight: '90vh', overflowY: 'auto',
          }}>

            <div style={{
              background:
                'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{
                  color: 'white', margin: '0 0 3px',
                  fontWeight: 800, fontSize: '1.1rem',
                }}>
                  💳 Complete Payment
                </h3>
                <p style={{
                  color: 'rgba(255,255,255,0.75)',
                  margin: 0, fontSize: '0.82rem',
                }}>
                  Group booking for {groupSize} people
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep(1)
                  setError('')
                }}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none', color: 'white',
                  borderRadius: '50%', width: 32,
                  height: 32, cursor: 'pointer',
                  fontSize: '1.1rem', display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >×</button>
            </div>

            <div style={{ padding: '20px 24px' }}>

              <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: '10px', padding: '14px',
                marginBottom: '20px',
              }}>
                <div style={{
                  fontWeight: 700, fontSize: '0.875rem',
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                }}>
                  📋 Booking Summary
                </div>
                {[
                  {
                    l: listing?.title || '—',
                    v: '',
                  },
                  {
                    l: `${checkIn} → ${checkOut}`,
                    v: `${nights} nights`,
                  },
                  {
                    l: `${groupSize} people`,
                    v: '',
                  },
                  priceCalc?.discount_rate > 0 && {
                    l: `Group discount (${
                      priceCalc.discount_rate}%)`,
                    v: `-PKR ${(priceCalc.discount_amount
                      || 0).toLocaleString('en-PK')}`,
                    color: '#16a34a',
                  },
                  couponDiscount > 0 && {
                    l: '🎟️ Coupon discount',
                    v: `-PKR ${couponDiscount
                      .toLocaleString('en-PK')}`,
                    color: '#16a34a',
                  },
                ].filter(Boolean).map((row, i) => (
                  row.v !== undefined && (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem', padding: '3px 0',
                      color: row.color ||
                        'var(--text-secondary)',
                    }}>
                      <span>{row.l}</span>
                      <span style={{ fontWeight: 600 }}>
                        {row.v}
                      </span>
                    </div>
                  )
                ))}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '2px solid var(--border-color)',
                  marginTop: '8px', paddingTop: '8px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}>
                  <span>Total (whole group)</span>
                  <span style={{
                    color: 'var(--accent)',
                    fontSize: '1.1rem',
                  }}>
                    PKR {finalTotal.toLocaleString('en-PK')}
                  </span>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px', marginBottom: '16px',
              }}>
                {[
                  { key: 'card', icon: '💳',
                    label: 'Card' },
                  { key: 'jazzcash', icon: '📱',
                    label: 'JazzCash' },
                  { key: 'easypaisa', icon: '💚',
                    label: 'EasyPaisa' },
                ].map(m => (
                  <div key={m.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => setPayMethod(m.key)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setPayMethod(m.key)
                      }
                    }}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '10px', cursor: 'pointer',
                      border: payMethod === m.key
                        ? '2px solid var(--accent)'
                        : '1px solid var(--border-color)',
                      background: payMethod === m.key
                        ? 'var(--accent-light)'
                        : 'var(--bg-secondary)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.2rem' }}>
                      {m.icon}
                    </div>
                    <div style={{
                      fontSize: '0.72rem', fontWeight: 600,
                      color: payMethod === m.key
                        ? 'var(--accent)'
                        : 'var(--text-secondary)',
                      marginTop: '3px',
                    }}>
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>

              {payMethod === 'card' && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{
                      display: 'block', fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: '5px',
                      textTransform: 'uppercase',
                    }}>
                      Cardholder Name
                    </label>
                    <input type="text"
                      placeholder="Name on card"
                      value={cardName}
                      onChange={e =>
                        setCardName(e.target.value)
                      }
                      style={{
                        width: '100%', padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem', outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'var(--font-primary)',
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{
                      display: 'block', fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: '5px',
                      textTransform: 'uppercase',
                    }}>
                      Card Number
                    </label>
                    <input type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={e =>
                        setCardNumber(
                          formatCard(e.target.value)
                        )
                      }
                      maxLength={19}
                      style={{
                        width: '100%', padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: '1rem',
                        letterSpacing: '0.1em',
                        fontFamily: 'monospace', outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <p style={{
                      margin: '4px 0 0', fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                    }}>
                      Test card: 4242 4242 4242 4242 ·
                      Decline: 4000 0000 0000 0002
                    </p>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px',
                  }}>
                    <div>
                      <label style={{
                        display: 'block', fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        marginBottom: '5px',
                        textTransform: 'uppercase',
                      }}>
                        Expiry
                      </label>
                      <input type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={e =>
                          setCardExpiry(
                            formatExpiry(e.target.value)
                          )
                        }
                        maxLength={5}
                        style={{
                          width: '100%', padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: '0.95rem',
                          fontFamily: 'monospace', outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block', fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        marginBottom: '5px',
                        textTransform: 'uppercase',
                      }}>
                        CVV
                      </label>
                      <input type="password"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={e =>
                          setCardCvv(
                            e.target.value
                              .replace(/\D/g, '').slice(0, 4)
                          )
                        }
                        maxLength={4}
                        style={{
                          width: '100%', padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: '0.95rem',
                          fontFamily: 'monospace', outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {(payMethod === 'jazzcash' ||
                payMethod === 'easypaisa') && (
                <div style={{
                  textAlign: 'center', padding: '16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px', marginBottom: '16px',
                }}>
                  <div style={{
                    fontSize: '2rem', marginBottom: '8px',
                  }}>
                    {payMethod === 'jazzcash' ? '📱' : '💚'}
                  </div>
                  <p style={{
                    margin: '0 0 12px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                  }}>
                    Enter your{' '}
                    {payMethod === 'jazzcash'
                      ? 'JazzCash' : 'EasyPaisa'
                    } number
                  </p>
                  <input type="tel"
                    placeholder="03XX-XXXXXXX"
                    value={phoneNumber}
                    onChange={e =>
                      setPhoneNumber(e.target.value)
                    }
                    style={{
                      width: '100%', padding: '11px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem', outline: 'none',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      letterSpacing: '0.1em',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {error && (
                <div style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  padding: '10px 12px', borderRadius: '8px',
                  fontSize: '0.85rem', fontWeight: 600,
                  marginBottom: '12px',
                }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleBook}
                disabled={booking}
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: '12px', border: 'none',
                  background:
                    'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                  color: 'white', fontWeight: 800,
                  fontSize: '1rem', cursor: 'pointer',
                  opacity: booking ? 0.75 : 1,
                }}
              >
                {booking
                  ? '⏳ Processing...'
                  : `🔒 Pay PKR ${finalTotal
                    .toLocaleString('en-PK')}`
                }
              </button>

              <p style={{
                textAlign: 'center', margin: '8px 0 0',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
              }}>
                🔒 SSL Secure · Instant Confirmation
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
