import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../utils/auth'
import { getRole, isLoggedIn } from '../utils/role'

function Navbar() {
  const navigate = useNavigate()
  const loggedIn = isLoggedIn()
  const role = getRole()

  const handleLogout = async () => {
    await logout(navigate)
  }

  return (
    <nav
      style={{
        backgroundColor: '#111827',
        color: '#ffffff',
        padding: '12px 0',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ fontWeight: 600 }}>GB Tourism</div>
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          <Link
            to="/"
            style={{ color: '#e5e7eb', textDecoration: 'none', fontSize: '0.95rem' }}
          >
            Listings
          </Link>
          {loggedIn && (
            <Link
              to="/recommendations"
              style={{
                color: '#e5e7eb',
                textDecoration: 'none',
                fontSize: '0.95rem',
              }}
            >
              ✨ For You
            </Link>
          )}
          {loggedIn && role === 'provider' && (
            <>
              <Link
                to="/add-listing"
                style={{
                  color: '#e5e7eb',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                }}
              >
                Add Listing
              </Link>
              <Link
                to="/my-listings"
                style={{
                  color: '#e5e7eb',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                }}
              >
                My Listings
              </Link>
            </>
          )}
          {loggedIn && (
            <>
              <Link
                to="/my-bookings"
                style={{
                  color: '#e5e7eb',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                }}
              >
                My Bookings
              </Link>
              <Link
                to="/profile"
                style={{
                  color: '#e5e7eb',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                }}
              >
                Profile
              </Link>
            </>
          )}
          {!loggedIn && (
            <>
              <Link
                to="/login"
                style={{
                  color: '#e5e7eb',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                }}
              >
                Login
              </Link>
              <Link
                to="/register"
                style={{
                  color: '#e5e7eb',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                }}
              >
                Register
              </Link>
            </>
          )}
          {loggedIn && (
            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #4b5563',
                backgroundColor: 'transparent',
                color: '#e5e7eb',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
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
