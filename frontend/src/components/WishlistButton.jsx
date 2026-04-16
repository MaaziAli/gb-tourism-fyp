import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'

export default function WishlistButton({
  listingId,
  size = 'md'
}) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const initialFetchDone = useRef(false)

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (!raw) return

    if (!initialFetchDone.current) {
      api.get('/wishlist/ids')
        .then(r => {
          setSaved(r.data.includes(listingId))
          initialFetchDone.current = true
        })
        .catch(() => {})
    }
  }, [listingId])

  async function toggle() {
    const raw = localStorage.getItem('user')
    if (!raw) return

    setLoading(true)
    const previousState = saved
    setSaved(!saved)
    try {
      if (previousState) {
        await api.delete(`/wishlist/${listingId}`)
      } else {
        await api.post(`/wishlist/${listingId}`)
      }
    } catch (e) {
      setSaved(previousState)
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const raw = localStorage.getItem('user')
  if (!raw) return null
  let user
  try { user = JSON.parse(raw) }
  catch (e) { return null }
  if (user.role !== 'user') return null

  const sz = size === 'sm' ? 28 : 36

  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation()
        toggle()
      }}
      disabled={loading}
      title={saved
        ? 'Remove from wishlist'
        : 'Save to wishlist'
      }
      style={{
        width: sz,
        height: sz,
        borderRadius: '50%',
        background: 'transparent',
        border: 'none',
        color: saved ? '#e11d48' : 'rgba(255,255,255,0.9)',
        cursor: 'pointer',
        fontSize: sz * 0.55,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: saved ? 'none' : '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'all 0.2s',
        opacity: loading ? 0.6 : 1,
        flexShrink: 0,
        filter: saved
          ? 'drop-shadow(0 0 4px rgba(225,29,72,0.4))'
          : 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))',
      }}
    >
      {saved ? '❤️' : '🤍'}
    </button>
  )
}
