export const getUser = () => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return parsed
    }
  } catch (e) {
    console.error('Failed to parse stored user', e)
  }
  return null
}

export const getRole = () => {
  const user = getUser()
  const role = user?.role
  return typeof role === 'string' ? role : null
}

export const isProvider = () => getRole() === 'provider'

export const isLoggedIn = () => {
  if (typeof window === 'undefined') {
    return false
  }
  const token = localStorage.getItem('token')
  const user = getUser()
  return Boolean(token && user)
}

