import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'

export default function Register() {
  const [step, setStep] = useState(1) // 1=choose role, 2=form
  const [role, setRole] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/register', {
        full_name: fullName,
        email,
        password,
        role
      })
      navigate('/login')
    } catch(e) {
      setError(
        e.response?.data?.detail || 'Registration failed'
      )
    } finally {
      setLoading(false)
    }
  }

  // STEP 1: Role selection screen
  if (step === 1) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px'
      }}>
        <div style={{
          width: '100%', maxWidth: '480px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
            padding: '32px 24px', textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2.5rem', marginBottom: '8px'
            }}>🏔️</div>
            <h1 style={{
              color: 'white', margin: '0 0 6px',
              fontSize: '1.6rem', fontWeight: 800
            }}>
              Join GB Tourism
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.8)',
              margin: 0, fontSize: '0.9rem'
            }}>
              How would you like to join?
            </p>
          </div>

          {/* Role cards */}
          <div style={{padding: '28px 24px'}}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px', marginBottom: '24px'
            }}>

              {/* Traveler card */}
              <div
                onClick={() => setRole('user')}
                style={{
                  padding: '24px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: role === 'user'
                    ? '2px solid var(--accent)'
                    : '2px solid var(--border-color)',
                  background: role === 'user'
                    ? 'var(--accent-light)'
                    : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  fontSize: '2.5rem', marginBottom: '10px'
                }}>
                  🧳
                </div>
                <div style={{
                  fontWeight: 700, fontSize: '1rem',
                  color: 'var(--text-primary)',
                  marginBottom: '6px'
                }}>
                  Traveler
                </div>
                <div style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5
                }}>
                  Explore & book hotels, tours and activities
                  across Gilgit-Baltistan
                </div>
                {role === 'user' && (
                  <div style={{
                    marginTop: '10px',
                    color: 'var(--accent)',
                    fontWeight: 700, fontSize: '0.85rem'
                  }}>
                    ✓ Selected
                  </div>
                )}
              </div>

              {/* Provider card */}
              <div
                onClick={() => setRole('provider')}
                style={{
                  padding: '24px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: role === 'provider'
                    ? '2px solid var(--accent)'
                    : '2px solid var(--border-color)',
                  background: role === 'provider'
                    ? 'var(--accent-light)'
                    : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  fontSize: '2.5rem', marginBottom: '10px'
                }}>
                  🏨
                </div>
                <div style={{
                  fontWeight: 700, fontSize: '1rem',
                  color: 'var(--text-primary)',
                  marginBottom: '6px'
                }}>
                  Service Provider
                </div>
                <div style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5
                }}>
                  List your hotel, tours, transport or
                  activities for travelers
                </div>
                {role === 'provider' && (
                  <div style={{
                    marginTop: '10px',
                    color: 'var(--accent)',
                    fontWeight: 700, fontSize: '0.85rem'
                  }}>
                    ✓ Selected
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                if (!role) return
                setStep(2)
              }}
              disabled={!role}
              style={{
                width: '100%', padding: '13px',
                borderRadius: '10px', border: 'none',
                background: role
                  ? 'linear-gradient(135deg, #1e3a5f, #0ea5e9)'
                  : 'var(--border-color)',
                color: role ? 'white' : 'var(--text-muted)',
                fontWeight: 700, fontSize: '1rem',
                cursor: role ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              Continue as {role === 'user'
                ? 'Traveler'
                : role === 'provider'
                ? 'Service Provider'
                : '...'
              }
            </button>

            <p style={{
              textAlign: 'center', marginTop: '16px',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)'
            }}>
              Already have an account?{' '}
              <Link to="/login" style={{
                color: 'var(--accent)', fontWeight: 600,
                textDecoration: 'none'
              }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // STEP 2: Registration form
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        width: '100%', maxWidth: '440px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
          padding: '24px', textAlign: 'center'
        }}>
          <div style={{fontSize: '2rem', marginBottom: '6px'}}>
            {role === 'provider' ? '🏨' : '🧳'}
          </div>
          <h2 style={{
            color: 'white', margin: '0 0 4px',
            fontSize: '1.3rem', fontWeight: 800
          }}>
            {role === 'provider'
              ? 'Register as Service Provider'
              : 'Register as Traveler'
            }
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            margin: 0, fontSize: '0.85rem'
          }}>
            Create your GB Tourism account
          </p>
        </div>

        <div style={{padding: '24px'}}>
          {/* Back button */}
          <button
            onClick={() => setStep(1)}
            type="button"
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '0.85rem',
              padding: '0 0 16px', display: 'flex',
              alignItems: 'center', gap: '4px'
            }}
          >
            ← Change role
          </button>

          {error && (
            <div style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '10px 14px',
              borderRadius: '8px', marginBottom: '16px',
              fontSize: '0.875rem', fontWeight: 600
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {[
              {
                label: 'Full Name',
                type: 'text',
                value: fullName,
                onChange: e => setFullName(e.target.value),
                placeholder: 'Your full name'
              },
              {
                label: 'Email Address',
                type: 'email',
                value: email,
                onChange: e => setEmail(e.target.value),
                placeholder: 'your@email.com'
              },
              {
                label: 'Password',
                type: 'password',
                value: password,
                onChange: e => setPassword(e.target.value),
                placeholder: 'Min 6 characters'
              },
              {
                label: 'Confirm Password',
                type: 'password',
                value: confirmPassword,
                onChange: e => setConfirmPassword(e.target.value),
                placeholder: 'Repeat password'
              },
            ].map(field => (
              <div key={field.label}
                style={{marginBottom: '14px'}}>
                <label style={{
                  display: 'block', fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px'
                }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={field.placeholder}
                  required
                  style={{
                    width: '100%', padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                marginTop: '4px',
                borderRadius: '10px', border: 'none',
                background:
                  'linear-gradient(135deg, #1e3a5f, #0ea5e9)',
                color: 'white', fontWeight: 700,
                fontSize: '1rem', cursor: 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{
            textAlign: 'center', marginTop: '16px',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{
              color: 'var(--accent)', fontWeight: 600,
              textDecoration: 'none'
            }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
