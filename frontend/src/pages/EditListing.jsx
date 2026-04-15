import { useEffect, useState } from 'react'
import {
  useNavigate,
  useParams,
  useSearchParams,
  useLocation as useRouterLocation
} from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'
import AvailabilityCalendar from '../components/AvailabilityCalendar'
import AmenitiesSelector from '../components/AmenitiesSelector'
import ListingAddonManager from '../components/ListingAddonManager'

function EditListing() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const routerLocation = useRouterLocation()

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
  const [extraImages, setExtraImages] = useState([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageMsg, setImageMsg] = useState('')
  const [roomTypes, setRoomTypes] = useState([])
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    price_per_night: '',
    capacity: 2,
    total_rooms: 1,
  })
  const [roomMsg, setRoomMsg] = useState('')
  const [addingRoom, setAddingRoom] = useState(false)
  const [bedType, setBedType] = useState('')
  const [availableCount, setAvailableCount] = useState(5)
  const [roomAmenities, setRoomAmenities] = useState([])
  const [diningPackages, setDiningPackages] = useState([])
  const [newPkg, setNewPkg] = useState({
    name: '',
    description: '',
    package_type: 'dine_in',
    price_per_person: '',
    min_persons: 1,
    max_persons: 10,
    duration_hours: 2
  })
  const [pkgMsg, setPkgMsg] = useState('')
  const [addingPkg, setAddingPkg] = useState(false)
  const [cancelPolicy, setCancelPolicy] = useState('moderate')
  const [cancelHours, setCancelHours] = useState(48)
  const [roomsAvailable, setRoomsAvailable] = useState(10)
  const [maxCapacityPerDay, setMaxCapacityPerDay] = useState('')
  const [amenities, setAmenities] = useState([])
  // Car rental fields
  const [pickupLocationDefault, setPickupLocationDefault] = useState('')
  const [dropoffLocationDefault, setDropoffLocationDefault] = useState('')
  const [pickupTimeDefault, setPickupTimeDefault] = useState('09:00')
  const [dropoffTimeDefault, setDropoffTimeDefault] = useState('18:00')
  const [fuelPolicyDefault, setFuelPolicyDefault] = useState('full_to_full')
  const [mileageLimitDefault, setMileageLimitDefault] = useState('')
  const [insuranceOptionsState, setInsuranceOptionsState] = useState([])
  const [newInsuranceName, setNewInsuranceName] = useState('')
  const [newInsurancePrice, setNewInsurancePrice] = useState('')

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
        setCancelPolicy(data.cancellation_policy || 'moderate')
        setCancelHours(
          data.cancellation_hours_free != null
            ? data.cancellation_hours_free
            : 48,
        )
        setRoomsAvailable(
          data.rooms_available != null ? data.rooms_available : 10,
        )
        setMaxCapacityPerDay(
          data.max_capacity_per_day != null ? String(data.max_capacity_per_day) : '',
        )
        setPickupLocationDefault(data.pickup_location || '')
        setDropoffLocationDefault(data.dropoff_location || '')
        setPickupTimeDefault(data.pickup_time || '09:00')
        setDropoffTimeDefault(data.dropoff_time || '18:00')
        setFuelPolicyDefault(data.fuel_policy || 'full_to_full')
        setMileageLimitDefault(data.mileage_limit != null ? String(data.mileage_limit) : '')
        setInsuranceOptionsState(data.insurance_options || [])

        // Amenities
        if (Array.isArray(data.amenities_list)) {
          setAmenities(data.amenities_list)
        } else if (data.amenities) {
          try {
            const parsed = JSON.parse(data.amenities)
            setAmenities(Array.isArray(parsed) ? parsed : [])
          } catch {
            setAmenities([])
          }
        } else {
          setAmenities([])
        }
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

  useEffect(() => {
    const tab = searchParams.get('tab')
    const msg = routerLocation.state?.message
    if (msg) {
      alert(msg)
    }
    if (tab === 'rooms') {
      setTimeout(() => {
        document
          .querySelector('[data-rooms-tab]')
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
      }, 800)
    }
  }, [])

  useEffect(() => {
    if (!listingId) return
    api
      .get(`/listing-images/${listingId}`)
      .then((r) => setExtraImages(r.data || []))
      .catch((e) => {
        console.error('Failed to load listing images', e)
      })
  }, [listingId])

  useEffect(() => {
    if (!listingId) return
    api
      .get(`/room-types/${listingId}`)
      .then((r) => setRoomTypes(r.data))
      .catch((e) => {
        console.error('Failed to load room types', e)
      })
  }, [listingId])

  useEffect(() => {
    if (!listingId) return
    api
      .get(`/dining/packages/${listingId}`)
      .then((r) => setDiningPackages(r.data || []))
      .catch(() => setDiningPackages([]))
  }, [listingId])

  async function uploadExtraImage(file) {
    if (!file || !listingId) return
    setUploadingImage(true)
    setImageMsg('')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('caption', '')
    try {
      const res = await api.post(
        `/listing-images/${listingId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      setExtraImages((prev) => [...prev, res.data])
      setImageMsg('✅ Image uploaded!')
    } catch (e) {
      console.error('Failed to upload image', e)
      setImageMsg('❌ Upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  async function deleteExtraImage(imageId) {
    if (!window.confirm('Remove this image?')) return
    try {
      await api.delete(`/listing-images/${imageId}`)
      setExtraImages((prev) => prev.filter((i) => i.id !== imageId))
    } catch (e) {
      console.error('Failed to delete image', e)
    }
  }

  async function addRoomType() {
    if (!newRoom.name || !newRoom.price_per_night) {
      setRoomMsg('Name and price are required')
      return
    }
    if (!listingId) return
    setAddingRoom(true)
    try {
      const res = await api.post(`/room-types/${listingId}`, {
        name: newRoom.name,
        description: newRoom.description,
        price_per_night: parseFloat(newRoom.price_per_night),
        capacity: parseInt(newRoom.capacity),
        bed_type: bedType || null,
        available_count: availableCount,
        amenities: roomAmenities.length > 0
          ? JSON.stringify(roomAmenities)
          : null,
        total_rooms: parseInt(newRoom.total_rooms),
      })
      setRoomTypes((prev) => [...prev, res.data])
      setNewRoom({
        name: '',
        description: '',
        price_per_night: '',
        capacity: 2,
        total_rooms: 1,
      })
      setBedType('')
      setAvailableCount(5)
      setRoomAmenities([])
      setRoomMsg('✅ Room type added!')
    } catch (e) {
      console.error('Failed to add room type', e)
    } finally {
      setAddingRoom(false)
    }
  }

  async function addDiningPackage() {
    if (!newPkg.name || !newPkg.price_per_person) {
      setPkgMsg('Name and price are required')
      return
    }
    setAddingPkg(true)
    setPkgMsg('')
    try {
      await api.post(`/dining/packages/${listingId}`, {
        ...newPkg,
        price_per_person: parseFloat(newPkg.price_per_person),
        min_persons: parseInt(newPkg.min_persons, 10),
        max_persons: parseInt(newPkg.max_persons, 10),
        duration_hours: parseFloat(newPkg.duration_hours)
      })
      const pkgRes = await api.get(`/dining/packages/${listingId}`)
      setDiningPackages(pkgRes.data || [])
      setNewPkg({
        name: '',
        description: '',
        package_type: 'dine_in',
        price_per_person: '',
        min_persons: 1,
        max_persons: 10,
        duration_hours: 2
      })
      setPkgMsg('✅ Package added!')
    } catch (e) {
      setPkgMsg('❌ Failed to add package')
    } finally {
      setAddingPkg(false)
    }
  }

  async function deleteDiningPackage(pkgId) {
    if (!window.confirm('Delete this package?')) return
    try {
      await api.delete(`/dining/packages/${pkgId}`)
      setDiningPackages((prev) => prev.filter((p) => p.id !== pkgId))
    } catch (e) {
      console.error(e)
    }
  }

  async function deleteRoomType(roomId) {
    if (!window.confirm('Delete this room type?')) return
    try {
      await api.delete(`/room-types/${roomId}`)
      setRoomTypes((prev) => prev.filter((r) => r.id !== roomId))
    } catch (e) {
      console.error('Failed to delete room type', e)
    }
  }

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
      formData.append('cancellation_policy', cancelPolicy)
      formData.append('cancellation_hours_free', String(cancelHours))
      formData.append('rooms_available', String(roomsAvailable))
      if (maxCapacityPerDay !== '') {
        formData.append('max_capacity_per_day', String(maxCapacityPerDay))
      }
      if (serviceType === 'car_rental') {
        formData.append('pickup_location', pickupLocationDefault)
        formData.append('dropoff_location', dropoffLocationDefault)
        formData.append('pickup_time', pickupTimeDefault)
        formData.append('dropoff_time', dropoffTimeDefault)
        formData.append('fuel_policy', fuelPolicyDefault)
        if (mileageLimitDefault !== '') {
          formData.append('mileage_limit', mileageLimitDefault)
        }
        formData.append('insurance_options', JSON.stringify(insuranceOptionsState))
      }
      formData.append(
        'amenities',
        JSON.stringify(amenities)
      )
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
          Edit Stay
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

          {(serviceType === 'restaurant') && (
            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block',
                fontWeight: 700,
                fontSize: '0.95rem',
                marginBottom: '14px',
                color: 'var(--text-primary)'
              }}>
                🍽️ Dining Packages & Amenities
              </label>
              <p style={{
                margin: '0 0 14px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}>
                Add packages like High Tea, Buffet, Pool Access etc.
              </p>

              {diningPackages.length > 0 && (
                <div style={{
                  marginBottom: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {diningPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div>
                        <div style={{
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          fontSize: '0.9rem'
                        }}>
                          {pkg.package_label} — {pkg.name}
                        </div>
                        <div style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)'
                        }}>
                          PKR {pkg.price_per_person?.toLocaleString('en-PK')}/person ·
                          {pkg.min_persons}-{pkg.max_persons} persons
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteDiningPackage(pkg.id)}
                        style={{
                          background: 'var(--danger-bg)',
                          color: 'var(--danger)',
                          border: '1px solid var(--danger)',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{
                padding: '16px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '12px'
                }}>
                  + Add Package
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '4px'
                  }}>
                    Package Type
                  </label>
                  <select
                    value={newPkg.package_type}
                    onChange={(e) => setNewPkg((p) => ({ ...p, package_type: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="dine_in">🍽️ Dine-In</option>
                    <option value="high_tea">☕ High Tea</option>
                    <option value="buffet">🍱 Buffet</option>
                    <option value="bbq">🔥 BBQ Night</option>
                    <option value="full_board">🥗 Full Board (3 meals)</option>
                    <option value="half_board">🥘 Half Board (2 meals)</option>
                    <option value="pool">🏊 Pool Access</option>
                    <option value="sports">🎾 Sports & Activities</option>
                    <option value="private_dining">🕯️ Private Dining</option>
                  </select>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginBottom: '10px'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: '4px'
                    }}>
                      Package Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sunset BBQ"
                      value={newPkg.name}
                      onChange={(e) => setNewPkg((p) => ({ ...p, name: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: '4px'
                    }}>
                      Price/Person (PKR) *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2500"
                      value={newPkg.price_per_person}
                      onChange={(e) => setNewPkg((p) => ({ ...p, price_per_person: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: '4px'
                    }}>
                      Min Persons
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={newPkg.min_persons}
                      onChange={(e) => setNewPkg((p) => ({ ...p, min_persons: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: '4px'
                    }}>
                      Max Persons
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={newPkg.max_persons}
                      onChange={(e) => setNewPkg((p) => ({ ...p, max_persons: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '4px'
                  }}>
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Includes BBQ, drinks, dessert"
                    value={newPkg.description}
                    onChange={(e) => setNewPkg((p) => ({ ...p, description: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {pkgMsg && (
                  <p style={{
                    margin: '0 0 10px',
                    fontSize: '0.85rem',
                    color: pkgMsg.startsWith('✅') ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {pkgMsg}
                  </p>
                )}

                <button
                  type="button"
                  onClick={addDiningPackage}
                  disabled={addingPkg}
                  style={{
                    background: '#e11d48',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    opacity: addingPkg ? 0.7 : 1
                  }}
                >
                  {addingPkg ? 'Adding...' : '+ Add Package'}
                </button>
              </div>
            </div>
          )}

          {/* Room Types Section */}
          <div
            data-rooms-tab="true"
            style={{ marginBottom: '28px' }}
          >
            <label
              style={{
                display: 'block',
                fontWeight: 700,
                fontSize: '0.95rem',
                marginBottom: '14px',
                color: 'var(--text-primary)',
              }}
            >
              🛏️ Room Types
            </label>
            <p
              style={{
                margin: '0 0 14px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}
            >
              Add specific room types with individual pricing. If no room types
              are added, the base listing price is used.
            </p>

            {/* Existing room types */}
            {roomTypes.length > 0 && (
              <div
                style={{
                  marginBottom: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {roomTypes.map((room) => (
                  <div
                    key={room.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          fontSize: '0.9rem',
                        }}
                      >
                        {room.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        PKR{' '}
                        {room.price_per_night?.toLocaleString('en-PK')}
                        /night · {room.capacity} guests · {room.total_rooms}{' '}
                        room{room.total_rooms > 1 ? 's' : ''}
                        {room.bed_type ? ` · ${room.bed_type}` : ''}
                        {typeof room.available_count === 'number'
                          ? ` · ${room.available_count} available`
                          : ''}
                      </div>
                      {room.description && (
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                            marginTop: '2px',
                          }}
                        >
                          {room.description}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteRoomType(room.id)}
                      style={{
                        background: 'var(--danger-bg)',
                        color: 'var(--danger)',
                        border: '1px solid var(--danger)',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new room type form */}
            <div
              style={{
                padding: '16px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '12px',
                }}
              >
                + Add Room Type
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px',
                      fontWeight: 600,
                    }}
                  >
                    Room Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Deluxe Room"
                    value={newRoom.name}
                    onChange={(e) =>
                      setNewRoom((p) => ({ ...p, name: e.target.value }))
                    }
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px',
                      fontWeight: 600,
                    }}
                  >
                    Price / night (PKR) *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 3500"
                    value={newRoom.price_per_night}
                    onChange={(e) =>
                      setNewRoom((p) => ({
                        ...p,
                        price_per_night: e.target.value,
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px',
                      fontWeight: 600,
                    }}
                  >
                    Max Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newRoom.capacity}
                    onChange={(e) =>
                      setNewRoom((p) => ({
                        ...p,
                        capacity: e.target.value,
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '4px',
                      fontWeight: 600,
                    }}
                  >
                    Number of Rooms
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newRoom.total_rooms}
                    onChange={(e) =>
                      setNewRoom((p) => ({
                        ...p,
                        total_rooms: e.target.value,
                      }))
                    }
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{
                  display: 'block',
                  fontWeight: 700,
                  marginBottom: '5px', fontSize: '0.85rem',
                  color: 'var(--text-primary)'
                }}>
                  🛏️ Bed Type
                </label>
                <select
                  value={bedType}
                  onChange={e => setBedType(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">Select bed type</option>
                  {[
                    'Single Bed', 'Double Bed', 'Twin Beds',
                    'Queen Bed', 'King Bed',
                    'Bunk Beds', 'Sofa Bed'
                  ].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block', fontWeight: 700,
                  marginBottom: '5px', fontSize: '0.85rem',
                  color: 'var(--text-primary)'
                }}>
                  🏷️ Rooms Available
                </label>
                <input type="number"
                  value={availableCount}
                  onChange={e => setAvailableCount(
                    parseInt(e.target.value) || 1
                  )}
                  min={0} max={999}
                  style={{
                    width: '100%', padding: '9px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem', outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block', fontWeight: 700,
                  marginBottom: '8px', fontSize: '0.85rem',
                  color: 'var(--text-primary)'
                }}>
                  ✨ Room Amenities
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '6px'
                }}>
                  {[
                    'WiFi', 'Air Conditioning', 'TV',
                    'Hot Water', 'Minibar', 'Room Service',
                    'Balcony', 'Sea View', 'Jacuzzi',
                    'Safe', 'Hairdryer', 'Iron'
                  ].map(amenity => {
                    const selected = (roomAmenities || [])
                      .includes(amenity)
                    return (
                      <div key={amenity}
                        onClick={() => {
                          setRoomAmenities(prev => {
                            const arr = prev || []
                            return selected
                              ? arr.filter(a => a !== amenity)
                              : [...arr, amenity]
                          })
                        }}
                        style={{
                          display: 'flex', alignItems: 'center',
                          gap: '6px', padding: '6px 8px',
                          borderRadius: '7px', cursor: 'pointer',
                          border: selected
                            ? '1px solid #0ea5e9'
                            : '1px solid var(--border-color)',
                          background: selected
                            ? '#e0f2fe' : 'var(--bg-secondary)',
                          fontSize: '0.78rem',
                          color: selected
                            ? '#0369a1' : 'var(--text-secondary)'
                        }}
                      >
                        <span style={{
                          width: 14, height: 14,
                          borderRadius: '3px',
                          background: selected
                            ? '#0ea5e9' : 'transparent',
                          border: selected
                            ? 'none'
                            : '1px solid var(--border-color)',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0, fontSize: '0.6rem',
                          color: 'white'
                        }}>
                          {selected ? '✓' : ''}
                        </span>
                        {amenity}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px',
                    fontWeight: 600,
                  }}
                >
                  Description (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mountain view, king bed, WiFi"
                  value={newRoom.description}
                  onChange={(e) =>
                    setNewRoom((p) => ({
                      ...p,
                      description: e.target.value,
                    }))
                  }
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              {roomMsg && (
                <p
                  style={{
                    margin: '0 0 10px',
                    fontSize: '0.85rem',
                    color: roomMsg.startsWith('✅')
                      ? 'var(--success)'
                      : 'var(--danger)',
                  }}
                >
                  {roomMsg}
                </p>
              )}
              <button
                type="button"
                onClick={addRoomType}
                disabled={addingRoom}
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  opacity: addingRoom ? 0.7 : 1,
                }}
              >
                {addingRoom ? 'Adding...' : '+ Add Room Type'}
              </button>
            </div>
          </div>

          {/* Listing Add-ons */}
          <ListingAddonManager listingId={listingId} />

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

          {/* Amenities */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontWeight: 700,
              marginBottom: '8px',
              fontSize: '0.9rem',
              color: 'var(--text-primary)'
            }}>
              ✨ Amenities & Features
            </label>
            <p style={{
              margin: '0 0 10px',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)'
            }}>
              Select everything your property offers
            </p>
            <AmenitiesSelector
              selected={amenities}
              onChange={setAmenities}
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

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', fontWeight: 700,
              marginBottom: '8px', fontSize: '0.85rem',
              color: 'var(--text-primary)',
            }}
            >
              ❌ Cancellation Policy
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}
            >
              {[
                {
                  key: 'flexible', emoji: '✅',
                  label: 'Flexible',
                  desc: 'Free cancel 48h before',
                },
                {
                  key: 'moderate', emoji: '⚠️',
                  label: 'Moderate',
                  desc: 'Free cancel 5 days before',
                },
                {
                  key: 'strict', emoji: '❌',
                  label: 'Strict',
                  desc: '50% refund 1 week before',
                },
              ].map((p) => (
                <div
                  key={p.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => setCancelPolicy(p.key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setCancelPolicy(p.key)
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '10px', cursor: 'pointer',
                    border: cancelPolicy === p.key
                      ? '2px solid var(--accent)'
                      : '1px solid var(--border-color)',
                    background: cancelPolicy === p.key
                      ? 'var(--accent-light)'
                      : 'var(--bg-secondary)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.3rem' }}>
                    {p.emoji}
                  </div>
                  <div style={{
                    fontWeight: 700, fontSize: '0.82rem',
                    color: cancelPolicy === p.key
                      ? 'var(--accent)'
                      : 'var(--text-primary)',
                    marginTop: '4px',
                  }}
                  >
                    {p.label}
                  </div>
                  <div style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)', marginTop: '2px',
                  }}
                  >
                    {p.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', fontWeight: 700,
              marginBottom: '6px', fontSize: '0.85rem',
              color: 'var(--text-primary)',
            }}
            >
              🛏️ Rooms Available
            </label>
            <input
              type="number"
              value={roomsAvailable}
              onChange={(e) =>
                setRoomsAvailable(
                  parseInt(e.target.value, 10) || 1
                )
              }
              min={1}
              max={999}
              style={{
                width: '100%', padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <p style={{
              margin: '4px 0 0', fontSize: '0.72rem',
              color: 'var(--text-muted)',
            }}
            >
              Shows &quot;Only X left&quot; when ≤ 5 rooms
            </p>
          </div>

          {['tour', 'activity', 'horse_riding', 'guide'].includes(serviceType) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{
              color: 'var(--text-secondary)', fontSize: '0.9rem',
              fontWeight: 600,
            }}>
              👥 Max Capacity Per Day
            </label>
            <input
              type="number"
              value={maxCapacityPerDay}
              onChange={(e) => setMaxCapacityPerDay(e.target.value)}
              min={1}
              max={9999}
              placeholder="Leave blank for unlimited"
              style={{
                width: '100%', padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Max bookings allowed per day. Blank = unlimited.
            </p>
          </div>
          )}

          {/* ── Car Rental Settings ───────────────────────────────── */}
          {serviceType === 'car_rental' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
              🚗 Car Rental Settings
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Default Pickup Location', val: pickupLocationDefault, set: setPickupLocationDefault, type: 'text' },
                { label: 'Default Dropoff Location', val: dropoffLocationDefault, set: setDropoffLocationDefault, type: 'text' },
                { label: 'Default Pickup Time', val: pickupTimeDefault, set: setPickupTimeDefault, type: 'time' },
                { label: 'Default Dropoff Time', val: dropoffTimeDefault, set: setDropoffTimeDefault, type: 'time' },
              ].map(({ label, val, set, type }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    {label}
                  </label>
                  <input
                    type={type}
                    value={val}
                    onChange={e => set(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Fuel Policy
                </label>
                <select
                  value={fuelPolicyDefault}
                  onChange={e => setFuelPolicyDefault(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none' }}
                >
                  <option value="full_to_full">Full to Full</option>
                  <option value="full_to_empty">Full to Empty</option>
                  <option value="prepaid">Prepaid</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Mileage Limit (km/day, blank = unlimited)
                </label>
                <input
                  type="number"
                  value={mileageLimitDefault}
                  onChange={e => setMileageLimitDefault(e.target.value)}
                  min={0}
                  placeholder="e.g. 200"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            </div>

            {/* Insurance options */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                🛡️ Insurance Options
              </div>
              {insuranceOptionsState.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                  {insuranceOptionsState.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>{opt.name}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>PKR {Number(opt.price_per_day).toLocaleString('en-PK')}/day</span>
                      <button
                        type="button"
                        onClick={() => setInsuranceOptionsState(prev => prev.filter((_, i) => i !== idx))}
                        style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: '8px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Name</label>
                  <input
                    type="text"
                    value={newInsuranceName}
                    onChange={e => setNewInsuranceName(e.target.value)}
                    placeholder="Collision Damage Waiver"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>PKR/day</label>
                  <input
                    type="number"
                    value={newInsurancePrice}
                    onChange={e => setNewInsurancePrice(e.target.value)}
                    placeholder="500"
                    min={0}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.85rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newInsuranceName.trim() || !newInsurancePrice) return
                    setInsuranceOptionsState(prev => [...prev, { name: newInsuranceName.trim(), price_per_day: parseFloat(newInsurancePrice) }])
                    setNewInsuranceName('')
                    setNewInsurancePrice('')
                  }}
                  style={{ padding: '7px 14px', borderRadius: '7px', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
          )}

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
              <option value="hotel">🏨 Hotel</option>
              <option value="tour">🗺️ Tour</option>
              <option value="transport">🚐 Transport</option>
              <option value="activity">🎯 Activity</option>
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

          {/* Room Images Section */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontWeight: 600,
                fontSize: '0.875rem',
                marginBottom: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              📸 Room & Facility Photos
            </label>

            {extraImages.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                  marginBottom: '12px',
                }}
              >
                {extraImages.map((img) => (
                  <div key={img.id} style={{ position: 'relative' }}>
                    <img
                      src={`http://127.0.0.1:8000/uploads/${img.filename}`}
                      alt="Room"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src =
                          'https://placehold.co/200x140/e5e7eb/9ca3af?text=Photo'
                      }}
                      style={{
                        width: '100%',
                        height: '100px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-sm)',
                        display: 'block',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => deleteExtraImage(img.id)}
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: 'rgba(239,68,68,0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        lineHeight: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label
              style={{
                display: 'block',
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                textAlign: 'center',
                cursor: uploadingImage ? 'not-allowed' : 'pointer',
                background: 'var(--bg-secondary)',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
              }}
            >
              {uploadingImage
                ? 'Uploading...'
                : '+ Click to add a room photo (JPG, PNG)'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                disabled={uploadingImage}
                onChange={(e) => uploadExtraImage(e.target.files?.[0])}
              />
            </label>

            {imageMsg && (
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: '0.85rem',
                  color: imageMsg.startsWith('✅')
                    ? 'var(--success)'
                    : 'var(--danger)',
                }}
              >
                {imageMsg}
              </p>
            )}
          </div>

          {/* Availability Calendar */}
          <div style={{ marginBottom: '28px' }}>
            <label
              style={{
                display: 'block',
                fontWeight: 700,
                fontSize: '0.95rem',
                marginBottom: '6px',
                color: 'var(--text-primary)',
              }}
            >
              📅 Manage Availability
            </label>
            <p
              style={{
                margin: '0 0 14px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}
            >
              Select dates to block or unblock. Red dates = unavailable to
              travelers.
            </p>
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                padding: '20px',
              }}
            >
              <AvailabilityCalendar
                listingId={parseInt(listingId, 10)}
                mode="manage"
              />
            </div>
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

