import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import { getImageUrl } from '../utils/image'
import useWindowSize from '../hooks/useWindowSize'

const SERVICE_TYPES = [
  { value: 'hotel', label: '🏨 Hotel' },
  { value: 'tour', label: '🏔️ Tour' },
  { value: 'restaurant', label: '🍽️ Restaurant' },
  { value: 'transport', label: '🚐 Transport' },
  { value: 'activity', label: '🎯 Activity' },
  { value: 'car_rental', label: '🚗 Car Rental' },
  { value: 'bike_rental', label: '🚲 Bike' },
  { value: 'jeep_safari', label: '🚙 Jeep' },
  { value: 'boat_trip', label: '🚢 Boat' },
  { value: 'horse_riding', label: '🐴 Horse' },
  { value: 'guide', label: '🧭 Guide' },
  { value: 'camping', label: '🏕️ Camping' },
  { value: 'medical', label: '🏥 Medical' },
]

const LOCATIONS = [
  'Hunza',
  'Skardu',
  'Gilgit',
  'Nagar',
  'Ghizer',
  'Diamer',
  'Astore',
  'Shigar',
  'Kharmang',
  'Fairy Meadows',
  'Naltar',
  'Deosai',
]

const SORT_OPTIONS = [
  { value: 'relevance', label: '🎯 Most Relevant' },
  { value: 'rating', label: '⭐ Top Rated' },
  { value: 'price_low', label: '💰 Price: Low to High' },
  { value: 'price_high', label: '💰 Price: High to Low' },
  { value: 'newest', label: '🆕 Newest First' },
]

function getServiceColor(type) {
  const colors = {
    hotel: '#2563eb',
    tour: '#16a34a',
    transport: '#d97706',
    activity: '#7c3aed',
    restaurant: '#e11d48',
    car_rental: '#0369a1',
    bike_rental: '#0891b2',
    jeep_safari: '#92400e',
    boat_trip: '#1d4ed8',
    horse_riding: '#7c2d12',
    guide: '#059669',
    camping: '#15803d',
    medical: '#dc2626',
  }
  return colors[type] || '#6b7280'
}

