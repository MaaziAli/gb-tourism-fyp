import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function AddListing() {
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [pricePerNight, setPricePerNight] = useState('')
  const [serviceType, setServiceType] = useState('hotel')
  const [cuisineType, setCuisineType] = useState('')
  const [openingHours, setOpeningHours] = useState('')
  const [diningAmenities, setDiningAmenities] = useState([])
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
      setCuisineType('')
      setOpeningHours('')
      setDiningAmenities([])
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
    <div
      style={{
        background: 'var(--bg-primary)',
        minHeight: '100vh',
      }}
    >
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
          List Your Service
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
              View My Services
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
                  color: 'var(--accent)',
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
                border: '1px solid var(--border-color)',
                boxSizing: 'border-box',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
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
                color: 'var(--text-secondary)',
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
                border: '1px solid var(--border-color)',
                boxSizing: 'border-box',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
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
                color: 'var(--text-secondary)',
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
              placeholder={serviceType === 'restaurant'
                ? 'Describe your restaurant, cuisine, ambiance...'
                : 'Describe your service...'}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '0.95rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                boxSizing: 'border-box',
                resize: 'vertical',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
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
                color: 'var(--text-secondary)',
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
                border: '1px solid var(--border-color)',
                boxSizing: 'border-box',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
              required
              min="1"
              step="1"
            />
            <p
              style={{
                marginTop: '4px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
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
                color: 'var(--text-secondary)',
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
                border: '1px solid var(--border-color)',
                boxSizing: 'border-box',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="hotel">🏨 Hotel</option>
              <option value="tour">🗺️ Tour Package</option>
              <option value="transport">🚗 Transport Service</option>
              <option value="activity">🧗 Activity</option>
              <option value="restaurant">🍽️ Restaurant</option>
              <option value="car_rental">🚗 Car Rental</option>
              <option value="bike_rental">🚲 Bike Rental</option>
              <option value="jeep_safari">🚙 Jeep Safari</option>
              <option value="boat_trip">🚢 Boat Trip</option>
              <option value="horse_riding">🐴 Horse Riding</option>
              <option value="medical">🏥 Medical Tourism</option>
              <option value="guide">🧭 Local Guide</option>
              <option value="camping">🏕️ Camping</option>
            </select>
          </div>

          {serviceType === 'restaurant' && (
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--accent)',
              padding: '20px', marginBottom: '16px'
            }}>
              <h3 style={{
                margin: '0 0 16px', fontSize: '0.95rem',
                fontWeight: 700, color: 'var(--accent)'
              }}>
                🍽️ Restaurant Details
              </h3>

              <div style={{marginBottom: '14px'}}>
                <label style={{
                  display: 'block', fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px'
                }}>
                  Cuisine Type
                </label>
                <select
                  value={cuisineType}
                  onChange={e => setCuisineType(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="">Select cuisine...</option>
                  <option value="Pakistani">🇵🇰 Pakistani</option>
                  <option value="Chinese">🥢 Chinese</option>
                  <option value="Continental">🍝 Continental</option>
                  <option value="BBQ">🔥 BBQ & Grill</option>
                  <option value="Desi">🍛 Desi</option>
                  <option value="Mixed">🌍 Mixed/International</option>
                  <option value="Cafe">☕ Cafe & Snacks</option>
                  <option value="Seafood">🦞 Seafood</option>
                </select>
              </div>

              <div style={{marginBottom: '14px'}}>
                <label style={{
                  display: 'block', fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px'
                }}>
                  Opening Hours
                </label>
                <input
                  type="text"
                  value={openingHours}
                  onChange={e => setOpeningHours(e.target.value)}
                  placeholder="e.g. 12:00 PM - 11:00 PM"
                  style={{
                    width: '100%', padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block', fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '10px'
                }}>
                  Dining Packages & Amenities Available
                  <span style={{
                    fontWeight: 400, fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    marginLeft: '6px'
                  }}>
                    (select all that apply)
                  </span>
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px'
                }}>
                  {[
                    { key: 'dine_in', label: '🍽️ Dine-In' },
                    { key: 'high_tea', label: '☕ High Tea' },
                    { key: 'buffet', label: '🍱 Buffet' },
                    { key: 'bbq', label: '🔥 BBQ Night' },
                    { key: 'full_board', label: '🥗 Full Board' },
                    { key: 'half_board', label: '🥘 Half Board' },
                    { key: 'pool', label: '🏊 Pool Access' },
                    { key: 'sports', label: '🎾 Sports' },
                    { key: 'private_dining', label: '🕯️ Private' },
                  ].map(item => (
                    <label key={item.key} style={{
                      display: 'flex', alignItems: 'center',
                      gap: '8px', cursor: 'pointer',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: diningAmenities.includes(item.key)
                        ? '2px solid var(--accent)'
                        : '1px solid var(--border-color)',
                      background: diningAmenities.includes(item.key)
                        ? 'var(--accent-light)'
                        : 'var(--bg-card)',
                      fontSize: '0.82rem',
                      color: diningAmenities.includes(item.key)
                        ? 'var(--accent)'
                        : 'var(--text-primary)',
                      fontWeight: diningAmenities.includes(item.key)
                        ? 700 : 400
                    }}>
                      <input
                        type="checkbox"
                        checked={diningAmenities.includes(item.key)}
                        onChange={() => {
                          setDiningAmenities(prev =>
                            prev.includes(item.key)
                              ? prev.filter(a => a !== item.key)
                              : [...prev, item.key]
                          )
                        }}
                        style={{display: 'none'}}
                      />
                      {diningAmenities.includes(item.key)
                        ? '✓ ' : ''
                      }{item.label}
                    </label>
                  ))}
                </div>
              </div>

              <p style={{
                margin: '12px 0 0', fontSize: '0.75rem',
                color: 'var(--text-muted)'
              }}>
                💡 After creating the listing, go to Edit to
                add pricing for each package
              </p>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                marginBottom: '4px',
              }}
            >
            Stay Image (optional)
            </label>
            <label
              htmlFor="imageFile"
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: 'var(--bg-secondary)',
                display: 'block',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>📷</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Click to upload an image
              </div>
              <div
                style={{
                  marginTop: '4px',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
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
                  color: 'var(--text-secondary)',
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
              backgroundColor: 'var(--accent)',
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
    </div>
  )
}

export default AddListing

