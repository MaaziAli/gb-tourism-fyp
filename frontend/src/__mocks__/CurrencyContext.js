import React from 'react'

export const useCurrency = jest.fn(() => ({
  formatPrice: jest.fn((val) => `PKR ${val}`),
}))

export const CurrencyProvider = ({ children }) => <>{children}</>
