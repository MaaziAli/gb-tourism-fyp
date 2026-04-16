import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import SearchPage from '../pages/SearchPage'
import api from '../api/axios'

jest.mock('../api/axios', () => require('../__mocks__/api'))

jest.mock('../hooks/useWindowSize', () => ({
  __esModule: true,
  default: () => ({ isMobile: false }),
}))

jest.mock('../utils/image', () => ({
  __esModule: true,
  getImageUrl: () => 'https://placehold.co/130x100',
}))

jest.mock('../context/CurrencyContext', () => require('../__mocks__/CurrencyContext'))

function renderSearch() {
  return render(
    <MemoryRouter>
      <SearchPage />
    </MemoryRouter>
  )
}

function mockSearchResults(results = [], total = results.length) {
  api.get.mockImplementation((url) => {
    if (url === '/listings/search/suggestions') {
      return Promise.resolve({ data: { suggestions: [] } })
    }
    if (url === '/listings/search') {
      return Promise.resolve({ data: { results, total } })
    }
    return Promise.resolve({ data: {} })
  })
}

describe('Search page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders search input', () => {
    mockSearchResults()
    renderSearch()
    expect(
      screen.getByPlaceholderText('Search hotels, tours, guides, activities...')
    ).toBeInTheDocument()
  })

  test('displays listings after search', async () => {
    mockSearchResults([
      {
        id: 1,
        title: 'Hunza View Hotel',
        location: 'Hunza',
        description: 'Beautiful valley stay',
        service_type: 'hotel',
        price_per_night: 5000,
        image_url: null,
        average_rating: 4.5,
        review_count: 10,
      },
    ])
    renderSearch()

    await userEvent.click(screen.getByRole('button', { name: 'Search' }))

    expect(await screen.findByText('Hunza View Hotel')).toBeInTheDocument()
    expect(
      screen.getAllByText((_, node) => node?.textContent?.includes('1 result') ?? false).length
    ).toBeGreaterThan(0)
  })

  test('shows loading state while searching', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/listings/search/suggestions') {
        return Promise.resolve({ data: { suggestions: [] } })
      }
      if (url === '/listings/search') {
        return new Promise(() => {})
      }
      return Promise.resolve({ data: {} })
    })
    renderSearch()

    await userEvent.click(screen.getByRole('button', { name: 'Search' }))

    expect(screen.getByText('Searching...')).toBeInTheDocument()
  })

  test('filters by query text in API request', async () => {
    mockSearchResults()
    renderSearch()

    await userEvent.type(
      screen.getByPlaceholderText('Search hotels, tours, guides, activities...'),
      'Hunza'
    )
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))

    await waitFor(() => {
      const searchCall = api.get.mock.calls.find(([url]) => url === '/listings/search')
      expect(searchCall).toBeTruthy()
      expect(searchCall[1].params.q).toBe('Hunza')
    })
  })

  test('shows empty state when no results found', async () => {
    mockSearchResults([], 0)
    renderSearch()

    await userEvent.click(screen.getByRole('button', { name: 'Search' }))

    expect(await screen.findByText('No results found')).toBeInTheDocument()
    expect(screen.getByText('Try different keywords or remove some filters')).toBeInTheDocument()
  })
})
