export const ALL_AMENITIES = [
  { key: 'wifi', label: 'Free WiFi', icon: '📶' },
  { key: 'ac', label: 'Air Conditioning', icon: '❄️' },
  { key: 'parking', label: 'Free Parking', icon: '🅿️' },
  { key: 'pool', label: 'Swimming Pool', icon: '🏊' },
  { key: 'hot_water', label: 'Hot Water', icon: '🚿' },
  { key: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { key: 'room_service', label: 'Room Service', icon: '🛎️' },
  { key: 'tv', label: 'Television', icon: '📺' },
  { key: 'laundry', label: 'Laundry', icon: '👕' },
  { key: 'generator', label: 'Generator', icon: '⚡' },
  { key: 'reception_24h', label: '24h Reception', icon: '🕐' },
  { key: 'mountain_view', label: 'Mountain View', icon: '🏔️' },
  { key: 'garden', label: 'Garden', icon: '🌿' },
  { key: 'gym', label: 'Fitness Center', icon: '🏋️' },
  { key: 'bbq', label: 'BBQ Area', icon: '🔥' },
  { key: 'conference', label: 'Conference Room', icon: '🖥️' },
  { key: 'airport_transfer', label: 'Airport Transfer', icon: '✈️' },
  { key: 'pet_friendly', label: 'Pet Friendly', icon: '🐾' },
]

export function getAmenityInfo(key) {
  return (
    ALL_AMENITIES.find(a => a.key === key) || {
      key,
      label: key,
      icon: '✓'
    }
  )
}

