import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../utils/auth'
import { getRole, isLoggedIn } from '../utils/role'
import { useTheme } from '../hooks/useTheme'
import useWindowSize from '../hooks/useWindowSize'
import NotificationBell from './NotificationBell'
import LoyaltyBadge from './LoyaltyBadge'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const loggedIn = isLoggedIn()
  const role = getRole()
  const { theme, toggleTheme } = useTheme()
  const { isMobile } = useWindowSize()
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const dropdownRef = useRef(null)

  const handleLogout = async () => {
    await logout(navigate)
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const dropdownItemStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    fontWeight: location.pathname === path ? 700 : 400,
    background: location.pathname === path ? 'var(--accent-light)' : 'transparent',
    transition: 'background 0.15s',
  })

  return (
    <nav className="navbar">
      <div className="navbar-inner" style={{ position: 'relative' }}>
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <span style={{ fontWeight: 800, fontSize: isMobile ? '1rem' : '1.1rem', color: 'white' }}>
            {isMobile ? '🏔️ GB' : '🏔️ GB Tourism'}
          </span>
          {!isMobile && <span className="logo-badge">GB</span>}
        </Link>
        {isMobile && (
          <button
            type="button"
            onClick={() => setMenuOpen((p) => !p)}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              padding: '8px 10px',
              cursor: 'pointer',
              fontSize: '1.2rem',
            }}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        )}

        {!isMobile && (
          <div
            ref={dropdownRef}
            className="nav-links nav-links-scroll"
            style={{
              display: 'flex',
              gap: '4px',
              alignItems: 'center',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              maxWidth: 'calc(100vw - 300px)',
              paddingBottom: '2px',
              flex: 1,
              minWidth: 0,
            }}
          >
            {loggedIn && role === 'user' && (
              <>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdown(openDropdown === 'explore' ? null : 'explore')
                    }
                    style={{
                      background: openDropdown === 'explore' ? 'rgba(255,255,255,0.2)' : 'transparent',
                      border: 'none',
                      color: 'white',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    🔍 Explore
                    <span style={{ fontSize: '0.6rem', opacity: 0.7, marginLeft: '2px' }}>
                      {openDropdown === 'explore' ? '▲' : '▼'}
                    </span>
                  </button>

                  {openDropdown === 'explore' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '6px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                        minWidth: '180px',
                        zIndex: 1000,
                        overflow: 'hidden',
                        padding: '6px',
                      }}
                    >
                      {[
                        { icon: '🏠', label: 'Home', path: '/' },
                        { icon: '🏨', label: 'Services', path: '/listings' },
                        { icon: '🎪', label: 'Events', path: '/events' },
                        { icon: '🗺️', label: 'Map', path: '/map' },
                        { icon: '🔍', label: 'Search', path: '/search' },
                        { icon: '🎟️', label: 'Deals', path: '/deals' },
                      ].map((item) => (
                        <div
                          key={item.path}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            navigate(item.path)
                            setOpenDropdown(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              navigate(item.path)
                              setOpenDropdown(null)
                            }
                          }}
                          style={dropdownItemStyle(item.path)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-secondary)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              location.pathname === item.path ? 'var(--accent-light)' : 'transparent'
                          }}
                        >
                          <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                          {item.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdown(openDropdown === 'bookings' ? null : 'bookings')
                    }
                    style={{
                      background: openDropdown === 'bookings' ? 'rgba(255,255,255,0.2)' : 'transparent',
                      border: 'none',
                      color: 'white',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    📅 My Bookings
                    <span style={{ fontSize: '0.6rem', opacity: 0.7, marginLeft: '2px' }}>
                      {openDropdown === 'bookings' ? '▲' : '▼'}
                    </span>
                  </button>

                  {openDropdown === 'bookings' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '6px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                        minWidth: '180px',
                        zIndex: 1000,
                        overflow: 'hidden',
                        padding: '6px',
                      }}
                    >
                      {[
                        { icon: '📅', label: 'My Bookings', path: '/my-bookings' },
                        { icon: '🎟️', label: 'My Tickets', path: '/my-tickets' },
                        { icon: '🍽️', label: 'Reservations', path: '/my-reservations' },
                        { icon: '💳', label: 'Spending History', path: '/my-spending' },
                        { icon: '👥', label: 'Group Booking', path: '/listings' },
                      ].map((item) => (
                        <div
                          key={item.path + item.label}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            navigate(item.path)
                            setOpenDropdown(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              navigate(item.path)
                              setOpenDropdown(null)
                            }
                          }}
                          style={dropdownItemStyle(item.path)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-secondary)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              location.pathname === item.path ? 'var(--accent-light)' : 'transparent'
                          }}
                        >
                          <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                          {item.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'foryou' ? null : 'foryou')}
                    style={{
                      background: openDropdown === 'foryou' ? 'rgba(255,255,255,0.2)' : 'transparent',
                      border: 'none',
                      color: 'white',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    ✨ For You
                    <span style={{ fontSize: '0.6rem', opacity: 0.7, marginLeft: '2px' }}>
                      {openDropdown === 'foryou' ? '▲' : '▼'}
                    </span>
                  </button>

                  {openDropdown === 'foryou' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '6px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                        minWidth: '180px',
                        zIndex: 1000,
                        overflow: 'hidden',
                        padding: '6px',
                      }}
                    >
                      {[
                        { icon: '✨', label: 'Recommendations', path: '/recommendations' },
                        { icon: '❤️', label: 'Wishlist', path: '/wishlist' },
                        { icon: '⭐', label: 'Loyalty Points', path: '/loyalty' },
                        { icon: '🗺️', label: 'Trip Planner', path: '/trip-planner' },
                        { icon: '📋', label: 'My Trips', path: '/my-trips' },
                      ].map((item) => (
                        <div
                          key={item.path}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            navigate(item.path)
                            setOpenDropdown(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              navigate(item.path)
                              setOpenDropdown(null)
                            }
                          }}
                          style={dropdownItemStyle(item.path)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-secondary)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              location.pathname === item.path ? 'var(--accent-light)' : 'transparent'
                          }}
                        >
                          <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                          {item.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {loggedIn && role === 'provider' && (
              <>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdown(openDropdown === 'explore' ? null : 'explore')
                    }
                    style={{
                      background: openDropdown === 'explore' ? 'rgba(255,255,255,0.2)' : 'transparent',
                      border: 'none',
                      color: 'white',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    🔍 Explore
                    <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>
                      {openDropdown === 'explore' ? '▲' : '▼'}
                    </span>
                  </button>
                  {openDropdown === 'explore' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '6px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                        minWidth: '180px',
                        zIndex: 1000,
                        overflow: 'hidden',
                        padding: '6px',
                      }}
                    >
                      {[
                        { icon: '🏠', label: 'Home', path: '/' },
                        { icon: '🏨', label: 'Services', path: '/listings' },
                        { icon: '🎪', label: 'Events', path: '/events' },
                        { icon: '🔍', label: 'Search', path: '/search' },
                      ].map((item) => (
                        <div
                          key={item.path}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            navigate(item.path)
                            setOpenDropdown(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              navigate(item.path)
                              setOpenDropdown(null)
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-secondary)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          <span>{item.icon}</span>
                          {item.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdown(openDropdown === 'services' ? null : 'services')
                    }
                    style={{
                      background: openDropdown === 'services' ? 'rgba(255,255,255,0.2)' : 'transparent',
                      border: 'none',
                      color: 'white',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    🏨 My Services
                    <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>
                      {openDropdown === 'services' ? '▲' : '▼'}
                    </span>
                  </button>
                  {openDropdown === 'services' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '6px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                        minWidth: '180px',
                        zIndex: 1000,
                        overflow: 'hidden',
                        padding: '6px',
                      }}
                    >
                      {[
                        { icon: '📋', label: 'My Listings', path: '/my-listings' },
                        { icon: '➕', label: 'Add Service', path: '/add-listing' },
                        { icon: '📊', label: 'Analytics', path: '/my-analytics' },
                        { icon: '💰', label: 'Payments', path: '/provider-payments' },
                        { icon: '🎟️', label: 'My Coupons', path: '/my-coupons' },
                      ].map((item) => (
                        <div
                          key={item.path}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            navigate(item.path)
                            setOpenDropdown(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              navigate(item.path)
                              setOpenDropdown(null)
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-secondary)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          <span>{item.icon}</span>
                          {item.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === 'events' ? null : 'events')}
                    style={{
                      background: openDropdown === 'events' ? 'rgba(255,255,255,0.2)' : 'transparent',
                      border: 'none',
                      color: 'white',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    🎪 My Events
                    <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>
                      {openDropdown === 'events' ? '▲' : '▼'}
                    </span>
                  </button>
                  {openDropdown === 'events' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '6px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                        minWidth: '180px',
                        zIndex: 1000,
                        overflow: 'hidden',
                        padding: '6px',
                      }}
                    >
                      {[
                        { icon: '🎪', label: 'My Events', path: '/my-events' },
                        { icon: '➕', label: 'Create Event', path: '/create-event' },
                        { icon: '📊', label: 'Event Stats', path: '/event-analytics' },
                      ].map((item) => (
                        <div
                          key={item.path}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            navigate(item.path)
                            setOpenDropdown(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              navigate(item.path)
                              setOpenDropdown(null)
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-secondary)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          <span>{item.icon}</span>
                          {item.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {!loggedIn && (
              <>
                {[
                  { label: '🏠 Home', path: '/' },
                  { label: '🏨 Services', path: '/listings' },
                  { label: '🎪 Events', path: '/events' },
                  { label: '🔍 Search', path: '/search' },
                ].map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'white',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </>
            )}

            {loggedIn && role === 'admin' && (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    padding: '7px 14px',
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
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                  }}
                >
                  📊 Analytics
                </button>
              </>
            )}
          </div>
        )}

        {isMobile && menuOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              top: '60px',
              background: 'var(--bg-card)',
              zIndex: 999,
              overflowY: 'auto',
              padding: '16px',
            }}
          >
            {!loggedIn && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      padding: '0 8px',
                      marginBottom: '6px',
                    }}
                  >
                    🔍 Explore
                  </div>
                  {[
                    { icon: '🏠', label: 'Home', path: '/' },
                    { icon: '🏨', label: 'Services', path: '/listings' },
                    { icon: '🎪', label: 'Events', path: '/events' },
                    { icon: '🔍', label: 'Search', path: '/search' },
                  ].map((link) => (
                    <div
                      key={link.path}
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
                        color: location.pathname === link.path ? 'var(--accent)' : 'var(--text-primary)',
                        background:
                          location.pathname === link.path ? 'var(--accent-light)' : 'transparent',
                        fontWeight: location.pathname === link.path ? 700 : 400,
                        fontSize: '0.9rem',
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{link.icon}</span>
                      {link.label}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
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
                      background: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                    }}
                  >
                    Register
                  </button>
                </div>
              </>
            )}

            {loggedIn && role === 'user' &&
              [
                {
                  section: '🔍 Explore',
                  links: [
                    { icon: '🏠', label: 'Home', path: '/' },
                    { icon: '🏨', label: 'Services', path: '/listings' },
                    { icon: '🎪', label: 'Events', path: '/events' },
                    { icon: '🗺️', label: 'Map', path: '/map' },
                    { icon: '🔍', label: 'Search', path: '/search' },
                    { icon: '🎟️', label: 'Deals', path: '/deals' },
                  ],
                },
                {
                  section: '📅 My Bookings',
                  links: [
                    { icon: '📅', label: 'My Bookings', path: '/my-bookings' },
                    { icon: '🎟️', label: 'My Tickets', path: '/my-tickets' },
                    { icon: '🍽️', label: 'Reservations', path: '/my-reservations' },
                    { icon: '💳', label: 'Spending', path: '/my-spending' },
                  ],
                },
                {
                  section: '✨ For You',
                  links: [
                    { icon: '✨', label: 'Recommendations', path: '/recommendations' },
                    { icon: '❤️', label: 'Wishlist', path: '/wishlist' },
                    { icon: '⭐', label: 'Loyalty Points', path: '/loyalty' },
                    { icon: '🗺️', label: 'Trip Planner', path: '/trip-planner' },
                    { icon: '📋', label: 'My Trips', path: '/my-trips' },
                  ],
                },
              ].map((group) => (
                <div key={group.section} style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      padding: '0 8px',
                      marginBottom: '6px',
                    }}
                  >
                    {group.section}
                  </div>
                  {group.links.map((link) => (
                    <div
                      key={link.path + link.label}
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
                        color: location.pathname === link.path ? 'var(--accent)' : 'var(--text-primary)',
                        background:
                          location.pathname === link.path ? 'var(--accent-light)' : 'transparent',
                        fontWeight: location.pathname === link.path ? 700 : 400,
                        fontSize: '0.9rem',
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{link.icon}</span>
                      {link.label}
                    </div>
                  ))}
                </div>
              ))}

            {loggedIn &&
              role === 'provider' &&
              [
                {
                  section: '🔍 Explore',
                  links: [
                    { icon: '🏠', label: 'Home', path: '/' },
                    { icon: '🏨', label: 'Services', path: '/listings' },
                    { icon: '🎪', label: 'Events', path: '/events' },
                    { icon: '🔍', label: 'Search', path: '/search' },
                  ],
                },
                {
                  section: '🏨 My Services',
                  links: [
                    { icon: '📋', label: 'My Listings', path: '/my-listings' },
                    { icon: '➕', label: 'Add Service', path: '/add-listing' },
                    { icon: '📊', label: 'Analytics', path: '/my-analytics' },
                    { icon: '💰', label: 'Payments', path: '/provider-payments' },
                    { icon: '🎟️', label: 'My Coupons', path: '/my-coupons' },
                  ],
                },
                {
                  section: '🎪 My Events',
                  links: [
                    { icon: '🎪', label: 'My Events', path: '/my-events' },
                    { icon: '➕', label: 'Create Event', path: '/create-event' },
                    { icon: '📊', label: 'Event Stats', path: '/event-analytics' },
                  ],
                },
              ].map((group) => (
                <div key={group.section} style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      padding: '0 8px',
                      marginBottom: '6px',
                    }}
                  >
                    {group.section}
                  </div>
                  {group.links.map((link) => (
                    <div
                      key={link.path + link.label}
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
                        color: location.pathname === link.path ? 'var(--accent)' : 'var(--text-primary)',
                        background:
                          location.pathname === link.path ? 'var(--accent-light)' : 'transparent',
                        fontWeight: location.pathname === link.path ? 700 : 400,
                        fontSize: '0.9rem',
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{link.icon}</span>
                      {link.label}
                    </div>
                  ))}
                </div>
              ))}

            {loggedIn && role === 'admin' && (
              <div style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    padding: '0 8px',
                    marginBottom: '6px',
                  }}
                >
                  Admin
                </div>
                {[
                  { icon: '🛡️', label: 'Admin Panel', path: '/admin' },
                  { icon: '📊', label: 'Analytics', path: '/admin/analytics' },
                ].map((link) => (
                  <div
                    key={link.path}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      navigate(link.path)
                      setMenuOpen(false)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '11px 12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      color: location.pathname === link.path ? 'var(--accent)' : 'var(--text-primary)',
                      background:
                        location.pathname === link.path ? 'var(--accent-light)' : 'transparent',
                      fontWeight: location.pathname === link.path ? 700 : 400,
                      fontSize: '0.9rem',
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{link.icon}</span>
                    {link.label}
                  </div>
                ))}
              </div>
            )}

            {loggedIn && (
              <div
                style={{
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '16px',
                  marginTop: '8px',
                  display: 'flex',
                  gap: '8px',
                }}
              >
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
                  onClick={async () => {
                    setMenuOpen(false)
                    await handleLogout()
                  }}
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
              </div>
            )}
          </div>
        )}

        {!isMobile && (
          <div className="nav-links nav-links-end">
            {!loggedIn && (
              <>
                <Link to="/login" className="nav-link">
                  Login
                </Link>
                <Link to="/register" className="nav-link">
                  Register
                </Link>
              </>
            )}
            <NotificationBell />
            {loggedIn && role === 'user' && <LoyaltyBadge compact={true} />}
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {loggedIn && (
              <Link to="/profile" className="nav-link">
                Profile
              </Link>
            )}
            {loggedIn && (
              <button type="button" onClick={handleLogout} className="nav-logout">
                Logout
              </button>
            )}
          </div>
        )}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <NotificationBell />
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {loggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="nav-logout"
                style={{ padding: '6px 12px', fontSize: '0.82rem' }}
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
