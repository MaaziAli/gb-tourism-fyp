export default function BookingSteps({
  step = 1
}) {
  const steps = [
    { id: 1, label: 'Details' },
    { id: 2, label: 'Payment' },
    { id: 3, label: 'Confirmation' },
  ]

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '16px',
      flexWrap: 'wrap',
    }}>
      {steps.map((s) => {
        const active = step >= s.id
        return (
          <div
            key={s.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '999px',
              border: `1px solid ${
                active ? '#7dd3fc' : 'var(--border-color)'
              }`,
              background: active ? '#e0f2fe' : 'var(--bg-secondary)',
              color: active ? '#0369a1' : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            <span>{active ? '✓' : s.id}</span>
            <span>{s.label}</span>
          </div>
        )
      })}
    </div>
  )
}
