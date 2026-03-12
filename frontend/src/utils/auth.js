import api from '../api/axios'

export const logout = async (navigate) => {
  try {
    await api.post('/auth/logout')
  } catch (error) {
    console.error('Logout API error:', error)
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (navigate) {
      navigate('/login')
    } else {
      window.location.href = '/login'
    }
  }
}

