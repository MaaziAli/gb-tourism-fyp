export function isLoggedIn() {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')
  if (!token || !user) return false
  try {
    JSON.parse(user)
    return true
  } catch {
    return false
  }
}

export function getUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getUserRole() {
  const user = getUser()
  return user?.role || null
}

export function getToken() {
  return localStorage.getItem('token') || null
}

export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

