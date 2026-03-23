import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'
import { getUser, getRole, isLoggedIn } from '../utils/role'
import useWindowSize from '../hooks/useWindowSize'
import WishlistButton from '../components/WishlistButton'
import CompareButton from '../components/CompareButton'
import AvailabilityCalendar from '../components/AvailabilityCalendar'
import PointsEarnedPopup from '../components/PointsEarnedPopup'
import PriceBreakdown from '../components/PriceBreakdown'
import CancellationPolicy from '../components/CancellationPolicy'
import UrgencyBanner from '../components/UrgencyBanner'
import RoomSelector from '../components/RoomSelector'

function getServiceBadge(type) {
  switch (type) {
    case 'hotel':
      return { bg: '#2563eb', label: '🏨 Hotel' }
    case 'tour':
      return { bg: '#16a34a', label: '🏔️ Tour' }
    case 'transport':
      return { bg: '#d97706', label: '🚐 Transport' }
    case 'activity':
      return { bg: '#7c3aed', label: '🎯 Activity' }
    case 'restaurant':
      return { bg: '#e11d48', label: '🍽️ Restaurant' }
    case 'car_rental':
      return { bg: '#0369a1', label: '🚗 Car Rental' }
    case 'bike_rental':
      return { bg: '#0891b2', label: '🚲 Bike Rental' }
    case 'jeep_safari':
      return { bg: '#92400e', label: '🚙 Jeep Safari' }
    case 'boat_trip':
      return { bg: '#1d4ed8', label: '🚢 Boat Trip' }
    case 'horse_riding':
      return { bg: '#7c2d12', label: '🐴 Horse Riding' }
    case 'medical':
      return { bg: '#dc2626', label: '🏥 Medical' }
    case 'guide':
      return { bg: '#059669', label: '🧭 Guide' }
    case 'camping':
      return { bg: '#15803d', label: '🏕️ Camping' }
    default:
      return { bg: '#0ea5e9', label: type }
  }
}

function getPriceLabel(serviceType) {
  const perDay = [
    'car_rental', 'bike_rental',
    'jeep_safari', 'camping',
  ]
  const perPerson = [
    'tour', 'activity', 'horse_riding',
    'guide', 'boat_trip', 'restaurant',
  ]
  if (perDay.includes(serviceType)) return '/day'
  if (perPerson.includes(serviceType)) return '/person'
  return '/night'
}

