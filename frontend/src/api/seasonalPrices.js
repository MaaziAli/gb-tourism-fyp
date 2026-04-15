import api from './axios'

export const seasonalPricesApi = {
  list: (listingId) =>
    api.get(`/listings/${listingId}/seasonal-prices`).then((r) => r.data),

  create: (listingId, data) =>
    api.post(`/listings/${listingId}/seasonal-prices`, data).then((r) => r.data),

  update: (priceId, data) =>
    api.put(`/seasonal-prices/${priceId}`, data).then((r) => r.data),

  remove: (priceId) =>
    api.delete(`/seasonal-prices/${priceId}`),
}
