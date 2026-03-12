const IMAGE_BASE_URL = 'http://127.0.0.1:8000/uploads/'

export const getImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return 'https://placehold.co/400x250?text=No+Image'
  }
  const trimmed = imageUrl.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  return `${IMAGE_BASE_URL}${trimmed}`
}

