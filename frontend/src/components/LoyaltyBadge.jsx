import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function LoyaltyBadge({ compact = false }) {
  const [account, setAccount] = useState(null)
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

  if (!account) return null

  const TIER_COLORS = {
    bronze: '#92400e',
    silver: '#6b7280',
    gold: '#d97706',
    platinum: '#7c3aed',
  }
  const color = TIER_COLORS[account.tier] || '#6b7280'

  if (compact) {
    return (
      <div
        onClick={() => navigate('/loyalty')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: color + '18',
          border: `1px solid ${color}44`,
          borderRadius: '999px',
          padding: '4px 10px',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: color,
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
        background: 'var(--bg-card)',
        border: `1px solid ${color}44`,
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        cursor: 'pointer',
        borderLeft: `4px solid ${color}`,
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
          {account.points_to_next_tier != null &&
            account.points_to_next_tier > 0 && (
              <div
                style={{
                  fontSize: '0.72rem',
                  color: color,
                  fontWeight: 600,
                  marginTop: '2px',
                }}
              >
                {account.points_to_next_tier} pts to {account.next_tier_emoji}{' '}
                {account.next_tier}
              </div>
            )}
        </div>
        <span style={{ fontSize: '1.8rem', opacity: 0.8 }}>
          {account.tier_emoji}
        </span>
      </div>
    </div>
  )
}
