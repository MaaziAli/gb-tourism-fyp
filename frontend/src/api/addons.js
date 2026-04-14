import api from './axios'

export async function fetchListingAddons(listingId, roomTypeId = null) {
  const res = await api.get(`/listings/${listingId}/addons`, {
    params: roomTypeId ? { room_type_id: roomTypeId } : {},
  })
  return res.data || []
}

export async function createListingAddon(listingId, payload) {
  const res = await api.post(`/listings/${listingId}/addons`, payload)
  return res.data
}

export async function updateListingAddon(addonId, payload) {
  const res = await api.put(`/addons/${addonId}`, payload)
  return res.data
}

export async function deleteListingAddon(addonId) {
  const res = await api.delete(`/addons/${addonId}`)
  return res.data
}
