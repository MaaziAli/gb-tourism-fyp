import { Navigate } from 'react-router-dom'

export default function ProviderRoute({
  children
}) {
  const token = localStorage.getItem('token')
  const user = (() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'provider' &&
      user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

