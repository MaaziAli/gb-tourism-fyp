import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useWindowSize from '../hooks/useWindowSize'

const CATEGORIES = [
  'Music & Cultural Festival',
  'Polo & Horse Events',
  'Guided Trek & Expedition',
  'Art & Photography',
  'Local Festival & Fair',
  'Sports Event',
  'Food & Dining Event',
  'Community Gathering',
  'Horse Riding & Adventure',
  'Other',
]

const LOCATIONS = [
  'Gilgit',
  'Hunza',
  'Skardu',
  'Nagar',
  'Ghizer',
  'Diamer',
  'Astore',
  'Shigar',
  'Kharmang',
  'Fairy Meadows',
  'Naltar',
  'Other',
]

export default function CreateEvent() {
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdEvent, setCreatedEvent] = useState(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [venue, setVenue] = useState('')
  const [location, setLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [capacity, setCapacity] = useState(100)
  const [isFree, setIsFree] = useState(false)

  const [ticketTypes, setTicketTypes] = useState([
    { name: 'General Admission', description: '', price: 0, capacity: 100, is_free: true },
  ])
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  function addTicketType() {
    setTicketTypes((prev) => [
      ...prev,
      { name: 'General Admission', description: '', price: 0, capacity: 50, is_free: false },
    ])
  }

  function removeTicketType(idx) {
    setTicketTypes((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateTicket(idx, field, value) {
    setTicketTypes((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)))
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleCreate() {
    if (!title.trim()) {
      setError('Event title is required')
      return
    }
    if (!category) {
      setError('Please select a category')
      return
    }
    if (!venue.trim() || !location) {
      setError('Venue and location are required')
      return
    }
    if (!eventDate || !eventTime) {
      setError('Date and time are required')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/events/', {
        title,
        description,
        category,
        venue,
        location,
        event_date: eventDate,
        event_time: eventTime,
        end_time: endTime || null,
        total_capacity: parseInt(String(capacity), 10) || 100,
        is_free: isFree,
        ticket_types: ticketTypes.map((t) => ({
          name: t.name,
          description: t.description || null,
          price: parseFloat(t.price) || 0,
          capacity: parseInt(String(t.capacity), 10) || 50,
          is_free: t.is_free || Number(t.price) === 0,
        })),
      })
      setCreatedEvent(res.data)
      setStep(3)
    } catch (e) {
      const d = e.response?.data?.detail
      setError(typeof d === 'string' ? d : 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  async function uploadImage() {
    if (!image || !createdEvent) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', image)
      await api.post(`/events/${createdEvent.id}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate(`/events/${createdEvent.id}`)
    } catch (e) {
      console.error(e)
      navigate(`/events/${createdEvent.id}`)
    } finally {
      setUploading(false)
    }
  }

  function StepIndicator() {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 28,
          flexWrap: 'wrap',
        }}
      >
        {[
          { n: 1, label: 'Event Info' },
          { n: 2, label: 'Tickets' },
          { n: 3, label: 'Photo' },
        ].map((s, i, arr) => (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.875rem',
                background: step >= s.n ? '#7c3aed' : 'var(--bg-secondary)',
                color: step >= s.n ? 'white' : 'var(--text-muted)',
                border: step === s.n ? '2px solid #7c3aed' : 'none',
              }}
            >
              {step > s.n ? '✓' : s.n}
            </div>
            {!isMobile && (
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: step >= s.n ? '#7c3aed' : 'var(--text-muted)',
                }}
              >
                {s.label}
              </span>
            )}
            {i < arr.length - 1 && (
              <div
                style={{
                  width: isMobile ? 24 : 40,
                  height: 2,
                  background: step > s.n ? '#7c3aed' : 'var(--border-color)',
                }}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 8,
    border: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
    outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 48 }}>
      <div style={{ background: 'linear-gradient(135deg, #4c1d95, #7c3aed)', padding: '32px 16px 80px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <button
            type="button"
            onClick={() => navigate('/my-events')}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              borderRadius: 8,
              padding: '7px 16px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            ← My Events
          </button>
          <h1 style={{ color: 'white', margin: '0 0 6px', fontSize: '1.8rem', fontWeight: 800 }}>
            🎪 Create New Event
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: '0.9rem' }}>
            Host your event on GB Tourism
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '-56px auto 0', padding: '0 16px' }}>
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md)',
            padding: isMobile ? '20px 16px' : 32,
          }}
        >
          <StepIndicator />
          {error && (
            <div
              style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 20,
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {step === 1 && (
            <div>
              <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                📋 Event Information
              </h3>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Event Title *
                </label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Annual Shandur Polo Festival" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Event Category *
                </label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                  <option value="">Select category...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: 14,
                  marginBottom: 16,
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                    Venue Name *
                  </label>
                  <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Shandur Polo Ground" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                    City / District *
                  </label>
                  <select value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle}>
                    <option value="">Select location</option>
                    {LOCATIONS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
                  gap: 14,
                  marginBottom: 16,
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                    Event Date *
                  </label>
                  <input type="date" value={eventDate} min={today} onChange={(e) => setEventDate(e.target.value)} style={{ ...inputStyle, fontFamily: 'var(--font-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                    Start Time *
                  </label>
                  <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} style={{ ...inputStyle, fontFamily: 'var(--font-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                    End Time
                  </label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ ...inputStyle, fontFamily: 'var(--font-primary)' }} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Total Capacity
                </label>
                <input
                  type="number"
                  value={capacity}
                  min={1}
                  onChange={(e) => setCapacity(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell attendees about this event..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-primary)' }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 24,
                  padding: '14px 16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 10,
                  border: isFree ? '2px solid #16a34a' : '1px solid var(--border-color)',
                }}
              >
                <div
                  role="switch"
                  tabIndex={0}
                  aria-checked={isFree}
                  onClick={() => setIsFree((p) => !p)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsFree((p) => !p)}
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    background: isFree ? '#16a34a' : 'var(--border-color)',
                    position: 'relative',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 3,
                      left: isFree ? 23 : 3,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: 'white',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isFree ? '#16a34a' : 'var(--text-primary)' }}>🎟️ Free Event</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No ticket price, open for everyone</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  width: '100%',
                  padding: 13,
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                Next: Set Up Tickets →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>🎟️ Ticket Types</h3>
              <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Create different ticket tiers for your event
              </p>
              {ticketTypes.map((ticket, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>🎟️ Ticket {idx + 1}</span>
                    {ticketTypes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTicketType(idx)}
                        style={{
                          background: 'var(--danger-bg)',
                          color: 'var(--danger)',
                          border: 'none',
                          borderRadius: 6,
                          padding: '4px 10px',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                      gap: 10,
                    }}
                  >
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
                        Ticket Name *
                      </label>
                      <select
                        value={ticket.name}
                        onChange={(e) => updateTicket(idx, 'name', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 10px',
                          borderRadius: 8,
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem',
                        }}
                      >
                        <option value="General Admission">General Admission</option>
                        <option value="VIP">VIP</option>
                        <option value="Early Bird">Early Bird</option>
                        <option value="Student">Student</option>
                        <option value="VVIP">VVIP</option>
                        <option value="Free Entry">Free Entry</option>
                        <option value="Group (5+)">Group (5+)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
                        Price (PKR) — 0 = Free
                      </label>
                      <input
                        type="number"
                        value={ticket.price}
                        min={0}
                        disabled={isFree}
                        onChange={(e) => updateTicket(idx, 'price', parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          padding: '9px 10px',
                          borderRadius: 8,
                          border: '1px solid var(--border-color)',
                          background: isFree ? 'var(--border-color)' : 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
                        Available Seats
                      </label>
                      <input
                        type="number"
                        value={ticket.capacity}
                        min={1}
                        onChange={(e) => updateTicket(idx, 'capacity', parseInt(e.target.value, 10) || 1)}
                        style={{
                          width: '100%',
                          padding: '9px 10px',
                          borderRadius: 8,
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
                        Description (optional)
                      </label>
                      <input
                        type="text"
                        value={ticket.description || ''}
                        placeholder="e.g. Includes VIP lounge"
                        onChange={(e) => updateTicket(idx, 'description', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 10px',
                          borderRadius: 8,
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addTicketType}
                style={{
                  width: '100%',
                  padding: 11,
                  borderRadius: 10,
                  border: '2px dashed #7c3aed',
                  background: '#f5f3ff',
                  color: '#7c3aed',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  marginBottom: 20,
                }}
              >
                + Add Another Ticket Type
              </button>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: 12,
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: loading ? 0.7 : 1,
                    fontSize: '0.95rem',
                  }}
                >
                  {loading ? '✨ Creating...' : 'Create Event →'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && createdEvent && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Event Created!</h3>
              <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Add a cover photo to attract more attendees
              </p>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt=""
                  style={{
                    width: '100%',
                    maxHeight: 220,
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 16,
                    display: 'block',
                  }}
                />
              )}
              <label
                style={{
                  display: 'block',
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: 24,
                  cursor: 'pointer',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-muted)',
                  marginBottom: 16,
                  fontSize: '0.875rem',
                }}
              >
                {image ? `✅ ${image.name}` : '📸 Click to upload event cover photo'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {image && (
                  <button
                    type="button"
                    onClick={uploadImage}
                    disabled={uploading}
                    style={{
                      flex: 1,
                      minWidth: 160,
                      padding: 12,
                      borderRadius: 10,
                      border: 'none',
                      background: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
                      color: 'white',
                      fontWeight: 700,
                      cursor: 'pointer',
                      opacity: uploading ? 0.7 : 1,
                    }}
                  >
                    {uploading ? 'Uploading...' : '📸 Upload & View Event'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate(`/events/${createdEvent.id}`)}
                  style={{
                    flex: 1,
                    minWidth: 160,
                    padding: 12,
                    borderRadius: 10,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Skip & View Event →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