function BookButton({
  listingId,
  selectedRoom,
  ownerId,
  serviceType,
  checkIn,
  checkOut,
  rooms = [],
}) {
  const navigate = useNavigate()
  const raw = localStorage.getItem('user')
  if (!raw) {
    return (
      <button
        onClick={() => navigate('/login')}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '12px',
          border: 'none',
          background: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
          color: 'white',
          fontWeight: 800,
          fontSize: '1rem',
          cursor: 'pointer',
          marginTop: '8px',
        }}
      >
        Login to Book
      </button>
    )
  }
  let user
  try {
    user = JSON.parse(raw)
  } catch (e) {
    return null
  }
  if (user.role === 'admin') return null
  if (user.id === ownerId) return null

  function goToBooking(path) {
    if (['hotel', 'camping'].includes(serviceType) &&
      rooms.length > 0 && !selectedRoom) {
      document.querySelector(
        '[data-room-selector="true"]'
      )?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      window.alert('Please select a room type first')
      return
    }

    const params = new URLSearchParams({
      checkIn: checkIn || '',
      checkOut: checkOut || '',
    })
    if (selectedRoom) {
      params.set('roomTypeId', String(selectedRoom.id))
      params.set('roomName', selectedRoom.name)
      params.set(
        'roomPrice',
        String(selectedRoom.price_per_night)
      )
      params.set('room_type_id', String(selectedRoom.id))
      params.set('room_name', selectedRoom.name)
    }
    navigate(`${path}?${params.toString()}`)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => goToBooking(`/booking/${listingId}`)}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '12px',
          border: 'none',
          background: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
          color: 'white',
          fontWeight: 800,
          fontSize: '1rem',
          cursor: 'pointer',
          marginTop: '8px',
          display: 'block',
          textAlign: 'center',
        }}
      >
        🗓️ Book Now
        {selectedRoom ? ` — ${selectedRoom.name}` : ''}
      </button>
      {serviceType !== 'restaurant' && (
        <button
          type="button"
          onClick={() =>
            goToBooking(`/group-booking/${listingId}`)
          }
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: '10px',
            border: '1px solid var(--accent)',
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.9rem',
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          👥 Book for Group
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 400,
            color: 'var(--text-secondary)',
          }}>
            (5+ people = discounts)
          </span>
        </button>
      )}
    </>
  )
}

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()

  const [listing, setListing] = useState(null)
  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [extraImages, setExtraImages] = useState([])
  const [activeImage, setActiveImage] = useState(null)
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [diningPackages, setDiningPackages] = useState([])

  const [hasBooked, setHasBooked] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [hasUpcomingBooking, setHasUpcomingBooking] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewMsg, setReviewMsg] = useState('')

  const [selectedPackage, setSelectedPackage] = useState(null)
  const [showReservation, setShowReservation] = useState(false)
  const [resDate, setResDate] = useState('')
  const [resTime, setResTime] = useState('')
  const [resPersons, setResPersons] = useState(2)
  const [showCalendar, setShowCalendar] = useState(false)
  const [resSpecial, setResSpecial] = useState('')
  const [resLoading, setResLoading] = useState(false)
  const [resSuccess, setResSuccess] = useState(false)
  const [resError, setResError] = useState('')
  const [pointsPopup, setPointsPopup] = useState(null)

  const [subRatings, setSubRatings] = useState({
    cleanliness_rating: 0,
    location_rating: 0,
    value_rating: 0,
    staff_rating: 0,
    facilities_rating: 0,
  })
  const [sidebarCheckIn, setSidebarCheckIn] = useState('')
  const [sidebarCheckOut, setSidebarCheckOut] = useState('')

  const sidebarNights = useMemo(() => {
    if (!sidebarCheckIn || !sidebarCheckOut) return 0
    const d1 = new Date(sidebarCheckIn)
    const d2 = new Date(sidebarCheckOut)
    const n = Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
    return n > 0 ? n : 0
  }, [sidebarCheckIn, sidebarCheckOut])

  const currentUser = getUser()
  const userRole = getRole()
  const isAdmin = userRole === 'admin'
  const isOwner =
    currentUser && listing ? currentUser.id === listing.owner_id : false

  useEffect(() => {
    fetchAll()
  }, [id])

  async function fetchAll() {
    setLoading(true)
    try {
      const [lRes, rRes, sRes] = await Promise.all([
        api.get(`/listings/${id}`),
        api.get(`/reviews/listing/${id}`),
        api.get(`/reviews/listing/${id}/summary`),
      ])
      setListing(lRes.data)
      setReviews(rRes.data)
      setSummary(sRes.data)

      try {
        const imgRes = await api.get(`/listing-images/${id}`)
        setExtraImages(imgRes.data || [])
      } catch (e) {
        console.error('Image load error:', e)
        setExtraImages([])
      }

      if (['hotel', 'camping', 'resort'].includes(lRes.data.service_type)) {
        setRoomsLoading(true)
        try {
          const rtRes = await api.get(`/room-types/${id}`)
          const roomData = rtRes.data || []
          setRooms(roomData)
          const firstAvailable = roomData.find(
            (rm) => rm.is_available && rm.available_count > 0
          )
          if (firstAvailable) setSelectedRoom(firstAvailable)
          else setSelectedRoom(null)
        } catch (e) {
          console.error('Room load error:', e)
          setRooms([])
          setSelectedRoom(null)
        } finally {
          setRoomsLoading(false)
        }
      } else {
        setRooms([])
        setSelectedRoom(null)
      }

      if (lRes.data.service_type === 'restaurant') {
        try {
          const pkgRes = await api.get(`/dining/packages/${id}`)
          setDiningPackages(pkgRes.data || [])
        } catch (e) {
          setDiningPackages([])
        }
      } else {
        setDiningPackages([])
      }

      if (isLoggedIn() && currentUser) {
        try {
          const bookingsRes = await api.get('/bookings/me')
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          const eligible = bookingsRes.data.find((b) => {
            if (b.listing_id !== parseInt(id, 10)) return false
            if (b.status === 'cancelled') return false
            if (!b.check_out) return false
            const co = new Date(b.check_out)
            co.setHours(0, 0, 0, 0)
            return co < today
          })
          setHasBooked(!!eligible)

          const upcoming = bookingsRes.data.find((b) => {
            if (b.listing_id !== parseInt(id, 10)) return false
            if (b.status === 'cancelled') return false
            if (!b.check_out) return false
            const co = new Date(b.check_out)
            co.setHours(0, 0, 0, 0)
            return co >= today
          })
          setHasUpcomingBooking(!!upcoming)

          const reviewed = rRes.data.some(
            (r) => r.user_id === currentUser.id
          )
          setAlreadyReviewed(reviewed)
        } catch (e) {
          setHasBooked(false)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function submitReview(e) {
    e.preventDefault()
    if (!comment.trim()) {
      setReviewMsg('Please write a comment')
      return
    }
    setSubmitting(true)
    try {
      const res = await api.post(`/reviews/listing/${id}`, {
        rating,
        comment,
        ...subRatings,
      })
      setReviews((prev) => [res.data, ...prev])
      setAlreadyReviewed(true)
      setReviewMsg('✅ Review submitted!')
      setComment('')
      setSubRatings({
        cleanliness_rating: 0,
        location_rating: 0,
        value_rating: 0,
        staff_rating: 0,
        facilities_rating: 0,
      })
      const sRes = await api.get(`/reviews/listing/${id}/summary`)
      setSummary(sRes.data)
      const lRes = await api.get(`/listings/${id}`)
      setListing(lRes.data)
    } catch (e) {
      const d = e.response?.data?.detail
      setReviewMsg(
        typeof d === 'string' ? d : Array.isArray(d) ? d[0]?.msg || '❌ Failed' : '❌ Failed'
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteReview(reviewId) {
    if (!window.confirm('Delete this review?')) return
    try {
      await api.delete(`/reviews/${reviewId}`)
      setReviews((prev) => prev.filter((r) => r.id !== reviewId))
      setAlreadyReviewed(false)
      const sRes = await api.get(`/reviews/listing/${id}/summary`)
      setSummary(sRes.data)
      const lRes = await api.get(`/listings/${id}`)
      setListing(lRes.data)
    } catch (e) {
      console.error(e)
    }
  }

  async function makeReservation() {
    if (!resDate) {
      setResError('Please select a date')
      return
    }
    if (!resTime) {
      setResError('Please select a time')
      return
    }
    setResLoading(true)
    setResError('')
    try {
      await api.post('/dining/reserve', {
        listing_id: parseInt(id, 10),
        package_id: selectedPackage?.id || null,
        reservation_date: resDate,
        reservation_time: resTime,
        persons: resPersons,
        special_requests: resSpecial || null,
      })
      setResSuccess(true)
      setShowReservation(false)
      setPointsPopup({
        points: 1000,
        description: 'Restaurant reservation bonus!',
      })
    } catch (e) {
      const d = e.response?.data?.detail
      setResError(
        typeof d === 'string'
          ? d
          : Array.isArray(d)
            ? d[0]?.msg || 'Reservation failed'
            : 'Reservation failed'
      )
    } finally {
      setResLoading(false)
    }
  }

  if (loading)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏳</div>
          Loading...
        </div>
      </div>
    )

  if (!listing)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>😕</div>
          <p style={{ color: 'var(--text-secondary)' }}>Listing not found</p>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    )

  const badge = getServiceBadge(listing.service_type)
  const priceLabel = getPriceLabel(listing.service_type)
  const effectivePrice = selectedRoom
    ? selectedRoom.price_per_night
    : listing?.price_per_night || 0
  const effectiveRoomName = selectedRoom?.name || null
  const currentPrice = effectivePrice
  const today = new Date().toISOString().split('T')[0]
  const totalReviews = summary?.total_reviews ?? listing.review_count ?? 0
  const avgRating = listing.average_rating ?? summary?.average_rating ?? 0

  return (
    <>
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        paddingBottom: '48px',
      }}
    >
      <div style={{ position: 'relative' }}>
        <img
          src={getImageUrl(listing.image_url)}
          alt={listing.title}
          onError={(e) => {
            e.target.onerror = null
            e.target.src =
              'https://placehold.co/1200x500/1e3a5f/7dd3fc?text=GB+Tourism'
          }}
          style={{
            width: '100%',
            height: isMobile ? '240px' : '420px',
            objectFit: 'cover',
            display: 'block',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
          }}
        />

        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            borderRadius: '10px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← Back
        </button>

        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <CompareButton listing={listing} size="md" />
          <WishlistButton listingId={parseInt(id, 10)} />
          {isOwner && (
            <button
              type="button"
              onClick={() => navigate(`/edit-listing/${id}`)}
              style={{
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: '10px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              ✏️ Edit
            </button>
          )}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '24px 20px',
          }}
        >
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: badge.bg,
                color: 'white',
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: '8px',
              }}
            >
              {badge.label}
            </div>
            <h1
              style={{
                color: 'white',
                margin: '0 0 6px',
                fontSize: isMobile ? '1.4rem' : '2rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              {listing.title}
            </h1>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                📍 {listing.location}
              </span>
              {avgRating > 0 && (
                <span
                  style={{
                    color: '#fbbf24',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  ⭐ {Number(avgRating).toFixed(1)}
                  <span
                    style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontWeight: 400,
                    }}
                  >
                    ({listing.review_count} reviews)
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: isMobile ? '16px 12px' : '24px 16px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 360px',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        <div>
          {extraImages.length > 0 && (
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                padding: '20px',
                marginBottom: '20px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 14px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                📸 Photos
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 400,
                    color: 'var(--text-muted)',
                  }}
                >
                  ({extraImages.length})
                </span>
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                }}
              >
                {extraImages.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setActiveImage(img)}
                    style={{
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      height: '120px',
                      background: 'var(--bg-secondary)',
                    }}
                  >
                    <img
                      src={`http://127.0.0.1:8000/uploads/${img.filename}`}
                      alt={img.caption || 'Room photo'}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src =
                          'https://placehold.co/300x120/e5e7eb/9ca3af?text=Photo'
                      }}
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              padding: '24px',
              marginBottom: '20px',
            }}
          >
            <h2
              style={{
                margin: '0 0 14px',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              About this{' '}
              {listing.service_type === 'restaurant'
                ? 'Restaurant'
                : listing.service_type === 'hotel'
                  ? 'Stay'
                  : 'Service'}
            </h2>
            {listing.description ? (
              <p
                style={{
                  margin: 0,
                  fontSize: '0.925rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                }}
              >
                {listing.description}
              </p>
            ) : (
              <p
                style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                }}
              >
                No description provided.
              </p>
            )}

            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginTop: '16px',
              }}
            >
              <span
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '999px',
                  padding: '5px 14px',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}
              >
                📍 {listing.location}
              </span>
              <span
                style={{
                  background: badge.bg + '18',
                  border: '1px solid ' + badge.bg + '44',
                  borderRadius: '999px',
                  padding: '5px 14px',
                  fontSize: '0.82rem',
                  color: badge.bg,
                  fontWeight: 600,
                }}
              >
                {badge.label}
              </span>
              {avgRating > 0 && (
                <span
                  style={{
                    background: '#fef3c7',
                    border: '1px solid #f59e0b44',
                    borderRadius: '999px',
                    padding: '5px 14px',
                    fontSize: '0.82rem',
                    color: '#d97706',
                    fontWeight: 600,
                  }}
                >
                  ⭐ {Number(avgRating).toFixed(1)} ({listing.review_count})
                </span>
              )}
            </div>
          </div>

          {listing.service_type === 'restaurant' &&
            diningPackages.length > 0 && (
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: '24px',
                  marginBottom: '20px',
                }}
              >
                <h2
                  style={{
                    margin: '0 0 16px',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  🍽️ Dining Packages
                </h2>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  {diningPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '12px',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            color: 'var(--text-primary)',
                            marginBottom: '3px',
                          }}
                        >
                          {pkg.package_label} — {pkg.name}
                        </div>
                        {pkg.description && (
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-secondary)',
                              marginBottom: '4px',
                            }}
                          >
                            {pkg.description}
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          👥 {pkg.min_persons}–{pkg.max_persons} persons · ⏱️{' '}
                          {pkg.duration_hours}h
                        </div>
                      </div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: '1rem',
                          color: '#e11d48',
                          flexShrink: 0,
                        }}
                      >
                        PKR {pkg.price_per_person?.toLocaleString('en-PK')}
                        <div
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 400,
                            color: 'var(--text-muted)',
                          }}
                        >
                          /person
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {listing.service_type === 'hotel' && rooms.length > 0 && (
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)',
                padding: '24px',
                marginBottom: '20px',
              }}
            >
              <h2
                style={{
                  margin: '0 0 16px',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                🛏️ Room Types
              </h2>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      border:
                        selectedRoom?.id === room.id
                          ? '2px solid var(--accent)'
                          : '1px solid var(--border-color)',
                      background:
                        selectedRoom?.id === room.id
                          ? 'var(--accent-light)'
                          : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: 'var(--text-primary)',
                          marginBottom: '3px',
                        }}
                      >
                        {selectedRoom?.id === room.id ? '✓ ' : ''}
                        {room.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        👥 {room.capacity} guests · 🏷️ {room.available_count ?? room.total_rooms ?? 0} available
                        {room.description ? ` · ${room.description}` : ''}
                      </div>
                    </div>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: '1rem',
                        color: 'var(--accent)',
                        flexShrink: 0,
                      }}
                    >
                      PKR {room.price_per_night?.toLocaleString('en-PK')}
                      <div
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 400,
                          color: 'var(--text-muted)',
                        }}
                      >
                        /night
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                ⭐ Guest Reviews
              </h2>
              {avgRating > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '1.6rem',
                      fontWeight: 800,
                      color: '#f59e0b',
                    }}
                  >
                    {Number(avgRating).toFixed(1)}
                  </span>
                  <div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          style={{
                            color:
                              s <= Math.round(avgRating)
                                ? '#f59e0b'
                                : 'var(--border-color)',
                            fontSize: '0.9rem',
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {listing.review_count} reviews
                    </div>
                  </div>
                </div>
              )}
            </div>

            {summary && totalReviews > 0 && (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                {[5, 4, 3, 2, 1].map((star) => {
                  const count =
                    summary.rating_breakdown?.[String(star)] ?? 0
                  const pct =
                    totalReviews > 0 ? (count / totalReviews) * 100 : 0
                  return (
                    <div
                      key={star}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '6px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          width: '20px',
                          textAlign: 'right',
                        }}
                      >
                        {star}★
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: '8px',
                          background: 'var(--border-color)',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: '#f59e0b',
                            borderRadius: '4px',
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          width: '20px',
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {isLoggedIn() && !isOwner && !isAdmin && (
              <div style={{ marginBottom: '20px' }}>
                {alreadyReviewed ? (
                  <div
                    style={{
                      padding: '12px 16px',
                      background: '#dcfce7',
                      borderRadius: 'var(--radius-md)',
                      color: '#16a34a',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    ✅ You have already reviewed this
                  </div>
                ) : !hasBooked && !hasUpcomingBooking ? (
                  <div
                    style={{
                      padding: '12px 16px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    🔒 Book this to leave a review
                  </div>
                ) : hasUpcomingBooking && !hasBooked ? (
                  <div
                    style={{
                      padding: '12px 16px',
                      background: '#fef3c7',
                      borderRadius: 'var(--radius-md)',
                      color: '#d97706',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    ⏳ You can review after check-out
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      padding: '16px',
                    }}
                  >
                    <h4
                      style={{
                        margin: '0 0 12px',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}
                    >
                      ✍️ Write a Review
                    </h4>
                    <div
                      style={{
                        display: 'flex',
                        gap: '4px',
                        marginBottom: '12px',
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          onClick={() => setRating(s)}
                          style={{
                            fontSize: '1.6rem',
                            cursor: 'pointer',
                            color:
                              s <= rating ? '#f59e0b' : 'var(--border-color)',
                            transition: 'color 0.15s',
                          }}
                        >
                          ★
                        </span>
                      ))}
                      <span
                        style={{
                          marginLeft: '8px',
                          fontSize: '0.85rem',
                          color: 'var(--text-muted)',
                          alignSelf: 'center',
                        }}
                      >
                        {
                          [
                            '',
                            'Terrible',
                            'Poor',
                            'OK',
                            'Good',
                            'Excellent',
                          ][rating]
                        }
                      </span>
                    </div>
                    {[
                      {
                        key: 'cleanliness_rating',
                        label: '🧹 Cleanliness',
                      },
                      {
                        key: 'location_rating',
                        label: '📍 Location',
                      },
                      {
                        key: 'value_rating',
                        label: '💰 Value for Money',
                      },
                      {
                        key: 'staff_rating',
                        label: '👥 Staff',
                      },
                      {
                        key: 'facilities_rating',
                        label: '🏨 Facilities',
                      },
                    ].map((sub) => (
                      <div key={sub.key} style={{
                        marginBottom: '10px',
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px',
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                        }}>
                          <span>{sub.label}</span>
                          <span style={{ fontWeight: 600 }}>
                            {subRatings[sub.key] || 0}/5
                          </span>
                        </div>
                        <div style={{
                          display: 'flex', gap: '4px',
                        }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              role="button"
                              tabIndex={0}
                              onClick={() => setSubRatings(
                                (prev) => ({ ...prev, [sub.key]: star }),
                              )}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  setSubRatings(
                                    (prev) => ({ ...prev, [sub.key]: star }),
                                  )
                                }
                              }}
                              style={{
                                cursor: 'pointer', fontSize: '1.2rem',
                                color: star <=
                                  (subRatings[sub.key] || 0)
                                  ? '#f59e0b' : '#d1d5db',
                                transition: 'color 0.1s',
                              }}
                            >★</span>
                          ))}
                        </div>
                      </div>
                    ))}
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        outline: 'none',
                        fontFamily: 'var(--font-primary)',
                        marginBottom: '10px',
                      }}
                    />
                    {reviewMsg && (
                      <p
                        style={{
                          margin: '0 0 8px',
                          fontSize: '0.85rem',
                          color: reviewMsg.startsWith('✅')
                            ? 'var(--success)'
                            : 'var(--danger)',
                        }}
                      >
                        {reviewMsg}
                      </p>
                    )}
                    <button
                      onClick={submitReview}
                      disabled={submitting}
                      style={{
                        background:
                          'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 24px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        opacity: submitting ? 0.7 : 1,
                      }}
                    >
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {reviews.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
                  💬
                </div>
                No reviews yet. Be the first!
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      paddingBottom: '16px',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background:
                          'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                        color: 'white',
                        fontSize: '1rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {review.reviewer_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '4px',
                          gap: '8px',
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {review.reviewer_name}
                          </span>
                          <span
                            style={{
                              marginLeft: '8px',
                              color: '#f59e0b',
                              fontSize: '0.85rem',
                            }}
                          >
                            {'★'.repeat(review.rating)}
                            {'☆'.repeat(5 - review.rating)}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexShrink: 0,
                          }}
                        >
                          {currentUser?.id === review.user_id && (
                            <button
                              type="button"
                              onClick={() => deleteReview(review.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--danger)',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                              }}
                            >
                              Delete
                            </button>
                          )}
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {new Date(review.created_at).toLocaleDateString(
                              'en-PK',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              }
                            )}
                          </span>
                        </div>
                      </div>
                      {review.comment && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.6,
                          }}
                        >
                          {review.comment}
                        </p>
                      )}
                      {(review.cleanliness_rating > 0 ||
                        review.location_rating > 0) && (
                        <div style={{
                          marginTop: '10px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: '6px',
                        }}>
                          {[
                            { key: 'cleanliness_rating',
                              label: '🧹 Clean' },
                            { key: 'location_rating',
                              label: '📍 Location' },
                            { key: 'value_rating',
                              label: '💰 Value' },
                            { key: 'staff_rating',
                              label: '👥 Staff' },
                            { key: 'facilities_rating',
                              label: '🏨 Facilities' },
                          ].filter((s) => (review[s.key] || 0) > 0)
                            .map((sub) => (
                              <div key={sub.key} style={{
                                fontSize: '0.72rem',
                              }}>
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  marginBottom: '2px',
                                  color: 'var(--text-muted)',
                                }}>
                                  <span>{sub.label}</span>
                                  <span style={{ fontWeight: 600 }}>
                                    {Number(review[sub.key]).toFixed(1)}
                                  </span>
                                </div>
                                <div style={{
                                  height: '4px',
                                  background: 'var(--border-color)',
                                  borderRadius: '2px', overflow: 'hidden',
                                }}>
                                  <div style={{
                                    width: `${(Number(review[sub.key]) / 5) * 100}%`,
                                    height: '100%',
                                    background: '#f59e0b',
                                    borderRadius: '2px',
                                  }} />
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                      {review.provider_reply && (
                        <div style={{
                          marginTop: '10px',
                          background: 'var(--accent-light)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          borderLeft: '3px solid var(--accent)',
                        }}>
                          <div style={{
                            fontSize: '0.72rem', fontWeight: 700,
                            color: 'var(--accent)', marginBottom: '4px',
                          }}>
                            🏨 Provider Response
                          </div>
                          <p style={{
                            margin: 0, fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.5,
                          }}>
                            {review.provider_reply}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            position: isMobile ? 'relative' : 'sticky',
            top: isMobile ? 'auto' : '20px',
            order: isMobile ? -1 : 0,
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '20px 20px 16px',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color:
                    listing.service_type === 'restaurant'
                      ? '#e11d48'
                      : 'var(--accent)',
                  marginBottom: '2px',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '6px',
                }}
              >
                PKR {(effectivePrice || 0).toLocaleString('en-PK')}
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 400,
                    color: 'var(--text-secondary)',
                  }}
                >
                  {priceLabel}
                </span>
              </div>
              {selectedRoom && (
                <div style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  marginTop: '4px',
                  display: 'flex', alignItems: 'center',
                  gap: '6px',
                }}>
                  <span style={{
                    background: '#dbeafe', color: '#1d4ed8',
                    padding: '2px 8px', borderRadius: '999px',
                    fontSize: '0.72rem', fontWeight: 700,
                  }}>
                    🛏️ {effectiveRoomName}
                  </span>
                  <span style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                  }}>
                    {selectedRoom.capacity} guests
                  </span>
                </div>
              )}
              {avgRating > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span style={{ color: '#f59e0b' }}>
                    {'★'.repeat(Math.round(avgRating))}
                  </span>
                  <span>
                    {Number(avgRating).toFixed(1)} ({listing.review_count}{' '}
                    reviews)
                  </span>
                </div>
              )}
            </div>

            <div style={{ padding: '20px' }}>
              <UrgencyBanner
                roomsLeft={listing?.rooms_available}
              />
              {listing.service_type === 'restaurant' ? (
                <div>
                  <div style={{ marginBottom: '14px' }}>
                    <CancellationPolicy
                      policy={listing?.cancellation_policy}
                      policyInfo={listing?.cancellation_policy_info}
                      compact={false}
                    />
                  </div>
                  {diningPackages.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          marginBottom: '8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Select Package
                      </label>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div
                          onClick={() => setSelectedPackage(null)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: !selectedPackage
                              ? '2px solid #e11d48'
                              : '1px solid var(--border-color)',
                            background: !selectedPackage
                              ? '#fce7f3'
                              : 'var(--bg-secondary)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: !selectedPackage ? 700 : 400,
                            color: !selectedPackage
                              ? '#e11d48'
                              : 'var(--text-primary)',
                          }}
                        >
                          🍽️ Regular Dine-In
                        </div>
                        {diningPackages.map((pkg) => (
                          <div
                            key={pkg.id}
                            onClick={() => setSelectedPackage(pkg)}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border:
                                selectedPackage?.id === pkg.id
                                  ? '2px solid #e11d48'
                                  : '1px solid var(--border-color)',
                              background:
                                selectedPackage?.id === pkg.id
                                  ? '#fce7f3'
                                  : 'var(--bg-secondary)',
                              cursor: 'pointer',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.82rem',
                              }}
                            >
                              <span
                                style={{
                                  fontWeight:
                                    selectedPackage?.id === pkg.id ? 700 : 500,
                                  color:
                                    selectedPackage?.id === pkg.id
                                      ? '#e11d48'
                                      : 'var(--text-primary)',
                                }}
                              >
                                {pkg.package_label}
                                {' — '}
                                {pkg.name}
                              </span>
                              <span style={{ fontWeight: 700, color: '#e11d48' }}>
                                PKR{' '}
                                {pkg.price_per_person?.toLocaleString('en-PK')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {resSuccess ? (
                    <div
                      style={{
                        background: '#dcfce7',
                        color: '#16a34a',
                        padding: '16px',
                        borderRadius: '10px',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                      }}
                    >
                      ✅ Table Reserved Successfully!
                    </div>
                  ) : showReservation ? (
                    <div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '10px',
                          marginBottom: '10px',
                        }}
                      >
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: 'var(--text-secondary)',
                              marginBottom: '5px',
                              textTransform: 'uppercase',
                            }}
                          >
                            Date
                          </label>
                          <input
                            type="date"
                            value={resDate}
                            min={today}
                            onChange={(e) => setResDate(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '9px 10px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              fontSize: '0.82rem',
                              boxSizing: 'border-box',
                              outline: 'none',
                              fontFamily: 'var(--font-primary)',
                            }}
                          />
                        </div>
                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: 'var(--text-secondary)',
                              marginBottom: '5px',
                              textTransform: 'uppercase',
                            }}
                          >
                            Time
                          </label>
                          <select
                            value={resTime}
                            onChange={(e) => setResTime(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '9px 8px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              fontSize: '0.82rem',
                              boxSizing: 'border-box',
                            }}
                          >
                            <option value="">Time</option>
                            {[
                              '08:00',
                              '09:00',
                              '10:00',
                              '11:00',
                              '12:00',
                              '13:00',
                              '14:00',
                              '15:00',
                              '16:00',
                              '17:00',
                              '18:00',
                              '19:00',
                              '20:00',
                              '21:00',
                              '22:00',
                            ].map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--text-secondary)',
                            marginBottom: '5px',
                            textTransform: 'uppercase',
                          }}
                        >
                          Number of Persons
                        </label>
                        <input
                          type="number"
                          value={resPersons}
                          min={1}
                          max={50}
                          onChange={(e) =>
                            setResPersons(
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          style={{
                            width: '100%',
                            padding: '9px 10px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            boxSizing: 'border-box',
                            outline: 'none',
                          }}
                        />
                      </div>

                      {selectedPackage && (
                        <div
                          style={{
                            background: '#fce7f3',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            marginBottom: '10px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: '#e11d48',
                          }}
                        >
                          Total: PKR{' '}
                          {(
                            selectedPackage.price_per_person * resPersons
                          ).toLocaleString('en-PK')}
                          <span
                            style={{
                              fontWeight: 400,
                              color: '#9f1239',
                              fontSize: '0.75rem',
                              marginLeft: '6px',
                            }}
                          >
                            ({resPersons} × PKR{' '}
                            {selectedPackage.price_per_person?.toLocaleString(
                              'en-PK'
                            )}
                            )
                          </span>
                        </div>
                      )}

                      <textarea
                        value={resSpecial}
                        onChange={(e) => setResSpecial(e.target.value)}
                        placeholder="Special requests..."
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '9px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: '0.82rem',
                          resize: 'none',
                          boxSizing: 'border-box',
                          outline: 'none',
                          marginBottom: '10px',
                          fontFamily: 'var(--font-primary)',
                        }}
                      />

                      {resError && (
                        <div
                          style={{
                            background: 'var(--danger-bg)',
                            color: 'var(--danger)',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            marginBottom: '10px',
                          }}
                        >
                          ⚠️ {resError}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={makeReservation}
                          disabled={resLoading}
                          style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '10px',
                            border: 'none',
                            background:
                              'linear-gradient(135deg, #e11d48, #f97316)',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            opacity: resLoading ? 0.7 : 1,
                          }}
                        >
                          {resLoading ? 'Reserving...' : '🍽️ Confirm'}
                        </button>
                        <button
                          onClick={() => setShowReservation(false)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        const raw = localStorage.getItem('user')
                        if (!raw) {
                          navigate('/login')
                          return
                        }
                        setShowReservation(true)
                      }}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        border: 'none',
                        background:
                          'linear-gradient(135deg, #e11d48, #f97316)',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '1rem',
                        cursor: 'pointer',
                      }}
                    >
                      🍽️ Reserve a Table
                      {selectedPackage ? ` — ${selectedPackage.name}` : ''}
                    </button>
                  )}

                  {!isOwner &&
                    isLoggedIn() &&
                    currentUser?.id &&
                    currentUser?.role !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        navigate(
                          `/messages?listing_id=${listing.id}`
                          + `&user_id=${listing.owner_id}`
                          + `&name=${encodeURIComponent(
                            listing?.owner_name || 'Provider'
                          )}`
                        )
                      }}
                      style={{
                        width: '100%', padding: '11px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer', fontWeight: 600,
                        fontSize: '0.875rem', marginTop: '10px',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '6px',
                      }}
                    >
                      💬 Message Provider
                    </button>
                  )}

                  {isOwner && (
                    <button
                      onClick={() => navigate(`/edit-listing/${id}`)}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        marginTop: '10px',
                      }}
                    >
                      ✏️ Edit This Listing
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '14px',
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        marginBottom: '4px',
                      }}
                      >
                        Check-in
                      </label>
                      <input
                        type="date"
                        value={sidebarCheckIn}
                        min={today}
                        onChange={(e) => setSidebarCheckIn(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: '0.82rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        marginBottom: '4px',
                      }}
                      >
                        Check-out
                      </label>
                      <input
                        type="date"
                        value={sidebarCheckOut}
                        min={sidebarCheckIn || today}
                        onChange={(e) => setSidebarCheckOut(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: '0.82rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                  {['hotel', 'camping'].includes(
                    listing?.service_type
                  ) && sidebarNights > 0 && (
                    <div
                      data-room-selector="true"
                      style={{
                        marginTop: '20px',
                        marginBottom: '4px',
                      }}
                    >
                      {roomsLoading ? (
                        <div style={{
                          textAlign: 'center', padding: '20px',
                          color: 'var(--text-muted)',
                          fontSize: '0.875rem',
                        }}>
                          <div style={{
                            fontSize: '1.5rem',
                            marginBottom: '8px',
                          }}>
                            🛏️
                          </div>
                          Loading room options...
                        </div>
                      ) : rooms.length > 0 ? (
                        <RoomSelector
                          rooms={rooms}
                          selectedRoom={selectedRoom}
                          onSelectRoom={setSelectedRoom}
                          nights={sidebarNights || 1}
                          isMobile={isMobile}
                        />
                      ) : (
                        <div style={{
                          background: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-md)',
                          padding: '14px', marginBottom: '12px',
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                          textAlign: 'center',
                        }}>
                          🛏️ Standard room included
                          <div style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            marginTop: '3px',
                          }}>
                            Contact provider for room details
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ marginBottom: '14px' }}>
                    <CancellationPolicy
                      policy={listing?.cancellation_policy}
                      policyInfo={listing?.cancellation_policy_info}
                      compact={false}
                    />
                  </div>
                  {sidebarNights > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <PriceBreakdown
                        pricePerNight={effectivePrice}
                        nights={sidebarNights}
                        groupSize={1}
                        serviceType={listing?.service_type}
                        compact={false}
                      />
                    </div>
                  )}

                  {listing.service_type !== 'restaurant' && (
                    <div style={{ marginBottom: '14px' }}>
                      <button
                        type="button"
                        onClick={() =>
                          setShowCalendar((p) => !p)
                        }
                        style={{
                          width: '100%', padding: '9px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer', fontWeight: 600,
                          fontSize: '0.85rem', textAlign: 'left',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span>📅 Check Availability</span>
                        <span>{showCalendar ? '▲' : '▼'}</span>
                      </button>
                      {showCalendar && (
                        <div style={{
                          marginTop: '10px',
                          background: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                          padding: '14px'
                        }}>
                          <AvailabilityCalendar
                            listingId={parseInt(id, 10)}
                            mode="view"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <BookButton
                    listingId={id}
                    selectedRoom={selectedRoom}
                    ownerId={listing?.owner_id}
                    serviceType={listing?.service_type}
                    checkIn={sidebarCheckIn}
                    checkOut={sidebarCheckOut}
                    rooms={rooms}
                  />

                  {!isOwner &&
                    isLoggedIn() &&
                    currentUser?.id &&
                    currentUser?.role !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => {
                        navigate(
                          `/messages?listing_id=${listing.id}`
                          + `&user_id=${listing.owner_id}`
                          + `&name=${encodeURIComponent(
                            listing?.owner_name || 'Provider'
                          )}`
                        )
                      }}
                      style={{
                        width: '100%', padding: '11px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer', fontWeight: 600,
                        fontSize: '0.875rem', marginTop: '8px',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '6px',
                      }}
                    >
                      💬 Message Provider
                    </button>
                  )}

                  {isOwner && (
                    <button
                      onClick={() => navigate(`/edit-listing/${id}`)}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        marginTop: '8px',
                      }}
                    >
                      ✏️ Edit This Listing
                    </button>
                  )}
                </div>
              )}

              <p
                style={{
                  textAlign: 'center',
                  margin: '12px 0 0',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                }}
              >
                {listing.service_type === 'restaurant'
                  ? '🍽️ See cancellation policy above'
                  : '✅ Taxes & fees shown in price breakdown when dates selected'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <img
            src={
              activeImage.filename
                ? `http://127.0.0.1:8000/uploads/${activeImage.filename}`
                : activeImage.url
                  ? `http://127.0.0.1:8000${activeImage.url}`
                  : 'https://placehold.co/800x600/e5e7eb/9ca3af?text=Photo'
            }
            alt="Photo"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
            }}
          />
          <button
            onClick={() => setActiveImage(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              cursor: 'pointer',
              fontSize: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
    {pointsPopup && (
      <PointsEarnedPopup
        points={pointsPopup.points}
        description={pointsPopup.description}
        onClose={() => setPointsPopup(null)}
      />
    )}
    </>
  )
}