function getPriceLabel(type) {
  if (['tour', 'activity', 'horse_riding', 'guide', 'boat_trip'].includes(type)) return '/person'
  if (['car_rental', 'bike_rental', 'jeep_safari', 'camping'].includes(type)) return '/day'
  if (type === 'restaurant') return '/person'
  return '/night'
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()
  const searchInputRef = useRef(null)
  const suggestionsRef = useRef(null)

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [selectedTypes, setSelectedTypes] = useState(
    searchParams.get('types')?.split(',').filter(Boolean) || [],
  )
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '')
  const [minRating, setMinRating] = useState(searchParams.get('min_rating') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance')
  const [showFilters, setShowFilters] = useState(!isMobile)

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [total, setTotal] = useState(0)

  const debounceRef = useRef(null)

  useEffect(() => {
    if (query || selectedTypes.length > 0 || location) {
      performSearch()
    }
    searchInputRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial URL-driven search only
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query || query.length < 2) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/listings/search/suggestions', { params: { q: query } })
        setSuggestions(res.data.suggestions || [])
      } catch {
        setSuggestions([])
      }
    }, 300)
  }, [query])

  useEffect(() => {
    function handleClick(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function performSearch(overrides = {}) {
    setLoading(true)
    setSearched(true)
    setShowSuggestions(false)

    const params = {
      q: overrides.query ?? query,
      sort_by: overrides.sortBy ?? sortBy,
    }

    const types = overrides.types ?? selectedTypes
    if (types.length > 0) params.service_type = types.join(',')

    const loc = overrides.location ?? location
    if (loc) params.location = loc

    const min = overrides.minPrice ?? minPrice
    if (min) params.min_price = parseFloat(min)

    const max = overrides.maxPrice ?? maxPrice
    if (max) params.max_price = parseFloat(max)

    const rat = overrides.minRating ?? minRating
    if (rat) params.min_rating = parseFloat(rat)

    try {
      const res = await api.get('/listings/search', { params })
      setResults(res.data.results || [])
      setTotal(res.data.total || 0)

      const urlParams = {}
      if (params.q) urlParams.q = params.q
      if (params.service_type) urlParams.types = params.service_type
      if (params.location) urlParams.location = params.location
      if (params.min_price) urlParams.min_price = String(params.min_price)
      if (params.max_price) urlParams.max_price = String(params.max_price)
      if (params.min_rating) urlParams.min_rating = String(params.min_rating)
      if (params.sort_by !== 'relevance') urlParams.sort = params.sort_by
      setSearchParams(urlParams)
    } catch (e) {
      console.error(e)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function handleTypeToggle(type) {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type]
    setSelectedTypes(newTypes)
    performSearch({ types: newTypes })
  }

  function handleSuggestionClick(suggestion) {
    if (suggestion.type === 'location') {
      setLocation(suggestion.text)
      performSearch({ location: suggestion.text })
    } else {
      setQuery(suggestion.text)
      performSearch({ query: suggestion.text })
    }
    setShowSuggestions(false)
  }

  function clearFilters() {
    setSelectedTypes([])
    setLocation('')
    setMinPrice('')
    setMaxPrice('')
    setMinRating('')
    setSortBy('relevance')
    setQuery('')
    setResults([])
    setSearched(false)
    setSearchParams({})
  }

  const hasActiveFilters =
    selectedTypes.length > 0 || location || minPrice || maxPrice || minRating

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
          padding: isMobile ? '24px 16px' : '32px 16px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              ←
            </button>
            <h1
              style={{
                color: 'white',
                margin: 0,
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                fontWeight: 800,
              }}
            >
              🔍 Search GB Tourism
            </h1>
          </div>

          <div style={{ position: 'relative' }} ref={suggestionsRef}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.1rem',
                    pointerEvents: 'none',
                  }}
                >
                  🔍
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search hotels, tours, guides, activities..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') performSearch()
                    if (e.key === 'Escape') setShowSuggestions(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '13px 14px 13px 44px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '1rem',
                    outline: 'none',
                    background: 'white',
                    color: '#111827',
                    boxSizing: 'border-box',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  }}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setSuggestions([])
                      searchInputRef.current?.focus()
                    }}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      fontSize: '1.1rem',
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => performSearch()}
                disabled={loading}
                style={{
                  padding: '13px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#f59e0b',
                  color: 'white',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? '...' : 'Search'}
              </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  zIndex: 200,
                  marginTop: '6px',
                  overflow: 'hidden',
                }}
              >
                {suggestions.map((s, i) => (
                  <div
                    key={`${s.type}-${s.text}-${i}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSuggestionClick(s)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleSuggestionClick(s)
                    }}
                    style={{
                      padding: '11px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      borderBottom: i < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'white'
                    }}
                  >
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#111827' }}>
                        {s.text}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                        {s.type === 'location'
                          ? 'Location'
                          : s.type === 'destination'
                            ? 'Destination'
                            : s.service_type || 'Service'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '20px 16px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : showFilters ? '260px 1fr' : '1fr',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        {(!isMobile || showFilters) && (
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              padding: '20px',
              position: isMobile ? 'relative' : 'sticky',
              top: isMobile ? 'auto' : '90px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}
              >
                🎛️ Filters
              </h3>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    color: '#e11d48',
                    fontWeight: 600,
                  }}
                >
                  Clear All
                </button>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '10px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Service Type
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {SERVICE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => handleTypeToggle(t.value)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '999px',
                      border: selectedTypes.includes(t.value)
                        ? `2px solid ${getServiceColor(t.value)}`
                        : '1px solid var(--border-color)',
                      background: selectedTypes.includes(t.value)
                        ? `${getServiceColor(t.value)}18`
                        : 'var(--bg-secondary)',
                      color: selectedTypes.includes(t.value)
                        ? getServiceColor(t.value)
                        : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: selectedTypes.includes(t.value) ? 700 : 400,
                      fontSize: '0.75rem',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                📍 Location
              </label>
              <select
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value)
                  performSearch({ location: e.target.value })
                }}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <option value="">All Locations</option>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                💰 Price Range (PKR)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  onBlur={() => performSearch()}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  onBlur={() => performSearch()}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                {[
                  { label: 'Budget', min: 0, max: 3000 },
                  { label: 'Mid', min: 3000, max: 8000 },
                  { label: 'Luxury', min: 8000, max: '' },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setMinPrice(String(p.min))
                      setMaxPrice(String(p.max))
                      performSearch({
                        minPrice: p.min,
                        maxPrice: p.max || undefined,
                      })
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '999px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                ⭐ Minimum Rating
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[0, 3, 4, 4.5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      const val = r === 0 ? '' : String(r)
                      setMinRating(val)
                      performSearch({ minRating: val })
                    }}
                    style={{
                      flex: 1,
                      padding: '7px 4px',
                      borderRadius: '8px',
                      border:
                        minRating === (r === 0 ? '' : String(r))
                          ? '2px solid #f59e0b'
                          : '1px solid var(--border-color)',
                      background:
                        minRating === (r === 0 ? '' : String(r)) ? '#fef3c7' : 'var(--bg-secondary)',
                      color:
                        minRating === (r === 0 ? '' : String(r)) ? '#d97706' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                    }}
                  >
                    {r === 0 ? 'All' : `${r}★`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  performSearch({ sortBy: e.target.value })
                }}
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                {SORT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              {searched && (
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {loading ? (
                    <span>Searching...</span>
                  ) : (
                    <span>
                      <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> result
                      {total !== 1 ? 's' : ''}
                      {query && (
                        <span>
                          {' '}
                          for <strong>&quot;{query}&quot;</strong>
                        </span>
                      )}
                    </span>
                  )}
                </p>
              )}
            </div>

            {isMobile && (
              <button
                type="button"
                onClick={() => setShowFilters((p) => !p)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: hasActiveFilters ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                  background: hasActiveFilters ? 'var(--accent-light)' : 'var(--bg-card)',
                  color: hasActiveFilters ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                🎛️ Filters
                {hasActiveFilters && (
                  <span
                    style={{
                      background: 'var(--accent)',
                      color: 'white',
                      borderRadius: '50%',
                      width: 16,
                      height: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                    }}
                  >
                    {selectedTypes.length +
                      (location ? 1 : 0) +
                      (minPrice ? 1 : 0) +
                      (maxPrice ? 1 : 0) +
                      (minRating ? 1 : 0)}
                  </span>
                )}
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {selectedTypes.map((t) => (
                <span
                  key={t}
                  role="button"
                  tabIndex={0}
                  style={{
                    background: `${getServiceColor(t)}18`,
                    color: getServiceColor(t),
                    border: `1px solid ${getServiceColor(t)}44`,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleTypeToggle(t)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleTypeToggle(t)
                  }}
                >
                  {SERVICE_TYPES.find((s) => s.value === t)?.label || t} ×
                </span>
              ))}
              {location && (
                <span
                  role="button"
                  tabIndex={0}
                  style={{
                    background: '#dbeafe',
                    color: '#2563eb',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onClick={() => {
                    setLocation('')
                    performSearch({ location: '' })
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setLocation('')
                      performSearch({ location: '' })
                    }
                  }}
                >
                  📍 {location} ×
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span
                  role="button"
                  tabIndex={0}
                  style={{
                    background: '#dcfce7',
                    color: '#16a34a',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onClick={() => {
                    setMinPrice('')
                    setMaxPrice('')
                    performSearch({ minPrice: '', maxPrice: '' })
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setMinPrice('')
                      setMaxPrice('')
                      performSearch({ minPrice: '', maxPrice: '' })
                    }
                  }}
                >
                  💰 PKR {minPrice || '0'}
                  {maxPrice ? ` - ${maxPrice}` : '+'} ×
                </span>
              )}
              {minRating && (
                <span
                  role="button"
                  tabIndex={0}
                  style={{
                    background: '#fef3c7',
                    color: '#d97706',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onClick={() => {
                    setMinRating('')
                    performSearch({ minRating: '' })
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setMinRating('')
                      performSearch({ minRating: '' })
                    }
                  }}
                >
                  ⭐ {minRating}+ ×
                </span>
              )}
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    padding: '16px',
                    display: 'flex',
                    gap: '14px',
                    animation: 'pulse 1.5s infinite',
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '10px',
                      background: 'var(--bg-secondary)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        height: 16,
                        width: '60%',
                        background: 'var(--bg-secondary)',
                        borderRadius: 4,
                        marginBottom: 8,
                      }}
                    />
                    <div
                      style={{
                        height: 12,
                        width: '40%',
                        background: 'var(--bg-secondary)',
                        borderRadius: 4,
                        marginBottom: 6,
                      }}
                    />
                    <div
                      style={{
                        height: 12,
                        width: '80%',
                        background: 'var(--bg-secondary)',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                padding: '60px 20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔍</div>
              <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>No results found</h3>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  margin: '0 0 20px',
                }}
              >
                Try different keywords or remove some filters
              </p>
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  background: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 24px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Clear All Filters
              </button>
            </div>
          )}

          {!loading && !searched && (
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                padding: '40px 24px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🗺️</div>
              <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>Search for anything in GB</h3>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  margin: '0 0 20px',
                }}
              >
                Hotels, tours, restaurants, guides, jeeps, horses & more
              </p>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {[
                  'Hunza Hotels',
                  'Skardu Tours',
                  'Jeep Safari',
                  'Horse Riding',
                  'Local Guide',
                  'Camping',
                  'Polo Events',
                  'Boat Trip',
                ].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setQuery(term)
                      performSearch({ query: term })
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {results.map((item) => {
                const color = getServiceColor(item.service_type)
                const priceLabel = getPriceLabel(item.service_type)
                const typeInfo = SERVICE_TYPES.find((t) => t.value === item.service_type)
                const typeShort = typeInfo?.label?.split(' ')[0] || '🏢'

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/listing/${item.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') navigate(`/listing/${item.id}`)
                    }}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      display: 'flex',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                    }}
                  >
                    <div
                      style={{
                        width: isMobile ? 90 : 130,
                        flexShrink: 0,
                        overflow: 'hidden',
                        position: 'relative',
                        background: `${color}18`,
                      }}
                    >
                      <img
                        src={getImageUrl(item.image_url)}
                        alt={item.title}
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = `https://placehold.co/130x100/${color.replace(
                            '#',
                            '',
                          )}/ffffff?text=${encodeURIComponent(typeShort)}`
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          minHeight: 100,
                          display: 'block',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          background: color,
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                        }}
                      >
                        {typeShort}
                      </div>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minWidth: 0,
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: '0 0 4px',
                            fontWeight: 700,
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.title}
                        </h3>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '4px',
                          }}
                        >
                          📍 {item.location}
                        </div>
                        {item.description && (
                          <p
                            style={{
                              margin: '0 0 8px',
                              fontSize: '0.78rem',
                              color: 'var(--text-muted)',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {item.average_rating > 0 ? (
                            <>
                              <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>
                                {'★'.repeat(Math.round(item.average_rating))}
                              </span>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {item.average_rating.toFixed(1)} ({item.review_count})
                              </span>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              No reviews yet
                            </span>
                          )}
                        </div>

                        <div style={{ fontWeight: 800, fontSize: '1rem', color }}>
                          PKR {item.price_per_night?.toLocaleString('en-PK')}
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 400,
                              color: 'var(--text-muted)',
                              marginLeft: '2px',
                            }}
                          >
                            {priceLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
