import { Navigate } from 'react-router-dom'

export default function PrivateRoute({
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

  return children
}

