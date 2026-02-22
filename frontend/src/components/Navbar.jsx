import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav>
      <Link to="/">Listings</Link>
      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>
      <Link to="/my-bookings">My Bookings</Link>
    </nav>
  )
}

export default Navbar
