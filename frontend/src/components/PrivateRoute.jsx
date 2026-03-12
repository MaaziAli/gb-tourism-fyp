import { Navigate } from 'react-router-dom'

function PrivateRoute({ children }) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default PrivateRoute

