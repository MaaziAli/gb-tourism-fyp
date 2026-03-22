import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import PrivateRoute from './components/PrivateRoute'
import ProviderRoute from './components/ProviderRoute'
import AdminRoute from './components/AdminRoute'
import Listings from './pages/Listings'
import MapView from './pages/MapView'
import Home from './pages/Home'
import SearchPage from './pages/SearchPage'
import Login from './pages/Login'
import Register from './pages/Register'
import MyBookings from './pages/MyBookings'
import AddListing from './pages/AddListing'
import BookingForm from './pages/BookingForm'
import GroupBookingForm from './pages/GroupBookingForm'
import EditListing from './pages/EditListing'
import MyListings from './pages/MyListings'
import Profile from './pages/Profile'
import Recommendations from './pages/Recommendations'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminAnalytics from './pages/admin/AdminAnalytics'
import ListingDetail from './pages/ListingDetail'
import ProviderAnalytics from './pages/ProviderAnalytics'
import ProviderDashboard from './pages/ProviderDashboard'
import ProviderEarningsChart from './pages/ProviderEarningsChart'
import NotificationsPage from './pages/NotificationsPage'
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
import EventAttendees from './pages/EventAttendees'
import EventAnalytics from './pages/EventAnalytics'
import Wishlist from './pages/Wishlist'
import PublicCoupons from './pages/PublicCoupons'
import MyCoupons from './pages/MyCoupons'
import LoyaltyPage from './pages/LoyaltyPage'
import MessagesPage from './pages/MessagesPage'
import BookingVoucher from './pages/BookingVoucher'
import CompareBar from './components/CompareBar'
import ComparePage from './pages/ComparePage'

function App() {
  return (
    <BrowserRouter>
      <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
        <Navbar />
        <CompareBar />
        <Routes>
          <Route path="/" element={<Listings />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/deals" element={<PublicCoupons />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route
            path="/listing/:id"
            element={
              <PrivateRoute>
                <ListingDetail />
              </PrivateRoute>
            }
          />
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
            path="/messages"
            element={
              <PrivateRoute>
                <MessagesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/voucher/:bookingId"
            element={
              <PrivateRoute>
                <BookingVoucher />
              </PrivateRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <PrivateRoute>
                <Wishlist />
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
              <ProviderRoute>
                <ProviderPayments />
              </ProviderRoute>
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
            path="/group-booking/:listingId"
            element={
              <PrivateRoute>
                <GroupBookingForm />
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
            path="/provider-dashboard"
            element={
              <ProviderRoute>
                <ProviderDashboard />
              </ProviderRoute>
            }
          />
          <Route
            path="/earnings-chart"
            element={
              <ProviderRoute>
                <ProviderEarningsChart />
              </ProviderRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <PrivateRoute>
                <NotificationsPage />
              </PrivateRoute>
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
            path="/my-coupons"
            element={
              <ProviderRoute>
                <MyCoupons />
              </ProviderRoute>
            }
          />
          <Route
            path="/event-analytics"
            element={
              <ProviderRoute>
                <EventAnalytics />
              </ProviderRoute>
            }
          />
          <Route
            path="/events/:id/attendees"
            element={
              <ProviderRoute>
                <EventAttendees />
              </ProviderRoute>
            }
          />
          <Route
            path="/loyalty"
            element={
              <PrivateRoute>
                <LoyaltyPage />
              </PrivateRoute>
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
            path="/admin/analytics"
            element={
              <AdminRoute>
                <AdminAnalytics />
              </AdminRoute>
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
