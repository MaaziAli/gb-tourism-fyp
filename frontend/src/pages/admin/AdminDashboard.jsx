import { useEffect, useState } from 'react'
import api from '../../api/axios'
import useWindowSize from '../../hooks/useWindowSize'

function AdminDashboard() {
  const { isMobile } = useWindowSize()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [payments, setPayments] = useState(null)
  const [paymentsLoading, setPaymentsLoading] = useState(false)

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
    if (activeSection === 'payments') {
      fetchPayments()
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

  async function fetchPayments() {
    setPaymentsLoading(true)
    try {
      const res = await api.get('/payments/admin/all-payments')
      setPayments(res.data)
    } catch (err) {
      console.error('Failed to load payments', err)
    } finally {
      setPaymentsLoading(false)
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
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? 0 : '24px',
    alignItems: isMobile ? 'stretch' : 'flex-start',
    minHeight: 'calc(100vh - 60px)',
    backgroundColor: 'var(--bg-primary)',
  }

  const sidebarStyle = {
    width: isMobile ? '100%' : '220px',
    flexShrink: 0,
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
            marginBottom: isMobile ? '12px' : '20px',
          }}
        >
          ⚙️ Admin Panel
        </div>
        <nav
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'row' : 'column',
            gap: '8px',
            fontSize: '0.9rem',
            overflowX: isMobile ? 'auto' : 'visible',
            paddingBottom: isMobile ? '8px' : 0,
            marginBottom: isMobile ? '16px' : 0,
            flexWrap: isMobile ? 'nowrap' : 'wrap',
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
            Services
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
          <button
            type="button"
            onClick={() => setActiveSection('payments')}
            style={{
              textAlign: 'left',
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor:
                activeSection === 'payments' ? '#1f2937' : 'transparent',
              color: '#e5e7eb',
            }}
          >
            💳 Payments
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
                  label: 'Total Services',
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
                  width: isMobile ? '100%' : '260px',
                  maxWidth: '260px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            {isMobile ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      padding: '14px 16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {user.full_name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            marginTop: '2px',
                          }}
                        >
                          {user.email}
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background:
                            user.role === 'admin'
                              ? '#fef3c7'
                              : user.role === 'provider'
                                ? '#eff6ff'
                                : '#f0fdf4',
                          color:
                            user.role === 'admin'
                              ? '#d97706'
                              : user.role === 'provider'
                                ? '#2563eb'
                                : '#16a34a',
                        }}
                      >
                        {user.role}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                        marginTop: '10px',
                      }}
                    >
                      {['user', 'provider'].includes(user.role) && (
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleChangeUserRole(user.id, e.target.value)
                          }
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            flex: 1,
                            minWidth: '120px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.8rem',
                          }}
                        >
                          <option value="user">Traveler</option>
                          <option value="provider">Provider</option>
                        </select>
                      )}
                      {user.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.id)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'var(--danger-bg)',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
            )}
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
            {isMobile ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={
                        listing.image_url
                          ? `http://127.0.0.1:8000/uploads/${listing.image_url}`
                          : 'https://placehold.co/400x120/e5e7eb/9ca3af?text=GB'
                      }
                      alt={listing.title}
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src =
                          'https://placehold.co/400x120/e5e7eb/9ca3af?text=GB'
                      }}
                      style={{
                        width: '100%',
                        height: '100px',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    <div style={{ padding: '12px 14px' }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: 'var(--text-primary)',
                          marginBottom: '3px',
                        }}
                      >
                        {listing.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          marginBottom: '8px',
                        }}
                      >
                        📍 {listing.location} · PKR{' '}
                        {listing.price_per_night?.toLocaleString('en-PK')}/
                        night
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteListing(listing.id)}
                        style={{
                          padding: '7px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'var(--danger-bg)',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          width: '100%',
                        }}
                      >
                        🗑️ Delete Service
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
                        <td
                          style={{
                            padding: '10px 16px',
                            borderBottom: '1px solid #f3f4f6',
                          }}
                        >
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
            )}
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
            ) : isMobile ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      padding: '14px 16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {r.reviewer_name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {r.reviewer_email}
                        </div>
                      </div>
                      <div style={{ color: '#f59e0b' }}>
                        {'★'.repeat(r.rating)}
                        {'☆'.repeat(5 - r.rating)}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'inline-block',
                        background: 'var(--accent-light)',
                        color: 'var(--accent)',
                        padding: '2px 10px',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        marginBottom: '8px',
                      }}
                    >
                      🏨 {r.listing_title}
                    </div>
                    {r.comment && (
                      <p
                        style={{
                          margin: '6px 0 8px',
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
                          fontStyle: 'italic',
                        }}
                      >
                        "{r.comment}"
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteReview(r.id)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'var(--danger-bg)',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        width: '100%',
                      }}
                    >
                      Delete Review
                    </button>
                  </div>
                ))}
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

        {activeSection === 'payments' && (
          <div>
            <h2
              style={{
                margin: '0 0 20px',
                color: 'var(--text-primary)',
                fontSize: '1.4rem',
                fontWeight: 800,
              }}
            >
              💳 All Payments
            </h2>

            {paymentsLoading ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'var(--text-secondary)',
                }}
              >
                Loading payments...
              </div>
            ) : payments ? (
              <div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '14px',
                    marginBottom: '24px',
                  }}
                >
                  {[
                    {
                      label: 'Total Volume',
                      value:
                        'PKR ' +
                        payments.total_volume?.toLocaleString(
                          'en-PK',
                        ),
                      color: 'var(--accent)',
                      icon: '💰',
                    },
                    {
                      label: 'Commission Earned',
                      value:
                        'PKR ' +
                        payments.total_commission?.toLocaleString(
                          'en-PK',
                        ),
                      color: '#16a34a',
                      icon: '🏦',
                    },
                    {
                      label: 'Provider Payouts',
                      value:
                        'PKR ' +
                        payments.total_provider_payouts?.toLocaleString(
                          'en-PK',
                        ),
                      color: '#d97706',
                      icon: '📤',
                    },
                    {
                      label: 'Transactions',
                      value: payments.total_transactions,
                      color: '#7c3aed',
                      icon: '🔢',
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        padding: '16px 20px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '1.4rem',
                          marginBottom: '6px',
                        }}
                      >
                        {s.icon}
                      </div>
                      <div
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 800,
                          color: s.color,
                        }}
                      >
                        {s.value}
                      </div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                          marginTop: '3px',
                        }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                {payments.payments?.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '40px',
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    No payments yet
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
                        display: 'grid',
                        gridTemplateColumns:
                          '2fr 1.5fr 1fr 1fr 1fr 0.8fr',
                        padding: '10px 20px',
                        borderBottom:
                          '1px solid var(--border-color)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <span>Service</span>
                      <span>Traveler</span>
                      <span>Amount</span>
                      <span>Commission</span>
                      <span>Provider Gets</span>
                      <span>Method</span>
                    </div>

                    {payments.payments.map((p, i) => (
                      <div
                        key={p.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            '2fr 1.5fr 1fr 1fr 1fr 0.8fr',
                          padding: '14px 20px',
                          borderBottom:
                            i < payments.payments.length - 1
                              ? '1px solid var(--border-color)'
                              : 'none',
                          alignItems: 'center',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {p.listing_title}
                          </div>
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)',
                              fontFamily: 'monospace',
                            }}
                          >
                            {p.transaction_id}
                          </div>
                        </div>
                        <div>
                          <div
                            style={{
                              color: 'var(--text-primary)',
                              fontWeight: 500,
                            }}
                          >
                            {p.traveler_name}
                          </div>
                          <div
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {p.traveler_email}
                          </div>
                        </div>
                        <span
                          style={{
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                          }}
                        >
                          PKR{' '}
                          {p.amount?.toLocaleString('en-PK')}
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: '#16a34a',
                          }}
                        >
                          PKR{' '}
                          {p.platform_commission?.toLocaleString(
                            'en-PK',
                          )}
                        </span>
                        <span
                          style={{
                            color: 'var(--text-secondary)',
                          }}
                        >
                          PKR{' '}
                          {p.provider_amount?.toLocaleString(
                            'en-PK',
                          )}
                        </span>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {p.payment_method === 'card'
                            ? '💳 ' +
                              (p.card_last4
                                ? '••' + p.card_last4
                                : 'Card')
                            : p.payment_method === 'jazzcash'
                              ? '📱 JazzCash'
                              : '💚 EasyPaisa'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminDashboard

