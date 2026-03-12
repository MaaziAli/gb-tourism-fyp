import { Navigate } from 'react-router-dom'
import { getRole, isLoggedIn } from '../utils/role'

function AdminRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />
  }
  if (getRole() !== 'admin') {
    return <Navigate to="/" replace />
  }
  return children
}

export default AdminRoute

