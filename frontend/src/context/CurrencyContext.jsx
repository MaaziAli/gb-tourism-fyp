import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const SUPPORTED_CURRENCIES = ['PKR', 'USD', 'EUR', 'GBP', 'SAR', 'AED']
const CURRENCY_SYMBOLS = {
  PKR: 'PKR',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SAR: 'SAR',
  AED: 'AED',
}
const RATES_CACHE_KEY = 'gb_currency_rates'
const RATES_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours in ms
const SELECTED_CURRENCY_KEY = 'gb_selected_currency'
const RATES_API_URL = 'https://open.er-api.com/v6/latest/PKR'

const CurrencyContext = createContext(null)

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(
    () => (typeof window !== 'undefined' && window.localStorage.getItem(SELECTED_CURRENCY_KEY)) || 'PKR',
  )
  const [rates, setRates] = useState({ PKR: 1 })
  const [ratesLoading, setRatesLoading] = useState(false)
  const [ratesError, setRatesError] = useState(null)

  const loadRates = useCallback(async () => {
    try {
      const cached = typeof window !== 'undefined' ? window.localStorage.getItem(RATES_CACHE_KEY) : null
      if (cached) {
        const { timestamp, data } = JSON.parse(cached)
        if (Date.now() - timestamp < RATES_CACHE_TTL) {
          setRates({ PKR: 1, ...data })
          return
        }
      }
    } catch {
      // ignore cache read errors and fetch fresh
    }

    setRatesLoading(true)
    setRatesError(null)
    try {
      const res = await fetch(RATES_API_URL)
      const json = await res.json()
      if (json.result === 'success' && json.rates) {
        const relevant = {}
        SUPPORTED_CURRENCIES.forEach((c) => {
          if (json.rates[c]) relevant[c] = json.rates[c]
        })
        relevant.PKR = 1
        setRates(relevant)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            RATES_CACHE_KEY,
            JSON.stringify({
              timestamp: Date.now(),
              data: relevant,
            }),
          )
        }
      }
    } catch (err) {
      setRatesError('Could not load exchange rates')
      // eslint-disable-next-line no-console
      console.warn('[currency] Rate fetch failed:', err)
    } finally {
      setRatesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRates()
  }, [loadRates])

  const setCurrency = useCallback((code) => {
    if (!SUPPORTED_CURRENCIES.includes(code)) return
    setCurrencyState(code)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SELECTED_CURRENCY_KEY, code)
    }
  }, [])

  const convert = useCallback(
    (pkrAmount) => {
      if (!pkrAmount && pkrAmount !== 0) return null
      const rate = rates[currency] || 1
      return pkrAmount * rate
    },
    [currency, rates],
  )

  const formatPrice = useCallback(
    (pkrAmount, options = {}) => {
      if (pkrAmount === null || pkrAmount === undefined) return '—'
      const converted = convert(pkrAmount)
      if (converted === null) return '—'
      const symbol = CURRENCY_SYMBOLS[currency] || currency
      const decimals = currency === 'PKR' ? 0 : 2
      const formatted = converted.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        ...options,
      })
      return `${symbol} ${formatted}`
    },
    [convert, currency],
  )

  const value = {
    currency,
    setCurrency,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    rates,
    ratesLoading,
    ratesError,
    convert,
    formatPrice,
  }

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider')
  return ctx
}

