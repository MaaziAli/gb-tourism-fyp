import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function AddListing() {
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [pricePerNight, setPricePerNight] = useState('')
  const [serviceType, setServiceType] = useState('hotel')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    setSubmitting(true)

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

      await api.post('/listings/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setMessage('Listing created successfully!')
      setTitle('')
      setLocation('')
      setDescription('')
      setPricePerNight('')
      setServiceType('hotel')
      setImageFile(null)
      setImagePreview(null)
    } catch (err) {
      console.error('Failed to create listing', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      setError('Failed to create listing')
    } finally {
      setSubmitting(false)
    }
  }

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setImageFile(file)
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    } else {
      setImagePreview(null)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  return (
    <div className="page-container">
      <div
        style={{
          maxWidth: '600px',
          margin: '40px auto',
          backgroundColor: 'var(--bg-card)',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '1.6rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          Add New Listing
        </h1>
        <p
          style={{
            marginTop: '4px',
            marginBottom: '24px',
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
          }}
        >
          List your service for travelers across Gilgit-Baltistan
        </p>

        {message && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'var(--success-bg)',
              border: '1px solid var(--success)',
              color: 'var(--success)',
              fontSize: '0.9rem',
            }}
          >
            <span style={{ marginRight: '6px' }}>✅</span>
            {message}{' '}
            <button
              type="button"
              onClick={() => navigate('/my-listings')}
              style={{
                marginLeft: '6px',
                padding: 0,
                border: 'none',
                background: 'none',
                color: 'var(--success)',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              View My Listings
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {imagePreview && (
            <div style={{ marginBottom: '20px' }}>
              <img
                src={imagePreview}
                alt="Listing preview"
                style={{
                  width: '100%',
                  height: '160px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  display: 'block',
                  marginBottom: '8px',
                }}
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                style={{
                  padding: 0,
                  border: 'none',
                  background: 'none',
                  color: '#2563eb',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Remove image
              </button>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="title"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '4px',
              }}
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hunza View Hotel"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '0.95rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="location"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '4px',
              }}
            >
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Hunza Valley, Gilgit-Baltistan"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '0.95rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="description"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '4px',
              }}
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your listing, amenities, highlights..."
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '0.95rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="pricePerNight"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '4px',
              }}
            >
              Price per night
            </label>
            <input
              id="pricePerNight"
              type="number"
              value={pricePerNight}
              onChange={(e) => setPricePerNight(e.target.value)}
              placeholder="e.g. 2500"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '0.95rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                boxSizing: 'border-box',
              }}
              required
              min="1"
              step="1"
            />
            <p
              style={{
                marginTop: '4px',
                fontSize: '0.8rem',
                color: '#6b7280',
              }}
            >
              Enter price in PKR (Pakistani Rupees)
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="serviceType"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '4px',
              }}
            >
              Service type
            </label>
            <select
              id="serviceType"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '0.95rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                boxSizing: 'border-box',
              }}
            >
              <option value="hotel">🏨 Hotel</option>
              <option value="tour">🗺️ Tour Package</option>
              <option value="transport">🚗 Transport Service</option>
              <option value="activity">🧗 Activity</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '4px',
              }}
            >
              Listing Image (optional)
            </label>
            <label
              htmlFor="imageFile"
              style={{
                border: '2px dashed #d1d5db',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#f9fafb',
                display: 'block',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>📷</div>
              <div style={{ fontSize: '0.9rem', color: '#374151' }}>
                Click to upload an image
              </div>
              <div
                style={{
                  marginTop: '4px',
                  fontSize: '0.8rem',
                  color: '#6b7280',
                }}
              >
                JPG, PNG up to 5MB
              </div>
            </label>
            <input
              id="imageFile"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            {imageFile && (
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '0.85rem',
                  color: '#374151',
                }}
              >
                Selected file: <strong>{imageFile.name}</strong>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              cursor: submitting ? 'default' : 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
              opacity: submitting ? 0.85 : 1,
            }}
          >
            {submitting ? 'Creating...' : 'Create Listing'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddListing

