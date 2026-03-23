import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
})

// ── Request interceptor ──
// Adds Bearer token + handles multipart
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`
    }

    // Let browser set Content-Type for FormData
    // (needs multipart boundary auto-generated)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    } else {
      config.headers['Content-Type'] =
        'application/json'
    }

    return config
  },
  error => Promise.reject(error)
)

// ── Response interceptor ──
// ONLY redirect on 401 for authenticated routes
// NEVER redirect on auth routes themselves
api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status
    const url = error.config?.url || ''

    // Auth endpoints — NEVER redirect
    // Let the component handle the error
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/logout')

    if (status === 401 && !isAuthRoute) {
      // Only clear and redirect if we had
      // a token (means it expired/invalid)
      const hadToken =
        localStorage.getItem('token')

      if (hadToken) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        // Use React Router navigate if possible
        // otherwise fall back to href
        const currentPath =
          window.location.pathname
        if (currentPath !== '/login') {
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api
