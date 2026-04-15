import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import { getUser, getRole, isLoggedIn } from '../utils/role'
import useWindowSize from '../hooks/useWindowSize'
import WishlistButton from '../components/WishlistButton'
import AvailabilityCalendar from '../components/AvailabilityCalendar'
import PointsEarnedPopup from '../components/PointsEarnedPopup'
import PriceBreakdown from '../components/PriceBreakdown'
import CancellationPolicy from '../components/CancellationPolicy'
import UrgencyBanner from '../components/UrgencyBanner'
import { getAmenityInfo } from '../utils/amenities'

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
        '[data-rooms-section="true"]'
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
  const [searchParams] = useSearchParams()
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
  const [heroImg, setHeroImg] = useState(null)
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
  const [sidebarCheckIn, setSidebarCheckIn] = useState(searchParams.get('checkIn') || '')
  const [sidebarCheckOut, setSidebarCheckOut] = useState(searchParams.get('checkOut') || '')
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)

  // ── Availability polling state ──
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [availabilityWarning, setAvailabilityWarning] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const pollIntervalRef = useRef(null)

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

  // ── Check availability against the blocked-dates endpoint ──
  const checkAvailability = useCallback(async (checkInDate, checkOutDate) => {
    const ci = checkInDate || sidebarCheckIn
    const co = checkOutDate || sidebarCheckOut
    if (!ci || !co) return
    setCheckingAvailability(true)
    try {
      const res = await api.get(`/availability/${id}/range`, {
        params: { months_ahead: 3 },
      })
      const blockedDates = res.data || []
      // Walk every date in [checkIn, checkOut) and look for a blocked one
      let isUnavailable = false
      const cursor = new Date(ci)
      const end = new Date(co)
      while (cursor < end) {
        if (blockedDates.includes(cursor.toISOString().split('T')[0])) {
          isUnavailable = true
          break
        }
        cursor.setDate(cursor.getDate() + 1)
      }
      if (isUnavailable) {
        setAvailabilityWarning(
          '⚠️ The selected dates are no longer available. Please choose different dates.'
        )
      } else {
        setAvailabilityWarning(null)
        // Refresh room availability for hotels/camping
        if (listing?.service_type &&
            ['hotel', 'camping', 'resort'].includes(listing.service_type)) {
          const params = new URLSearchParams({ check_in: ci, check_out: co })
          api.get(`/rooms/hotel/${id}/availability?${params.toString()}`)
            .then(r => {
              const roomData = r.data || []
              setRooms(roomData)
              if (selectedRoom) {
                const updated = roomData.find(rm => rm.id === selectedRoom.id)
                if (updated && updated.available_rooms <= 0) setSelectedRoom(null)
                else if (updated) setSelectedRoom(updated)
              }
            })
            .catch(() => {})
        }
      }
    } catch (e) {
      console.error('Availability check failed:', e)
    } finally {
      setCheckingAvailability(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, sidebarCheckIn, sidebarCheckOut, listing?.service_type, selectedRoom?.id])

  // ── Auto-poll every 30 s when both dates are selected ──
  useEffect(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    if (!sidebarCheckIn || !sidebarCheckOut || !autoRefresh) return
    pollIntervalRef.current = setInterval(() => {
      checkAvailability(sidebarCheckIn, sidebarCheckOut)
    }, 30000)
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [sidebarCheckIn, sidebarCheckOut, autoRefresh, checkAvailability])

  // Reset warning when dates change so stale warnings don't linger
  useEffect(() => {
    setAvailabilityWarning(null)
  }, [sidebarCheckIn, sidebarCheckOut])

  useEffect(() => {
    fetchAll()
  }, [id])

  // Re-fetch room availability when dates change
  useEffect(() => {
    if (!listing || !['hotel', 'camping', 'resort'].includes(listing.service_type)) return
    if (!sidebarCheckIn || !sidebarCheckOut) return
    setRoomsLoading(true)
    const params = new URLSearchParams({
      check_in: sidebarCheckIn,
      check_out: sidebarCheckOut,
    })
    api.get(`/rooms/hotel/${id}/availability?${params.toString()}`)
      .then(res => {
        const roomData = res.data || []
        setRooms(roomData)
        // If currently selected room is now unavailable, clear selection
        if (selectedRoom) {
          const updated = roomData.find(r => r.id === selectedRoom.id)
          if (updated && updated.available_rooms <= 0) setSelectedRoom(null)
          else if (updated) setSelectedRoom(updated)
        }
      })
      .catch(() => {})
      .finally(() => setRoomsLoading(false))
  }, [sidebarCheckIn, sidebarCheckOut, listing?.id])

  async function fetchAll() {
    setLoading(true)
    try {
      const listingId = parseInt(id, 10)
      const [lRes, rRes, sRes] = await Promise.all([
        api.get(`/listings/${id}`),
        api.get(`/reviews/listing/${id}`),
        api.get(`/reviews/listing/${id}/summary`),
      ])
      setListing(lRes.data)
      setReviews(rRes.data)
      setSummary(sRes.data)

      // Load gallery images
      api.get(`/listing-images/${listingId}`)
        .then(r => setListingImages(r.data || []))
        .catch(() => setListingImages([]))

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
          const rtRes = await api.get(`/rooms/hotel/${id}`)
          const roomData = rtRes.data || []
          setRooms(roomData)
          const firstAvailable = roomData.find(
            (rm) => rm.available_rooms > 0
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

  // Computed: effective price from selected room
  const effectivePrice = selectedRoom
    ? selectedRoom.price_per_night
    : (listing?.price_per_night || 0)

  const checkIn = sidebarCheckIn
  const checkOut = sidebarCheckOut
  const setCheckIn = setSidebarCheckIn
  const setCheckOut = setSidebarCheckOut

  // Computed: average rating
  const avgRating = reviews.length > 0
    ? (
        reviews.reduce(
          (sum, r) => sum + (r.rating || 0), 0
        ) / reviews.length
      ).toFixed(1)
    : null

  // Computed: nights between dates
  const nights = (() => {
    if (!checkIn || !checkOut) return 0
    try {
      const d = (new Date(checkOut) -
                 new Date(checkIn)) /
                 (1000 * 60 * 60 * 24)
      return d > 0 ? d : 0
    } catch { return 0 }
  })()

  const CANCEL_EMOJI = {
    flexible: '✅',
    moderate: '⚠️',
    strict: '❌'
  }

  const highlights = [
    listing?.service_type && {
      icon: '🏷️',
      label: (listing.service_type
        .charAt(0).toUpperCase() +
        listing.service_type.slice(1))
        .replace('_', ' '),
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
      icon: CANCEL_EMOJI[
        listing.cancellation_policy
      ] || '⚠️',
      label: (
        listing.cancellation_policy
          .charAt(0).toUpperCase() +
        listing.cancellation_policy.slice(1)
      ) + ' cancellation',
      sub: 'Policy'
    }
  ].filter(Boolean)

  const SUB_RATING_KEYS = [
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

  const avgSubRatings = SUB_RATING_KEYS.map(s => {
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

  const allGalleryImages = (() => {
    const imgs = []
    if (listing && listing.image_url) {
      imgs.push(listing.image_url)
    }
    if (Array.isArray(listingImages)) {
      listingImages.forEach(img => {
        const url = img && img.image_url
          ? img.image_url
          : img
        if (url && typeof url === 'string' && !imgs.includes(url)) {
          imgs.push(url)
        }
      })
    }
    return imgs
  })()

  function handleBookNow() {
    if (['hotel','camping'].includes(
      listing?.service_type
    ) && rooms.length > 0 && !selectedRoom) {
      document.querySelector(
        '[data-rooms-section]'
      )?.scrollIntoView({
        behavior: 'smooth', block: 'center'
      })
      return
    }

    const params = new URLSearchParams()
    if (checkIn) params.set('checkIn', checkIn)
    if (checkOut) params.set('checkOut', checkOut)
    if (selectedRoom) {
      params.set('roomTypeId',
        String(selectedRoom.id))
      params.set('roomName', selectedRoom.name)
      params.set('roomPrice',
        String(selectedRoom.price_per_night))
    }
    navigate(
      `/booking/${listing.id}?${params.toString()}`
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      width: '100%',
      overflowX: 'hidden'
    }}>
      {/* Spinner keyframe for availability check button */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {/* HERO — full viewport width */}
      <div style={{
        width: '100%',
        position: 'relative',
        height: isMobile ? '260px' : '460px',
        overflow: 'hidden',
        background: '#1e3a5f',
        flexShrink: '0'
      }}>
        <img
          src={
            heroImg
              ? (heroImg.startsWith('http')
                  ? heroImg
                  : 'http://127.0.0.1:8000/uploads/' + heroImg)
              : listing
              ? (listing.image_url
                  ? (listing.image_url.startsWith('http')
                      ? listing.image_url
                      : 'http://127.0.0.1:8000/uploads/' + listing.image_url)
                  : 'https://placehold.co/1200x460/1e3a5f/ffffff?text=GB+Tourism')
              : 'https://placehold.co/1200x460/1e3a5f/ffffff?text=GB+Tourism'
          }
          alt={listing ? listing.title : 'Hotel'}
          onError={e => {
            e.target.onerror = null
            e.target.src = 'https://placehold.co/1200x460/1e3a5f/ffffff?text=GB+Tourism'
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            position: 'absolute',
            top: '0',
            left: '0'
          }}
        />

        <div style={{
          position: 'absolute',
          inset: '0',
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)',
          pointerEvents: 'none'
        }}/>

        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            background: 'rgba(0,0,0,0.45)',
            border: 'none',
            color: 'white',
            borderRadius: '8px',
            padding: '7px 14px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.85rem',
            zIndex: '10'
          }}
        >
          ← Back
        </button>

        {allGalleryImages.length > 1 ? (
          <button
            onClick={() => setGalleryOpen(true)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontWeight: '600',
              zIndex: '10'
            }}
          >
            Photos ({allGalleryImages.length})
          </button>
        ) : null}

        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          padding: isMobile ? '16px' : '24px 32px',
          zIndex: '5'
        }}>
          {listing ? (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '6px'
              }}>
                <span style={{
                  background: '#0ea5e9',
                  color: 'white',
                  padding: '2px 9px',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontWeight: '700'
                }}>
                  {(listing.service_type || '').replace(/_/g, ' ')}
                </span>
                {listing.is_featured ? (
                  <span style={{
                    background: '#f59e0b',
                    color: 'white',
                    padding: '2px 9px',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: '700'
                  }}>
                    Featured
                  </span>
                ) : null}
              </div>
              <h1 style={{
                margin: '0 0 6px 0',
                fontSize: isMobile ? '1.4rem' : '2rem',
                fontWeight: '900',
                color: 'white',
                lineHeight: '1.25',
                textShadow: '0 2px 8px rgba(0,0,0,0.4)'
              }}>
                {listing.title}
              </h1>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '0.9rem'
                }}>
                  {listing.location}
                </span>
                {avgRating ? (
                  <span style={{
                    background: '#16a34a',
                    color: 'white',
                    padding: '2px 9px',
                    borderRadius: '5px',
                    fontSize: '0.82rem',
                    fontWeight: '700'
                  }}>
                    {avgRating} / 5
                    <span style={{
                      fontWeight: '400',
                      opacity: '0.85',
                      marginLeft: '5px',
                      fontSize: '0.75rem'
                    }}>
                      ({reviews.length})
                    </span>
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Thumbnail strip */}
      {allGalleryImages.length > 1 ? (
        <div style={{
          width: '100%',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          padding: '8px 16px',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          flexShrink: '0'
        }}>
          {allGalleryImages.map((img, idx) => {
            const src = img.startsWith('http')
              ? img
              : 'http://127.0.0.1:8000/uploads/' + img
            const isActive = (heroImg || allGalleryImages[0]) === img
            return (
              <div
                key={idx}
                onClick={() => setHeroImg(img)}
                style={{
                  width: '72px',
                  height: '50px',
                  flexShrink: '0',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: isActive ? '2px solid #0ea5e9' : '2px solid transparent',
                  opacity: isActive ? '1' : '0.65',
                  transition: 'all 0.15s'
                }}
              >
                <img
                  src={src}
                  alt={'Photo ' + (idx + 1)}
                  onError={e => {
                    e.target.onerror = null
                    e.target.src = 'https://placehold.co/72x50/e5e7eb/9ca3af?text=Photo'
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>
            )
          })}
        </div>
      ) : null}

      <div style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '16px 12px' : '24px 24px',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 360px',
        gap: isMobile ? '20px' : '28px',
        alignItems: 'start',
        boxSizing: 'border-box'
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

            {/* Amenities grid */}
            {listing?.amenities_list?.length > 0 && (
              <div style={{marginTop: '20px'}}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  ✨ Amenities & Facilities
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '8px'
                }}>
                  {listing?.amenities_list?.map(key => {
                    const info = getAmenityInfo(key)
                    return (
                      <div key={key} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <span style={{fontSize: '1rem'}}>
                          {info.icon}
                        </span>
                        <span style={{fontWeight: 500}}>
                          {info.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
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

            {/* ── CHOOSE YOUR ROOM SECTION ── */}
            {['hotel', 'camping'].includes(
              listing?.service_type
            ) && (
              <div
                data-rooms-section="true"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  padding: '24px',
                  marginBottom: '16px'
                }}
              >
                <h2 style={{
                  margin: '0 0 4px',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)'
                }}>
                  🛏️ Choose Your Room
                </h2>
                <p style={{
                  margin: '0 0 16px',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)'
                }}>
                  {checkIn && checkOut
                    ? `Available for ${nights} night${nights > 1 ? 's' : ''} · ${checkIn} → ${checkOut}`
                    : 'Select dates in the booking panel to check availability'}
                </p>

                {roomsLoading ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '32px',
                    color: 'var(--text-muted)'
                  }}>
                    <div style={{
                      fontSize: '2rem',
                      marginBottom: '8px'
                    }}>
                      🛏️
                    </div>
                    Loading available rooms...
                  </div>
                ) : rooms.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '24px',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                    borderRadius: '10px'
                  }}>
                    <div style={{fontSize: '1.5rem'}}>
                      🏨
                    </div>
                    <p style={{
                      margin: '8px 0 0',
                      fontSize: '0.85rem'
                    }}>
                      Standard room available.
                      Contact provider for details.
                    </p>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {rooms.map(room => {
                      const isSelected =
                        selectedRoom?.id === room.id
                      const isUnavailable =
                        room.available_rooms === 0

                      const amenityList = (() => {
                        if (!room.amenities) return []
                        if (Array.isArray(room.amenities)) return room.amenities
                        try {
                          const p = JSON.parse(room.amenities)
                          return Array.isArray(p) ? p : []
                        } catch {
                          return String(room.amenities)
                            .split(',')
                            .map(s => s.trim())
                            .filter(Boolean)
                        }
                      })()

                      return (
                        <div
                          key={room.id}
                          style={{
                            borderRadius: '10px',
                            border: isSelected
                              ? '2px solid #0ea5e9'
                              : '1px solid var(--border-color)',
                            background: isSelected ? '#f0f9ff' : 'var(--bg-card)',
                            overflow: 'hidden',
                            boxShadow: isSelected ? '0 0 0 3px #bae6fd' : 'none',
                            transition: 'all 0.15s',
                            cursor: isUnavailable ? 'not-allowed' : 'pointer',
                            opacity: isUnavailable ? '0.5' : '1',
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            alignItems: 'stretch'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'stretch',
                            flexDirection: isMobile ? 'column' : 'row',
                            width: '100%'
                          }}>
                            {/* Room image */}
                            <div style={{
                              width: isMobile ? '100%' : '150px',
                              minHeight: '110px',
                              flexShrink: '0',
                              background: '#dbeafe',
                              overflow: 'hidden',
                              position: 'relative',
                              borderRadius: isMobile ? '10px 10px 0 0' : '10px 0 0 10px'
                            }}>
                              <img
                                src={
                                  room.image_url
                                    ? (room.image_url.startsWith('http')
                                        ? room.image_url
                                        : 'http://127.0.0.1:8000/uploads/' + room.image_url)
                                    : 'https://placehold.co/140x100/dbeafe/1d4ed8?text=' + encodeURIComponent(room.name || 'Room')
                                }
                                alt={room.name || 'Room'}
                                onError={e => {
                                  e.target.onerror = null
                                  e.target.src = 'https://placehold.co/140x100/dbeafe/1d4ed8?text=Room'
                                }}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  display: 'block',
                                  minHeight: '110px'
                                }}
                              />
                              {isSelected && (
                                <div style={{
                                  position: 'absolute',
                                  top: '8px', right: '8px',
                                  width: 24, height: 24,
                                  borderRadius: '50%',
                                  background: '#0ea5e9',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.75rem',
                                  fontWeight: 800
                                }}>
                                  ✓
                                </div>
                              )}
                            </div>

                            {/* Room details */}
                            <div style={{
                              flex: 1,
                              padding: '14px 16px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}>
                              <div>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  marginBottom: '4px',
                                  flexWrap: 'wrap'
                                }}>
                                  <h4 style={{
                                    margin: 0,
                                    fontSize: '0.95rem',
                                    fontWeight: 700,
                                    color: isSelected
                                      ? '#0369a1'
                                      : 'var(--text-primary)'
                                  }}>
                                    {room.name}
                                  </h4>
                                  {room.bed_type && (
                                    <span style={{
                                      fontSize: '0.68rem',
                                      background: '#f3f4f6',
                                      color: '#6b7280',
                                      padding: '2px 7px',
                                      borderRadius: '999px'
                                    }}>
                                      🛏️ {room.bed_type}
                                    </span>
                                  )}
                                  {room.capacity && (
                                    <span style={{
                                      fontSize: '0.68rem',
                                      background: '#f3f4f6',
                                      color: '#6b7280',
                                      padding: '2px 7px',
                                      borderRadius: '999px'
                                    }}>
                                      👥 {room.capacity} guests
                                    </span>
                                  )}
                                </div>

                                {room.description && (
                                  <p style={{
                                    margin: '0 0 6px',
                                    fontSize: '0.78rem',
                                    color: 'var(--text-secondary)',
                                    lineHeight: 1.5
                                  }}>
                                    {room.description}
                                  </p>
                                )}

                                {/* Amenity tags */}
                                {amenityList.length > 0 && (
                                  <div style={{
                                    display: 'flex',
                                    gap: '4px',
                                    flexWrap: 'wrap'
                                  }}>
                                    {amenityList
                                      .slice(0, 4)
                                      .map((a, i) => (
                                        <span
                                          key={i}
                                          style={{
                                            fontSize: '0.68rem',
                                            background: isSelected
                                              ? '#e0f2fe'
                                              : 'var(--bg-secondary)',
                                            color: isSelected
                                              ? '#0369a1'
                                              : 'var(--text-muted)',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            border: '1px solid',
                                            borderColor: isSelected
                                              ? '#bae6fd'
                                              : 'var(--border-color)'
                                          }}
                                        >
                                          {a}
                                        </span>
                                      ))}
                                  </div>
                                )}
                              </div>

                              {/* Price + button row */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-end',
                                marginTop: '10px',
                                paddingTop: '10px',
                                borderTop:
                                  '1px solid var(--border-color)'
                              }}>
                                <div>
                                  {room.available_rooms > 0 &&
                                   room.available_rooms <= 3 && (
                                    <div style={{
                                      fontSize: '0.72rem',
                                      color: '#dc2626',
                                      fontWeight: 700,
                                      marginBottom: '3px'
                                    }}>
                                      🔥 Only{' '}
                                      {room.available_rooms} left!
                                    </div>
                                  )}
                                  <div style={{
                                    fontSize: '1.2rem',
                                    fontWeight: 800,
                                    color: isSelected
                                      ? '#0369a1'
                                      : '#0ea5e9',
                                    lineHeight: 1
                                  }}>
                                    PKR{' '}
                                    {room.price_per_night
                                      ?.toLocaleString('en-PK')}
                                    <span style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 400,
                                      color: 'var(--text-muted)',
                                      marginLeft: '3px'
                                    }}>
                                      /night
                                    </span>
                                  </div>
                                  {nights > 0 && (
                                    <div style={{
                                      fontSize: '0.72rem',
                                      color: 'var(--text-muted)'
                                    }}>
                                      PKR{' '}
                                      {(
                                        room.price_per_night *
                                        nights
                                      ).toLocaleString('en-PK')}
                                      {' '}total
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() => {
                                    if (!isUnavailable) {
                                      setSelectedRoom(
                                        isSelected
                                          ? null
                                          : room
                                      )
                                    }
                                  }}
                                  disabled={isUnavailable}
                                  style={{
                                    padding: '8px 18px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: isSelected
                                      ? '#0ea5e9'
                                      : 'var(--bg-secondary)',
                                    color: isSelected
                                      ? 'white'
                                      : 'var(--text-secondary)',
                                    fontWeight: 700,
                                    cursor: isUnavailable
                                      ? 'not-allowed'
                                      : 'pointer',
                                    fontSize: '0.82rem',
                                    border: isSelected
                                      ? 'none'
                                      : '1px solid var(--border-color)',
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  {isUnavailable
                                    ? 'Unavailable'
                                    : isSelected
                                      ? '✓ Selected'
                                      : 'Select Room'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

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
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
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
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '6px', marginBottom: '10px'
                      }}>
                        {SUB_RATING_KEYS
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
                              background: 'var(--border-color)',
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
          top: isMobile ? 'auto' : '80px',
          width: '100%',
          alignSelf: 'start'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            width: '100%'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
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

              {/* ── Availability check button + auto-refresh toggle ── */}
              {checkIn && checkOut && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    display: 'flex', gap: '8px', alignItems: 'center'
                  }}>
                    <button
                      onClick={() =>
                        checkAvailability(checkIn, checkOut)
                      }
                      disabled={checkingAvailability}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: checkingAvailability
                          ? 'var(--bg-secondary)'
                          : 'var(--bg-card)',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: checkingAvailability
                          ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        transition: 'all 0.15s',
                      }}
                    >
                      {checkingAvailability ? (
                        <>
                          <span style={{
                            display: 'inline-block',
                            animation: 'spin 1s linear infinite',
                            fontSize: '0.85rem'
                          }}>⏳</span>
                          Checking...
                        </>
                      ) : (
                        <>🔄 Check Availability</>
                      )}
                    </button>
                    {/* Auto-refresh toggle */}
                    <button
                      title={
                        autoRefresh
                          ? 'Auto-refresh ON — click to disable'
                          : 'Auto-refresh OFF — click to enable'
                      }
                      onClick={() => setAutoRefresh(v => !v)}
                      style={{
                        flexShrink: 0,
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: autoRefresh
                          ? '#dcfce7'
                          : 'var(--bg-secondary)',
                        color: autoRefresh ? '#16a34a' : 'var(--text-muted)',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {autoRefresh ? '● Auto' : '○ Auto'}
                    </button>
                  </div>

                  {/* Availability warning / success */}
                  {availabilityWarning ? (
                    <div style={{
                      marginTop: '8px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      lineHeight: 1.4,
                    }}>
                      {availabilityWarning}
                    </div>
                  ) : checkIn && checkOut && !checkingAvailability ? (
                    <div style={{
                      marginTop: '8px',
                      background: '#dcfce7',
                      color: '#16a34a',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      ✅ Selected dates are available
                    </div>
                  ) : null}
                </div>
              )}

              {/* Selected room summary in sidebar */}
              {['hotel','camping'].includes(
                listing?.service_type
              ) && (
                <div style={{
                  marginBottom: '12px',
                  padding: '10px 12px',
                  background: selectedRoom
                    ? '#f0f9ff'
                    : 'var(--bg-secondary)',
                  borderRadius: '10px',
                  border: selectedRoom
                    ? '1px solid #bae6fd'
                    : '1px solid var(--border-color)'
                }}>
                  {selectedRoom ? (
                    <div>
                      <div style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#0369a1',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '4px'
                      }}>
                        Selected Room
                      </div>
                      <div style={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: '#0369a1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        🛏️ {selectedRoom.name}
                      </div>
                      {selectedRoom.bed_type && (
                        <div style={{
                          fontSize: '0.72rem',
                          color: '#0ea5e9',
                          marginTop: '2px'
                        }}>
                          {selectedRoom.bed_type}
                          {selectedRoom.capacity
                            ? ` · ${selectedRoom.capacity} guests`
                            : ''}
                        </div>
                      )}
                      <button
                        onClick={() => {
                          document
                            .querySelector(
                              '[data-rooms-section]'
                            )
                            ?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'center'
                            })
                        }}
                        style={{
                          marginTop: '6px',
                          fontSize: '0.72rem',
                          color: '#0ea5e9',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          fontWeight: 600
                        }}
                      >
                        Change room ↓
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)'
                    }}>
                      <div>🛏️</div>
                      <div style={{marginTop: '4px'}}>
                        Select a room below
                      </div>
                      <button
                        onClick={() => {
                          document
                            .querySelector(
                              '[data-rooms-section]'
                            )
                            ?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'center'
                            })
                        }}
                        style={{
                          marginTop: '6px',
                          fontSize: '0.72rem',
                          color: '#0ea5e9',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        View rooms ↓
                      </button>
                    </div>
                  )}
                </div>
              )}

              {nights > 0 ? (
                <div style={{marginBottom: '14px'}}>
                  <PriceBreakdown
                    pricePerNight={effectivePrice}
                    nights={nights}
                    groupSize={1}
                    serviceType={
                      listing?.service_type
                    }
                    couponDiscount={couponDiscount || 0}
                    compact={true}
                  />
                </div>
              ) : null}

              {/* Coupon input */}
              <div style={{marginBottom: '12px'}}>
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Promo Code
                </div>
                <div style={{
                  display: 'flex',
                  gap: '6px'
                }}>
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode || ''}
                    onChange={e => setCouponCode
                      ? setCouponCode(e.target.value.toUpperCase())
                      : null}
                    style={{
                      flex: '1',
                      padding: '9px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      fontFamily: 'var(--font-primary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  />
                  <button
                    onClick={() => {
                      if (couponCode && listing) {
                        api.post('/coupons/validate', {
                          code: couponCode,
                          listing_id: listing.id,
                          listing_owner_id: listing.owner_id,
                          booking_amount: effectivePrice * (nights || 1)
                        })
                        .then(r => {
                          setCouponDiscount
                            ? setCouponDiscount(r.data.discount_amount || 0)
                            : null
                          setCouponApplied
                            ? setCouponApplied(true)
                            : null
                        })
                        .catch(() => {
                          setCouponDiscount
                            ? setCouponDiscount(0)
                            : null
                          setCouponApplied
                            ? setCouponApplied(false)
                            : null
                        })
                      }
                    }}
                    style={{
                      padding: '9px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#0ea5e9',
                      color: 'white',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Apply
                  </button>
                </div>
                {couponApplied && couponDiscount > 0 ? (
                  <div style={{
                    marginTop: '5px',
                    fontSize: '0.75rem',
                    color: '#16a34a',
                    fontWeight: '700'
                  }}>
                    Coupon applied! Saving PKR {couponDiscount.toLocaleString('en-PK')}
                  </div>
                ) : null}
              </div>

              <button
                onClick={handleBookNow}
                disabled={
                  !checkIn ||
                  !checkOut ||
                  checkOut <= checkIn ||
                  !!availabilityWarning ||
                  (
                    ['hotel', 'camping'].includes(
                      listing ? listing.service_type : ''
                    ) &&
                    rooms.length > 0 &&
                    !selectedRoom
                  )
                }
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  background: (
                    !checkIn ||
                    !checkOut ||
                    checkOut <= checkIn ||
                    !!availabilityWarning
                  )
                    ? 'var(--bg-secondary)'
                    : 'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
                  color: (
                    !checkIn ||
                    !checkOut ||
                    checkOut <= checkIn ||
                    !!availabilityWarning
                  ) ? 'var(--text-muted)' : 'white',
                  fontWeight: '800',
                  fontSize: '1rem',
                  cursor: (
                    !checkIn ||
                    !checkOut ||
                    checkOut <= checkIn ||
                    !!availabilityWarning
                  ) ? 'not-allowed' : 'pointer',
                  marginBottom: '8px',
                  letterSpacing: '0.01em',
                  transition: 'all 0.2s'
                }}
              >
                {!checkIn
                  ? 'Select Check-in Date'
                  : !checkOut
                  ? 'Select Check-out Date'
                  : availabilityWarning
                  ? '⚠️ Dates Unavailable'
                  : (
                      ['hotel', 'camping'].includes(
                        listing ? listing.service_type : ''
                      ) &&
                      rooms.length > 0 &&
                      !selectedRoom
                    )
                  ? 'Select a Room First'
                  : nights > 0
                  ? 'Book Now — PKR ' + (
                      (effectivePrice * nights) -
                      (couponDiscount || 0)
                    ).toLocaleString('en-PK')
                  : 'Book Now'
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
              src={(() => {
                const raw =
                  galleryActiveImg ||
                  heroImg ||
                  listing?.image_url
                if (!raw) return ''
                return raw.startsWith('http')
                  ? raw
                  : `http://127.0.0.1:8000/uploads/${raw}`
              })()}
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
