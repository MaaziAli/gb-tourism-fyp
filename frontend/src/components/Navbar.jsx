import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { isLoggedIn, getUser, getRole } from '../utils/role'
import api from '../api/axios'
import useWindowSize from '../hooks/useWindowSize'
import NotificationBell from './NotificationBell'
import LoyaltyBadge from './LoyaltyBadge'

// ── Single dropdown group component ──
function NavDropdown({ label, items, navigate, currentPath }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const timeoutRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function handleMouseEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  // Check if any child is active
  const isActive = items.some((item) => currentPath === item.path)

  return (
    <div
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative' }}
    >
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          background: open || isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
          border: 'none',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          transition: 'background 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
        <span
          style={{
            fontSize: '0.55rem',
            opacity: 0.8,
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
            display: 'inline-block',
          }}
        >
          ▼
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
            minWidth: '200px',
            zIndex: 9999,
            padding: '8px',
            animation: 'dropIn 0.15s ease',
          }}
        >
          {items.map((item, i) => {
            const active = currentPath === item.path
            return (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => {
                  navigate(item.path)
                  setOpen(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(item.path)
                    setOpen(false)
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: active ? 700 : 400,
                  color: active ? 'var(--accent)' : 'var(--text-primary)',
                  background: active ? 'var(--accent-light)' : 'transparent',
                  transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'var(--bg-secondary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = active ? 'var(--accent-light)' : 'transparent'
                }}
              >
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
                <span>{item.label}</span>
                {active && (
                  <span
                    style={{
                      marginLeft: 'auto',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Group config per role ──
const TRAVELER_GROUPS = [
  {
    label: '🔍 Explore',
    items: [
      { icon: '🏠', label: 'Home', path: '/' },
      { icon: '🏨', label: 'Services', path: '/listings' },
      { icon: '🎪', label: 'Events', path: '/events' },
      { icon: '🗺️', label: 'Map', path: '/map' },
      { icon: '🔍', label: 'Search', path: '/search' },
      { icon: '🎟️', label: 'Deals', path: '/deals' },
    ],
  },
  {
    label: '📅 My Bookings',
    items: [
      { icon: '📅', label: 'My Bookings', path: '/my-bookings' },
      { icon: '🎟️', label: 'My Tickets', path: '/my-tickets' },
      { icon: '🍽️', label: 'Reservations', path: '/my-reservations' },
      { icon: '💳', label: 'Spending', path: '/my-spending' },
    ],
  },
  {
    label: '✨ For You',
    items: [
      { icon: '✨', label: 'For You', path: '/recommendations' },
      { icon: '❤️', label: 'Wishlist', path: '/wishlist' },
      { icon: '⭐', label: 'Loyalty Points', path: '/loyalty' },
      { icon: '🗺️', label: 'Trip Planner', path: '/trip-planner' },
      { icon: '📋', label: 'My Trips', path: '/my-trips' },
    ],
  },
]

const PROVIDER_GROUPS = [
  {
    label: '🔍 Explore',
    items: [
      { icon: '🏠', label: 'Home', path: '/' },
      { icon: '🏨', label: 'Services', path: '/listings' },
      { icon: '🎪', label: 'Events', path: '/events' },
      { icon: '🔍', label: 'Search', path: '/search' },
    ],
  },
  {
    label: '🏨 My Services',
    items: [
      { icon: '📊', label: 'Dashboard', path: '/provider-dashboard' },
      { icon: '📈', label: 'Earnings Chart', path: '/earnings-chart' },
      { icon: '📋', label: 'My Listings', path: '/my-listings' },
      { icon: '➕', label: 'Add Service', path: '/add-listing' },
      { icon: '📊', label: 'Analytics', path: '/my-analytics' },
      { icon: '💰', label: 'Payments', path: '/provider-payments' },
      { icon: '🎟️', label: 'My Coupons', path: '/my-coupons' },
    ],
  },
  {
    label: '🎪 My Events',
    items: [
      { icon: '🎪', label: 'My Events', path: '/my-events' },
      { icon: '➕', label: 'Create Event', path: '/create-event' },
      { icon: '📊', label: 'Event Stats', path: '/event-analytics' },
    ],
  },
]

const PUBLIC_LINKS = [
  { icon: '🏠', label: 'Home', path: '/' },
  { icon: '🏨', label: 'Services', path: '/listings' },
  { icon: '🎪', label: 'Events', path: '/events' },
  { icon: '🔍', label: 'Search', path: '/search' },
]

function travelerGroupsWithUnread(unread) {
  return [
    TRAVELER_GROUPS[0],
    {
      label: '📅 My Bookings',
      items: [
        { icon: '📅', label: 'My Bookings', path: '/my-bookings' },
        { icon: '💬', label: unread > 0 ? `Messages (${unread})` : 'Messages', path: '/messages' },
        { icon: '🎟️', label: 'My Tickets', path: '/my-tickets' },
        { icon: '🍽️', label: 'Reservations', path: '/my-reservations' },
        { icon: '💳', label: 'Spending', path: '/my-spending' },
      ],
    },
    TRAVELER_GROUPS[2],
  ]
}

function providerGroupsWithUnread(unread) {
  return [
    PROVIDER_GROUPS[0],
    {
      label: '🏨 My Services',
      items: [
        { icon: '📊', label: 'Dashboard', path: '/provider-dashboard' },
        { icon: '📈', label: 'Earnings Chart', path: '/earnings-chart' },
        { icon: '📋', label: 'My Listings', path: '/my-listings' },
        { icon: '➕', label: 'Add Service', path: '/add-listing' },
        { icon: '💬', label: unread > 0 ? `Messages (${unread})` : 'Messages', path: '/messages' },
        { icon: '📊', label: 'Analytics', path: '/my-analytics' },
        { icon: '💰', label: 'Payments', path: '/provider-payments' },
        { icon: '🎟️', label: 'My Coupons', path: '/my-coupons' },
      ],
    },
    PROVIDER_GROUPS[2],
  ]
}

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isMobile } = useWindowSize()
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [unreadMessages, setUnreadMessages] = useState(0)

  const user = getUser()
  const role = getRole()
  const loggedIn = isLoggedIn()

  useEffect(() => {
    if (!loggedIn) return
    api.get('/messages/unread-count')
      .then((r) => setUnreadMessages(r.data?.unread ?? 0))
      .catch(() => {})
  }, [location.pathname, loggedIn])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  function handleLogout() {
    localStorage.clear()
    navigate('/login')
    setMenuOpen(false)
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const groups = useMemo(() => {
    if (role === 'provider') return providerGroupsWithUnread(unreadMessages)
    if (role === 'user') return travelerGroupsWithUnread(unreadMessages)
    return []
  }, [role, unreadMessages])

  return (
    <>
      {/* CSS animation */}
      <style>{`
        @keyframes dropIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <nav
        style={{
          background: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
          padding: '0 16px',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            height: '58px',
            gap: '8px',
          }}
        >
          {/* Logo */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate('/')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') navigate('/')
            }}
            style={{
              fontWeight: 800,
              color: 'white',
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginRight: '8px',
            }}
          >
            🏔️
            {!isMobile && <span>GB Tourism</span>}
          </div>

          {/* Desktop Nav Groups */}
          {!isMobile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                flex: 1,
              }}
            >
              {loggedIn && groups.length > 0 ? (
                groups.map((group, i) => (
                  <NavDropdown
                    key={i}
                    label={group.label}
                    items={group.items}
                    navigate={navigate}
                    currentPath={location.pathname}
                  />
                ))
              ) : !loggedIn ? (
                PUBLIC_LINKS.map((link) => (
                  <button
                    key={link.path}
                    type="button"
                    onClick={() => navigate(link.path)}
                    style={{
                      background: location.pathname === link.path ? 'rgba(255,255,255,0.18)' : 'transparent',
                      border: 'none',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {link.icon} {link.label}
                  </button>
                ))
              ) : role === 'admin' ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: 'none',
                      color: 'white',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                    }}
                  >
                    🛡️ Admin Panel
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/analytics')}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: 'none',
                      color: 'white',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                    }}
                  >
                    📊 Analytics
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/listings')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                    }}
                  >
                    🏨 Services
                  </button>
                </>
              ) : null}
            </div>
          )}

          {/* Right side controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginLeft: 'auto',
              flexShrink: 0,
            }}
          >
            {/* Search icon */}
            <button
              type="button"
              onClick={() => navigate('/search')}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                padding: '7px 10px',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
              title="Search"
            >
              🔍
            </button>

            {/* Loyalty badge - compact */}
            {loggedIn && role === 'user' && !isMobile && <LoyaltyBadge compact={true} />}

            {/* Notifications */}
            {loggedIn && <NotificationBell />}

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                padding: '7px 10px',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* Profile */}
            {loggedIn && !isMobile && (
              <button
                type="button"
                onClick={() => navigate('/profile')}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                👤 {user?.full_name?.split(' ')[0] || 'Profile'}
              </button>
            )}

            {/* Logout */}
            {loggedIn && !isMobile && (
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '7px 12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  opacity: 0.85,
                }}
              >
                🚪
              </button>
            )}

            {/* Login/Register for public */}
            {!loggedIn && !isMobile && (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '7px 14px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  style={{
                    background: 'white',
                    color: '#1e3a5f',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '7px 14px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                  }}
                >
                  Sign Up
                </button>
              </>
            )}

            {/* Mobile hamburger */}
            {isMobile && (
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                }}
              >
                {menuOpen ? '✕' : '☰'}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile Menu Overlay ── */}
      {isMobile && menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '58px',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--bg-primary)',
            zIndex: 999,
            overflowY: 'auto',
            padding: '12px 16px 32px',
          }}
        >
          {loggedIn && groups.length > 0 ? (
            groups.map((group, gi) => (
              <div key={gi} style={{ marginBottom: '20px' }}>
                {/* Section header */}
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    padding: '0 8px 6px',
                    borderBottom: '1px solid var(--border-color)',
                    marginBottom: '6px',
                  }}
                >
                  {group.label}
                </div>

                {group.items.map((item, ii) => {
                  const active = location.pathname === item.path
                  return (
                    <div
                      key={ii}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        navigate(item.path)
                        setMenuOpen(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          navigate(item.path)
                          setMenuOpen(false)
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '11px 12px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: active ? 700 : 400,
                        color: active ? 'var(--accent)' : 'var(--text-primary)',
                        background: active ? 'var(--accent-light)' : 'transparent',
                        marginBottom: '2px',
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                      {item.label}
                      {active && (
                        <span
                          style={{
                            marginLeft: 'auto',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--accent)',
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          ) : !loggedIn ? (
            <div style={{ marginBottom: '20px' }}>
              {PUBLIC_LINKS.map((link, i) => (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    navigate(link.path)
                    setMenuOpen(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(link.path)
                      setMenuOpen(false)
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '11px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    marginBottom: '2px',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{link.icon}</span>
                  {link.label}
                </div>
              ))}
            </div>
          ) : role === 'admin' ? (
            <div style={{ marginBottom: '20px' }}>
              {[
                { icon: '🛡️', label: 'Admin Panel', path: '/admin' },
                { icon: '📊', label: 'Analytics', path: '/admin/analytics' },
                { icon: '🏨', label: 'Services', path: '/listings' },
              ].map((link, i) => (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    navigate(link.path)
                    setMenuOpen(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(link.path)
                      setMenuOpen(false)
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '11px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    marginBottom: '2px',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{link.icon}</span>
                  {link.label}
                </div>
              ))}
            </div>
          ) : null}

          {/* Profile + Logout */}
          <div
            style={{
              borderTop: '1px solid var(--border-color)',
              paddingTop: '16px',
              marginTop: '8px',
              display: 'flex',
              gap: '8px',
            }}
          >
            {loggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/profile')
                    setMenuOpen(false)
                  }}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  👤 Profile
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--danger-bg)',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/login')
                    setMenuOpen(false)
                  }}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigate('/register')
                    setMenuOpen(false)
                  }}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
