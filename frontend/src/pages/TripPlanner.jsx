import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import useWindowSize from '../hooks/useWindowSize'

const DESTINATIONS = [
  'Hunza', 'Skardu', 'Gilgit', 'Nagar',
  'Astore', 'Ghizer', 'Shigar', 'Diamer',
  'Kharmang', 'Fairy Meadows', 'Deosai', 'Naltar'
]

const DURATIONS = [
  { days: 2, label: '2 Days' },
  { days: 3, label: '3 Days' },
  { days: 5, label: '5 Days' },
  { days: 7, label: '1 Week' },
  { days: 10, label: '10 Days' },
  { days: 14, label: '2 Weeks' },
]

const BUDGET_TIERS = [
  {
    key: 'budget', label: 'Budget',
    emoji: '💚', desc: 'PKR 1,500 - 3,000/night',
    color: '#16a34a', bg: '#dcfce7'
  },
  {
    key: 'standard', label: 'Standard',
    emoji: '💛', desc: 'PKR 3,000 - 8,000/night',
    color: '#d97706', bg: '#fef3c7'
  },
  {
    key: 'luxury', label: 'Luxury',
    emoji: '💎', desc: 'PKR 8,000+/night',
    color: '#7c3aed', bg: '#ede9fe'
  },
]

function ServiceCard({
  item, type, onSwap, alternatives,
  duration, isSelected
}) {
  const [showAlts, setShowAlts] = useState(false)
  const navigate = useNavigate()

  if (!item) return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-md)',
      border: '2px dashed var(--border-color)',
      padding: '24px', textAlign: 'center',
      color: 'var(--text-muted)'
    }}>
      <div style={{fontSize: '2rem', marginBottom: '8px'}}>
        {type === 'hotel' ? '🏨'
          : type === 'transport' ? '🚐' : '🎯'}
      </div>
      <p style={{margin: 0, fontSize: '0.85rem'}}>
        No {type} found for this destination
      </p>
    </div>
  )

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-md)',
      border: isSelected
        ? '2px solid var(--accent)'
        : '1px solid var(--border-color)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{position: 'relative'}}>
        <img
          src={item.image_url
            ? 'http://127.0.0.1:8000/uploads/'
              + item.image_url
            : 'https://placehold.co/400x160/e5e7eb/9ca3af?text=GB'
          }
          alt={item.title}
          onError={e => {
            e.target.onerror = null
            e.target.src =
              'https://placehold.co/400x160/e5e7eb/9ca3af?text=GB'
          }}
          style={{
            width: '100%', height: '140px',
            objectFit: 'cover', display: 'block'
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.5), transparent)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '8px', left: '12px',
          color: 'white', fontWeight: 800,
          fontSize: '1rem'
        }}>
          PKR {item.total_price?.toLocaleString('en-PK')}
          <span style={{
            fontSize: '0.72rem', fontWeight: 400,
            marginLeft: '4px', opacity: 0.85
          }}>
            total
          </span>
        </div>
      </div>

      <div style={{padding: '12px 14px'}}>
        <div style={{
          fontWeight: 700, fontSize: '0.9rem',
          color: 'var(--text-primary)', marginBottom: '3px'
        }}>
          {item.title}
        </div>
        <div style={{
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          marginBottom: '10px'
        }}>
          📍 {item.location} ·
          PKR {item.price_per_night
            ?.toLocaleString('en-PK')}/night
        </div>

        <div style={{
          display: 'flex', gap: '8px'
        }}>
          <button
            onClick={() =>
              navigate(`/listing/${item.id}`)
            }
            style={{
              flex: 1, padding: '7px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: 600,
              fontSize: '0.8rem'
            }}
          >
            View →
          </button>
          {alternatives?.length > 0 && (
            <button
              onClick={() => setShowAlts(p => !p)}
              style={{
                flex: 1, padding: '7px',
                borderRadius: '8px',
                border: '1px solid var(--accent)',
                background: 'var(--accent-light)',
                color: 'var(--accent)',
                cursor: 'pointer', fontWeight: 600,
                fontSize: '0.8rem'
              }}
            >
              🔄 Swap
            </button>
          )}
        </div>

        {showAlts && alternatives?.length > 0 && (
          <div style={{
            marginTop: '12px', padding: '10px',
            background: 'var(--bg-secondary)',
            borderRadius: '8px'
          }}>
            <p style={{
              margin: '0 0 8px', fontSize: '0.75rem',
              fontWeight: 700, color: 'var(--text-muted)',
              textTransform: 'uppercase'
            }}>
              Choose alternative:
            </p>
            {alternatives.map(alt => (
              <div
                key={alt.id}
                onClick={() => {
                  onSwap(alt)
                  setShowAlts(false)
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  cursor: 'pointer', marginBottom: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{
                    fontWeight: 600, fontSize: '0.82rem',
                    color: 'var(--text-primary)'
                  }}>
                    {alt.title}
                  </div>
                  <div style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-secondary)'
                  }}>
                    📍 {alt.location}
                  </div>
                </div>
                <div style={{
                  fontWeight: 700, fontSize: '0.82rem',
                  color: 'var(--accent)'
                }}>
                  PKR {alt.total_price
                    ?.toLocaleString('en-PK')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function buildItinerary(destination, duration, hotel, transport, activities) {
  if (duration <= 1) {
    return [{
      day: 1, icon: '🗺️', title: 'Day Trip',
      items: [
        transport ? `Travel via ${transport.title}` : `Travel to ${destination}`,
        ...activities.slice(0, 3).map(a => a.title),
        'Return journey'
      ]
    }]
  }

  const days = []

  days.push({
    day: 1, icon: '🚐', title: 'Arrival & Check-in',
    items: [
      transport
        ? `${transport.title} to ${destination}`
        : `Travel to ${destination}`,
      hotel
        ? `Check-in at ${hotel.title}`
        : 'Check-in at accommodation'
    ]
  })

  const middleCount = duration - 2
  for (let i = 0; i < middleCount; i++) {
    const act = activities[i] || null
    days.push({
      day: i + 2,
      icon: act ? '🎯' : '🗺️',
      title: act ? act.title : 'Free Exploration',
      items: act
        ? [
            act.location ? `📍 ${act.location}` : null,
            `PKR ${(act.price_per_night || 0).toLocaleString('en-PK')}`
          ].filter(Boolean)
        : [
            `Explore ${destination}`,
            'Local markets, viewpoints & scenic spots'
          ]
    })
  }

  days.push({
    day: duration, icon: '🏁', title: 'Departure',
    items: [
      hotel ? `Check-out from ${hotel.title}` : 'Hotel check-out',
      transport ? `Return via ${transport.title}` : 'Return journey'
    ]
  })

  return days
}

function WebResultCard({ result }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-md)',
      border: '2px dashed #d1d5db',
      padding: '14px',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute', top: '8px', right: '8px',
        background: '#f3f4f6',
        border: '1px solid #d1d5db',
        borderRadius: '999px', padding: '2px 8px',
        fontSize: '0.65rem', fontWeight: 700,
        color: '#6b7280'
      }}>
        🌐 Web Result
      </div>
      <div style={{
        fontWeight: 700, fontSize: '0.875rem',
        color: 'var(--text-primary)',
        marginBottom: '6px', paddingRight: '72px'
      }}>
        {result.name}
      </div>
      <p style={{
        margin: '0 0 10px', fontSize: '0.78rem',
        color: 'var(--text-secondary)',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {result.description || 'No description available.'}
      </p>
      {result.url && (
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            background: '#f9fafb',
            color: '#374151',
            fontSize: '0.78rem',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          Visit Website →
        </a>
      )}
    </div>
  )
}

export default function TripPlanner() {
  const { isMobile } = useWindowSize()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [destination, setDestination] = useState('')
  const [customDest, setCustomDest] = useState('')
  const [duration, setDuration] = useState(null)
  const [budgetTier, setBudgetTier] = useState('')
  const [totalBudget, setTotalBudget] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [plan, setPlan] = useState(null)
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [selectedTransport, setSelectedTransport] =
    useState(null)
  const [selectedActivities, setSelectedActivities] =
    useState([])
  const [alternatives, setAlternatives] = useState({})

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(null)
  const [tripTitle, setTripTitle] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [notes, setNotes] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const finalDest = customDest.trim() || destination

  async function generatePlan() {
    if (!finalDest) {
      setError('Please select or enter a destination')
      return
    }
    if (!duration) {
      setError('Please select trip duration')
      return
    }
    if (!budgetTier) {
      setError('Please select a budget tier')
      return
    }
    if (!totalBudget || parseFloat(totalBudget) < 1000) {
      setError('Please enter a valid budget (min PKR 1,000)')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api.post(
        '/trip-planner/suggest', {
          destination: finalDest,
          duration_days: duration,
          budget_tier: budgetTier,
          total_budget: parseFloat(totalBudget),
          start_date: startDate || null,
          end_date: endDate || null
        }
      )
      setPlan(res.data)
      setSelectedHotel(res.data.hotel)
      setSelectedTransport(res.data.transport)
      setSelectedActivities(res.data.activities || [])
      setAlternatives(res.data.alternatives || {})
      setTripTitle(
        `${finalDest} Trip - ${duration} Days`
      )
      setStep(2)
    } catch (e) {
      setError(
        e.response?.data?.detail ||
        'Could not generate plan'
      )
    } finally {
      setLoading(false)
    }
  }

  function toggleActivity(activity) {
    setSelectedActivities(prev => {
      const exists = prev.find(a => a.id === activity.id)
      if (exists) {
        return prev.filter(a => a.id !== activity.id)
      }
      return [...prev, activity]
    })
  }

  function calcTotal() {
    const hotel = selectedHotel?.price_per_night
      ? selectedHotel.price_per_night * (duration || 1)
      : 0
    const transport =
      selectedTransport?.price_per_night || 0
    const acts = selectedActivities.reduce(
      (s, a) => s + (a.price_per_night || 0), 0
    )
    return hotel + transport + acts
  }

  async function savePlan() {
    if (!tripTitle.trim()) {
      alert('Please enter a title for your trip')
      return
    }
    setSaving(true)
    try {
      const res = await api.post('/trip-planner/save', {
        title: tripTitle,
        destination: finalDest,
        duration_days: duration,
        budget_tier: budgetTier,
        total_budget: parseFloat(totalBudget),
        estimated_cost: calcTotal(),
        hotel_id: selectedHotel?.id || null,
        transport_id: selectedTransport?.id || null,
        activity_ids: selectedActivities.map(a => a.id),
        notes: notes || null,
        start_date: startDate || null,
        end_date: endDate || null,
        is_public: isPublic
      })
      setSaved(res.data)
      setStep(3)
    } catch (e) {
      alert('Failed to save plan')
    } finally {
      setSaving(false)
    }
  }

  const totalEstimate = calcTotal()
  const remaining = parseFloat(totalBudget || 0) -
    totalEstimate
  const tierInfo = BUDGET_TIERS.find(
    t => t.key === budgetTier
  )

  // Step 1: Form
  if (step === 1) return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingBottom: '48px'
    }}>
      <div style={{
        background:
          'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
        padding: '40px 16px 80px'
      }}>
        <div style={{
          maxWidth: '700px', margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '999px',
            padding: '7px 18px', marginBottom: '20px',
            fontSize: '0.82rem', fontWeight: 700,
            color: 'white'
          }}>
            🗺️ Smart Trip Planner
          </div>
          <h1 style={{
            color: 'white', margin: '0 0 10px',
            fontSize: isMobile ? '1.6rem' : '2rem',
            fontWeight: 800, letterSpacing: '-0.02em'
          }}>
            Plan Your Perfect GB Trip
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.75)',
            margin: 0, fontSize: '0.95rem'
          }}>
            Tell us your budget and we'll build your
            complete itinerary
          </p>
        </div>
      </div>

      <div style={{
        maxWidth: '700px', margin: '-56px auto 0',
        padding: '0 16px'
      }}>
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          padding: isMobile ? '20px 16px' : '32px'
        }}>

          {error && (
            <div style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '10px 14px', borderRadius: '8px',
              marginBottom: '20px', fontWeight: 600,
              fontSize: '0.875rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{marginBottom: '24px'}}>
            <label style={{
              display: 'block', fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              marginBottom: '12px'
            }}>
              📍 Where do you want to go?
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns:
                isMobile
                  ? 'repeat(3, 1fr)'
                  : 'repeat(4, 1fr)',
              gap: '8px', marginBottom: '10px'
            }}>
              {DESTINATIONS.map(d => (
                <button key={d} type="button"
                  onClick={() => {
                    setDestination(d)
                    setCustomDest('')
                  }}
                  style={{
                    padding: '10px 6px',
                    borderRadius: '10px',
                    border: destination === d
                      ? '2px solid var(--accent)'
                      : '1px solid var(--border-color)',
                    background: destination === d
                      ? 'var(--accent-light)'
                      : 'var(--bg-secondary)',
                    color: destination === d
                      ? 'var(--accent)'
                      : 'var(--text-secondary)',
                    cursor: 'pointer', fontWeight: 600,
                    fontSize: isMobile
                      ? '0.72rem' : '0.82rem',
                    textAlign: 'center'
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or type a custom destination..."
              value={customDest}
              onChange={e => {
                setCustomDest(e.target.value)
                setDestination('')
              }}
              style={{
                width: '100%', padding: '11px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                boxSizing: 'border-box', outline: 'none'
              }}
            />
          </div>

          <div style={{marginBottom: '24px'}}>
            <label style={{
              display: 'block', fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              marginBottom: '12px'
            }}>
              🗓️ How long is your trip?
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px'
            }}>
              {DURATIONS.map(d => (
                <button key={d.days} type="button"
                  onClick={() => setDuration(d.days)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '10px',
                    border: duration === d.days
                      ? '2px solid var(--accent)'
                      : '1px solid var(--border-color)',
                    background: duration === d.days
                      ? 'var(--accent-light)'
                      : 'var(--bg-secondary)',
                    color: duration === d.days
                      ? 'var(--accent)'
                      : 'var(--text-secondary)',
                    cursor: 'pointer', fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{marginBottom: '24px'}}>
            <label style={{
              display: 'block', fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              marginBottom: '12px'
            }}>
              💰 What is your budget style?
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px'
            }}>
              {BUDGET_TIERS.map(t => (
                <div key={t.key}
                  onClick={() => setBudgetTier(t.key)}
                  style={{
                    padding: '16px 12px',
                    borderRadius: '12px',
                    border: budgetTier === t.key
                      ? '2px solid ' + t.color
                      : '1px solid var(--border-color)',
                    background: budgetTier === t.key
                      ? t.bg : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{
                    fontSize: '1.6rem',
                    marginBottom: '6px'
                  }}>
                    {t.emoji}
                  </div>
                  <div style={{
                    fontWeight: 700, fontSize: '0.875rem',
                    color: budgetTier === t.key
                      ? t.color : 'var(--text-primary)',
                    marginBottom: '3px'
                  }}>
                    {t.label}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)'
                  }}>
                    {t.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{marginBottom: '24px'}}>
            <label style={{
              display: 'block', fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              marginBottom: '12px'
            }}>
              🏦 Your total trip budget (PKR)
            </label>
            <div style={{position: 'relative'}}>
              <span style={{
                position: 'absolute', left: '14px',
                top: '50%', transform: 'translateY(-50%)',
                fontWeight: 700, color: 'var(--text-muted)',
                fontSize: '0.9rem'
              }}>
                PKR
              </span>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={totalBudget}
                onChange={e =>
                  setTotalBudget(e.target.value)
                }
                min="1000"
                style={{
                  width: '100%', padding: '12px 14px 12px 56px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem', fontWeight: 700,
                  boxSizing: 'border-box', outline: 'none'
                }}
              />
            </div>
            <div style={{
              display: 'flex', gap: '8px',
              marginTop: '8px', flexWrap: 'wrap'
            }}>
              {[20000, 50000, 100000, 200000].map(amt => (
                <button key={amt} type="button"
                  onClick={() =>
                    setTotalBudget(String(amt))
                  }
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    border: '1px solid var(--border-color)',
                    background:
                      totalBudget === String(amt)
                        ? 'var(--accent)'
                        : 'var(--bg-secondary)',
                    color:
                      totalBudget === String(amt)
                        ? 'white'
                        : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.78rem', fontWeight: 600
                  }}
                >
                  {(amt / 1000).toFixed(0)}K
                </button>
              ))}
            </div>
          </div>

          <div style={{marginBottom: '28px'}}>
            <label style={{
              display: 'block', fontWeight: 700,
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              marginBottom: '12px'
            }}>
              📅 Travel dates{' '}
              <span style={{
                fontWeight: 400, fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}>
                (optional)
              </span>
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}>
              <div>
                <label style={{
                  display: 'block', fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginBottom: '5px', fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  Start Date
                </label>
                <input type="date"
                  value={startDate} min={today}
                  onChange={e =>
                    setStartDate(e.target.value)
                  }
                  style={{
                    width: '100%', padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box', outline: 'none',
                    fontFamily: 'var(--font-primary)'
                  }}
                />
              </div>
              <div>
                <label style={{
                  display: 'block', fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginBottom: '5px', fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  End Date
                </label>
                <input type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={e =>
                    setEndDate(e.target.value)
                  }
                  style={{
                    width: '100%', padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box', outline: 'none',
                    fontFamily: 'var(--font-primary)'
                  }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={generatePlan}
            disabled={loading}
            style={{
              width: '100%', padding: '15px',
              borderRadius: '12px', border: 'none',
              background:
                'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
              color: 'white', fontWeight: 800,
              fontSize: '1.05rem', cursor: 'pointer',
              opacity: loading ? 0.75 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {loading
              ? '✨ Building your plan...'
              : '🗺️ Generate My Trip Plan →'}
          </button>
        </div>
      </div>
    </div>
  )

  // Step 2: Results
  if (step === 2 && plan) return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      paddingBottom: '48px'
    }}>

      <div style={{
        background:
          'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
        padding: '32px 16px 80px'
      }}>
        <div style={{
          maxWidth: '900px', margin: '0 auto'
        }}>
          <button
            onClick={() => setStep(1)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white', borderRadius: '8px',
              padding: '7px 16px', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 600,
              marginBottom: '16px'
            }}
          >
            ← Edit Plan
          </button>
          <h1 style={{
            color: 'white', margin: '0 0 6px',
            fontSize: isMobile ? '1.4rem' : '1.8rem',
            fontWeight: 800
          }}>
            ✨ Your {finalDest} Trip Plan
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.75)',
            margin: '0 0 20px', fontSize: '0.9rem'
          }}>
            {duration} days ·
            {tierInfo?.emoji} {tierInfo?.label} ·
            Budget: PKR {parseFloat(totalBudget)
              .toLocaleString('en-PK')}
          </p>

          <div style={{
            display: 'inline-flex',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '14px', overflow: 'hidden'
          }}>
            {[
              {
                label: 'Estimated Cost',
                value: 'PKR ' +
                  totalEstimate.toLocaleString('en-PK'),
                color: 'white'
              },
              {
                label: 'Remaining',
                value: 'PKR ' +
                  Math.max(0, remaining)
                    .toLocaleString('en-PK'),
                color: remaining >= 0
                  ? '#86efac' : '#fca5a5'
              },
            ].map((s, i, arr) => (
              <div key={s.label} style={{
                padding: '12px 20px',
                textAlign: 'center',
                borderRight: i < arr.length - 1
                  ? '1px solid rgba(255,255,255,0.12)'
                  : 'none'
              }}>
                <div style={{
                  fontSize: '1.1rem', fontWeight: 800,
                  color: s.color
                }}>
                  {s.value}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.6)',
                  marginTop: '2px'
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '900px',
        margin: '-48px auto 0',
        padding: '0 16px'
      }}>

        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: isMobile
            ? 'repeat(2, 1fr)'
            : 'repeat(4, 1fr)',
          gap: '12px'
        }}>
          {[
            {
              label: '🏨 Hotel',
              value: selectedHotel
                ? selectedHotel.price_per_night * (duration || 1)
                : 0,
              color: '#2563eb'
            },
            {
              label: '🚐 Transport',
              value: selectedTransport?.price_per_night || 0,
              color: '#d97706'
            },
            {
              label: '🎯 Activities',
              value: selectedActivities.reduce(
                (s, a) => s + (a.price_per_night || 0), 0
              ),
              color: '#7c3aed'
            },
            {
              label: '💰 Total',
              value: totalEstimate,
              color: remaining >= 0
                ? '#16a34a' : '#dc2626'
            },
          ].map(item => (
            <div key={item.label}
              style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginBottom: '3px'
              }}>
                {item.label}
              </div>
              <div style={{
                fontSize: '0.95rem', fontWeight: 800,
                color: item.color
              }}>
                PKR {item.value.toLocaleString('en-PK')}
              </div>
            </div>
          ))}
        </div>

        {plan.db_results_found === false && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '0.875rem',
            color: '#92400e',
            fontWeight: 500
          }}>
            ⚠️ We don't have listings for this destination yet. Showing web results to help you plan.
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{
            margin: '0 0 12px', fontWeight: 700,
            fontSize: '1rem', color: 'var(--text-primary)',
            display: 'flex', alignItems: 'center',
            gap: '8px'
          }}>
            🏨 Your Stay
            <span style={{
              fontSize: '0.75rem', fontWeight: 400,
              color: 'var(--text-muted)'
            }}>
              ({duration} nights)
            </span>
          </h3>
          <ServiceCard
            item={selectedHotel}
            type="hotel"
            duration={duration}
            alternatives={alternatives.hotels}
            onSwap={h => setSelectedHotel({
              ...h,
              total_price: (h.price_per_night || 0) * duration
            })}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{
            margin: '0 0 12px', fontWeight: 700,
            fontSize: '1rem', color: 'var(--text-primary)'
          }}>
            🚐 Transport
          </h3>
          <ServiceCard
            item={selectedTransport}
            type="transport"
            duration={1}
            alternatives={alternatives.transports}
            onSwap={t => setSelectedTransport(t)}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            margin: '0 0 6px', fontWeight: 700,
            fontSize: '1rem', color: 'var(--text-primary)'
          }}>
            🎯 Tours & Activities
          </h3>
          <p style={{
            margin: '0 0 12px', fontSize: '0.82rem',
            color: 'var(--text-secondary)'
          }}>
            Tap to select/deselect activities
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? '1fr' : 'repeat(2, 1fr)',
            gap: '12px', marginBottom: '12px'
          }}>
            {selectedActivities.map(a => (
              <div
                key={a.id}
                onClick={() => toggleActivity(a)}
                style={{
                  background: 'var(--accent-light)',
                  border: '2px solid var(--accent)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{
                    fontWeight: 700, fontSize: '0.875rem',
                    color: 'var(--text-primary)'
                  }}>
                    ✓ {a.title}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                  }}>
                    📍 {a.location} · PKR {
                      a.price_per_night
                        ?.toLocaleString('en-PK')
                    }
                  </div>
                </div>
                <span style={{
                  color: 'var(--accent)',
                  fontWeight: 700, fontSize: '1rem'
                }}>×</span>
              </div>
            ))}
          </div>

          {alternatives.activities?.length > 0 && (
            <div>
              <p style={{
                margin: '0 0 8px', fontSize: '0.78rem',
                color: 'var(--text-muted)', fontWeight: 700,
                textTransform: 'uppercase'
              }}>
                + Add more activities:
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? '1fr' : 'repeat(2, 1fr)',
                gap: '8px'
              }}>
                {alternatives.activities.map(a => (
                  <div
                    key={a.id}
                    onClick={() => toggleActivity(a)}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        color: 'var(--text-primary)'
                      }}>
                        {a.title}
                      </div>
                      <div style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-secondary)'
                      }}>
                        📍 {a.location}
                      </div>
                    </div>
                    <div style={{
                      fontWeight: 700, fontSize: '0.8rem',
                      color: 'var(--accent)'
                    }}>
                      + PKR {a.price_per_night
                        ?.toLocaleString('en-PK')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedActivities.length === 0 &&
            (!alternatives.activities ||
              alternatives.activities.length === 0) && (
            <div style={{
              textAlign: 'center', padding: '24px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '2px dashed var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '0.875rem'
            }}>
              No tours or activities found for{' '}
              {finalDest}. Add services to see them here!
            </div>
          )}
        </div>

        {/* Day-by-Day Itinerary */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            margin: '0 0 16px', fontWeight: 700,
            fontSize: '1rem', color: 'var(--text-primary)'
          }}>
            📅 Day-by-Day Itinerary
          </h3>
          <div style={{ position: 'relative', paddingLeft: '8px' }}>
            <div style={{
              position: 'absolute', left: '19px',
              top: '20px', bottom: '20px',
              width: '2px',
              background:
                'linear-gradient(to bottom, #1e3a5f, #0ea5e9)',
              opacity: 0.35
            }} />
            {buildItinerary(
              finalDest, duration,
              selectedHotel, selectedTransport,
              selectedActivities
            ).map(day => (
              <div key={day.day} style={{
                display: 'flex', gap: '14px',
                marginBottom: '14px',
                position: 'relative'
              }}>
                <div style={{
                  width: '40px', height: '40px',
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                  color: 'white', flexShrink: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}>
                  <span style={{
                    fontSize: '0.55rem', fontWeight: 600,
                    opacity: 0.8, lineHeight: 1
                  }}>
                    Day
                  </span>
                  <span style={{
                    fontSize: '0.82rem', fontWeight: 800,
                    lineHeight: 1
                  }}>
                    {day.day}
                  </span>
                </div>
                <div style={{
                  flex: 1,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{
                    fontWeight: 700, fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    marginBottom: '6px'
                  }}>
                    {day.icon} {day.title}
                  </div>
                  {day.items.map((item, idx) => (
                    <div key={idx} style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      marginTop: '3px', paddingLeft: '8px',
                      borderLeft:
                        '2px solid var(--accent-light)'
                    }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* External Web Suggestions */}
        {plan.external_suggestions && (
          plan.external_suggestions.hotels?.length > 0 ||
          plan.external_suggestions.transports?.length > 0 ||
          plan.external_suggestions.activities?.length > 0
        ) && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              margin: '0 0 4px', fontWeight: 700,
              fontSize: '1rem', color: 'var(--text-primary)'
            }}>
              🌐 More Options Found on the Web
            </h3>
            <p style={{
              margin: '0 0 12px', fontSize: '0.82rem',
              color: 'var(--text-secondary)'
            }}>
              {plan.external_suggestions.note}
            </p>
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '0.82rem',
              color: '#92400e'
            }}>
              📋 These listings are not on GB Tourism yet.
              You can view them on their own website.{' '}
              <strong>
                Contact us to add your business to
                GB Tourism.
              </strong>
            </div>

            {plan.external_suggestions.hotels?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  margin: '0 0 10px', fontWeight: 700,
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)'
                }}>
                  🏨 Hotels
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? '1fr' : 'repeat(2, 1fr)',
                  gap: '12px'
                }}>
                  {plan.external_suggestions.hotels.map(
                    (result, idx) => (
                      <WebResultCard
                        key={idx} result={result}
                      />
                    )
                  )}
                </div>
              </div>
            )}

            {plan.external_suggestions.transports?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  margin: '0 0 10px', fontWeight: 700,
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)'
                }}>
                  🚐 Transport
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? '1fr' : 'repeat(2, 1fr)',
                  gap: '12px'
                }}>
                  {plan.external_suggestions.transports.map(
                    (result, idx) => (
                      <WebResultCard
                        key={idx} result={result}
                      />
                    )
                  )}
                </div>
              </div>
            )}

            {plan.external_suggestions.activities?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{
                  margin: '0 0 10px', fontWeight: 700,
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)'
                }}>
                  🎯 Tours & Activities
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? '1fr' : 'repeat(2, 1fr)',
                  gap: '12px'
                }}>
                  {plan.external_suggestions.activities.map(
                    (result, idx) => (
                      <WebResultCard
                        key={idx} result={result}
                      />
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          padding: '24px'
        }}>
          <h3 style={{
            margin: '0 0 16px', fontWeight: 700,
            fontSize: '1rem', color: 'var(--text-primary)'
          }}>
            💾 Save Your Trip Plan
          </h3>

          <div style={{ marginBottom: '14px' }}>
            <label style={{
              display: 'block', fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '6px'
            }}>
              Trip Title
            </label>
            <input
              type="text"
              value={tripTitle}
              onChange={e => setTripTitle(e.target.value)}
              placeholder="e.g. Hunza Trip - Summer 2026"
              style={{
                width: '100%', padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                boxSizing: 'border-box', outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{
              display: 'block', fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '6px'
            }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes about your trip..."
              rows={2}
              style={{
                width: '100%', padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                boxSizing: 'border-box', outline: 'none',
                resize: 'vertical',
                fontFamily: 'var(--font-primary)'
              }}
            />
          </div>

          <div style={{
            display: 'flex', alignItems: 'center',
            gap: '12px', marginBottom: '16px',
            padding: '12px 14px',
            background: 'var(--bg-secondary)',
            borderRadius: '8px'
          }}>
            <div
              onClick={() => setIsPublic(p => !p)}
              style={{
                width: 44, height: 24,
                borderRadius: '12px',
                background: isPublic
                  ? 'var(--accent)' : 'var(--border-color)',
                position: 'relative', cursor: 'pointer',
                transition: 'background 0.2s',
                flexShrink: 0
              }}
            >
              <div style={{
                position: 'absolute',
                top: '3px',
                left: isPublic ? '23px' : '3px',
                width: 18, height: 18,
                borderRadius: '50%',
                background: 'white',
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }} />
            </div>
            <div>
              <div style={{
                fontWeight: 600, fontSize: '0.875rem',
                color: 'var(--text-primary)'
              }}>
                Share with others
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
              }}>
                Generate a shareable link for your plan
              </div>
            </div>
          </div>

          <button
            onClick={savePlan}
            disabled={saving}
            style={{
              width: '100%', padding: '14px',
              borderRadius: '12px', border: 'none',
              background:
                'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
              color: 'white', fontWeight: 800,
              fontSize: '1rem', cursor: 'pointer',
              opacity: saving ? 0.75 : 1
            }}
          >
            {saving
              ? 'Saving...'
              : '💾 Save Trip Plan'}
          </button>
        </div>
      </div>
    </div>
  )

  // Step 3: Saved
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        maxWidth: '480px', width: '100%',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden', textAlign: 'center'
      }}>
        <div style={{
          background:
            'linear-gradient(135deg, #16a34a, #0ea5e9)',
          padding: '36px 24px'
        }}>
          <div style={{
            fontSize: '3.5rem', marginBottom: '10px'
          }}>
            🎉
          </div>
          <h2 style={{
            color: 'white', margin: '0 0 6px',
            fontSize: '1.5rem', fontWeight: 800
          }}>
            Trip Plan Saved!
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            margin: 0, fontSize: '0.9rem'
          }}>
            {tripTitle}
          </p>
        </div>
        <div style={{ padding: '24px' }}>
          {saved?.share_code && (
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '10px', padding: '14px',
              marginBottom: '16px'
            }}>
              <p style={{
                margin: '0 0 6px', fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-secondary)'
              }}>
                🔗 Share Code
              </p>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '1.3rem', fontWeight: 800,
                color: 'var(--accent)',
                letterSpacing: '0.2em'
              }}>
                {saved.share_code}
              </div>
              <p style={{
                margin: '6px 0 0', fontSize: '0.72rem',
                color: 'var(--text-muted)'
              }}>
                Share this code so others can view
                your trip plan
              </p>
            </div>
          )}
          <div style={{
            display: 'flex', gap: '10px'
          }}>
            <button
              onClick={() => navigate('/my-trips')}
              style={{
                flex: 1, padding: '12px',
                borderRadius: '10px', border: 'none',
                background:
                  'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                color: 'white', fontWeight: 700,
                cursor: 'pointer', fontSize: '0.9rem'
              }}
            >
              View My Trips
            </button>
            <button
              onClick={() => {
                setStep(1)
                setPlan(null)
                setSaved(null)
                setDestination('')
                setCustomDest('')
                setDuration(null)
                setBudgetTier('')
                setTotalBudget('')
              }}
              style={{
                flex: 1, padding: '12px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                fontWeight: 600, cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              New Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
