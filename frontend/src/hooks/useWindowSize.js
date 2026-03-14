import { useState, useEffect } from 'react'

export default function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    isTablet: typeof window !== 'undefined' ? (window.innerWidth >= 768 && window.innerWidth < 1024) : false,
    isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  })

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth
      setSize({
        width: w,
        height: window.innerHeight,
        isMobile: w < 768,
        isTablet: w >= 768 && w < 1024,
        isDesktop: w >= 1024
      })
    }
    window.addEventListener('resize', handleResize)
    return () =>
      window.removeEventListener('resize', handleResize)
  }, [])

  return size
}
