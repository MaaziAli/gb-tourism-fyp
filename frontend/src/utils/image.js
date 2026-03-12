const IMAGE_BASE_URL = 'http://127.0.0.1:8000/uploads/'

export const getImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    const result = 'https://placehold.co/400x250?text=No+Image'
    console.log('image_url input:', imageUrl, '→ output:', result)
    return result
  }

  let trimmed = imageUrl.trim()

  // Already a full URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    console.log('image_url input:', imageUrl, '→ output:', trimmed)
    return trimmed
  }

  // Path starting with "uploads/" – strip prefix
  if (trimmed.startsWith('uploads/')) {
    trimmed = trimmed.substring('uploads/'.length)
  }

  const result = `${IMAGE_BASE_URL}${trimmed}`
  console.log('image_url input:', imageUrl, '→ output:', result)
  return result
}


