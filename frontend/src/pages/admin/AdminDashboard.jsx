import { useEffect, useState } from 'react'
import api from '../../api/axios'

function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      setError('')
      try {
        const [statsRes, usersRes, listingsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users'),
          api.get('/admin/listings'),
        ])
        setStats(statsRes.data)
        setUsers(usersRes.data)
        setListings(listingsRes.data)
      } catch (err) {
        console.error('Failed to load admin data', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        })
        setError('Failed to load admin data.')
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  useEffect(() => {
    if (activeSection === 'reviews') {
      fetchReviews()
    }
  }, [activeSection])

  async function fetchReviews() {
    setReviewsLoading(true)
    try {
      const res = await api.get('/admin/reviews')
      setReviews(res.data)
    } catch (err) {
      console.error('Failed to load reviews', err)
    } finally {
      setReviewsLoading(false)
    }
  }

  const handleChangeUserRole = async (userId, role) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role })
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: res.data.role } : u)),
      )
    } catch (err) {
      console.error('Failed to update user role', err)
      alert('Failed to update user role.')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm('Are you sure you want to delete this user and their data?')
    ) {
      return
    }
    try {
      await api.delete(`/admin/users/${userId}`)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (err) {
      console.error('Failed to delete user', err)
      alert('Failed to delete user.')
    }
  }

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) {
      return
    }
    try {
      await api.delete(`/admin/listings/${listingId}`)
      setListings((prev) => prev.filter((l) => l.id !== listingId))
    } catch (err) {
      console.error('Failed to delete listing', err)
      alert('Failed to delete listing.')
    }
  }

  const deleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return
    try {
      await api.delete(`/admin/reviews/${reviewId}`)
      fetchReviews()
    } catch (err) {
      console.error('Failed to delete review', err)
      alert('Failed to delete review.')
    }
  }

  const containerStyle = {
    display: 'flex',
    minHeight: 'calc(100vh - 60px)',
    backgroundColor: 'var(--bg-primary)',
  }

  const sidebarStyle = {
    width: '220px',
    backgroundColor: '#111827',
    color: '#e5e7eb',
    padding: '20px 16px',
  }

  const mainStyle = {
    flex: 1,
    padding: '24px',
    backgroundColor: 'var(--bg-primary)',
  }

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true
    const q = userSearch.toLowerCase()
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  })

  const roleBadgeStyle = (role) => {
    if (role === 'provider') {
      return {
        backgroundColor: '#dbeafe',
        color: '#1e40af',
      }
    }
    if (role === 'admin') {
      return {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
      }
    }
    return {
      backgroundColor: '#d1fae5',
      color: '#065f46',
    }
  }

  return (
    <div style={containerStyle}>
      <aside style={sidebarStyle}>
        <div
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            marginBottom: '20px',
          }}
        >
          ⚙️ Admin Panel
        </div>
        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.9rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveSection('dashboard')}
            style={{
              textAlign: 'left',
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor:
                activeSection === 'dashboard' ? '#1f2937' : 'transparent',
              color: '#e5e7eb',
            }}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('users')}
            style={{
              textAlign: 'left',
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor:
                activeSection === 'users' ? '#1f2937' : 'transparent',
              color: '#e5e7eb',
            }}
          >
            Users
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('listings')}
            style={{
              textAlign: 'left',
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor:
                activeSection === 'listings' ? '#1f2937' : 'transparent',
              color: '#e5e7eb',
            }}
          >
            Stays & Experiences
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('reviews')}
            style={{
              textAlign: 'left',
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor:
                activeSection === 'reviews' ? '#1f2937' : 'transparent',
              color: '#e5e7eb',
            }}
          >
            Reviews
          </button>
        </nav>
      </aside>

      <main style={mainStyle}>
        {loading && (
          <p style={{ color: 'var(--text-secondary)' }}>Loading admin data...</p>
        )}
        {error && (
          <p style={{ color: 'var(--danger)', marginBottom: '16px' }}>{error}</p>
        )}

        {!loading && !error && activeSection === 'dashboard' && stats && (
          <>
            <h1
              style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '16px',
              }}
            >
              Overview
            </h1>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              {[
                {
                  label: 'Total Users',
                  value: stats.total_users,
                  icon: '👥',
                },
                {
                  label: 'Total Stays & Experiences',
                  value: stats.total_listings,
                  icon: '🏨',
                },
                {
                  label: 'Active Bookings',
                  value: stats.active_bookings,
                  icon: '📅',
                },
                {
                  label: 'Total Bookings',
                  value: stats.total_bookings,
                  icon: '📊',
                },
              ].map((card) => (
                <div
                  key={card.label}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    padding: '20px',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
                    {card.icon}
                  </div>
                  <div
                    style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    }}
                  >
                    {card.value}
                  </div>
                  <div
                    style={{
                      marginTop: '4px',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {card.label}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '16px',
                }}
              >
                <h2
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  Users by Role
                </h2>
                <p
                  style={{
                    margin: '4px 0',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  Travelers: {stats.total_travelers}
                </p>
                <p
                  style={{
                    margin: '4px 0',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  Providers: {stats.total_providers}
                </p>
              </div>
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '16px',
                }}
              >
                <h2
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  Stays & Experiences by Type
                </h2>
                {Object.entries(stats.listings_by_type || {}).map(
                  ([type, count]) => (
                    <p
                      key={type}
                      style={{
                        margin: '4px 0',
                        fontSize: '0.9rem',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {type}: {count}
                    </p>
                  ),
                )}
              </div>
            </div>
          </>
        )}

        {!loading && !error && activeSection === 'users' && (
          <>
            <h1
              style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '16px',
              }}
            >
              Users
            </h1>
            <div style={{ marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="Search by name or email"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.9rem',
                  width: '260px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.9rem',
                }}
              >
                <thead
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    textAlign: 'left',
                  }}
                >
                  <tr>
                    <th
                      style={{
                        padding: '10px 16px',
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        padding: '10px 16px',
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      Email
                    </th>
                    <th
                      style={{
                        padding: '10px 16px',
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      Role
                    </th>
                    <th
                      style={{
                        padding: '10px 16px',
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      Listings
                    </th>
                    <th
                      style={{
                        padding: '10px 16px',
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      Bookings
                    </th>
                    <th
                      style={{
                        padding: '10px 16px',
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {u.full_name}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {u.email}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--border-color)',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            ...roleBadgeStyle(u.role),
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {u.listings_count}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {u.bookings_count}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--border-color)',
                        }}
                      >
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleChangeUserRole(u.id, e.target.value)
                          }
                          style={{
                            marginRight: '8px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.8rem',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          <option value="user">user</option>
                          <option value="provider">provider</option>
                          <option value="admin">admin</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--danger)',
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--danger)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && !error && activeSection === 'listings' && (
          <>
            <h1
              style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '16px',
              }}
            >
              Stays & Experiences
            </h1>
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.9rem',
                }}
              >
                <thead
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    textAlign: 'left',
                  }}
                >
                  <tr>
                    <th
                      style={{
                        padding: '10px 16px',
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      Title
                    </th>
                    <th
                      style={{
                        padding: '10px 16px',
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      Owner
                    </th>
                    <th
                      style={{
                        padding: '10px 16px',
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      Location
                    </th>
                    <th
                      style={{
                        padding: '10px 16px',
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      Type
                    </th>
                    <th
                      style={{
                        padding: '10px 16px',
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      Price
                    </th>
                    <th
                      style={{
                        padding: '10px 16px',
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      Bookings
                    </th>
                    <th
                      style={{
                        padding: '10px 16px',
                        color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((l) => (
                    <tr key={l.id}>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {l.title}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <div>{l.owner_name}</div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {l.owner_email}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {l.location}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {l.service_type}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        PKR {l.price_per_night}
                      </td>
                      <td
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--border-color)',
                        }}
                      >
                        {l.bookings_count}
                      </td>
                      <td style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteListing(l.id)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--danger)',
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--danger)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && !error && activeSection === 'reviews' && (
          <div>
            <h2
              style={{
                margin: '0 0 24px',
                color: 'var(--text-primary)',
                fontSize: '1.4rem',
                fontWeight: 800,
              }}
            >
              ⭐ All Reviews
            </h2>

            {reviewsLoading ? (
              <div
                style={{
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  padding: '40px',
                }}
              >
                Loading reviews...
              </div>
            ) : reviews.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                }}
              >
                <div style={{ fontSize: '3rem' }}>⭐</div>
                <p>No reviews yet.</p>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    gap: '24px',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                    }}
                  >
                    Total:{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {reviews.length} reviews
                    </strong>
                  </span>
                  <span
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                    }}
                  >
                    Avg rating:{' '}
                    <strong style={{ color: '#f59e0b' }}>
                      {reviews.length > 0
                        ? (
                            reviews.reduce(
                              (s, r) => s + (r.rating || 0),
                              0,
                            ) / reviews.length
                          ).toFixed(1)
                        : '—'}{' '}
                      ★
                    </strong>
                  </span>
                </div>

                {reviews.map((r, idx) => (
                  <div
                    key={r.id}
                    style={{
                      padding: '18px 24px',
                      borderBottom:
                        idx < reviews.length - 1
                          ? '1px solid var(--border-color)'
                          : 'none',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem',
                        flexShrink: 0,
                      }}
                    >
                      {r.reviewer_name?.charAt(0).toUpperCase()}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '6px',
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              fontSize: '0.9rem',
                            }}
                          >
                            {r.reviewer_name}
                          </span>
                          <span
                            style={{
                              margin: '0 8px',
                              color: 'var(--text-muted)',
                              fontSize: '0.8rem',
                            }}
                          >
                            {r.reviewer_email}
                          </span>
                          <span style={{ color: '#f59e0b' }}>
                            {'★'.repeat(r.rating)}
                            {'☆'.repeat(5 - r.rating)}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {new Date(r.created_at).toLocaleDateString(
                              'en-PK',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              },
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteReview(r.id)}
                            style={{
                              background: 'var(--danger-bg)',
                              color: 'var(--danger)',
                              border: '1px solid var(--danger)',
                              borderRadius: '6px',
                              padding: '3px 10px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'inline-block',
                          background: 'var(--accent-light)',
                          color: 'var(--accent)',
                          padding: '2px 10px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          marginBottom: r.comment ? '8px' : 0,
                        }}
                      >
                        🏨 {r.listing_title}
                      </div>

                      {r.comment && (
                        <p
                          style={{
                            margin: '6px 0 0',
                            color: 'var(--text-secondary)',
                            fontSize: '0.875rem',
                            lineHeight: 1.6,
                          }}
                        >
                          "{r.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminDashboard

