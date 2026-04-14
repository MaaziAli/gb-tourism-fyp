import { useEffect, useState } from 'react'
import {
  createListingAddon,
  deleteListingAddon,
  fetchListingAddons,
  updateListingAddon,
} from '../api/addons'
import api from '../api/axios'

const INITIAL_FORM = {
  room_type_id: '',
  name: '',
  description: '',
  price: '',
  price_type: 'per_night',
  is_optional: true,
  max_quantity: 1,
  is_active: true,
  sort_order: 0,
}

export default function ListingAddonManager({ listingId }) {
  const [addons, setAddons] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(INITIAL_FORM)

  async function refresh() {
    if (!listingId) return
    setLoading(true)
    setMessage('')
    try {
      const [addonsRes, roomTypesRes] = await Promise.all([
        fetchListingAddons(listingId, null),
        api.get(`/room-types/${listingId}`),
      ])
      setAddons(addonsRes)
      setRoomTypes(roomTypesRes.data || [])
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to load add-ons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [listingId])

  function roomTypeLabel(roomTypeId) {
    if (!roomTypeId) return 'All room types'
    const room = roomTypes.find(r => r.id === roomTypeId)
    return room ? room.name : `Room #${roomTypeId}`
  }

  async function submitNewAddon() {
    if (!form.name.trim() || Number(form.price) <= 0) {
      setMessage('Name and valid price are required')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      await createListingAddon(listingId, {
        ...form,
        room_type_id: form.room_type_id ? Number(form.room_type_id) : null,
        price: Number(form.price),
        max_quantity: Number(form.max_quantity || 1),
        sort_order: Number(form.sort_order || 0),
      })
      setForm(INITIAL_FORM)
      await refresh()
      setMessage('✅ Add-on created')
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to create add-on')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(addon) {
    setEditingId(addon.id)
    setEditForm({
      room_type_id: addon.room_type_id || '',
      name: addon.name || '',
      description: addon.description || '',
      price: addon.price ?? '',
      price_type: addon.price_type || 'per_night',
      is_optional: addon.is_optional !== false,
      max_quantity: addon.max_quantity || 1,
      is_active: addon.is_active !== false,
      sort_order: addon.sort_order || 0,
    })
  }

  async function saveEdit() {
    if (!editingId) return
    if (!editForm.name.trim() || Number(editForm.price) <= 0) {
      setMessage('Name and valid price are required')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      await updateListingAddon(editingId, {
        ...editForm,
        room_type_id: editForm.room_type_id ? Number(editForm.room_type_id) : null,
        price: Number(editForm.price),
        max_quantity: Number(editForm.max_quantity || 1),
        sort_order: Number(editForm.sort_order || 0),
      })
      setEditingId(null)
      await refresh()
      setMessage('✅ Add-on updated')
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to update add-on')
    } finally {
      setSaving(false)
    }
  }

  async function removeAddon(addonId) {
    if (!window.confirm('Delete this add-on?')) return
    setSaving(true)
    setMessage('')
    try {
      await deleteListingAddon(addonId)
      await refresh()
      setMessage('✅ Add-on deleted')
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to delete add-on')
    } finally {
      setSaving(false)
    }
  }

  function renderAddonForm(current, setCurrent) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input
          type="text"
          placeholder="Name (e.g. Airport Pickup)"
          value={current.name}
          onChange={e => setCurrent(p => ({ ...p, name: e.target.value }))}
          style={inputStyle}
        />
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder="Price (PKR)"
          value={current.price}
          onChange={e => setCurrent(p => ({ ...p, price: e.target.value }))}
          style={inputStyle}
        />
        <select
          value={current.price_type}
          onChange={e => setCurrent(p => ({ ...p, price_type: e.target.value }))}
          style={inputStyle}
        >
          <option value="per_night">Per night</option>
          <option value="per_person">Per person</option>
          <option value="per_booking">Per booking</option>
        </select>
        <select
          value={current.room_type_id}
          onChange={e => setCurrent(p => ({ ...p, room_type_id: e.target.value }))}
          style={inputStyle}
        >
          <option value="">All room types</option>
          {roomTypes.map(room => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          max={99}
          placeholder="Max quantity"
          value={current.max_quantity}
          onChange={e => setCurrent(p => ({ ...p, max_quantity: e.target.value }))}
          style={inputStyle}
        />
        <input
          type="number"
          placeholder="Sort order"
          value={current.sort_order}
          onChange={e => setCurrent(p => ({ ...p, sort_order: e.target.value }))}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={current.description}
          onChange={e => setCurrent(p => ({ ...p, description: e.target.value }))}
          style={{ ...inputStyle, gridColumn: '1 / -1' }}
        />
        <label style={checkLabelStyle}>
          <input
            type="checkbox"
            checked={current.is_optional}
            onChange={e => setCurrent(p => ({ ...p, is_optional: e.target.checked }))}
          />
          Optional add-on
        </label>
        <label style={checkLabelStyle}>
          <input
            type="checkbox"
            checked={current.is_active}
            onChange={e => setCurrent(p => ({ ...p, is_active: e.target.checked }))}
          />
          Active
        </label>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '28px' }}>
      <label style={{
        display: 'block',
        fontWeight: 700,
        fontSize: '0.95rem',
        marginBottom: '10px',
        color: 'var(--text-primary)',
      }}>
        🧩 Manage Add-ons
      </label>
      <p style={{ margin: '0 0 14px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Create optional or required extras such as breakfast, pickup, insurance, and equipment.
      </p>

      {loading && <p style={{ margin: '0 0 10px' }}>Loading add-ons...</p>}
      {message && (
        <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: message.startsWith('✅') ? 'var(--success)' : 'var(--danger)' }}>
          {message}
        </p>
      )}

      {addons.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {addons.map(addon => (
            <div key={addon.id} style={rowCardStyle}>
              {editingId === addon.id ? (
                <div style={{ width: '100%' }}>
                  {renderAddonForm(editForm, setEditForm)}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button type="button" onClick={saveEdit} disabled={saving} style={primaryBtnStyle}>
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} style={secondaryBtnStyle}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {addon.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      PKR {Number(addon.price || 0).toLocaleString('en-PK')} · {addon.price_type.replace('_', ' ')} ·
                      {' '}{roomTypeLabel(addon.room_type_id)} · max {addon.max_quantity}
                    </div>
                    {addon.description && (
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{addon.description}</div>
                    )}
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {addon.is_optional ? 'Optional' : 'Required'} · {addon.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => startEdit(addon)} style={secondaryBtnStyle}>
                      Edit
                    </button>
                    <button type="button" onClick={() => removeAddon(addon.id)} style={dangerBtnStyle}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ ...rowCardStyle, display: 'block' }}>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 10, color: 'var(--text-secondary)' }}>
          + Add New Add-on
        </div>
        {renderAddonForm(form, setForm)}
        <button
          type="button"
          onClick={submitNewAddon}
          disabled={saving}
          style={{ ...primaryBtnStyle, marginTop: 10 }}
        >
          {saving ? 'Saving...' : 'Create Add-on'}
        </button>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-primary)',
  boxSizing: 'border-box',
  fontSize: '0.85rem',
}

const rowCardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 10,
  padding: '12px 14px',
  background: 'var(--bg-secondary)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
}

const primaryBtnStyle = {
  background: 'var(--accent)',
  color: 'white',
  border: 'none',
  borderRadius: '7px',
  padding: '7px 12px',
  cursor: 'pointer',
  fontWeight: 600,
}

const secondaryBtnStyle = {
  background: 'var(--bg-card)',
  color: 'var(--text-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '7px',
  padding: '7px 12px',
  cursor: 'pointer',
}

const dangerBtnStyle = {
  background: 'var(--danger-bg)',
  color: 'var(--danger)',
  border: '1px solid var(--danger)',
  borderRadius: '7px',
  padding: '7px 12px',
  cursor: 'pointer',
}

const checkLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: '0.82rem',
  color: 'var(--text-secondary)',
}
