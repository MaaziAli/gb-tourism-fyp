import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import BookingForm from '../pages/BookingForm'
import api from '../api/axios'

jest.mock('../api/axios', () => require('../__mocks__/api'))

jest.mock('../hooks/useWindowSize', () => ({
  __esModule: true,
  default: () => ({ isMobile: false }),
}))

jest.mock('../context/CurrencyContext', () => require('../__mocks__/CurrencyContext'))

jest.mock('../components/AvailabilityCalendar', () => () => <div>Availability Calendar</div>)
jest.mock('../components/CouponInput', () => () => <div>Coupon Input</div>)
jest.mock('../components/LoyaltyInput', () => () => <div>Loyalty Input</div>)
jest.mock('../components/PointsEarnedPopup', () => () => <div>Points Popup</div>)
jest.mock('../components/Toast', () => () => <div>Toast</div>)
jest.mock('../components/PriceBreakdown', () => () => <div>Price Breakdown</div>)
jest.mock('../components/CancellationPolicy', () => () => <div>Cancellation Policy</div>)

function addDays(daysToAdd) {
  const date = new Date()
  date.setDate(date.getDate() + daysToAdd)
  return date.toISOString().split('T')[0]
}

function renderBookingForm() {
  return render(
    <MemoryRouter initialEntries={['/booking/1']}>
      <Routes>
        <Route path="/booking/:listingId" element={<BookingForm />} />
      </Routes>
    </MemoryRouter>
  )
}

function setBookingDates(checkInDate, checkOutDate) {
  const dateInputs = document.querySelectorAll('input[type="date"]')
  const checkInInput = dateInputs[0]
  const checkOutInput = dateInputs[1]

  fireEvent.change(checkInInput, { target: { value: checkInDate } })
  fireEvent.change(checkOutInput, { target: { value: checkOutDate } })
}

describe('BookingForm page', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    api.get.mockImplementation((url) => {
      if (url === '/listings/1') {
        return Promise.resolve({
          data: {
            id: 1,
            title: 'Hunza View Hotel',
            location: 'Hunza',
            service_type: 'hotel',
            price_per_night: 5000,
            owner_id: 10,
          },
        })
      }
      if (url === '/rooms/hotel/1') {
        return Promise.resolve({ data: [] })
      }
      if (url === '/room-types/1') {
        return Promise.resolve({ data: [] })
      }
      return Promise.resolve({ data: [] })
    })

    api.post.mockResolvedValue({
      data: {
        id: 101,
        total_price: 10000,
        loyalty_discount_applied: 0,
        loyalty_points_used: 0,
      },
    })
  })

  test('renders check-in and check-out date fields', async () => {
    renderBookingForm()

    expect(await screen.findByText('Complete Your Booking')).toBeInTheDocument()
    const dateInputs = document.querySelectorAll('input[type="date"]')
    expect(dateInputs.length).toBeGreaterThanOrEqual(2)
  })

  test('renders submit button', async () => {
    renderBookingForm()

    expect(await screen.findByText('Complete Your Booking')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /select dates to continue/i })).toBeInTheDocument()
  })

  test('shows calculated total price after selecting dates', async () => {
    renderBookingForm()
    await screen.findByText('Complete Your Booking')

    setBookingDates(addDays(1), addDays(3))

    expect(await screen.findByRole('button', { name: /confirm booking/i })).toHaveTextContent(
      'Confirm Booking — PKR 10000'
    )
  })

  test('calls booking API when submitting', async () => {
    renderBookingForm()
    await screen.findByText('Complete Your Booking')

    setBookingDates(addDays(1), addDays(3))
    await userEvent.click(await screen.findByRole('button', { name: /confirm booking/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/bookings/',
        expect.objectContaining({
          listing_id: 1,
          check_in: addDays(1),
          check_out: addDays(3),
          total_price: 10000,
        })
      )
    })
  })

  test('shows success state after successful booking', async () => {
    renderBookingForm()
    await screen.findByText('Complete Your Booking')

    setBookingDates(addDays(1), addDays(3))
    await userEvent.click(await screen.findByRole('button', { name: /confirm booking/i }))

    expect(await screen.findByText('Booking Confirmed!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view my bookings/i })).toBeInTheDocument()
  })
})
