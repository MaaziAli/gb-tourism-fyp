import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('username', email)
      formData.append('password', password)
      const res = await api.post(
        '/auth/login', formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      localStorage.setItem('token', res.data.access_token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      const role = res.data.user?.role
      if (role === 'admin') navigate('/admin')
      else if (role === 'provider') navigate('/my-listings')
      else navigate('/')
    } catch(e) {
      setError(
        e.response?.data?.detail || 'Invalid email or password'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden'
      }}>

        {/* Gradient header */}
        <div style={{
          background:
            'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
          padding: '36px 24px', textAlign: 'center'
        }}>
          <div style={{
            fontSize: '3rem', marginBottom: '10px'
          }}>
            🏔️
          </div>
          <h1 style={{
            color: 'white', margin: '0 0 6px',
            fontSize: '1.6rem', fontWeight: 800,
            letterSpacing: '-0.02em'
          }}>
            Welcome Back
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            margin: 0, fontSize: '0.9rem'
          }}>
            Sign in to GB Tourism
          </p>
        </div>

        {/* Form area */}
        <div style={{padding: '28px 24px'}}>

          {error && (
            <div style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '18px',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{marginBottom: '16px'}}>
              <label style={{
                display: 'block', fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
                style={{
                  width: '100%', padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e =>
                  e.target.style.borderColor = 'var(--accent)'
                }
                onBlur={e =>
                  e.target.style.borderColor =
                    'var(--border-color)'
                }
              />
            </div>

            {/* Password */}
            <div style={{marginBottom: '22px'}}>
              <label style={{
                display: 'block', fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  width: '100%', padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e =>
                  e.target.style.borderColor = 'var(--accent)'
                }
                onBlur={e =>
                  e.target.style.borderColor =
                    'var(--border-color)'
                }
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                borderRadius: '10px', border: 'none',
                background:
                  'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                color: 'white', fontWeight: 700,
                fontSize: '1rem', cursor: 'pointer',
                opacity: loading ? 0.75 : 1,
                transition: 'opacity 0.2s, transform 0.1s',
                letterSpacing: '0.01em'
              }}
              onMouseEnter={e => {
                if (!loading)
                  e.target.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)'
              }}
            >
              {loading ? '⏳ Signing in...' : 'Sign In →'}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: '12px', margin: '20px 0'
          }}>
            <div style={{
              flex: 1, height: '1px',
              background: 'var(--border-color)'
            }} />
            <span style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)'
            }}>
              New to GB Tourism?
            </span>
            <div style={{
              flex: 1, height: '1px',
              background: 'var(--border-color)'
            }} />
          </div>

          {/* Register link */}
          <Link to="/register" style={{
            display: 'block', textAlign: 'center',
            padding: '12px',
            borderRadius: '10px',
            border: '2px solid var(--border-color)',
            color: 'var(--text-primary)',
            textDecoration: 'none',
            fontWeight: 700, fontSize: '0.95rem',
            transition: 'border-color 0.2s, color 0.2s'
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor =
                'var(--accent)'
              e.currentTarget.style.color = 'var(--accent)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor =
                'var(--border-color)'
              e.currentTarget.style.color =
                'var(--text-primary)'
            }}
          >
            Create an Account
          </Link>

        </div>
      </div>
    </div>
  )
}
