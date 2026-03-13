const PLACEHOLDER = 'https://placehold.co/400x250/e5e7eb/9ca3af?text=GB+Tourism'

export const getImageUrl = (imageUrl) => {
  if (!imageUrl) {
    return PLACEHOLDER
  }
  if (typeof imageUrl === 'string' && imageUrl.trim().startsWith('http')) {
    return imageUrl.trim()
  }
  return `http://127.0.0.1:8000/uploads/${String(imageUrl).trim()}`
}

