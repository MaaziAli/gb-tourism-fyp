import { useState, useEffect } from 'react'
import {
  useParams, useNavigate,
  useSearchParams
} from 'react-router-dom'
import api from '../api/axios'
import useWindowSize from '../hooks/useWindowSize'
import AvailabilityCalendar from '../components/AvailabilityCalendar'
import CouponInput from '../components/CouponInput'
import LoyaltyInput from '../components/LoyaltyInput'
import PointsEarnedPopup from '../components/PointsEarnedPopup'
import Toast from '../components/Toast'
import PriceBreakdown from '../components/PriceBreakdown'
import CancellationPolicy from '../components/CancellationPolicy'

function getPriceLabel(serviceType) {
  const perDay = [
    'car_rental', 'bike_rental',
    'jeep_safari', 'camping',
  ]
  const perPerson = [
    'tour', 'activity', 'horse_riding',
    'guide', 'boat_trip',
  ]
  if (!serviceType) return '/night'
  if (perDay.includes(serviceType)) return '/day'
  if (perPerson.includes(serviceType)) return '/person'
  return '/night'
}

export default function BookingForm() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()
  const [searchParams] = useSearchParams()

  // Get room info from URL
  const roomTypeIdFromUrl =
    searchParams.get('roomTypeId') || searchParams.get('room_type_id')
  const roomNameFromUrl =
    searchParams.get('roomName') || searchParams.get('room_name')
  const roomPriceFromUrl =
    searchParams.get('roomPrice')

  // Pre-fill check-in / check-out from URL
  const checkInFromUrl =
    searchParams.get('checkIn')
  const checkOutFromUrl =
    searchParams.get('checkOut')

  const [listing, setListing] = useState(null)
  const [checkIn, setCheckIn] = useState(
    checkInFromUrl || ''
  )
  const [checkOut, setCheckOut] = useState(
    checkOutFromUrl || ''
  )
  const [selectedRoomTypeId, setSelectedRoomTypeId]
    = useState(
      roomTypeIdFromUrl
        ? parseInt(roomTypeIdFromUrl)
        : null
    )
  const [selectedRoomName, setSelectedRoomName]
    = useState(roomNameFromUrl || null)
  const [basePrice, setBasePrice] = useState(
    roomPriceFromUrl
      ? parseFloat(roomPriceFromUrl)
      : 0
  )
  const [nights, setNights] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [bookingId, setBookingId] = useState(null)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0)
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0)
  const [confirmedTotal, setConfirmedTotal] = useState(null)
  const [pointsPopup, setPointsPopup] = useState(null)
  const [loyaltyToast, setLoyaltyToast] = useState(null)
  const [guests, setGuests] = useState(1)
  const [roomTypes, setRoomTypes] = useState([])
  const [roomsLoading, setRoomsLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    api.get('/listings/' + listingId)
      .then(r => {
        setListing(r.data)
        // If hotel and no room pre-selected, load room types
        if (r.data.service_type === 'hotel' && !roomTypeIdFromUrl) {
          setRoomsLoading(true)
          api.get('/rooms/hotel/' + listingId)
            .then(rt => setRoomTypes(rt.data || []))
            .catch(() => setRoomTypes([]))
            .finally(() => setRoomsLoading(false))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [listingId])

  useEffect(() => {
    if (selectedRoomTypeId && listingId) {
      api.get('/room-types/' + listingId)
        .then(res => {
          const found = res.data.find(
            r => r.id === parseInt(selectedRoomTypeId)
          )
          if (found) {
            setBasePrice(found.price_per_night)
            setSelectedRoomName(found.name)
          }
        })
        .catch(console.error)
    }
  }, [selectedRoomTypeId, listingId])

  useEffect(() => {
    if (listing && (!roomPriceFromUrl || Number.isNaN(parseFloat(roomPriceFromUrl)))) {
      setBasePrice(listing?.price_per_night || 0)
    }
  }, [listing, roomPriceFromUrl])

  useEffect(() => {
    if (checkIn && checkOut) {
      const d1 = new Date(checkIn)
      const d2 = new Date(checkOut)
      const n = Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
      if (n > 0) {
        setNights(n)
        const price = basePrice || listing?.price_per_night || 0
        setTotalPrice(n * price)
      } else {
        setNights(0)
        setTotalPrice(0)
      }
    }
  }, [checkIn, checkOut, basePrice, listing])

  useEffect(() => {
    setCouponDiscount(0)
    setAppliedCoupon(null)
    setLoyaltyDiscount(0)
    setLoyaltyPointsUsed(0)
  }, [totalPrice])

  const subtotal = totalPrice
  const discountedTotal = Math.max(0, subtotal - couponDiscount - loyaltyDiscount)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!checkIn || !checkOut) {
      setError('Please select check-in and check-out dates')
      return
    }
    if (nights <= 0) {
      setError('Check-out must be after check-in')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const finalTotal = discountedTotal
      const bookingPayload = {
        listing_id: parseInt(listingId, 10),
        check_in: checkIn,
        check_out: checkOut,
        total_price: finalTotal,
        guests: guests,
        ...(selectedRoomTypeId && {
          room_type_id: selectedRoomTypeId
        }),
        coupon_code: appliedCoupon?.code || null,
        loyalty_points_used: loyaltyPointsUsed || 0,
      }
      const res = await api.post('/bookings/', bookingPayload)
      const tp = res.data.total_price ?? 0
      setBookingId(res.data.id)
      setConfirmedTotal(tp)
      setSuccess(true)
      // Show loyalty savings toast when points were redeemed
      const confirmedLoyaltyDiscount = res.data.loyalty_discount_applied ?? 0
      const confirmedLoyaltyPoints  = res.data.loyalty_points_used ?? 0
      if (confirmedLoyaltyPoints > 0 && confirmedLoyaltyDiscount > 0) {
        setLoyaltyToast({
          points: confirmedLoyaltyPoints,
          discount: confirmedLoyaltyDiscount,
        })
      }
      const earnedPoints = Math.floor(tp * 10)
      if (earnedPoints > 0) {
        setPointsPopup({
          points: earnedPoints,
          description: `Earned for booking ${
            listing?.title || 'this service'
          }`,
        })
      }
    } catch(e) {
      setError(e.response?.data?.detail || 'Booking failed')
    } finally {
      setSubmitting(false)
    }
  }

  const pricePerNight =
    basePrice || listing?.price_per_night || 0

  const priceLabel = getPriceLabel(listing?.service_type)
  const durationUnit =
    ['car_rental', 'bike_rental', 'jeep_safari', 'camping'].includes(
      listing?.service_type,
    )
      ? 'day'
      : 'night'

  // SUCCESS STATE
  if (success) {
    return (
      <>
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px'
      }}>
        <div style={{
          maxWidth: '440px', width: '100%',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden', textAlign: 'center'
        }}>
          <div style={{
            background:
              'linear-gradient(135deg, #16a34a, #15803d)',
            padding: '40px 24px'
          }}>
            <div style={{
              fontSize: '3.5rem', marginBottom: '12px'
            }}>
              🎉
            </div>
            <h2 style={{
              color: 'white', margin: '0 0 8px',
              fontSize: '1.5rem', fontWeight: 800
            }}>
              Booking Confirmed!
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              margin: 0, fontSize: '0.9rem'
            }}>
              Your trip to {listing?.location} is booked
            </p>
          </div>
          <div style={{padding: '28px 24px'}}>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              padding: '16px', marginBottom: '20px'
            }}>
              <div style={{
                fontWeight: 700, fontSize: '1rem',
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}>
                {listing?.title}
              </div>
              {selectedRoomName && (
                <div style={{
                  display: 'inline-block',
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  fontSize: '0.78rem', fontWeight: 600,
                  marginBottom: '8px'
                }}>
                  🛏️ {selectedRoomName}
                </div>
              )}
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                display: 'flex', flexDirection: 'column',
                gap: '4px', marginTop: '6px'
              }}>
                <span>📅 {checkIn} → {checkOut}</span>
                <span>🌙 {nights} {durationUnit}
                  {nights > 1 ? 's' : ''}
                </span>
                <span style={{
                  fontWeight: 700, color: 'var(--accent)',
                  fontSize: '1rem', marginTop: '4px'
                }}>
                  PKR {(confirmedTotal ?? discountedTotal).toLocaleString('en-PK')} total
                </span>
                {(couponDiscount > 0 || loyaltyDiscount > 0) && (
                  <div style={{
                    marginTop: '6px',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '6px',
                    fontSize: '0.875rem',
                    display: 'flex', flexDirection: 'column',
                    gap: '4px',
                  }}>
                    {couponDiscount > 0 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          🎟️ Coupon
                        </span>
                        <span style={{ fontWeight: 600, color: '#16a34a' }}>
                          - PKR {couponDiscount.toLocaleString('en-PK')}
                        </span>
                      </div>
                    )}
                    {loyaltyDiscount > 0 && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          ⭐ {loyaltyPointsUsed.toLocaleString()} points
                        </span>
                        <span style={{ fontWeight: 600, color: '#a16207' }}>
                          - PKR {loyaltyDiscount.toLocaleString('en-PK')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div style={{
              display: 'flex', flexDirection: 'column',
              gap: '10px'
            }}>
              <button
                onClick={() => navigate('/checkout/' + bookingId)}
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: '12px', border: 'none',
                  background:
                    'linear-gradient(135deg, #16a34a, #15803d)',
                  color: 'white', fontWeight: 800,
                  fontSize: '1rem', cursor: 'pointer'
                }}
              >
                💳 Pay Now — PKR {(confirmedTotal ?? discountedTotal).toLocaleString('en-PK')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/my-bookings')}
                style={{
                  flex: 1, padding: '12px',
                  borderRadius: '10px', border: 'none',
                  background:
                    'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                  color: 'white', fontWeight: 700,
                  fontSize: '0.9rem', cursor: 'pointer'
                }}
              >
                View My Bookings
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(`/voucher/${bookingId}`)
                }
                style={{
                  width: '100%', padding: '12px',
                  borderRadius: '12px', border: 'none',
                  background: '#f59e0b',
                  color: 'white', fontWeight: 700,
                  fontSize: '0.95rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px',
                  marginTop: '8px'
                }}
              >
                🎫 Download Voucher
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                style={{
                  flex: 1, padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600, fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Explore More
              </button>
            </div>
          </div>
        </div>
      </div>
      {pointsPopup && (
        <PointsEarnedPopup
          points={pointsPopup.points}
          description={pointsPopup.description}
          onClose={() => setPointsPopup(null)}
        />
      )}
      {loyaltyToast && (
        <Toast
          title={`You saved PKR ${loyaltyToast.discount.toLocaleString('en-PK')}!`}
          message={`${loyaltyToast.points.toLocaleString()} loyalty points redeemed on this booking.`}
          type="success"
          duration={5000}
          onClose={() => setLoyaltyToast(null)}
        />
      )}
      </>
    )
  }

  // LOADING STATE
  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-secondary)'
    }}>
      Loading...
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingBottom: '48px'
    }}>

      {/* Gradient header */}
      <div style={{
        background:
          'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
        padding: '32px 16px 80px'
      }}>
        <div style={{maxWidth: '760px', margin: '0 auto'}}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', borderRadius: '8px',
              padding: '7px 16px', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 600,
              marginBottom: '20px',
              display: 'flex', alignItems: 'center',
              gap: '6px'
            }}
          >
            ← Back
          </button>
          <h1 style={{
            color: 'white', margin: '0 0 6px',
            fontSize: '1.7rem', fontWeight: 800
          }}>
            Complete Your Booking
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.75)',
            margin: 0, fontSize: '0.9rem'
          }}>
            You're one step away from your GB adventure
          </p>
        </div>
      </div>

      {/* Main content pulled up */}
      <div style={{
        maxWidth: '760px', margin: '-56px auto 0',
        padding: '0 16px',
        display: isMobile ? 'flex' : 'grid',
        flexDirection: isMobile ? 'column' : undefined,
        gridTemplateColumns: isMobile ? undefined : '1fr 340px',
        gap: '20px', alignItems: 'start'
      }}>

        {/* LEFT — Booking form */}
        <div>
          {/* Date picker card */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            padding: '24px', marginBottom: '16px'
          }}>
            {/* Availability Calendar */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', fontWeight: 700,
                fontSize: '0.9rem', marginBottom: '10px',
                color: 'var(--text-primary)'
              }}>
                📅 Select Your Dates
              </label>
              <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                padding: '16px', marginBottom: '14px'
              }}>
                <AvailabilityCalendar
                  listingId={parseInt(listingId, 10)}
                  mode="view"
                  selectedCheckIn={checkIn}
                  selectedCheckOut={checkOut}
                  onDateSelect={(date) => {
                    if (!checkIn || (checkIn && checkOut)) {
                      setCheckIn(date)
                      setCheckOut('')
                    } else if (date > checkIn) {
                      setCheckOut(date)
                    } else {
                      setCheckIn(date)
                      setCheckOut('')
                    }
                  }}
                />
              </div>
              <p style={{
                margin: 0, fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                💡 Red dates are unavailable.
                Click to select check-in then check-out.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px', marginBottom: '16px'
            }}>
              <div>
                <label style={{
                  display: 'block', fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Check-in
                </label>
                <input
                  type="date"
                  value={checkIn}
                  min={today}
                  onChange={e => {
                    setCheckIn(e.target.value)
                    if (checkOut &&
                        e.target.value >= checkOut) {
                      setCheckOut('')
                    }
                  }}
                  style={{
                    width: '100%', padding: '12px 14px',
                    borderRadius: '10px',
                    border: checkIn
                      ? '2px solid var(--accent)'
                      : '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box', outline: 'none',
                    fontFamily: 'var(--font-primary)'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block', fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Check-out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || today}
                  onChange={e => setCheckOut(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px',
                    borderRadius: '10px',
                    border: checkOut
                      ? '2px solid var(--accent)'
                      : '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box', outline: 'none',
                    fontFamily: 'var(--font-primary)'
                  }}
                />
              </div>
            </div>

            {/* Duration display */}
            {nights > 0 ? (
              <div style={{
                background: 'var(--accent-light)',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{fontSize: '1.2rem'}}>🌙</span>
                  <span style={{
                    fontWeight: 700,
                    color: 'var(--accent)',
                    fontSize: '0.95rem'
                  }}>
                    {nights} {durationUnit}
                    {nights > 1 ? 's' : ''}
                  </span>
                </div>
                <span style={{
                  fontWeight: 800, fontSize: '1.1rem',
                  color: 'var(--accent)'
                }}>
                  PKR {discountedTotal.toLocaleString('en-PK')}
                </span>
              </div>
            ) : (
              <div style={{
                background: 'var(--bg-secondary)',
                borderRadius: '10px',
                padding: '14px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.875rem'
              }}>
                Select dates to see total price
              </div>
            )}
          </div>

          {/* Room type selector — shown for hotels when no room was pre-selected */}
          {listing?.service_type === 'hotel' && !roomTypeIdFromUrl && (
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              padding: '24px', marginBottom: '16px'
            }}>
              <h3 style={{
                margin: '0 0 4px', fontSize: '1rem',
                fontWeight: 700, color: 'var(--text-primary)'
              }}>
                🛏️ Select Room Type
              </h3>
              <p style={{
                margin: '0 0 16px', fontSize: '0.82rem',
                color: 'var(--text-secondary)'
              }}>
                Choose a room type to see its price
              </p>

              {roomsLoading ? (
                <div style={{
                  textAlign: 'center', padding: '20px',
                  color: 'var(--text-muted)'
                }}>
                  Loading rooms…
                </div>
              ) : roomTypes.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem'
                }}>
                  Standard room — price shown in summary
                </div>
              ) : (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '10px'
                }}>
                  {roomTypes.map(room => {
                    const isSelected = selectedRoomTypeId === room.id
                    const noAvail = room.available_rooms === 0
                    return (
                      <div
                        key={room.id}
                        onClick={() => {
                          if (noAvail) return
                          setSelectedRoomTypeId(room.id)
                          setSelectedRoomName(room.room_type || room.name)
                          setBasePrice(room.price_per_night)
                        }}
                        style={{
                          border: isSelected
                            ? '2px solid var(--accent)'
                            : '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '12px 16px',
                          cursor: noAvail ? 'not-allowed' : 'pointer',
                          opacity: noAvail ? 0.5 : 1,
                          background: isSelected ? 'var(--accent-light)' : 'var(--bg-secondary)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: 700, fontSize: '0.9rem',
                            color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                            marginBottom: '3px'
                          }}>
                            {room.room_type || room.name}
                            {room.bed_type && (
                              <span style={{
                                marginLeft: '8px', fontSize: '0.72rem',
                                fontWeight: 400,
                                color: 'var(--text-muted)'
                              }}>
                                · {room.bed_type}
                              </span>
                            )}
                          </div>
                          <div style={{
                            fontSize: '0.75rem', color: 'var(--text-secondary)',
                            display: 'flex', gap: '8px', flexWrap: 'wrap'
                          }}>
                            {room.capacity && (
                              <span>👥 {room.capacity} guests</span>
                            )}
                            <span style={{
                              color: noAvail ? '#dc2626' : '#16a34a',
                              fontWeight: 600
                            }}>
                              {noAvail
                                ? 'Fully booked'
                                : `${room.available_rooms} room${room.available_rooms !== 1 ? 's' : ''} left`
                              }
                            </span>
                          </div>
                        </div>
                        <div style={{
                          textAlign: 'right', flexShrink: 0
                        }}>
                          <div style={{
                            fontWeight: 800, fontSize: '1rem',
                            color: isSelected ? 'var(--accent)' : 'var(--text-primary)'
                          }}>
                            PKR {(room.price_per_night || 0).toLocaleString('en-PK')}
                          </div>
                          <div style={{
                            fontSize: '0.68rem',
                            color: 'var(--text-muted)'
                          }}>
                            /night
                          </div>
                        </div>
                        {isSelected && (
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: 'var(--accent)', color: 'white',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '0.75rem',
                            fontWeight: 800, flexShrink: 0
                          }}>
                            ✓
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Guests input */}
              <div style={{ marginTop: '16px' }}>
                <label style={{
                  display: 'block', fontSize: '0.78rem', fontWeight: 700,
                  color: 'var(--text-secondary)', marginBottom: '8px',
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  Guests
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                  <button
                    type="button"
                    onClick={() => setGuests(g => Math.max(1, g - 1))}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem',
                      color: 'var(--text-secondary)',
                    }}
                  >−</button>
                  <span style={{
                    fontWeight: 700, fontSize: '1rem',
                    color: 'var(--text-primary)', minWidth: '24px',
                    textAlign: 'center'
                  }}>
                    {guests}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGuests(g => Math.min(20, g + 1))}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem',
                      color: 'var(--text-secondary)',
                    }}
                  >+</button>
                  <span style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)'
                  }}>
                    guest{guests !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Policies card */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            padding: '20px 24px'
          }}>
            <h3 style={{
              margin: '0 0 14px', fontSize: '0.9rem',
              fontWeight: 700, color: 'var(--text-primary)'
            }}>
              📋 Booking Policies
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <CancellationPolicy
                policy={listing?.cancellation_policy || 'moderate'}
                policyInfo={listing?.cancellation_policy_info}
                compact={false}
              />
            </div>
            {[
              { icon: '✅', text: 'Free cancellation anytime before check-in' },
              { icon: '💳', text: 'No payment required now — pay at property' },
              { icon: '📞', text: 'Provider will contact you to confirm' },
            ].map(p => (
              <div key={p.text} style={{
                display: 'flex', gap: '10px',
                alignItems: 'flex-start',
                marginBottom: '10px'
              }}>
                <span style={{fontSize: '1rem', flexShrink: 0}}>
                  {p.icon}
                </span>
                <span style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5
                }}>
                  {p.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Summary + Submit */}
        <div style={{
          position: isMobile ? 'relative' : 'sticky',
          top: isMobile ? 'auto' : '20px',
          order: isMobile ? -1 : 0
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden'
          }}>
            {/* Listing image */}
            {listing?.image_url && (
              <img
                src={'http://127.0.0.1:8000/uploads/'
                  + listing.image_url}
                alt={listing?.title}
                onError={e => {
                  e.target.onerror = null
                  e.target.src =
                    'https://placehold.co/340x160/e5e7eb/9ca3af?text=GB+Tourism'
                }}
                style={{
                  width: '100%', height: '160px',
                  objectFit: 'cover', display: 'block'
                }}
              />
            )}

            <div style={{padding: '20px'}}>
              {/* Listing info */}
              <h3 style={{
                margin: '0 0 4px', fontWeight: 800,
                fontSize: '1rem',
                color: 'var(--text-primary)'
              }}>
                {listing?.title}
              </h3>
              <p style={{
                margin: '0 0 10px', fontSize: '0.85rem',
                color: 'var(--text-secondary)'
              }}>
                📍 {listing?.location}
              </p>

              {selectedRoomName && (
                <div style={{
                  display: 'inline-block',
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  padding: '3px 12px',
                  borderRadius: '999px',
                  fontSize: '0.8rem', fontWeight: 600,
                  marginBottom: '14px'
                }}>
                  🛏️ {selectedRoomName}
                </div>
              )}
              {selectedRoomName && (
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '14px',
                  display: 'flex', alignItems: 'center',
                  gap: '10px'
                }}>
                  <span style={{fontSize: '1.3rem'}}>🛏️</span>
                  <div>
                    <div style={{
                      fontWeight: 700, fontSize: '0.875rem',
                      color: '#0369a1'
                    }}>
                      {selectedRoomName}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#0ea5e9'
                    }}>
                      PKR {parseFloat(
                        roomPriceFromUrl || basePrice || 0
                      ).toLocaleString('en-PK')}/night
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(-1)}
                    style={{
                      marginLeft: 'auto', fontSize: '0.75rem',
                      color: '#0369a1', background: 'transparent',
                      border: '1px solid #bae6fd',
                      borderRadius: '6px', padding: '4px 10px',
                      cursor: 'pointer'
                    }}
                  >
                    Change room
                  </button>
                </div>
              )}

              {/* Divider */}
              <div style={{
                height: '1px',
                background: 'var(--border-color)',
                margin: '14px 0'
              }} />

              {/* Price breakdown */}
              <div style={{ marginBottom: '16px' }}>
                {nights > 0 ? (
                  <>
                    <PriceBreakdown
                      pricePerNight={pricePerNight}
                      nights={nights}
                      groupSize={1}
                      serviceType={listing?.service_type}
                      couponDiscount={couponDiscount}
                      loyaltyDiscount={loyaltyDiscount}
                      compact={false}
                    />
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Loyalty points — sits above coupon so user applies
                          the bigger discount (points) first */}
                      <LoyaltyInput
                        key={`loyalty-${subtotal}-${checkIn}-${checkOut}`}
                        subtotal={subtotal}
                        onPointsChange={({ points, discount }) => {
                          setLoyaltyPointsUsed(points)
                          setLoyaltyDiscount(discount)
                        }}
                      />
                      <CouponInput
                        key={`coupon-${subtotal}-${checkIn}-${checkOut}`}
                        listingId={parseInt(listingId, 10)}
                        listingOwnerId={listing?.owner_id || null}
                        bookingAmount={subtotal}
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
                  </>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem',
                    padding: '12px',
                  }}>
                    Select dates to see price breakdown
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem', fontWeight: 600,
                  marginBottom: '14px'
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={submitting || nights <= 0}
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: '12px', border: 'none',
                  background: nights > 0
                    ? 'linear-gradient(135deg, #1e3a5f, #0ea5e9)'
                    : 'var(--border-color)',
                  color: nights > 0
                    ? 'white' : 'var(--text-muted)',
                  fontWeight: 800, fontSize: '1rem',
                  cursor: nights > 0
                    ? 'pointer' : 'not-allowed',
                  opacity: submitting ? 0.75 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {submitting
                  ? '⏳ Confirming...'
                  : nights > 0
                  ? `Confirm Booking — PKR ${discountedTotal.toLocaleString('en-PK')}`
                  : 'Select dates to continue'
                }
              </button>

              <p style={{
                textAlign: 'center', margin: '10px 0 0',
                fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                ✅ Free cancellation · No payment now
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
