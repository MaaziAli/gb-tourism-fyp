/**
 * HotelRooms — Provider page to manage rooms for a specific hotel.
 * Route: /hotel/:hotelId/rooms
 *
 * Features:
 *  - List all room types
 *  - Add new room (modal form)
 *  - Edit existing room
 *  - Delete room
 *  - Update availability count
 */
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'

const AMENITY_OPTIONS = [
  'WiFi', 'Air Conditioning', 'TV', 'Mini Fridge', 'En-suite Bathroom',
  'Balcony', 'Mountain View', 'River View', 'Heater', 'Hot Water',
  'Room Service', 'Safe', 'Hair Dryer', 'Iron', 'Coffee Maker',
]

const ROOM_TYPES = ['Single', 'Double', 'Twin', 'Triple', 'Suite', 'Deluxe', 'Family', 'Penthouse']

function RoomModal({ room, hotelId, onClose, onSaved }) {
  const isEdit = Boolean(room?.id)
  const [form, setForm] = useState({
    room_type:      room?.room_type  || room?.name || '',
    description:    room?.description   || '',
    price_per_night: room?.price_per_night || '',
    capacity:       room?.capacity      || 2,
    bed_type:       room?.bed_type      || '',
    total_rooms:    room?.total_rooms   || 1,
    available_rooms: room?.available_rooms ?? room?.total_rooms ?? 1,
    amenities:      room?.amenities     || [],
  })
  const [imageFile, setImageFile]   = useState(null)
  const [preview, setPreview]       = useState(room?.image_url ? `http://localhost:8000/uploads/${room.image_url}` : null)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const fileRef = useRef()

  function toggleAmenity(a) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(a)
        ? f.amenities.filter(x => x !== a)
        : [...f.amenities, a],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('room_type',      form.room_type)
      fd.append('description',    form.description)
      fd.append('price_per_night', parseFloat(form.price_per_night))
      fd.append('capacity',       parseInt(form.capacity))
      fd.append('bed_type',       form.bed_type)
      fd.append('total_rooms',    parseInt(form.total_rooms))
      fd.append('available_rooms', parseInt(form.available_rooms))
      fd.append('amenities',      JSON.stringify(form.amenities))
      if (imageFile) fd.append('image', imageFile)

      if (isEdit) {
        await api.put(`/rooms/${room.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        await api.post(`/rooms/hotel/${hotelId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      onSaved()
      onClose()
    } catch (e) {
      setError(e.response?.data?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: '0.9rem',
    boxSizing: 'border-box', outline: 'none',
  }
  const labelStyle = {
    display: 'block', fontSize: '0.78rem', fontWeight: 700,
    color: 'var(--text-secondary)', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: '0.04em',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)', width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1,
        }}>
          <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit Room' : 'Add New Room'}
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '1.4rem',
            cursor: 'pointer', color: 'var(--text-muted)',
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {error && (
            <div style={{
              background: 'var(--danger-bg)', color: 'var(--danger)',
              padding: '10px 14px', borderRadius: 8, marginBottom: 16,
              fontSize: '0.85rem', fontWeight: 600,
            }}>⚠️ {error}</div>
          )}

          {/* Room image */}
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%', height: 140, borderRadius: 10,
                border: '2px dashed var(--border-color)',
                background: preview ? 'transparent' : 'var(--bg-secondary)',
                cursor: 'pointer', overflow: 'hidden', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {preview ? (
                <img src={preview} alt="room" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem' }}>📷</div>
                  <div style={{ fontSize: '0.8rem', marginTop: 6 }}>Upload room image</div>
                </div>
              )}
            </div>
            <input
              ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files[0]
                if (f) { setImageFile(f); setPreview(URL.createObjectURL(f)) }
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Room Type *</label>
              <select
                value={form.room_type}
                onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))}
                required style={inputStyle}
              >
                <option value="">Select type…</option>
                {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                <option value="custom">Custom…</option>
              </select>
              {form.room_type === 'custom' && (
                <input
                  type="text" placeholder="Enter custom type"
                  style={{ ...inputStyle, marginTop: 8 }}
                  onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))}
                />
              )}
            </div>
            <div>
              <label style={labelStyle}>Bed Type</label>
              <select value={form.bed_type} onChange={e => setForm(f => ({ ...f, bed_type: e.target.value }))} style={inputStyle}>
                <option value="">Select…</option>
                {['Single Bed','Double Bed','Twin Beds','Queen Bed','King Bed','Bunk Beds'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2} placeholder="Brief description of the room…"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Price / Night (PKR) *</label>
              <input
                type="number" min="1" required
                value={form.price_per_night}
                onChange={e => setForm(f => ({ ...f, price_per_night: e.target.value }))}
                placeholder="5000" style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Capacity (guests)</label>
              <input
                type="number" min="1" max="20"
                value={form.capacity}
                onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Total Rooms</label>
              <input
                type="number" min="1"
                value={form.total_rooms}
                onChange={e => setForm(f => ({
                  ...f,
                  total_rooms: e.target.value,
                  available_rooms: e.target.value,
                }))}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Available Rooms</label>
            <input
              type="number" min="0"
              value={form.available_rooms}
              onChange={e => setForm(f => ({ ...f, available_rooms: e.target.value }))}
              style={inputStyle}
            />
          </div>

          {/* Amenities */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Amenities</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {AMENITY_OPTIONS.map(a => (
                <div
                  key={a} onClick={() => toggleAmenity(a)}
                  style={{
                    padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
                    fontSize: '0.78rem', fontWeight: 600,
                    background: form.amenities.includes(a) ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: form.amenities.includes(a) ? 'white' : 'var(--text-secondary)',
                    border: `1px solid ${form.amenities.includes(a) ? 'var(--accent)' : 'var(--border-color)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  {a}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={saving} style={{
              flex: 1, padding: '12px', borderRadius: 10, border: 'none',
              background: saving ? '#9ca3af' : 'linear-gradient(135deg,#1e3a5f,#0ea5e9)',
              color: 'white', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Room'}
            </button>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '12px', borderRadius: 10,
              border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer',
            }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function HotelRooms() {
  const { hotelId } = useParams()
  const navigate = useNavigate()

  const [hotel, setHotel]           = useState(null)
  const [rooms, setRooms]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [deleting, setDeleting]     = useState(null)
  const [error, setError]           = useState('')

  async function loadData() {
    setLoading(true)
    try {
      const [hotelRes, roomsRes] = await Promise.all([
        api.get(`/hotels/${hotelId}`),
        api.get(`/rooms/hotel/${hotelId}`),
      ])
      setHotel(hotelRes.data)
      setRooms(roomsRes.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to load hotel data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [hotelId])

  async function handleDelete(roomId) {
    if (!window.confirm('Delete this room type?')) return
    setDeleting(roomId)
    try {
      await api.delete(`/rooms/${roomId}`)
      setRooms(r => r.filter(x => x.id !== roomId))
    } catch (e) {
      alert(e.response?.data?.detail || 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  async function handleAvailability(room, delta) {
    const newVal = Math.max(0, Math.min(room.total_rooms, room.available_rooms + delta))
    try {
      const res = await api.patch(`/rooms/${room.id}/availability`, null, {
        params: { available_rooms: newVal },
      })
      setRooms(prev => prev.map(r => r.id === room.id ? { ...r, available_rooms: res.data.available_rooms } : r))
    } catch (e) {
      alert(e.response?.data?.detail || 'Update failed')
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
      Loading rooms…
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--danger)' }}>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer' }}>Go Back</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 48 }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1e3a5f 0%,#0ea5e9 100%)', padding: '32px 16px 60px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <button onClick={() => navigate('/my-listings')} style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: 600, marginBottom: 20,
          }}>
            ← My Hotels
          </button>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ color: 'white', margin: '0 0 4px', fontSize: '1.6rem', fontWeight: 800 }}>
                🛏️ Room Management
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0, fontSize: '0.9rem' }}>
                {hotel?.name} · {hotel?.location}
              </p>
            </div>
            <button
              onClick={() => { setEditingRoom(null); setShowModal(true) }}
              style={{
                background: 'white', color: '#1e3a5f', border: 'none',
                borderRadius: 10, padding: '10px 20px', fontWeight: 700,
                cursor: 'pointer', fontSize: '0.9rem',
              }}
            >
              + Add Room
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '-24px auto 0', padding: '0 16px' }}>

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          gap: 12, marginBottom: 24,
        }}>
          {[
            { label: 'Room Types',     value: rooms.length,                           icon: '🏷️' },
            { label: 'Total Rooms',    value: rooms.reduce((s, r) => s + (r.total_rooms || 0), 0), icon: '🏠' },
            { label: 'Available Now',  value: rooms.reduce((s, r) => s + (r.available_rooms || 0), 0), icon: '✅' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)', padding: '16px 20px',
              textAlign: 'center', boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ fontSize: '1.6rem', marginBottom: 4 }}>{stat.icon}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Room cards */}
        {rooms.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
            border: '2px dashed var(--border-color)', padding: '60px 24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🛏️</div>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px' }}>No rooms yet</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px' }}>Add room types to your hotel</p>
            <button
              onClick={() => { setEditingRoom(null); setShowModal(true) }}
              style={{
                padding: '12px 28px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#1e3a5f,#0ea5e9)',
                color: 'white', fontWeight: 700, cursor: 'pointer',
              }}
            >
              + Add First Room
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {rooms.map(room => (
              <div key={room.id} style={{
                background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                display: 'grid', gridTemplateColumns: room.image_url ? '200px 1fr' : '1fr',
              }}>
                {room.image_url && (
                  <img
                    src={`http://localhost:8000/uploads/${room.image_url}`}
                    alt={room.room_type}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 160 }}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                )}

                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {room.room_type || room.name}
                      </h3>
                      {room.bed_type && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          🛏️ {room.bed_type} · 👥 {room.capacity} guests
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)', textAlign: 'right' }}>
                      PKR {(room.price_per_night || 0).toLocaleString('en-PK')}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>/night</div>
                    </div>
                  </div>

                  {room.description && (
                    <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {room.description}
                    </p>
                  )}

                  {room.amenities?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                      {room.amenities.slice(0, 6).map(a => (
                        <span key={a} style={{
                          fontSize: '0.7rem', padding: '2px 8px', borderRadius: 999,
                          background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 600,
                        }}>
                          {a}
                        </span>
                      ))}
                      {room.amenities.length > 6 && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          +{room.amenities.length - 6} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Availability controls */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'var(--bg-secondary)', borderRadius: 8,
                    padding: '10px 14px', marginBottom: 16,
                  }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      Availability:
                    </span>
                    <button onClick={() => handleAvailability(room, -1)} style={{
                      width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)', cursor: 'pointer', fontWeight: 700, fontSize: '1rem',
                      color: 'var(--text-secondary)',
                    }}>−</button>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', minWidth: 60, textAlign: 'center', fontSize: '0.9rem' }}>
                      {room.available_rooms} / {room.total_rooms}
                    </span>
                    <button onClick={() => handleAvailability(room, +1)} style={{
                      width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)', cursor: 'pointer', fontWeight: 700, fontSize: '1rem',
                      color: 'var(--text-secondary)',
                    }}>+</button>
                    <span style={{
                      marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px',
                      borderRadius: 999,
                      background: room.available_rooms > 0 ? '#dcfce7' : '#fee2e2',
                      color: room.available_rooms > 0 ? '#16a34a' : '#dc2626',
                    }}>
                      {room.available_rooms > 0 ? 'Available' : 'Fully Booked'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => { setEditingRoom(room); setShowModal(true) }}
                      style={{
                        padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border-color)',
                        background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
                        cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(room.id)}
                      disabled={deleting === room.id}
                      style={{
                        padding: '8px 18px', borderRadius: 8, border: '1px solid #fca5a5',
                        background: '#fee2e2', color: '#dc2626',
                        cursor: deleting === room.id ? 'not-allowed' : 'pointer',
                        fontWeight: 600, fontSize: '0.85rem',
                      }}
                    >
                      {deleting === room.id ? '…' : '🗑️ Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <RoomModal
          room={editingRoom}
          hotelId={hotelId}
          onClose={() => { setShowModal(false); setEditingRoom(null) }}
          onSaved={loadData}
        />
      )}
    </div>
  )
}
