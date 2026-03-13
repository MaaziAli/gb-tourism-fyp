import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../utils/auth'
import { getRole, isLoggedIn } from '../utils/role'
import { useTheme } from '../hooks/useTheme'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const loggedIn = isLoggedIn()
  const role = getRole()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    await logout(navigate)
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          🏔️ GB Tourism
          <span className="logo-badge">GB</span>
        </Link>
        <div className="nav-links">
          <Link
            to="/"
            className={`nav-link${isActive('/') ? ' active' : ''}`}
          >
            Listings
          </Link>
          {loggedIn && role !== 'admin' && (
            <Link
              to="/recommendations"
              className={`nav-link${
                isActive('/recommendations') ? ' active' : ''
              }`}
            >
              ✨ For You
            </Link>
          )}
          {loggedIn && role === 'admin' && (
            <Link
              to="/admin"
              className={`nav-link${isActive('/admin') ? ' active' : ''}`}
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
              >
                Add Listing
              </Link>
              <Link
                to="/my-listings"
                className={`nav-link${
                  isActive('/my-listings') ? ' active' : ''
                }`}
              >
                My Listings
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
              >
                My Bookings
              </Link>
              <Link
                to="/profile"
                className={`nav-link${
                  isActive('/profile') ? ' active' : ''
                }`}
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
            >
              Profile
            </Link>
          )}
          {!loggedIn && (
            <>
              <Link
                to="/login"
                className={`nav-link${
                  isActive('/login') ? ' active' : ''
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`nav-link${
                  isActive('/register') ? ' active' : ''
                }`}
              >
                Register
              </Link>
            </>
          )}
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
      </div>
    </nav>
  )
}

export default Navbar
