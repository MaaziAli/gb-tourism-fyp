import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'
import { isLoggedIn, getUser, getRole } from '../utils/role'

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
            <div style={{fontSize:'1.8rem',fontWeight:800,
                          color:'var(--accent)',marginBottom:'4px'}}>
              PKR {listing.price_per_night?.toLocaleString('en-PK')}
              <span style={{fontSize:'1rem',fontWeight:400,
                             color:'var(--text.secondary)'}}> / night</span>
            </div>
            {summary?.total_reviews > 0 && (
              <p style={{color:'var(--text-secondary)',
                          fontSize:'0.875rem',margin:'0 0 16px'}}>
                ⭐ {summary.average_rating} · {summary.total_reviews} reviews
              </p>
            )}
            {!isOwner && !isAdmin && (
              <button className="btn-primary"
                style={{width:'100%',justifyContent:'center',
                        padding:'13px',fontSize:'1rem'}}
                onClick={()=>navigate(`/booking/${id}`)}>
                🗓️ Book Now
              </button>
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

