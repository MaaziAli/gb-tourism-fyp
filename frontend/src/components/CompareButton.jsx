import { useCompare } from '../context/CompareContext'

export default function CompareButton({
  listing,
  size = 'sm',
}) {
  const { addToCompare, removeFromCompare, isInCompare } =
    useCompare()
  const added = isInCompare(listing.id)

  const sz = size === 'sm' ? 28 : 34

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        if (added) {
          removeFromCompare(listing.id)
        } else {
          addToCompare(listing)
        }
      }}
      title={
        added ? 'Remove from comparison' : 'Add to compare'
      }
      style={{
        width: sz,
        height: sz,
        borderRadius: '50%',
        background: added
          ? '#2563eb'
          : 'rgba(255,255,255,0.9)',
        border: 'none',
        color: added ? 'white' : '#2563eb',
        cursor: 'pointer',
        fontSize: sz * 0.42,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        transition: 'all 0.2s',
        flexShrink: 0,
        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))',
      }}
    >
      {added ? '✓' : '⚖️'}
    </button>
  )
}
