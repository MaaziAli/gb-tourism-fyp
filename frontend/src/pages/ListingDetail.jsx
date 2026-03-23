import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'
import { getUser, getRole, isLoggedIn } from '../utils/role'
import useWindowSize from '../hooks/useWindowSize'
import WishlistButton from '../components/WishlistButton'
import AvailabilityCalendar from '../components/AvailabilityCalendar'
import PointsEarnedPopup from '../components/PointsEarnedPopup'
import PriceBreakdown from '../components/PriceBreakdown'
import CancellationPolicy from '../components/CancellationPolicy'
import UrgencyBanner from '../components/UrgencyBanner'
import RoomSelector from '../components/RoomSelector'
import PhotoGallery from '../components/PhotoGallery'

const SERVICE_LABELS = {
  hotel: '🏨 Hotel',
  tour: '🏔️ Tour',
  transport: '🚐 Transport',
  activity: '🎯 Activity',
  restaurant: '🍽️ Restaurant',
  car_rental: '🚗 Car Rental',
  bike_rental: '🚲 Bike Rental',
  jeep_safari: '🚙 Jeep Safari',
  boat_trip: '🚢 Boat Trip',
  horse_riding: '🐴 Horse Riding',
  medical: '🏥 Medical',
  guide: '🧭 Guide',
  camping: '🏕️ Camping',
}

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
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryActiveImg, setGalleryActiveImg] = useState(null)
  const [listingImages, setListingImages] = useState([])
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
        setListingImages(imgRes.data || [])
      } catch (e) {
        console.error('Image load error:', e)
        setExtraImages([])
        setListingImages([])
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

  const effectivePrice = selectedRoom
    ? selectedRoom.price_per_night
    : listing?.price_per_night || 0
  const checkIn = sidebarCheckIn
  const checkOut = sidebarCheckOut
  const nights = sidebarNights
  const setCheckIn = setSidebarCheckIn
  const setCheckOut = setSidebarCheckOut
  const totalGuests =
    listing?.capacity ||
    selectedRoom?.capacity || 2

  const highlights = [
    listing?.service_type && {
      icon: '🏨',
      label: SERVICE_LABELS[
        listing.service_type
      ] || listing.service_type,
      sub: 'Service type'
    },
    listing?.location && {
      icon: '📍',
      label: listing.location,
      sub: 'Location'
    },
    selectedRoom?.capacity && {
      icon: '👥',
      label: `Up to ${selectedRoom.capacity} guests`,
      sub: 'Capacity'
    },
    listing?.cancellation_policy && {
      icon: {
        flexible: '✅',
        moderate: '⚠️',
        strict: '❌'
      }[listing.cancellation_policy] || '⚠️',
      label: (
        listing.cancellation_policy
          .charAt(0).toUpperCase() +
        listing.cancellation_policy.slice(1)
      ) + ' cancellation',
      sub: 'Policy'
    }
  ].filter(Boolean)

  const avgRating = reviews.length > 0
    ? (reviews.reduce(
        (s, r) => s + (r.rating || 0), 0
      ) / reviews.length).toFixed(1)
    : 0

  const subRatingKeys = [
    { key: 'cleanliness_rating',
      label: 'Cleanliness' },
    { key: 'location_rating',
      label: 'Location' },
    { key: 'value_rating',
      label: 'Value' },
    { key: 'staff_rating',
      label: 'Staff' },
    { key: 'facilities_rating',
      label: 'Facilities' },
  ]

  const avgSubRatings = subRatingKeys.map(s => {
    const vals = reviews
      .map(r => r[s.key] || 0)
      .filter(v => v > 0)
    return {
      ...s,
      avg: vals.length > 0
        ? (vals.reduce((a,b) => a+b, 0) /
           vals.length).toFixed(1)
        : 0
    }
  })

  function handleBookNow() {
    if (['hotel','camping'].includes(
      listing?.service_type
    ) && rooms.length > 0 && !selectedRoom) {
      document.querySelector(
        '[data-room-selector]'
      )?.scrollIntoView({
        behavior: 'smooth', block: 'center'
      })
      return
    }

    const params = new URLSearchParams({
      checkIn: checkIn || '',
      checkOut: checkOut || '',
    })
    if (selectedRoom) {
      params.set('roomTypeId',
        String(selectedRoom.id))
      params.set('roomName', selectedRoom.name)
      params.set('roomPrice',
        String(selectedRoom.price_per_night))
      params.set('room_type_id', String(selectedRoom.id))
      params.set('room_name', selectedRoom.name)
    }
    navigate(
      `/booking/${listing.id}?${params.toString()}`
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        padding: '12px 16px',
        position: 'sticky', top: '58px',
        zIndex: 50,
        display: 'flex', alignItems: 'center',
        gap: '12px'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'var(--bg-secondary)',
            border: 'none', borderRadius: '8px',
            padding: '7px 12px', cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontWeight: 600, fontSize: '0.85rem',
            flexShrink: 0
          }}
        >
          ← Back
        </button>

        <div style={{flex: 1, minWidth: 0}}>
          <h1 style={{
            margin: 0, fontSize: isMobile
              ? '1rem' : '1.2rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {listing?.title}
          </h1>
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: '8px', marginTop: '2px',
            flexWrap: 'wrap'
          }}>
            {avgRating > 0 && (
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 700, color: '#d97706'
              }}>
                ⭐ {avgRating}
                <span style={{
                  color: 'var(--text-muted)',
                  fontWeight: 400,
                  marginLeft: '3px'
                }}>
                  ({reviews.length} reviews)
                </span>
              </span>
            )}
            {listing?.is_featured && (
              <span style={{
                background: '#fef3c7',
                color: '#d97706', fontSize: '0.72rem',
                fontWeight: 700, padding: '1px 7px',
                borderRadius: '999px'
              }}>
                ⭐ Featured
              </span>
            )}
            <span style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)'
            }}>
              📍 {listing?.location}
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex', gap: '8px',
          flexShrink: 0, alignItems: 'center'
        }}>
          <WishlistButton listingId={parseInt(id, 10)} />
          <button
            onClick={() => navigate(
              `/messages?listing_id=${listing?.id}`
              + `&user_id=${listing?.owner_id}`
            )}
            style={{
              background: 'var(--bg-secondary)',
              border:
                '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '7px 12px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '0.82rem', fontWeight: 600
            }}
          >
            💬
          </button>
        </div>
      </div>

      <div style={{
        maxWidth: '1100px', margin: '0 auto',
        padding: isMobile ? '0' : '16px 16px 0'
      }}>
        <PhotoGallery
          mainImage={listing?.image_url}
          extraImages={listingImages || []}
          title={listing?.title}
          isMobile={isMobile}
          onViewAll={() => setGalleryOpen(true)}
        />
      </div>

      <div style={{
        maxWidth: '1100px', margin: '0 auto',
        padding: '0 16px 80px',
        display: 'grid',
        gridTemplateColumns: isMobile
          ? '1fr'
          : '1fr 360px',
        gap: '32px', alignItems: 'start',
        paddingTop: '24px'
      }}>
        <div>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '24px',
            marginBottom: '20px'
          }}>
            <h2 style={{
              margin: '0 0 12px', fontSize: '1.1rem',
              fontWeight: 700,
              color: 'var(--text-primary)'
            }}>
              About this stay
            </h2>
            <p style={{
              margin: '0 0 20px',
              color: 'var(--text-secondary)',
              lineHeight: 1.7, fontSize: '0.9rem'
            }}>
              {listing?.description ||
                'Contact the provider for more details about this service.'
              }
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {highlights.map((h, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '10px',
                  alignItems: 'flex-start',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '10px'
                }}>
                  <span style={{
                    fontSize: '1.3rem', flexShrink: 0
                  }}>
                    {h.icon}
                  </span>
                  <div>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: 'var(--text-primary)'
                    }}>
                      {h.label}
                    </div>
                    <div style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)'
                    }}>
                      {h.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {listing?.cancellation_policy_info && (
            <div style={{marginBottom: '20px'}}>
              <CancellationPolicy
                policy={listing.cancellation_policy}
                policyInfo={
                  listing.cancellation_policy_info
                }
                compact={false}
              />
            </div>
          )}

          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2 style={{
                margin: 0, fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center', gap: '8px'
              }}>
                ⭐ Reviews
                {avgRating > 0 && (
                  <span style={{
                    background: '#fef3c7',
                    color: '#d97706',
                    padding: '2px 10px',
                    borderRadius: '999px',
                    fontSize: '0.85rem'
                  }}>
                    {avgRating} / 5
                  </span>
                )}
              </h2>
              <span style={{
                fontSize: '0.82rem',
                color: 'var(--text-muted)'
              }}>
                {reviews.length} review
                {reviews.length !== 1 ? 's' : ''}
              </span>
            </div>

            {avgRating > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns:
                  isMobile ? '1fr'
                  : 'repeat(2, 1fr)',
                gap: '10px', marginBottom: '20px'
              }}>
                {avgSubRatings
                  .filter(s => s.avg > 0)
                  .map(s => (
                  <div key={s.key}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      marginBottom: '4px'
                    }}>
                      <span style={{
                        color: 'var(--text-secondary)'
                      }}>
                        {s.label}
                      </span>
                      <span style={{
                        fontWeight: 700,
                        color: 'var(--text-primary)'
                      }}>
                        {s.avg}
                      </span>
                    </div>
                    <div style={{
                      height: '6px',
                      background: 'var(--border-color)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${
                          (parseFloat(s.avg)/5)*100
                        }%`,
                        height: '100%',
                        background: '#f59e0b',
                        borderRadius: '3px'
                      }}/>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reviews.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '32px',
                color: 'var(--text-muted)'
              }}>
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '8px'
                }}>
                  💬
                </div>
                No reviews yet. Book and be the first!
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column', gap: '14px'
              }}>
                {reviews.map((review, i) => (
                  <div key={review.id || i} style={{
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '10px',
                    border:
                      '1px solid var(--border-color)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div style={{
                          width: 36, height: 36,
                          borderRadius: '50%',
                          background: '#dbeafe',
                          color: '#1d4ed8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.875rem'
                        }}>
                          {(review.reviewer_name ||
                            'G').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            color: 'var(--text-primary)'
                          }}>
                            {review.reviewer_name
                              || 'Guest'}
                          </div>
                          <div style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)'
                          }}>
                            {review.created_at
                              ? new Date(
                                  review.created_at
                                ).toLocaleDateString(
                                  'en-PK', {
                                    month: 'long',
                                    year: 'numeric'
                                  }
                                )
                              : ''
                            }
                          </div>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{
                          background: '#16a34a',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          fontWeight: 700
                        }}>
                          ★ {review.rating}
                        </span>
                      </div>
                    </div>

                    {review.comment && (
                      <p style={{
                        margin: '0 0 10px',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6
                      }}>
                        {review.comment}
                      </p>
                    )}

                    {(review.cleanliness_rating > 0 ||
                      review.location_rating > 0) && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(2, 1fr)',
                        gap: '6px', marginBottom: '10px'
                      }}>
                        {subRatingKeys
                          .filter(s =>
                            (review[s.key] || 0) > 0
                          )
                          .map(s => (
                          <div key={s.key}
                            style={{fontSize: '0.7rem'}}
                          >
                            <div style={{
                              display: 'flex',
                              justifyContent:
                                'space-between',
                              marginBottom: '2px',
                              color: 'var(--text-muted)'
                            }}>
                              <span>{s.label}</span>
                              <span style={{
                                fontWeight: 600
                              }}>
                                {review[s.key]}
                              </span>
                            </div>
                            <div style={{
                              height: '3px',
                              background:
                                'var(--border-color)',
                              borderRadius: '2px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${
                                  (review[s.key]/5)*100
                                }%`,
                                height: '100%',
                                background: '#f59e0b'
                              }}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {review.provider_reply && (
                      <div style={{
                        background: 'var(--accent-light)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        borderLeft:
                          '3px solid var(--accent)'
                      }}>
                        <div style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--accent)',
                          marginBottom: '4px'
                        }}>
                          🏨 Response from provider
                        </div>
                        <p style={{
                          margin: 0,
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.5
                        }}>
                          {review.provider_reply}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{
          position: isMobile ? 'relative' : 'sticky',
          top: isMobile ? 'auto' : '130px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              background:
                'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
              padding: '20px'
            }}>
              <div style={{
                fontSize: '1.8rem', fontWeight: 900,
                color: 'white', lineHeight: 1
              }}>
                PKR {(effectivePrice || 0)
                  .toLocaleString('en-PK')}
                <span style={{
                  fontSize: '0.82rem',
                  fontWeight: 400, marginLeft: '4px',
                  opacity: 0.75
                }}>
                  / night
                </span>
              </div>

              {selectedRoom && (
                <div style={{
                  marginTop: '6px', display: 'flex',
                  alignItems: 'center', gap: '6px'
                }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white', fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontWeight: 600
                  }}>
                    🛏️ {selectedRoom.name}
                  </span>
                  {selectedRoom.capacity && (
                    <span style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.72rem'
                    }}>
                      · {selectedRoom.capacity} guests
                    </span>
                  )}
                </div>
              )}

              {listing?.urgency && (
                <div style={{
                  marginTop: '8px',
                  background: 'rgba(220,38,38,0.9)',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  color: 'white', fontWeight: 700
                }}>
                  🔥 {listing.urgency}
                </div>
              )}
            </div>

            <div style={{padding: '20px'}}>
              <UrgencyBanner roomsLeft={listing?.rooms_available} />
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px', marginBottom: '14px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.72rem', fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}>
                    Check-in
                  </label>
                  <input type="date"
                    value={checkIn}
                    min={new Date()
                      .toISOString().split('T')[0]}
                    onChange={e =>
                      setCheckIn(e.target.value)
                    }
                    style={{
                      width: '100%',
                      padding: '9px 8px',
                      borderRadius: '8px',
                      border:
                        '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.72rem', fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}>
                    Check-out
                  </label>
                  <input type="date"
                    value={checkOut}
                    min={checkIn ||
                      new Date().toISOString()
                        .split('T')[0]}
                    onChange={e =>
                      setCheckOut(e.target.value)
                    }
                    style={{
                      width: '100%',
                      padding: '9px 8px',
                      borderRadius: '8px',
                      border:
                        '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>

              {nights > 0 && (
                <div style={{
                  textAlign: 'center',
                  marginBottom: '14px',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-secondary)',
                  padding: '7px', borderRadius: '8px'
                }}>
                  🌙 {nights} night{nights > 1
                    ? 's' : ''} selected
                </div>
              )}

              {['hotel','camping'].includes(
                listing?.service_type
              ) && (
                <div style={{marginBottom: '14px'}}
                  data-room-selector="true"
                >
                  {roomsLoading ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '16px',
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem'
                    }}>
                      🛏️ Loading rooms...
                    </div>
                  ) : rooms.length > 0 ? (
                    <RoomSelector
                      rooms={rooms}
                      selectedRoom={selectedRoom}
                      onSelectRoom={setSelectedRoom}
                      nights={nights || 1}
                      isMobile={true}
                    />
                  ) : null}
                </div>
              )}

              {nights > 0 && (
                <div style={{marginBottom: '14px'}}>
                  <PriceBreakdown
                    pricePerNight={effectivePrice}
                    nights={nights}
                    groupSize={1}
                    serviceType={
                      listing?.service_type
                    }
                    compact={true}
                  />
                </div>
              )}

              <button
                onClick={handleBookNow}
                disabled={
                  !checkIn || !checkOut ||
                  checkOut <= checkIn ||
                  (['hotel','camping'].includes(
                    listing?.service_type
                  ) && rooms.length > 0 &&
                  !selectedRoom)
                }
                style={{
                  width: '100%', padding: '14px',
                  borderRadius: '12px', border: 'none',
                  background:
                    'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                  color: 'white', fontWeight: 800,
                  fontSize: '1rem', cursor: 'pointer',
                  opacity: (!checkIn || !checkOut)
                    ? 0.6 : 1,
                  marginBottom: '8px',
                  transition: 'opacity 0.2s'
                }}
              >
                {!checkIn || !checkOut
                  ? '📅 Select Dates First'
                  : `🏨 Book Now`
                }
              </button>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px'
              }}>
                <button
                  onClick={() => navigate(
                    `/messages?listing_id=${listing?.id}`
                    + `&user_id=${listing?.owner_id}`
                    + `&name=${encodeURIComponent(
                      listing?.title || 'Provider'
                    )}`
                  )}
                  style={{
                    padding: '9px',
                    borderRadius: '8px',
                    border:
                      '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer', fontWeight: 600,
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  💬 Ask Provider
                </button>
                <button
                  onClick={() =>
                    navigate(
                      `/group-booking/${listing?.id}`
                    )
                  }
                  style={{
                    padding: '9px',
                    borderRadius: '8px',
                    border:
                      '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer', fontWeight: 600,
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  👥 Group Book
                </button>
              </div>

              <div style={{
                marginTop: '12px',
                display: 'flex', gap: '8px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {[
                  '🔒 Secure payment',
                  '✅ Instant confirm',
                  '🎫 E-Voucher'
                ].map((badge, i) => (
                  <span key={i} style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)'
                  }}>
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {galleryOpen && (
        <div
          onClick={() => setGalleryOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 9999, display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '85vh',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            <img
              src={getImageUrl(
                galleryActiveImg ||
                listing?.image_url
              )}
              alt={listing?.title}
              onError={e => {
                e.target.onerror = null
                e.target.src =
                  'https://placehold.co/800x500/1e3a5f/ffffff?text=Photo'
              }}
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>
          <button
            onClick={() => setGalleryOpen(false)}
            style={{
              position: 'fixed',
              top: '20px', right: '20px',
              background: 'rgba(255,255,255,0.15)',
              border: 'none', color: 'white',
              borderRadius: '50%',
              width: 40, height: 40,
              cursor: 'pointer', fontSize: '1.2rem',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center'
            }}
          >×</button>
        </div>
      )}
    </div>
  )
}
