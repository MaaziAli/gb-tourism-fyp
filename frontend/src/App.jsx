import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import Listings from './pages/Listings'
import Login from './pages/Login'
import Register from './pages/Register'
import MyBookings from './pages/MyBookings'
import AddListing from './pages/AddListing'
import BookingForm from './pages/BookingForm'
import EditListing from './pages/EditListing'
import MyListings from './pages/MyListings'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Listings />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/my-bookings"
          element={
            <PrivateRoute>
              <MyBookings />
            </PrivateRoute>
          }
        />
        <Route
          path="/add-listing"
          element={
            <PrivateRoute>
              <AddListing />
            </PrivateRoute>
          }
        />
        <Route
          path="/booking/:listingId"
          element={
            <PrivateRoute>
              <BookingForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/edit-listing/:listingId"
          element={
            <PrivateRoute>
              <EditListing />
            </PrivateRoute>
          }
        />
        <Route
          path="/my-listings"
          element={
            <PrivateRoute>
              <MyListings />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
