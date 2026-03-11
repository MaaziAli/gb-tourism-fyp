import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Listings from './pages/Listings'
import Login from './pages/Login'
import Register from './pages/Register'
import MyBookings from './pages/MyBookings'
import AddListing from './pages/AddListing'
import BookingForm from './pages/BookingForm'
import EditListing from './pages/EditListing'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Listings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/add-listing" element={<AddListing />} />
        <Route path="/booking/:listingId" element={<BookingForm />} />
        <Route path="/edit-listing/:listingId" element={<EditListing />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
