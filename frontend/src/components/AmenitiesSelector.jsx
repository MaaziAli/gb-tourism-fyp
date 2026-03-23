import { ALL_AMENITIES } from '../utils/amenities'

export default function AmenitiesSelector({
  selected = [],
  onChange
}) {
  function toggle(key) {
    const next = selected.includes(key)
      ? selected.filter(k => k !== key)
      : [...selected, key]
    onChange(next)
  }

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '8px'
      }}>
        {ALL_AMENITIES.map(a => {
          const on = selected.includes(a.key)
          return (
            <div
              key={a.key}
              onClick={() => toggle(a.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                border: on
                  ? '1px solid #0ea5e9'
                  : '1px solid var(--border-color)',
                background: on
                  ? '#e0f2fe'
                  : 'var(--bg-secondary)',
                transition: 'all 0.12s'
              }}
            >
              <span style={{
                width: 18,
                height: 18,
                borderRadius: '4px',
                background: on ? '#0ea5e9' : 'transparent',
                border: on
                  ? 'none'
                  : '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 800,
                flexShrink: 0,
                transition: 'all 0.12s'
              }}>
                {on ? '✓' : ''}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: on ? 700 : 400,
                color: on
                  ? '#0369a1'
                  : 'var(--text-secondary)'
              }}>
                {a.icon} {a.label}
              </span>
            </div>
          )
        })}
      </div>

      {selected.length > 0 && (
        <div style={{
          marginTop: '8px',
          fontSize: '0.75rem',
          color: '#0369a1'
        }}>
          ✓ {selected.length} amenity
          {selected.length > 1 ? 'ies' : 'y'} selected
        </div>
      )}
    </div>
  )
}

