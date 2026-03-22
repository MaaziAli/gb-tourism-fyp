import { useState, useEffect } from 'react'
import api from '../api/axios'

export default function WishlistButton({
  listingId,
  size = 'md'
}) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('user')
    if (!raw) return
    api.get('/wishlist/ids')
      .then(r => {
        setSaved(r.data.includes(listingId))
      })
      .catch(() => {})
  }, [listingId])

  async function toggle() {
    const raw = localStorage.getItem('user')
    if (!raw) return

    setLoading(true)
    try {
      if (saved) {
        await api.delete(`/wishlist/${listingId}`)
        setSaved(false)
      } else {
        await api.post(`/wishlist/${listingId}`)
        setSaved(true)
      }
    } catch (e) {
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
        width: sz, height: sz,
        borderRadius: '50%',
        background: saved
          ? '#e11d48' : 'rgba(255,255,255,0.9)',
        border: saved
          ? 'none'
          : '1px solid rgba(0,0,0,0.1)',
        color: saved ? 'white' : '#e11d48',
        cursor: 'pointer', fontSize: sz * 0.45,
        display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        transition: 'all 0.2s',
        opacity: loading ? 0.6 : 1,
        flexShrink: 0
      }}
    >
      {saved ? '❤️' : '🤍'}
    </button>
  )
}
