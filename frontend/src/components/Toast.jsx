import { useEffect, useRef } from 'react'

const STYLES = {
  success: {
    bg: '#fefce8',
    border: '#fde047',
    icon: '⭐',
    titleColor: '#a16207',
    textColor: '#713f12',
  },
  info: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    icon: 'ℹ️',
    titleColor: '#1d4ed8',
    textColor: '#1e40af',
  },
  error: {
    bg: '#fef2f2',
    border: '#fecaca',
    icon: '❌',
    titleColor: '#b91c1c',
    textColor: '#991b1b',
  },
}

/**
 * Toast – lightweight fixed-position notification.
 *
 * Props:
 *   title    {string}   Bold first line.
 *   message  {string}   Body text.
 *   type     {string}   'success' | 'info' | 'error'  (default 'success')
 *   duration {number}   Auto-hide after N ms           (default 5000)
 *   onClose  {function} Called when the toast closes.
 */
export default function Toast({
  title,
  message,
  type = 'success',
  duration = 5000,
  onClose,
}) {
  const timerRef = useRef(null)
  const style = STYLES[type] ?? STYLES.success

  useEffect(() => {
    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        onClose?.()
      }, duration)
    }
    return () => clearTimeout(timerRef.current)
  }, [duration, onClose])

  return (
    <div
      role="alert"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        maxWidth: 340,
        background: style.bg,
        border: `1.5px solid ${style.border}`,
        borderRadius: 14,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        animation: 'toastSlideIn 0.25s ease',
      }}
    >
      <span style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0 }}>
        {style.icon}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div style={{
            fontWeight: 800,
            fontSize: '0.9rem',
            color: style.titleColor,
            marginBottom: 3,
          }}>
            {title}
          </div>
        )}
        {message && (
          <div style={{
            fontSize: '0.82rem',
            color: style.textColor,
            lineHeight: 1.5,
          }}>
            {message}
          </div>
        )}
        {/* Progress bar */}
        {duration > 0 && (
          <div style={{
            marginTop: 8,
            height: 3,
            borderRadius: 999,
            background: style.border,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              background: style.titleColor,
              animation: `toastProgress ${duration}ms linear forwards`,
              transformOrigin: 'left',
            }} />
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.1rem',
          color: style.titleColor,
          lineHeight: 1,
          flexShrink: 0,
          padding: 0,
          opacity: 0.7,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>

      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastProgress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  )
}
