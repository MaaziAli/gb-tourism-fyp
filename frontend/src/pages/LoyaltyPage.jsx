import { useState, useEffect } from 'react'
import api from '../api/axios'
import useWindowSize from '../hooks/useWindowSize'

const TIER_COLORS = {
  bronze: { bg: '#92400e', light: '#fef3c7', text: '#92400e' },
  silver: { bg: '#6b7280', light: '#f3f4f6', text: '#4b5563' },
  gold: { bg: '#d97706', light: '#fef9c3', text: '#b45309' },
  platinum: { bg: '#7c3aed', light: '#f5f3ff', text: '#6d28d9' },
}

export default function LoyaltyPage() {
  const [account, setAccount] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [redeemPoints, setRedeemPoints] = useState('')
  const [redeemCalc, setRedeemCalc] = useState(null)
  const [calcLoading, setCalcLoading] = useState(false)
  const { isMobile } = useWindowSize()

  useEffect(() => {
    Promise.all([api.get('/loyalty/my-account'), api.get('/loyalty/transactions')])
      .then(([acc, txns]) => {
        setAccount(acc.data)
        setTransactions(txns.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function calculateRedeem() {
    if (!redeemPoints || parseInt(redeemPoints, 10) <= 0) return
    setCalcLoading(true)
    try {
      const res = await api.post('/loyalty/calculate-redeem', {
        points: parseInt(redeemPoints, 10),
        booking_amount: 10000,
      })
      setRedeemCalc(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setCalcLoading(false)
    }
  }

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getTxnIcon(type) {
    const icons = {
      booking_earn: '🏨',
      review_bonus: '⭐',
      first_booking: '🎉',
      event_earn: '🎪',
      restaurant_earn: '🍽️',
      redeem: '🎁',
      expire: '⏰',
      admin_adjust: '🔧',
    }
    return icons[type] || '💰'
  }

  if (loading)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⭐</div>
          Loading loyalty account...
        </div>
      </div>
    )

  if (!account) return null

  const tierColor = TIER_COLORS[account.tier] || TIER_COLORS.bronze

  const curTierRow = account.tiers?.find((t) => t.key === account.tier)
  const nextTierRow = account.next_tier
    ? account.tiers?.find((t) => t.key === account.next_tier)
    : null
  const curTh = curTierRow?.threshold ?? 0
  const nextTh = nextTierRow?.threshold ?? curTh
  const span = nextTh - curTh
  const progressToNext =
    account.next_tier && span > 0
      ? Math.min(
          100,
          Math.round(
            ((account.lifetime_points - curTh) / span) * 100,
          ),
        )
      : 100

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        paddingBottom: '48px',
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${tierColor.bg}dd, ${tierColor.bg})`,
          padding: '40px 16px 100px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -40,
            left: -40,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '20px',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '999px',
                  padding: '6px 16px',
                  marginBottom: '14px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                {account.tier_emoji} {account.tier_label} Member
              </div>

              <h1
                style={{
                  color: 'white',
                  margin: '0 0 6px',
                  fontSize: isMobile ? '1.6rem' : '2rem',
                  fontWeight: 800,
                }}
              >
                ⭐ Loyalty Points
              </h1>
              <p
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  margin: '0 0 20px',
                  fontSize: '0.9rem',
                }}
              >
                Earn points on every booking and redeem for discounts
              </p>

              {account.next_tier && (
                <div style={{ maxWidth: '340px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      color: 'white',
                      marginBottom: '6px',
                      opacity: 0.9,
                    }}
                  >
                    <span>
                      {account.tier_emoji} {account.tier_label}
                    </span>
                    <span>
                      {account.points_to_next_tier} pts to{' '}
                      {account.next_tier_emoji}{' '}
                      {account.next_tier
                        ? account.next_tier.charAt(0).toUpperCase() +
                          account.next_tier.slice(1)
                        : ''}
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, progressToNext)}%`,
                        height: '100%',
                        background: 'white',
                        borderRadius: '4px',
                        transition: 'width 0.5s',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '20px',
                padding: '20px 28px',
                textAlign: 'center',
                minWidth: '160px',
              }}
            >
              <div
                style={{
                  fontSize: '2.8rem',
                  fontWeight: 800,
                  color: 'white',
                  lineHeight: 1,
                }}
              >
                {account.total_points.toLocaleString('en-PK')}
              </div>
              <div
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.82rem',
                  marginTop: '4px',
                }}
              >
                Available Points
              </div>
              <div
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  marginTop: '8px',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  padding: '6px',
                }}
              >
                ≈ PKR {account.pkr_value?.toLocaleString('en-PK')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '0 16px',
          marginTop: '-60px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '20px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {[
            {
              icon: '⭐',
              label: 'Available',
              value: account.total_points.toLocaleString('en-PK'),
              sub: 'points',
              color: tierColor.bg,
            },
            {
              icon: '🏆',
              label: 'Lifetime Earned',
              value: account.lifetime_points.toLocaleString('en-PK'),
              sub: 'total points',
              color: '#16a34a',
            },
            {
              icon: '💰',
              label: 'Redeemable',
              value: 'PKR ' + (account.pkr_value || 0).toLocaleString('en-PK'),
              sub: 'discount value',
              color: '#2563eb',
            },
            {
              icon: account.tier_emoji,
              label: 'Current Tier',
              value: account.tier_label,
              sub:
                account.bonus_multiplier > 1
                  ? `+${Math.round((account.bonus_multiplier - 1) * 100)}% bonus`
                  : 'base rate',
              color: tierColor.bg,
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                padding: isMobile ? '14px' : '20px',
                borderTop: `3px solid ${card.color}`,
              }}
            >
              <div style={{ fontSize: '1.3rem', marginBottom: '6px' }}>{card.icon}</div>
              <div
                style={{
                  fontSize: isMobile ? '0.95rem' : '1.1rem',
                  fontWeight: 800,
                  color: card.color,
                }}
              >
                {card.value}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  marginTop: '2px',
                }}
              >
                {card.label}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {account.total_points >= 1000 && (
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-md)',
              padding: '24px',
              marginBottom: '20px',
            }}
          >
            <h3
              style={{
                margin: '0 0 6px',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              🎁 Redeem Your Points
            </h3>
            <p
              style={{
                margin: '0 0 16px',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
              }}
            >
              Use your points as discount when booking. 1000 points = PKR 1 off
            </p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Points to Redeem
                </label>
                <input
                  type="number"
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(e.target.value)}
                  placeholder="e.g. 5000"
                  min={1000}
                  max={account.total_points}
                  step={1000}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="button"
                  onClick={calculateRedeem}
                  disabled={calcLoading}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: tierColor.bg,
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  {calcLoading ? '...' : 'Calculate'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {[1000, 5000, 10000, 50000]
                .filter((p) => p <= account.total_points)
                .map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => {
                      setRedeemPoints(String(p))
                      setRedeemCalc({
                        points_to_use: p,
                        discount_amount: p * 0.001,
                        remaining_after: account.total_points - p,
                      })
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      border:
                        redeemPoints === String(p)
                          ? `2px solid ${tierColor.bg}`
                          : '1px solid var(--border-color)',
                      background:
                        redeemPoints === String(p) ? tierColor.light : 'var(--bg-secondary)',
                      color:
                        redeemPoints === String(p)
                          ? tierColor.bg
                          : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.82rem',
                    }}
                  >
                    {p >= 1000 ? `${p / 1000}K` : p} pts
                    <span style={{ marginLeft: '4px', fontSize: '0.72rem', opacity: 0.7 }}>
                      = PKR {(p * 0.001).toLocaleString('en-PK')}
                    </span>
                  </button>
                ))}
            </div>

            {redeemCalc && (
              <div
                style={{
                  background: '#dcfce7',
                  border: '1px solid #86efac',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>🎁 Discount Value</span>
                  <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '1.1rem' }}>
                    PKR {(redeemCalc.discount_amount || 0).toLocaleString('en-PK')}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#15803d' }}>
                  Using {redeemCalc.points_to_use} points · {redeemCalc.remaining_after} remaining
                </div>
              </div>
            )}

            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}
            >
              💡 <strong>How to use:</strong> Apply your points as discount when booking any service.
              Enter your points in the coupon/discount section of the booking form.
            </div>
          </div>
        )}

        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            padding: '24px',
            marginBottom: '20px',
          }}
        >
          <h3
            style={{
              margin: '0 0 16px',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            🏆 Membership Tiers
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: '12px',
            }}
          >
            {account.tiers?.map((tier) => {
              const tc = TIER_COLORS[tier.key] || TIER_COLORS.bronze
              const bonusPct = tier.bonus_percent ?? tier.bonus ?? 0
              return (
                <div
                  key={tier.key}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: tier.is_current ? `2px solid ${tc.bg}` : '1px solid var(--border-color)',
                    background: tier.is_current ? tc.light : 'var(--bg-secondary)',
                    opacity: tier.is_achieved ? 1 : 0.5,
                  }}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>
                    {tier.emoji}
                    {tier.is_current && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          background: tc.bg,
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '999px',
                          marginLeft: '4px',
                          fontWeight: 700,
                          verticalAlign: 'middle',
                        }}
                      >
                        YOU
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: tier.is_current ? tc.bg : 'var(--text-primary)',
                      marginBottom: '3px',
                    }}
                  >
                    {tier.label}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    {tier.threshold === 0
                      ? 'Starting tier'
                      : `${tier.threshold.toLocaleString('en-PK')} lifetime pts`}
                  </div>
                  {bonusPct > 0 && (
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: tier.is_current ? tc.bg : '#16a34a',
                      }}
                    >
                      +{bonusPct}% bonus pts
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            padding: '24px',
            marginBottom: '20px',
          }}
        >
          <h3
            style={{
              margin: '0 0 16px',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            💡 How to Earn Points
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '10px',
            }}
          >
            {[
              {
                icon: '🏨',
                title: 'Book Any Service',
                desc: 'PKR 1 = 10 points earned',
                bonus:
                  account.bonus_multiplier > 1
                    ? `+${Math.round((account.bonus_multiplier - 1) * 100)}% tier bonus`
                    : null,
                color: '#2563eb',
              },
              {
                icon: '⭐',
                title: 'Write a Review',
                desc: '2,000 bonus points per review',
                color: '#d97706',
              },
              {
                icon: '🎉',
                title: 'First Booking',
                desc: '5,000 bonus points one-time',
                color: '#16a34a',
              },
              {
                icon: '🎪',
                title: 'Book Event Tickets',
                desc: 'PKR 1 = 10 points earned',
                color: '#7c3aed',
              },
              {
                icon: '🍽️',
                title: 'Restaurant Reservation',
                desc: '1,000 bonus points per reservation',
                color: '#e11d48',
              },
              {
                icon: '🏆',
                title: 'Reach Higher Tiers',
                desc: 'Earn up to 20% bonus points',
                color: tierColor.bg,
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: 'var(--text-primary)',
                      marginBottom: '2px',
                    }}
                  >
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                  {item.bonus && (
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: item.color,
                        fontWeight: 600,
                        marginTop: '2px',
                      }}
                    >
                      ✨ {item.bonus}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            padding: '24px',
          }}
        >
          <h3
            style={{
              margin: '0 0 16px',
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            📋 Points History
          </h3>

          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⭐</div>
              No transactions yet. Start booking to earn points!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.2rem' }}>{getTxnIcon(txn.type)}</span>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {txn.description}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {formatDate(txn.created_at)} · Balance: {txn.balance_after} pts
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: txn.points > 0 ? '#16a34a' : '#dc2626',
                      flexShrink: 0,
                    }}
                  >
                    {txn.points > 0 ? '+' : ''}
                    {txn.points}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
