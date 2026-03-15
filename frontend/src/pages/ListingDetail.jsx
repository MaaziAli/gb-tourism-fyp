import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'
import { getUser, getRole, isLoggedIn } from '../utils/role'

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [reviews, setReviews] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [hasBooked, setHasBooked] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [hasUpcomingBooking, setHasUpcomingBooking] = useState(false)
  const [extraImages, setExtraImages] = useState([])
  const [activeImage, setActiveImage] = useState(null)
  const [roomTypes, setRoomTypes] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [diningPackages, setDiningPackages] = useState([])
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [showReservation, setShowReservation] = useState(false)
  const [resDate, setResDate] = useState('')
  const [resTime, setResTime] = useState('')
  const [resPersons, setResPersons] = useState(2)
  const [resSpecial, setResSpecial] = useState('')
  const [resLoading, setResLoading] = useState(false)
  const [resSuccess, setResSuccess] = useState(false)
  const [resError, setResError] = useState('')

  const currentUser = getUser()
  const isOwner = listing && currentUser && 
                 listing.owner_id === currentUser.id
  const isAdmin = getRole() === 'admin'

  useEffect(() => { fetchAll() }, [id])

  async function fetchAll() {
    setLoading(true)
    try {
      const [lRes, rRes, sRes] = await Promise.all([
        api.get(`/listings/${id}`),
        api.get(`/reviews/listing/${id}`),
        api.get(`/reviews/listing/${id}/summary`)
      ])
      setListing(lRes.data)
      setReviews(rRes.data)
      setSummary(sRes.data)

      // Fetch extra images separately
      try {
        const imgRes = await api.get(`/listing-images/${id}`)
        setExtraImages(imgRes.data || [])
      } catch (e) {
        setExtraImages([])
      }

      // Fetch room types
      try {
        const rtRes = await api.get(`/room-types/${id}`)
        setRoomTypes(rtRes.data || [])
        if (rtRes.data && rtRes.data.length > 0) {
          setSelectedRoom(rtRes.data[0])
        } else {
          setSelectedRoom(null)
        }
      } catch (e) {
        setRoomTypes([])
        setSelectedRoom(null)
      }

      if (lRes.data.service_type === 'restaurant') {
        try {
          const pkgRes = await api.get(`/dining/packages/${id}`)
          setDiningPackages(pkgRes.data || [])
        } catch (e) {
          setDiningPackages([])
        }
      }

      // Booking/review eligibility check
      if (isLoggedIn() && currentUser) {
        try {
          const bookingsRes = await api.get('/bookings/me')
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          const eligibleBooking = bookingsRes.data.find(b => {
            if (b.listing_id !== parseInt(id)) return false
            if (b.status === 'cancelled') return false
            if (!b.check_out) return false
            const checkOut = new Date(b.check_out)
            checkOut.setHours(0, 0, 0, 0)
            return checkOut < today
          })
          setHasBooked(!!eligibleBooking)

          const upcomingBooking = bookingsRes.data.find(b => {
            if (b.listing_id !== parseInt(id)) return false
            if (b.status === 'cancelled') return false
            if (!b.check_out) return false
            const checkOut = new Date(b.check_out)
            checkOut.setHours(0, 0, 0, 0)
            return checkOut >= today
          })
          setHasUpcomingBooking(!!upcomingBooking)

          const reviewed = rRes.data.some(
            r => r.user_id === currentUser.id
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
        listing_id: parseInt(id),
        package_id: selectedPackage?.id || null,
        reservation_date: resDate,
        reservation_time: resTime,
        persons: resPersons,
        special_requests: resSpecial || null
      })
      setResSuccess(true)
      setShowReservation(false)
    } catch (e) {
      setResError(
        e.response?.data?.detail || 'Reservation failed'
      )
    } finally {
      setResLoading(false)
    }
  }

  async function submitReview(e) {
    e.preventDefault()
    if (!rating) {
      setMsg({ type: 'error', text: 'Select a star rating' })
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/reviews/listing/${id}`, { rating, comment })
      setMsg({ type: 'success', text: '✅ Review submitted!' })
      setRating(0); setComment('')
      fetchAll()
    } catch(e) {
      setMsg({ type: 'error', 
               text: e.response?.data?.detail || 'Failed' })
    } finally { setSubmitting(false) }
  }

  async function deleteReview(rid) {
    if (!confirm('Delete your review?')) return
    try {
      await api.delete(`/reviews/${rid}`)
      fetchAll()
    } catch(e) { console.error(e) }
  }

  function Stars({ count, size = '1rem', interactive = false }) {
    return (
      <span>
        {[1,2,3,4,5].map(i => (
          <span key={i}
            onClick={interactive ? () => setRating(i) : undefined}
            onMouseEnter={interactive ? ()=>setHoverRating(i) : undefined}
            onMouseLeave={interactive ? ()=>setHoverRating(0) : undefined}
            style={{
              fontSize: size,
              cursor: interactive ? 'pointer' : 'default',
              color: i <= (interactive?(hoverRating||rating):count) 
                     ? '#f59e0b' : 'var(--border-color)',
              userSelect: 'none'
            }}>★</span>
        ))}
      </span>
    )
  }

  if (loading) return (
    <div className="page-container" 
         style={{textAlign:'center',paddingTop:'80px',
                 color:'var(--text-secondary)'}}>
      Loading...
    </div>
  )
  if (!listing) return (
    <div className="page-container"
         style={{textAlign:'center',paddingTop:'80px',
                 color:'var(--text-secondary)'}}>
      Listing not found.
    </div>
  )

  const badgeStyles = {
    hotel: { bg: '#dbeafe', color: '#1d4ed8', label: '🏨 Hotel' },
    tour: { bg: '#dcfce7', color: '#15803d', label: '🏔️ Tour' },
    transport: { bg: '#fef3c7', color: '#b45309', label: '🚐 Transport' },
    activity: { bg: '#f3e8ff', color: '#7e22ce', label: '🎯 Activity' },
    restaurant: { bg: '#fce7f3', color: '#e11d48', label: '🍽️ Restaurant' },
  }
  const { bg: bgc, color: tc, label: serviceLabel } =
    badgeStyles[listing.service_type] ||
    { bg: '#f3f4f6', color: '#374151', label: listing.service_type }

  return (
    <div className="page-container">
      {/* Back link */}
      <button onClick={() => navigate(-1)} style={{
        background:'none', border:'none', 
        color:'var(--text-secondary)', cursor:'pointer',
        fontSize:'0.9rem', marginBottom:'20px', padding:0,
        display:'flex', alignItems:'center', gap:'6px'
      }}>← Back to stays</button>

      <div style={{display:'grid',
                   gridTemplateColumns:'1fr 380px',
                   gap:'28px', alignItems:'start'}}>

        {/* LEFT */}
        <div>
          {/* Image */}
          <div style={{borderRadius:'var(--radius-md)',
                       overflow:'hidden', marginBottom:'20px',
                       boxShadow:'var(--shadow-md)'}}>
            <img
              src={getImageUrl(listing.image_url)}
              alt={listing.title}
              onError={e=>{e.target.onerror=null;
                e.target.src='https://placehold.co/800x400/e5e7eb/9ca3af?text=GB+Tourism'}}
              style={{width:'100%',height:'360px',
                      objectFit:'cover',display:'block'}}
            />
          </div>

          {extraImages.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3
                style={{
                  margin: '0 0 12px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                📸 Room & Facility Photos ({extraImages.length})
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                }}
              >
                {extraImages.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setActiveImage(img)}
                    style={{
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                  >
                    <img
                      src={`http://127.0.0.1:8000/uploads/${img.filename}`}
                      alt={img.caption || 'Room photo'}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src =
                          'https://placehold.co/300x200/e5e7eb/9ca3af?text=Photo'
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

          {/* Info card */}
          <div className="card" style={{marginBottom:'20px'}}>
            <div style={{display:'flex',gap:'10px',
                         alignItems:'center',marginBottom:'10px'}}>
              <span style={{background:bgc,color:tc,
                            padding:'3px 12px',borderRadius:'999px',
                            fontSize:'0.8rem',fontWeight:600}}>
                {serviceLabel}
              </span>
              {summary?.total_reviews > 0 && (
                <span style={{color:'var(--text-secondary)',
                               fontSize:'0.875rem'}}>
                  ⭐ {summary.average_rating} · {summary.total_reviews} reviews
                </span>
              )}
            </div>
            <h1 style={{margin:'0 0 8px',fontSize:'1.85rem',
                        fontWeight:800,color:'var(--text-primary)',
                        lineHeight:1.2}}>
              {listing.title}
            </h1>
            <p style={{margin:'0 0 8px',
                       color:'var(--text-secondary)',fontSize:'1rem'}}>
              📍 {listing.location}
            </p>
            {listing.description && (
              <p style={{margin:'12px 0 0',
                         color:'var(--text-secondary)',
                         lineHeight:1.7}}>
                {listing.description}
              </p>
            )}
          </div>

          {/* Reviews list */}
          <div className="card">
            <h2 style={{margin:'0 0 20px',fontSize:'1.2rem',
                        fontWeight:700,color:'var(--text-primary)'}}>
              ⭐ Guest Reviews
              {reviews.length > 0 && (
                <span style={{fontWeight:400,fontSize:'0.9rem',
                               color:'var(--text-secondary)',
                               marginLeft:'8px'}}>
                  ({reviews.length})
                </span>
              )}
            </h2>
            {reviews.length === 0 ? (
              <div style={{textAlign:'center',padding:'32px 0',
                            color:'var(--text-muted)'}}>
                <div style={{fontSize:'2.5rem'}}>✍️</div>
                <p>No reviews yet. Be the first!</p>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',
                           gap:'20px'}}>
                {reviews.map(r => (
                  <div key={r.id} style={{
                    display:'flex', gap:'14px',
                    paddingBottom:'20px',
                    borderBottom:'1px solid var(--border-color)'
                  }}>
                    <div style={{
                      width:42,height:42,borderRadius:'50%',
                      background:'var(--accent)',color:'white',
                      display:'flex',alignItems:'center',
                      justifyContent:'center',fontWeight:700,
                      fontSize:'1.1rem',flexShrink:0
                    }}>
                      {r.reviewer_name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',
                                   justifyContent:'space-between',
                                   marginBottom:'4px'}}>
                        <div>
                          <strong style={{color:'var(--text-primary)',
                                          fontSize:'0.95rem'}}>
                            {r.reviewer_name}
                          </strong>
                          <span style={{marginLeft:'10px',
                                         color:'var(--text-muted)',
                                         fontSize:'0.8rem'}}>
                            {new Date(r.created_at)
                              .toLocaleDateString('en-PK',{
                                year:'numeric',month:'short',
                                day:'numeric'})}
                          </span>
                        </div>
                        {currentUser?.id === r.user_id && (
                          <button onClick={()=>deleteReview(r.id)}
                            style={{background:'none',border:'none',
                                    color:'var(--danger)',cursor:'pointer',
                                    fontSize:'0.8rem'}}>
                            Delete
                          </button>
                        )}
                      </div>
                      <Stars count={r.rating} />
                      {r.comment && (
                        <p style={{margin:'6px 0 0',
                                   color:'var(--text-secondary)',
                                   fontSize:'0.9rem',lineHeight:1.6}}>
                          {r.comment}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review eligibility info messages */}
          {isLoggedIn() && !isOwner && !isAdmin &&
           !hasBooked && !hasUpcomingBooking && (
            <div style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              textAlign: 'center',
              marginTop: '16px'
            }}>
              🔒 Book this stay to leave a review
            </div>
          )}

          {isLoggedIn() && !isOwner && !isAdmin &&
           hasUpcomingBooking && !hasBooked && (
            <div style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              fontSize: '0.875rem',
              textAlign: 'center',
              marginTop: '16px'
            }}>
              ⏳ You can write a review after your check-out date
            </div>
          )}

          {isLoggedIn() && !isOwner && !isAdmin &&
           hasBooked && alreadyReviewed && (
            <div style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--success-bg)',
              color: 'var(--success)',
              fontSize: '0.875rem',
              textAlign: 'center',
              marginTop: '16px'
            }}>
              ✅ You have already reviewed this stay
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div style={{position:'sticky',top:'90px'}}>
          {/* Book card */}
          <div className="card" style={{marginBottom:'16px'}}>
            {/* Price */}
            <div style={{
              fontSize: '1.8rem', fontWeight: 800,
              color: 'var(--accent)', marginBottom: '4px'
            }}>
              PKR {(selectedRoom
                ? selectedRoom.price_per_night
                : listing.price_per_night
              )?.toLocaleString('en-PK')}
              <span style={{fontSize: '1rem', fontWeight: 400,
                             color: 'var(--text-secondary)'}}>
                {' '}{listing.service_type === 'restaurant' ? '/person' : '/night'}
              </span>
            </div>
            {summary?.total_reviews > 0 && (
              <p style={{color:'var(--text-secondary)',
                          fontSize:'0.875rem',margin:'0 0 16px'}}>
                ⭐ {summary.average_rating} · {summary.total_reviews} reviews
              </p>
            )}

            {listing.service_type === 'restaurant' ? (
              <div>
                {diningPackages.length > 0 && (
                  <div style={{marginBottom: '16px'}}>
                    <label style={{
                      display: 'block', fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Select Package
                    </label>
                    <div style={{
                      display: 'flex', flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div
                        onClick={() => setSelectedPackage(null)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: !selectedPackage
                            ? '2px solid var(--accent)'
                            : '1px solid var(--border-color)',
                          background: !selectedPackage
                            ? 'var(--accent-light)'
                            : 'var(--bg-secondary)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{
                          fontWeight: 600, fontSize: '0.85rem',
                          color: 'var(--text-primary)'
                        }}>
                          🍽️ Regular Dine-In
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)'
                        }}>
                          Standard table booking
                        </div>
                      </div>
                      {diningPackages.map(pkg => (
                        <div key={pkg.id}
                          onClick={() => setSelectedPackage(pkg)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border:
                              selectedPackage?.id === pkg.id
                                ? '2px solid var(--accent)'
                                : '1px solid var(--border-color)',
                            background:
                              selectedPackage?.id === pkg.id
                                ? 'var(--accent-light)'
                                : 'var(--bg-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{
                              fontWeight: 600, fontSize: '0.85rem',
                              color: 'var(--text-primary)'
                            }}>
                              {pkg.package_label} — {pkg.name}
                            </div>
                            <div style={{
                              fontWeight: 700, fontSize: '0.85rem',
                              color: 'var(--accent)'
                            }}>
                              PKR {pkg.price_per_person?.toLocaleString('en-PK')}
                              <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 400,
                                color: 'var(--text-muted)'
                              }}>
                                /person
                              </span>
                            </div>
                          </div>
                          {pkg.description && (
                            <div style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-secondary)',
                              marginTop: '2px'
                            }}>
                              {pkg.description}
                            </div>
                          )}
                          <div style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            marginTop: '2px'
                          }}>
                            {pkg.min_persons}-{pkg.max_persons} persons · {pkg.duration_hours}h
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {resSuccess ? (
                  <div style={{
                    background: '#dcfce7', color: '#16a34a',
                    padding: '14px', borderRadius: '10px',
                    textAlign: 'center', fontWeight: 700,
                    fontSize: '0.9rem'
                  }}>
                    ✅ Table Reserved Successfully!
                  </div>
                ) : showReservation ? (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px', marginBottom: '10px'
                    }}>
                      <div>
                        <label style={{
                          display: 'block', fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          marginBottom: '5px',
                          textTransform: 'uppercase'
                        }}>
                          Date
                        </label>
                        <input type="date"
                          value={resDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => setResDate(e.target.value)}
                          style={{
                            width: '100%', padding: '9px 10px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            boxSizing: 'border-box', outline: 'none',
                            fontFamily: 'var(--font-primary)'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{
                          display: 'block', fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          marginBottom: '5px',
                          textTransform: 'uppercase'
                        }}>
                          Time
                        </label>
                        <select
                          value={resTime}
                          onChange={e => setResTime(e.target.value)}
                          style={{
                            width: '100%', padding: '9px 10px',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="">Select time</option>
                          {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{marginBottom: '10px'}}>
                      <label style={{
                        display: 'block', fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        marginBottom: '5px',
                        textTransform: 'uppercase'
                      }}>
                        Number of Persons
                      </label>
                      <input type="number"
                        value={resPersons} min={1} max={50}
                        onChange={e => setResPersons(parseInt(e.target.value) || 1)}
                        style={{
                          width: '100%', padding: '9px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box', outline: 'none'
                        }}
                      />
                    </div>
                    {selectedPackage && (
                      <div style={{
                        background: 'var(--accent-light)',
                        borderRadius: '8px', padding: '10px 12px',
                        marginBottom: '10px', fontSize: '0.82rem',
                        color: 'var(--accent)', fontWeight: 700
                      }}>
                        Total: PKR {(selectedPackage.price_per_person * resPersons).toLocaleString('en-PK')}
                        {' '}({resPersons} × PKR {selectedPackage.price_per_person?.toLocaleString('en-PK')})
                      </div>
                    )}
                    <div style={{marginBottom: '10px'}}>
                      <label style={{
                        display: 'block', fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        marginBottom: '5px',
                        textTransform: 'uppercase'
                      }}>
                        Special Requests (optional)
                      </label>
                      <textarea
                        value={resSpecial}
                        onChange={e => setResSpecial(e.target.value)}
                        placeholder="Allergies, seating preference..."
                        rows={2}
                        style={{
                          width: '100%', padding: '9px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          fontSize: '0.82rem', resize: 'vertical',
                          boxSizing: 'border-box', outline: 'none',
                          fontFamily: 'var(--font-primary)'
                        }}
                      />
                    </div>
                    {resError && (
                      <div style={{
                        background: 'var(--danger-bg)',
                        color: 'var(--danger)', padding: '8px 12px',
                        borderRadius: '8px', marginBottom: '10px',
                        fontSize: '0.82rem', fontWeight: 600
                      }}>
                        ⚠️ {resError}
                      </div>
                    )}
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button
                        onClick={makeReservation}
                        disabled={resLoading}
                        style={{
                          flex: 1, padding: '12px',
                          borderRadius: '10px', border: 'none',
                          background: 'linear-gradient(135deg, #e11d48, #f43f5e)',
                          color: 'white', fontWeight: 700,
                          fontSize: '0.9rem', cursor: 'pointer',
                          opacity: resLoading ? 0.7 : 1
                        }}
                      >
                        {resLoading ? 'Reserving...' : '🍽️ Confirm Reservation'}
                      </button>
                      <button
                        onClick={() => setShowReservation(false)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer', fontWeight: 600
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const stored = localStorage.getItem('user')
                      if (!stored) {
                        navigate('/login')
                        return
                      }
                      setShowReservation(true)
                    }}
                    style={{
                      width: '100%', padding: '13px',
                      borderRadius: '12px', border: 'none',
                      background: 'linear-gradient(135deg, #e11d48, #f43f5e)',
                      color: 'white', fontWeight: 800,
                      fontSize: '1rem', cursor: 'pointer',
                      marginTop: '8px'
                    }}
                  >
                    🍽️ Reserve a Table
                    {selectedPackage ? ` — ${selectedPackage.name}` : ''}
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Room type selector */}
                {roomTypes.length > 0 && (
                  <div style={{marginBottom: '16px'}}>
                    <label style={{
                      display: 'block', fontSize: '0.8rem',
                      fontWeight: 600, color: 'var(--text-secondary)',
                      marginBottom: '8px'
                    }}>
                      Select Room Type
                    </label>
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: '8px'
                    }}>
                      {roomTypes.map((room) => (
                        <div key={room.id}
                          onClick={() => setSelectedRoom(room)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: selectedRoom?.id === room.id
                              ? '2px solid var(--accent)'
                              : '1px solid var(--border-color)',
                            background: selectedRoom?.id === room.id
                              ? 'var(--accent-light)'
                              : 'var(--bg-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span style={{
                              fontWeight: 700, fontSize: '0.875rem',
                              color: 'var(--text-primary)'
                            }}>
                              {room.name}
                            </span>
                            <span style={{
                              fontWeight: 700, fontSize: '0.875rem',
                              color: 'var(--accent)'
                            }}>
                              PKR {room.price_per_night?.toLocaleString('en-PK')}
                            </span>
                          </div>
                          <div style={{
                            fontSize: '0.75rem', color: 'var(--text-muted)',
                            marginTop: '2px'
                          }}>
                            👥 {room.capacity} guests
                            · 🏠 {room.total_rooms} room{room.total_rooms > 1 ? 's' : ''}
                            {room.description && ` · ${room.description}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <BookButton
                  listingId={id}
                  selectedRoom={selectedRoom}
                  ownerId={listing?.owner_id}
                />
              </>
            )}
            {isOwner && (
              <button className="btn-primary"
                style={{width:'100%',justifyContent:'center',
                        background:'var(--text-secondary)'}}
                onClick={()=>navigate(`/edit-listing/${id}`)}>
                ✏️ Edit Stay
              </button>
            )}
          </div>

          {/* Rating breakdown */}
          {summary?.total_reviews > 0 && (
            <div className="card" style={{marginBottom:'16px'}}>
              <div style={{textAlign:'center',marginBottom:'14px'}}>
                <div style={{fontSize:'2.8rem',fontWeight:800,
                              color:'var(--text-primary)',lineHeight:1}}>
                  {summary.average_rating}
                </div>
                <Stars count={Math.round(summary.average_rating)} 
                       size="1.3rem" />
                <div style={{color:'var(--text-secondary)',
                              fontSize:'0.85rem',marginTop:'4px'}}>
                  {summary.total_reviews} reviews
                </div>
              </div>
              {[5,4,3,2,1].map(star => {
                const count = summary.rating_breakdown[String(star)]||0
                const pct = summary.total_reviews > 0
                  ? (count/summary.total_reviews)*100 : 0
                return (
                  <div key={star} style={{display:'flex',
                                           alignItems:'center',
                                           gap:'8px',marginBottom:'6px'}}>
                    <span style={{fontSize:'0.8rem',width:'22px',
                                   color:'var(--text-secondary)',
                                   textAlign:'right'}}>
                      {star}★
                    </span>
                    <div style={{flex:1,height:'8px',
                                  background:'var(--border-color)',
                                  borderRadius:'4px',overflow:'hidden'}}>
                      <div style={{width:`${pct}%`,height:'100%',
                                    background:'#f59e0b',
                                    borderRadius:'4px',
                                    transition:'width 0.5s'}}/>
                    </div>
                    <span style={{fontSize:'0.8rem',width:'18px',
                                   color:'var(--text-muted)'}}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Write review */}
          {isLoggedIn() && !isOwner && !isAdmin &&
           hasBooked && !alreadyReviewed && (
            <div className="card">
              <h3 style={{margin:'0 0 14px',fontWeight:700,
                           fontSize:'1rem',
                           color:'var(--text-primary)'}}>
                ✍️ Write a Review
              </h3>
              <form onSubmit={submitReview}>
                <div style={{marginBottom:'12px'}}>
                  <label style={{display:'block',fontSize:'0.85rem',
                                  fontWeight:600,marginBottom:'6px',
                                  color:'var(--text-secondary)'}}>
                    Rating
                  </label>
                  <Stars count={rating} size="2rem" interactive />
                </div>
                <div style={{marginBottom:'12px'}}>
                  <label style={{display:'block',fontSize:'0.85rem',
                                  fontWeight:600,marginBottom:'6px',
                                  color:'var(--text-secondary)'}}>
                    Comment (optional)
                  </label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={comment}
                    onChange={e=>setComment(e.target.value)}
                    placeholder="Share your experience..."
                    style={{resize:'vertical',fontFamily:'inherit'}}
                  />
                </div>
                {msg.text && (
                  <div style={{
                    padding:'10px 14px',borderRadius:'var(--radius-sm)',
                    marginBottom:'12px',fontSize:'0.875rem',
                    background: msg.type==='success'
                      ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: msg.type==='success'
                      ? 'var(--success)' : 'var(--danger)'
                  }}>{msg.text}</div>
                )}
                <button type="submit" className="btn-primary"
                  disabled={submitting}
                  style={{width:'100%',justifyContent:'center'}}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}

          {!isLoggedIn() && (
            <div className="card" style={{textAlign:'center',
                                          color:'var(--text-secondary)'}}>
              <p style={{margin:'0 0 12px'}}>
                Login to write a review
              </p>
              <button className="btn-primary"
                style={{width:'100%',justifyContent:'center'}}
                onClick={()=>navigate('/login')}>
                Login
              </button>
            </div>
          )}
        </div>
      </div>
      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.88)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <img
            src={`http://127.0.0.1:8000/uploads/${activeImage.filename}`}
            alt={activeImage.caption || 'Room photo'}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '80vh',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            }}
          />
          <button
            onClick={() => setActiveImage(null)}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: 'none',
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
  )
}

