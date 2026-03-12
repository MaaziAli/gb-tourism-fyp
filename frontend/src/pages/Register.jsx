import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

function Register() {
  const navigate = useNavigate()
  const [full_name, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('user')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/auth/register', { full_name, email, password, role })
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.detail ?? err.message ?? 'Registration failed'
      setError(Array.isArray(msg) ? msg.map((m) => m.msg ?? JSON.stringify(m)).join(', ') : String(msg))
    }
  }

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          margin: '40px auto',
          backgroundColor: '#ffffff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 1px 4px rgba(15, 23, 42, 0.08)',
        }}
      >
        <h1 style={{ marginBottom: '24px' }}>Register</h1>
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="full_name">Full name</label>
            <input
              id="full_name"
              type="text"
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={{
                padding: '8px',
                fontSize: '0.95rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                width: '100%',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="email">Email</label>
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
                border: '1px solid #d1d5db',
                width: '100%',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="password">Password</label>
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
                border: '1px solid #d1d5db',
                width: '100%',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                padding: '8px',
                fontSize: '0.95rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                width: '100%',
              }}
            >
              <option value="user">User</option>
              <option value="provider">Provider</option>
            </select>
          </div>
          {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}
          <button
            type="submit"
            style={{
              marginTop: '4px',
              padding: '10px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Register
          </button>
        </form>
      </div>
    </div>
  )
}

export default Register
