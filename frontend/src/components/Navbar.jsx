import { Link } from 'react-router-dom'

function Navbar() {
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
          <Link
            to="/add-listing"
            style={{ color: '#e5e7eb', textDecoration: 'none', fontSize: '0.95rem' }}
          >
            Add Listing
          </Link>
          <Link
            to="/login"
            style={{ color: '#e5e7eb', textDecoration: 'none', fontSize: '0.95rem' }}
          >
            Login
          </Link>
          <Link
            to="/register"
            style={{ color: '#e5e7eb', textDecoration: 'none', fontSize: '0.95rem' }}
          >
            Register
          </Link>
          <Link
            to="/my-bookings"
            style={{ color: '#e5e7eb', textDecoration: 'none', fontSize: '0.95rem' }}
          >
            My Bookings
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
