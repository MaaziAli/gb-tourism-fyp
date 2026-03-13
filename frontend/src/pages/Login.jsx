import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)

      const { data } = await api.post('/auth/login', formData)
      localStorage.setItem('token', data.access_token)
      // Fetch current user profile for client-side authorization
      try {
        const meRes = await api.get('/users/me')
        localStorage.setItem('user', JSON.stringify(meRes.data))
      } catch {
        // If /users/me fails, continue with token-only auth
      }
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.detail ?? err.message ?? 'Login failed'
      setError(Array.isArray(msg) ? msg.map((m) => m.msg ?? JSON.stringify(m)).join(', ') : String(msg))
    }
  }

  return (
    <div className="page-container">
      <div
        style={{
          maxWidth: '400px',
          margin: '40px auto',
          backgroundColor: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h1 style={{ marginBottom: '24px', color: 'var(--text-primary)' }}>Login</h1>
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="email" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: '8px',
                fontSize: '0.95rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                width: '100%',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="password" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: '8px',
                fontSize: '0.95rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                width: '100%',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</p>}
          <button
            type="submit"
            style={{
              marginTop: '4px',
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--accent)',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
