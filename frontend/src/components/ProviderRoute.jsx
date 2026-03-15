import { Navigate } from 'react-router-dom'
import { getRole, isLoggedIn } from '../utils/role'

function ProviderRoute({ children }) {
  const loggedIn = isLoggedIn()
  const role = getRole()

  if (!loggedIn) {
    return <Navigate to="/login" replace />
  }

  if (role !== 'provider' && role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProviderRoute

