import { createContext, useContext, useState } from 'react'

const CompareContext = createContext(null)

export function CompareProvider({ children }) {
  const [compareList, setCompareList] = useState([])

  function addToCompare(listing) {
    setCompareList((prev) => {
      if (prev.find((l) => l.id === listing.id)) {
        return prev
      }
      if (prev.length >= 3) {
        alert(
          'You can compare up to 3 services. Remove one first.',
        )
        return prev
      }
      return [
        ...prev,
        {
          id: listing.id,
          title: listing.title,
          service_type: listing.service_type,
          image_url: listing.image_url,
          price_per_night: listing.price_per_night,
          location: listing.location,
        },
      ]
    })
  }

  function removeFromCompare(id) {
    setCompareList((prev) => prev.filter((l) => l.id !== id))
  }

  function isInCompare(id) {
    return compareList.some((l) => l.id === id)
  }

  function clearCompare() {
    setCompareList([])
  }

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        isInCompare,
        clearCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  return useContext(CompareContext)
}