function BookButton({ listingId, selectedRoom, ownerId }) {
  const raw = localStorage.getItem('user')

  // Not logged in — show login link
  if (!raw) {
    return (
      <a href="/login" style={{
        display: 'block', textAlign: 'center',
        background: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
        color: 'white', padding: '13px',
        borderRadius: '10px', textDecoration: 'none',
        fontWeight: 700, fontSize: '1rem', marginTop: '12px'
      }}>
        Login to Book
      </a>
    )
  }

  let user
  try { user = JSON.parse(raw) }
  catch(e) { return null }

  // Hide for admin
  if (user.role === 'admin') return null

  // Hide for listing owner
  if (ownerId && user.id === ownerId) return null

  const params = selectedRoom
    ? '?room_type_id=' + selectedRoom.id
      + '&room_name=' + encodeURIComponent(selectedRoom.name)
    : ''

  return (
    <a href={'/booking/' + listingId + params}
      style={{
        display: 'block', textAlign: 'center',
        background: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
        color: 'white', padding: '13px',
        borderRadius: '10px', textDecoration: 'none',
        fontWeight: 700, fontSize: '1rem', marginTop: '12px'
      }}
    >
      Book Now
      {selectedRoom ? ' - ' + selectedRoom.name : ''}
    </a>
  )
}

