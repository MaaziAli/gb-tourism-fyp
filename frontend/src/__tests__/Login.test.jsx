import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'
import api from '../api/axios'

jest.mock('../api/axios', () => require('../__mocks__/api'))

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )
}

describe('Login page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  test('renders login form fields and submit button', () => {
    renderLogin()

    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  test('shows empty submit error when no token is returned', async () => {
    api.post.mockResolvedValueOnce({ data: {} })
    renderLogin()

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    const form = submitButton.closest('form')
    fireEvent.submit(form)

    expect(await screen.findByText(/no token received/i)).toBeInTheDocument()
  })

  test('allows typing in email and password inputs', async () => {
    renderLogin()

    const emailInput = screen.getByPlaceholderText('your@email.com')
    const passwordInput = screen.getByPlaceholderText('Enter your password')

    await userEvent.type(emailInput, 'Test@Example.com')
    await userEvent.type(passwordInput, 'abc123')

    expect(emailInput).toHaveValue('Test@Example.com')
    expect(passwordInput).toHaveValue('abc123')
  })

  test('calls login API on submit with normalized email', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        access_token: 'mock.jwt.token',
        user: { id: 1, role: 'traveler' },
      },
    })
    renderLogin()

    await userEvent.type(screen.getByPlaceholderText('your@email.com'), '  Test@Example.com  ')
    await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'abc123')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'abc123',
      })
    })
  })

  test('shows API error message on 401', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { detail: 'Invalid email or password' } },
    })
    renderLogin()

    await userEvent.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com')
    await userEvent.type(screen.getByPlaceholderText('Enter your password'), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument()
  })
})
