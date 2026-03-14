import { useState } from 'react'
import { Link, useLocation, useNavigate, NavLink } from 'react-router-dom'
import { logout } from '../utils/auth'
import { getRole, isLoggedIn } from '../utils/role'
import { useTheme } from '../hooks/useTheme'
import useWindowSize from '../hooks/useWindowSize'
import NotificationBell from './NotificationBell'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const loggedIn = isLoggedIn()
  const role = getRole()
  const { theme, toggleTheme } = useTheme()
  const { isMobile } = useWindowSize()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout(navigate)
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="navbar-inner" style={{ position: 'relative' }}>
        <Link to="/" className="navbar-logo">
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>
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
        {(!isMobile || menuOpen) && (
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '4px' : '8px',
              position: isMobile ? 'absolute' : 'relative',
              top: isMobile ? '60px' : 'auto',
              left: isMobile ? 0 : 'auto',
              right: isMobile ? 0 : 'auto',
              background: isMobile
                ? 'linear-gradient(135deg, #1e3a5f, #0ea5e9)'
                : 'transparent',
              padding: isMobile ? '12px 16px' : '0',
              zIndex: isMobile ? 999 : 'auto',
              borderTop: isMobile ? '1px solid rgba(255,255,255,0.15)' : 'none',
              width: isMobile ? '100%' : 'auto',
              boxSizing: isMobile ? 'border-box' : 'content-box',
              alignItems: isMobile ? 'stretch' : 'center',
            }}
            className={!isMobile ? 'nav-links' : ''}
          >
            <NavLink
              to="/"
              className={({ isActive: navActive }) =>
                'nav-link' + (navActive ? ' active' : '')
              }
              onClick={() => setMenuOpen(false)}
            >
              Stays & Experiences
            </NavLink>
            <NavLink
              to="/map"
              className={({ isActive }) =>
                'nav-link' + (isActive ? ' active' : '')
              }
              onClick={() => setMenuOpen(false)}
            >
              📍 Map
            </NavLink>
            {loggedIn && role !== 'admin' && (
              <Link
                to="/recommendations"
                className={`nav-link${
                  isActive('/recommendations') ? ' active' : ''
                }`}
                onClick={() => setMenuOpen(false)}
              >
                ✨ For You
              </Link>
            )}
            {loggedIn && role === 'admin' && (
              <Link
                to="/admin"
                className={`nav-link${isActive('/admin') ? ' active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                ⚙️ Admin
              </Link>
            )}
            {loggedIn && role === 'provider' && (
              <>
                <Link
                  to="/add-listing"
                  className={`nav-link${
                    isActive('/add-listing') ? ' active' : ''
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  List Your Service
                </Link>
                <Link
                  to="/my-listings"
                  className={`nav-link${
                    isActive('/my-listings') ? ' active' : ''
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  My Services
                </Link>
                <Link
                  to="/my-analytics"
                  className={`nav-link${
                    isActive('/my-analytics') ? ' active' : ''
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  📊 Analytics
                </Link>
              </>
            )}
            {loggedIn && role !== 'admin' && (
              <>
                <Link
                  to="/my-bookings"
                  className={`nav-link${
                    isActive('/my-bookings') ? ' active' : ''
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  My Bookings
                </Link>
                {role === 'user' && (
                  <>
                    <Link
                      to="/trip-planner"
                      className={`nav-link${
                        isActive('/trip-planner') ? ' active' : ''
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      🗺️ Trip Planner
                    </Link>
                    <Link
                      to="/my-trips"
                      className={`nav-link${
                        isActive('/my-trips') ? ' active' : ''
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      📋 My Trips
                    </Link>
                  </>
                )}
                <Link
                  to="/profile"
                  className={`nav-link${
                    isActive('/profile') ? ' active' : ''
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </Link>
              </>
            )}
            {loggedIn && role === 'admin' && (
              <Link
                to="/profile"
                className={`nav-link${
                  isActive('/profile') ? ' active' : ''
                }`}
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </Link>
            )}
            {!loggedIn && (
              <>
                <NavLink
                  to="/home"
                  className={({ isActive }) =>
                    'nav-link' + (isActive ? ' active' : '')
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  🏠 Home
                </NavLink>
                <Link
                  to="/login"
                  className={`nav-link${
                    isActive('/login') ? ' active' : ''
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={`nav-link${
                    isActive('/register') ? ' active' : ''
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
        {!isMobile && (
          <div className="nav-links">
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
              >
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
