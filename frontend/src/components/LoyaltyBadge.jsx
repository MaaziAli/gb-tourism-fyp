import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const TIER_STYLES = {
  bronze: {
    bg: 'rgba(180, 83, 9, 0.12)',
    border: 'rgba(180, 83, 9, 0.3)',
    color: '#b45309',
    darkColor: '#fbbf24',
  },
  silver: {
    bg: 'rgba(107, 114, 128, 0.12)',
    border: 'rgba(107, 114, 128, 0.3)',
    color: '#4b5563',
    darkColor: '#d1d5db',
  },
  gold: {
    bg: 'rgba(217, 119, 6, 0.12)',
    border: 'rgba(217, 119, 6, 0.3)',
    color: '#d97706',
    darkColor: '#fbbf24',
  },
  platinum: {
    bg: 'rgba(124, 58, 237, 0.12)',
    border: 'rgba(124, 58, 237, 0.3)',
    color: '#7c3aed',
    darkColor: '#a78bfa',
  },
}

export default function LoyaltyBadge({ compact = false }) {
  const [account, setAccount] = useState(null)
  const [themeTick, setThemeTick] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (!raw) return
    let user
    try {
      user = JSON.parse(raw)
    } catch (e) {
      return
    }
    if (user.role !== 'user') return

    api
      .get('/loyalty/my-account')
      .then((r) => setAccount(r.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const obs = new MutationObserver(() => setThemeTick((t) => t + 1))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])

  if (!account) return null

  const isDark =
    themeTick >= 0 &&
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('data-theme') === 'dark'

  const tierStyle = TIER_STYLES[account.tier] || TIER_STYLES.silver
  const accentText = isDark ? tierStyle.darkColor : tierStyle.color

  if (compact) {
    return (
      <div
        onClick={() => navigate('/loyalty')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: 'var(--accent-light)',
          border: '1px solid var(--border-color)',
          borderRadius: '999px',
          padding: '4px 10px',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--accent)',
        }}
      >
        {account.tier_emoji} {account.total_points} pts
      </div>
    )
  }

  return (
    <div
      onClick={() => navigate('/loyalty')}
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        cursor: 'pointer',
        borderLeft: '4px solid var(--accent)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.875rem',
              color: 'var(--text-primary)',
              marginBottom: '2px',
            }}
          >
            {account.tier_emoji} {account.tier_label} Member
          </div>
          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
            }}
          >
            {account.total_points.toLocaleString('en-PK')} points ≈ PKR{' '}
            {account.pkr_value?.toLocaleString('en-PK')}
          </div>
          {account.points_to_next_tier != null && account.points_to_next_tier > 0 && (
            <div
              style={{
                fontSize: '0.72rem',
                color: accentText,
                fontWeight: 600,
                marginTop: '2px',
              }}
            >
              {account.points_to_next_tier} pts to {account.next_tier_emoji} {account.next_tier}
            </div>
          )}
        </div>
        <span style={{ fontSize: '1.8rem', opacity: 0.8 }}>{account.tier_emoji}</span>
      </div>
    </div>
  )
}
