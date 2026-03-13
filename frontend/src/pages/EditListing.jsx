import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'

function EditListing() {
  const { listingId } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [pricePerNight, setPricePerNight] = useState('')
  const [serviceType, setServiceType] = useState('hotel')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState('')

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError('')
    api
      .get(`/listings/${listingId}`)
      .then((response) => {
        if (!isMounted) return
        const data = response.data
        setTitle(data.title || '')
        setLocation(data.location || '')
        setDescription(data.description || '')
        setPricePerNight(
          typeof data.price_per_night === 'number'
            ? String(data.price_per_night)
            : '',
        )
        setServiceType(data.service_type || 'hotel')
        setCurrentImageUrl(data.image_url || '')
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err.response?.data?.detail || 'Failed to load listing.')
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [listingId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('location', location)
      formData.append('description', description)
      formData.append('price_per_night', pricePerNight)
      formData.append('service_type', serviceType)
      if (imageFile) {
        formData.append('image', imageFile)
      }

      await api.put(`/listings/${listingId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      navigate('/')
    } catch (err) {
      console.error('Failed to update listing', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      setError('Failed to update listing.')
    } finally {
      setSaving(false)
    }
  }

  const containerStyle = {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
    background: 'var(--bg-primary)',
    minHeight: '100vh',
  }

  const cardStyle = {
    maxWidth: '480px',
    margin: '40px auto',
    backgroundColor: 'var(--bg-card)',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: 'var(--shadow-sm)',
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <p>Loading listing...</p>
      </div>
    )
  }

  if (error && !title) {
    return (
      <div style={containerStyle}>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1
          style={{
            marginBottom: '24px',
            color: 'var(--text-primary)',
          }}
        >
          Edit Listing
        </h1>
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label
              htmlFor="title"
              style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                padding: '8px',
                fontSize: '0.95rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                width: '100%',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label
              htmlFor="location"
              style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}
            >
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              style={{
                padding: '8px',
                fontSize: '0.95rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                width: '100%',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label
              htmlFor="description"
              style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                padding: '8px',
                fontSize: '0.95rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                width: '100%',
                resize: 'vertical',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label
              htmlFor="pricePerNight"
              style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}
            >
              Price per night
            </label>
            <input
              id="pricePerNight"
              type="number"
              value={pricePerNight}
              onChange={(e) => setPricePerNight(e.target.value)}
              required
              min="0"
              step="0.01"
              style={{
                padding: '8px',
                fontSize: '0.95rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                width: '100%',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label
              htmlFor="serviceType"
              style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}
            >
              Service type
            </label>
            <select
              id="serviceType"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              style={{
                padding: '8px',
                fontSize: '0.95rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                width: '100%',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="hotel">hotel</option>
              <option value="tour">tour</option>
              <option value="transport">transport</option>
              <option value="activity">activity</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
              Current image
            </label>
            {currentImageUrl ? (
              <div style={{ marginBottom: '8px' }}>
                <img
                  src={getImageUrl(currentImageUrl)}
                  alt={title || 'Listing image'}
                  style={{
                    width: '200px',
                    height: '130px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    display: 'block',
                  }}
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/400x250?text=No+Image'
                  }}
                />
                <p
                  style={{
                    marginTop: '6px',
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Upload a new image to replace it (optional).
                </p>
              </div>
            ) : (
              <p
                style={{
                  marginBottom: '6px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                }}
              >
                No image uploaded yet.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label
              htmlFor="imageFile"
              style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}
            >
              Image (optional)
            </label>
            <input
              id="imageFile"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              style={{
                padding: '4px 0',
                fontSize: '0.95rem',
              }}
            />
          </div>

          {error && (
            <p style={{ color: 'red', fontSize: '0.9rem', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: '8px',
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.8 : 1,
              fontSize: '1rem',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default EditListing

