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
  const [reviewMsg, setReviewMsg] = useState({ type: '', text: '' })

  const user = getUser()
  const isOwner = listing && user && listing.owner_id === user.id
  const isAdmin = getRole() === 'admin'

  useEffect(() => {
    fetchAll()
  }, [id])

  async function fetchAll() {
    setLoading(true)
    try {
      const [listingRes, reviewsRes, summaryRes] = await Promise.all([
        api.get(`/listings/${id}`),
        api.get(`/reviews/listing/${id}`),
        api.get(`/reviews/listing/${id}/summary`)
      ])
      setListing(listingRes.data)
      setReviews(reviewsRes.data)
      setSummary(summaryRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function submitReview(e) {
    e.preventDefault()
    if (rating === 0) {
      setReviewMsg({ type: 'error', text: 'Please select a star rating' })
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/reviews/listing/${id}`, { rating, comment })
      setReviewMsg({ type: 'success', text: '✅ Review submitted!' })
      setRating(0)
      setComment('')
      fetchAll()  // refresh reviews
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to submit review'
      setReviewMsg({ type: 'error', text: msg })
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteReview(reviewId) {
    if (!confirm('Delete your review?')) return
    try {
      await api.delete(`/reviews/${reviewId}`)
      fetchAll()
    } catch (err) {
      console.error(err)
    }
  }

  function renderStars(count, interactive = false) {
    return [1,2,3,4,5].map(i => (
      <span
        key={i}
        onClick={interactive ? () => setRating(i) : undefined}
        onMouseEnter={interactive ? () => setHoverRating(i) : undefined}
        onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
        style={{
          fontSize: interactive ? '1.8rem' : '1rem',
          cursor: interactive ? 'pointer' : 'default',
          color: i <= (interactive ? (hoverRating || rating) : count) 
                 ? '#f59e0b' : '#d1d5db',
          transition: 'color 0.1s',
          userSelect: 'none'
        }}
      >★</span>
    ))
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', 
                  color: 'var(--text-secondary)' }}>
      Loading listing...
    </div>
  )
  
  if (!listing) return (
    <div style={{ textAlign: 'center', padding: '80px',
                  color: 'var(--text-secondary)' }}>
      Listing not found.
    </div>
  )

  const badgeClass = {
    hotel: 'badge badge-hotel',
    tour: 'badge badge-tour',
    transport: 'badge badge-transport',
    activity: 'badge badge-activity'
  }[listing.service_type] || 'badge'

  return (
    <div className="page-container">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', 
                    gap: '32px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN */}
        <div>
          {/* Image */}
          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden',
                        marginBottom: '24px', boxShadow: 'var(--shadow-md)' }}>
            <img
              src={getImageUrl(listing.image_url)}
              alt={listing.title}
              onError={(e) => {
                e.target.onerror = null
                e.target.src = 'https://placehold.co/800x400/e5e7eb/9ca3af?text=GB+Tourism'
              }}
              style={{ width: '100%', height: '380px', objectFit: 'cover',
                       display: 'block' }}
            />
          </div>

          {/* Listing info */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', 
                          gap: '12px', marginBottom: '12px' }}>
              <span className={badgeClass}>
                {listing.service_type.charAt(0).toUpperCase() + 
                 listing.service_type.slice(1)}
              </span>
              {summary && summary.total_reviews > 0 && (
                <span style={{ color: 'var(--text-secondary)', 
                               fontSize: '0.875rem' }}>
                  ⭐ {summary.average_rating} · {summary.total_reviews} reviews
                </span>
              )}
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: '1.9rem',
                         fontWeight: '800', color: 'var(--text-primary)',
                         lineHeight: '1.2' }}>
              {listing.title}
            </h1>
            <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)',
                        display: 'flex', alignItems: 'center', gap: '4px' }}>
              📍 {listing.location}
            </p>
            {listing.description && (
              <p style={{ margin: '12px 0 0', color: 'var(--text-secondary)',
                          lineHeight: '1.7', fontSize: '0.95rem' }}>
                {listing.description}
              </p>
            )}
          </div>

          {/* Reviews list */}
          <div className="card">
            <h2 style={{ margin: '0 0 20px', fontSize: '1.25rem',
                         fontWeight: '700', color: 'var(--text-primary)' }}>
              Guest Reviews
              {reviews.length > 0 && (
                <span style={{ fontWeight: '400', fontSize: '0.9rem',
                               color: 'var(--text-secondary)', 
                               marginLeft: '8px' }}>
                  ({reviews.length})
                </span>
              )}
            </h2>

            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0',
                            color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
                  ✍️
                </div>
                <p style={{ margin: 0 }}>
                  No reviews yet. Be the first to review!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', 
                            gap: '20px' }}>
                {reviews.map(review => (
                  <div key={review.id} style={{
                    display: 'flex', gap: '14px',
                    paddingBottom: '20px',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%',
                      background: 'var(--accent)', color: 'white',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontWeight: '700',
                      fontSize: '1rem', flexShrink: 0
                    }}>
                      {review.reviewer_name.charAt(0).toUpperCase()}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', 
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '4px' }}>
                        <div>
                          <span style={{ fontWeight: '600',
                                         color: 'var(--text-primary)',
                                         fontSize: '0.95rem' }}>
                            {review.reviewer_name}
                          </span>
                          <span style={{ marginLeft: '10px',
                                         color: 'var(--text-muted)',
                                         fontSize: '0.8rem' }}>
                            {new Date(review.created_at)
                              .toLocaleDateString('en-PK', {
                                year: 'numeric', month: 'short', 
                                day: 'numeric'
                              })}
                          </span>
                        </div>
                        {user && user.id === review.user_id && (
                          <button
                            onClick={() => deleteReview(review.id)}
                            style={{
                              background: 'none', border: 'none',
                              color: 'var(--danger)', cursor: 'pointer',
                              fontSize: '0.8rem', padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        {renderStars(review.rating)}
                      </div>
                      {review.comment && (
                        <p style={{ margin: 0, 
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.9rem', lineHeight: '1.6' }}>
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ position: 'sticky', top: '90px' }}>
          {/* Booking card */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '800',
                          color: 'var(--accent)', marginBottom: '4px' }}>
              PKR {listing.price_per_night?.toLocaleString('en-PK')}
              <span style={{ fontSize: '1rem', fontWeight: '400',
                             color: 'var(--text-secondary)' }}>
                {' '}/ night
              </span>
            </div>
            {summary && summary.total_reviews > 0 && (
              <div style={{ marginBottom: '16px',
                            color: 'var(--text-secondary)',
                            fontSize: '0.875rem' }}>
                ⭐ {summary.average_rating} · {summary.total_reviews} reviews
              </div>
            )}
            {!isOwner && !isAdmin && (
              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center',
                         padding: '14px', fontSize: '1rem' }}
                onClick={() => navigate(`/booking/${id}`)}
              >
                🗓️ Book Now
              </button>
            )}
            {isOwner && (
              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center',
                         background: 'var(--text-secondary)' }}
                onClick={() => navigate(`/edit-listing/${id}`)}
              >
                ✏️ Edit Listing
              </button>
            )}
          </div>

          {/* Rating summary card */}
          {summary && summary.total_reviews > 0 && (
            <div className="card" style={{ marginBottom: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '3rem', fontWeight: '800',
                              color: 'var(--text-primary)',
                              lineHeight: 1 }}>
                  {summary.average_rating}
                </div>
                <div style={{ margin: '6px 0' }}>
                  {renderStars(Math.round(summary.average_rating))}
                </div>
                <div style={{ color: 'var(--text-secondary)',
                              fontSize: '0.85rem' }}>
                  {summary.total_reviews} reviews
                </div>
              </div>
              {/* Rating bars */}
              {[5,4,3,2,1].map(star => {
                const count = summary.rating_breakdown[String(star)] || 0
                const pct = summary.total_reviews > 0
                  ? (count / summary.total_reviews) * 100 : 0
                return (
                  <div key={star} style={{ display: 'flex',
                                           alignItems: 'center',
                                           gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8rem', width: '20px',
                                   color: 'var(--text-secondary)',
                                   textAlign: 'right' }}>
                      {star}★
                    </span>
                    <div style={{ flex: 1, height: '8px',
                                  background: 'var(--border-color)',
                                  borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: '#f59e0b',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', width: '20px',
                                   color: 'var(--text-muted)' }}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Write review card */}
          {isLoggedIn() && !isOwner && !isAdmin && (
            <div className="card">
              <h3 style={{ margin: '0 0 16px', fontSize: '1rem',
                           fontWeight: '700', color: 'var(--text-primary)' }}>
                ✍️ Write a Review
              </h3>
              <form onSubmit={submitReview}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem',
                                   fontWeight: '600', marginBottom: '6px',
                                   color: 'var(--text-secondary)' }}>
                    Your Rating
                  </label>
                  <div>{renderStars(rating, true)}</div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem',
                                   fontWeight: '600', marginBottom: '6px',
                                   color: 'var(--text-secondary)' }}>
                    Comment (optional)
                  </label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Share your experience..."
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>
                {reviewMsg.text && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                    marginBottom: '12px', fontSize: '0.875rem',
                    background: reviewMsg.type === 'success'
                      ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: reviewMsg.type === 'success'
                      ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {reviewMsg.text}
                  </div>
                )}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

