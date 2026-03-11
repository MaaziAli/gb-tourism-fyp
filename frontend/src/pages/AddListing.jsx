import { useState } from 'react'
import api from '../api/axios'

function AddListing() {
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [pricePerNight, setPricePerNight] = useState('')
  const [serviceType, setServiceType] = useState('hotel')
  const [imageFile, setImageFile] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('location', location)
      formData.append('price_per_night', pricePerNight)
      formData.append('service_type', serviceType)
      if (imageFile) {
        formData.append('image', imageFile)
      }

      await api.post('/listings/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setMessage('Listing created successfully')
      setTitle('')
      setLocation('')
      setPricePerNight('')
      setServiceType('hotel')
      setImageFile(null)
    } catch (err) {
      console.error('Failed to create listing', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      })
      setError('Failed to create listing')
    }
  }

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          margin: '40px auto',
          backgroundColor: '#ffffff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 4px rgba(15, 23, 42, 0.08)',
        }}
      >
        <h1 style={{ marginBottom: '24px' }}>Add Listing</h1>
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              padding: '8px',
              fontSize: '0.95rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              width: '100%',
            }}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{
              padding: '8px',
              fontSize: '0.95rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              width: '100%',
            }}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="pricePerNight">Price per night</label>
          <input
            id="pricePerNight"
            type="number"
            value={pricePerNight}
            onChange={(e) => setPricePerNight(e.target.value)}
            style={{
              padding: '8px',
              fontSize: '0.95rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              width: '100%',
            }}
            required
            min="0"
            step="0.01"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="serviceType">Service type</label>
          <select
            id="serviceType"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            style={{
              padding: '8px',
              fontSize: '0.95rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              width: '100%',
            }}
          >
            <option value="hotel">hotel</option>
            <option value="tour">tour</option>
            <option value="transport">transport</option>
            <option value="activity">activity</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="imageFile">Image (optional)</label>
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

        <button
          type="submit"
          style={{
            marginTop: '8px',
            padding: '10px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Create Listing
        </button>
      </form>

      {message && (
        <p style={{ marginTop: '12px', color: 'green', fontSize: '0.95rem' }}>
          {message}
        </p>
      )}
      {error && (
        <p style={{ marginTop: '12px', color: 'red', fontSize: '0.95rem' }}>
          {error}
        </p>
      )}
      </div>
    </div>
  )
}

export default AddListing

