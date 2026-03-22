export default function CancellationPolicy({
  policy = 'moderate',
  policyInfo = null,
  compact = false
}) {
  const policies = {
    flexible: {
      label: 'Flexible',
      emoji: '✅',
      color: '#16a34a',
      bg: '#dcfce7',
      border: '#86efac',
      rules: [
        'Full refund if cancelled 48h+ before check-in',
        '50% refund if cancelled within 48h',
        'No refund for no-shows'
      ]
    },
    moderate: {
      label: 'Moderate',
      emoji: '⚠️',
      color: '#d97706',
      bg: '#fef3c7',
      border: '#fcd34d',
      rules: [
        'Full refund if cancelled 5+ days before',
        'No refund within 5 days of check-in',
        'No refund for no-shows'
      ]
    },
    strict: {
      label: 'Strict',
      emoji: '❌',
      color: '#dc2626',
      bg: '#fee2e2',
      border: '#fca5a5',
      rules: [
        '50% refund if cancelled 1+ week before',
        'No refund within 1 week of check-in',
        'No refund for no-shows'
      ]
    }
  }

  const info = policyInfo || policies[policy]
    || policies.moderate

  if (compact) {
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center', gap: '5px',
        background: info.bg || '#fef3c7',
        border: `1px solid ${info.border || '#fcd34d'}`,
        borderRadius: '999px',
        padding: '3px 10px',
        fontSize: '0.75rem', fontWeight: 700,
        color: info.color || '#d97706'
      }}>
        {info.emoji || '⚠️'} {info.label} Cancel
      </div>
    )
  }

  return (
    <div style={{
      background: info.bg || '#fef3c7',
      border: `1px solid ${info.border || '#fcd34d'}`,
      borderRadius: '12px', padding: '14px 16px'
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '8px', marginBottom: '10px'
      }}>
        <span style={{fontSize: '1.2rem'}}>
          {info.emoji || '⚠️'}
        </span>
        <div>
          <div style={{
            fontWeight: 700, fontSize: '0.9rem',
            color: info.color || '#d97706'
          }}>
            {info.label || 'Moderate'} Cancellation
          </div>
          <div style={{
            fontSize: '0.72rem',
            color: info.color || '#d97706',
            opacity: 0.8
          }}>
            Know before you book
          </div>
        </div>
      </div>
      {info.description && (!info.rules || info.rules.length === 0) ? (
        <p style={{
          margin: 0,
          fontSize: '0.82rem',
          color: info.color || '#d97706',
          lineHeight: 1.5
        }}>
          {info.description}
        </p>
      ) : (
        (info.rules || []).map((rule, i) => (
          <div key={i} style={{
            display: 'flex', gap: '7px',
            fontSize: '0.8rem',
            color: info.color || '#d97706',
            marginBottom: '5px',
            alignItems: 'flex-start'
          }}>
            <span style={{flexShrink: 0}}>
              {i === 0 ? '✓' : i === 1 ? '~' : '✗'}
            </span>
            {rule}
          </div>
        ))
      )}
    </div>
  )
}
