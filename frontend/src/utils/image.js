const IMAGE_BASE_URL = 'http://127.0.0.1:8000/uploads/'
const PLACEHOLDER = 'https://placehold.co/400x250/e5e7eb/9ca3af?text=GB+Tourism'

export const getImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return PLACEHOLDER
  }

  let trimmed = imageUrl.trim()

  // Already a full URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  // Path starting with "uploads/" – strip prefix
  if (trimmed.startsWith('uploads/')) {
    trimmed = trimmed.substring('uploads/'.length)
  }

  return `${IMAGE_BASE_URL}${trimmed}`
}

