import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import ProviderRoute from './components/ProviderRoute'
import AdminRoute from './components/AdminRoute'
import Listings from './pages/Listings'
import MapView from './pages/MapView'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import MyBookings from './pages/MyBookings'
import AddListing from './pages/AddListing'
import BookingForm from './pages/BookingForm'
import EditListing from './pages/EditListing'
import MyListings from './pages/MyListings'
import Profile from './pages/Profile'
import Recommendations from './pages/Recommendations'
import AdminDashboard from './pages/admin/AdminDashboard'
import ListingDetail from './pages/ListingDetail'
import ProviderAnalytics from './pages/ProviderAnalytics'
import PaymentPage from './pages/PaymentPage'
import PaymentHistory from './pages/PaymentHistory'
import ProviderPayments from './pages/ProviderPayments'
import TripPlanner from './pages/TripPlanner'
import MyTrips from './pages/MyTrips'
import MyReservations from './pages/MyReservations'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import EventTickets from './pages/EventTickets'
import MyTickets from './pages/MyTickets'
import CreateEvent from './pages/CreateEvent'
import MyEvents from './pages/MyEvents'

function App() {
  return (
    <BrowserRouter>
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Listings />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/home" element={<Home />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route
            path="/events/:id/tickets"
            element={
              <PrivateRoute>
                <EventTickets />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-tickets"
            element={
              <PrivateRoute>
                <MyTickets />
              </PrivateRoute>
            }
          />
          <Route path="/listing/:id" element={<ListingDetail />} />
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
            path="/my-reservations"
            element={
              <PrivateRoute>
                <MyReservations />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-spending"
            element={
              <PrivateRoute>
                <PaymentHistory />
              </PrivateRoute>
            }
          />
          <Route
            path="/provider-payments"
            element={
              <PrivateRoute>
                <ProviderPayments />
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
            path="/trip-planner"
            element={
              <PrivateRoute>
                <TripPlanner />
              </PrivateRoute>
            }
          />
          <Route
            path="/my-trips"
            element={
              <PrivateRoute>
                <MyTrips />
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
            path="/payment/:bookingId"
            element={
              <PrivateRoute>
                <PaymentPage />
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
            path="/my-analytics"
            element={
              <ProviderRoute>
                <ProviderAnalytics />
              </ProviderRoute>
            }
          />
          <Route
            path="/create-event"
            element={
              <ProviderRoute>
                <CreateEvent />
              </ProviderRoute>
            }
          />
          <Route
            path="/my-events"
            element={
              <ProviderRoute>
                <MyEvents />
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
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
