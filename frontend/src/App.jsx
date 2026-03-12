import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import ProviderRoute from './components/ProviderRoute'
import Listings from './pages/Listings'
import Login from './pages/Login'
import Register from './pages/Register'
import MyBookings from './pages/MyBookings'
import AddListing from './pages/AddListing'
import BookingForm from './pages/BookingForm'
import EditListing from './pages/EditListing'
import MyListings from './pages/MyListings'
import Profile from './pages/Profile'
import Recommendations from './pages/Recommendations'

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
          path="/recommendations"
          element={
            <PrivateRoute>
              <Recommendations />
            </PrivateRoute>
          }
        />
        <Route
          path="/add-listing"
          element={
            <ProviderRoute>
              <AddListing />
            </ProviderRoute>
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
            <ProviderRoute>
              <EditListing />
            </ProviderRoute>
          }
        />
        <Route
          path="/my-listings"
          element={
            <ProviderRoute>
              <MyListings />
            </ProviderRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
