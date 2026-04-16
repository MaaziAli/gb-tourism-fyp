import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useCurrency } from '../context/CurrencyContext'

const SERVICE_LABELS = {
  hotel: '🏨 Hotel', tour: '🏔️ Tour',
  transport: '🚐 Transport',
  activity: '🎯 Activity',
  restaurant: '🍽️ Restaurant',
  car_rental: '🚗 Car Rental',
  bike_rental: '🚲 Bike Rental',
  jeep_safari: '🚙 Jeep Safari',
  boat_trip: '🚢 Boat Trip',
  horse_riding: '🐴 Horse Riding',
  guide: '🧭 Guide', camping: '🏕️ Camping',
  medical: '🏥 Medical'
}

function generateQRMatrix(text) {
  const size = 21
  const matrix = Array(size).fill(null)
    .map(() => Array(size).fill(0))

  const addFinder = (row, col) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isEdge = r === 0 || r === 6
          || c === 0 || c === 6
        const isInner = r >= 2 && r <= 4
          && c >= 2 && c <= 4
        if (row + r < size && col + c < size) {
          matrix[row + r][col + c] =
            (isEdge || isInner) ? 1 : 0
        }
      }
    }
  }

  addFinder(0, 0)
  addFinder(0, size - 7)
  addFinder(size - 7, 0)

  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) +
      text.charCodeAt(i)
    hash = hash & hash
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if ((r < 7 && c < 7) ||
          (r < 7 && c >= size - 7) ||
          (r >= size - 7 && c < 7)) {
        continue
      }
      const bit = (hash ^ (r * 31 + c * 17) ^
        (r * c)) & 1
      matrix[r][c] = bit
    }
  }

  return matrix
}

function QRCode({ data, size = 160 }) {
  const matrix = generateQRMatrix(data)
  const cellSize = size / matrix.length

  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{display: 'block'}}
    >
      <rect width={size} height={size}
        fill="white" />
      {matrix.map((row, ri) =>
        row.map((cell, ci) =>
          cell === 1 ? (
            <rect
              key={`${ri}-${ci}`}
              x={ci * cellSize}
              y={ri * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#1e3a5f"
            />
          ) : null
        )
      )}
    </svg>
  )
}

export default function BookingVoucher() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { formatPrice } = useCurrency()
  const [voucher, setVoucher] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [invoice, setInvoice] = useState(null)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const voucherRef = useRef(null)

  const fetchInvoice = async () => {
    setInvoiceLoading(true)
    try {
      const res = await api.get(`/bookings/${bookingId}/invoice`)
      setInvoice(res.data)
    } catch (err) {
      console.error('Invoice fetch failed:', err)
    } finally {
      setInvoiceLoading(false)
    }
  }

  useEffect(() => {
    api.get(`/bookings/${bookingId}/voucher`)
      .then(r => setVoucher(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))

    fetchInvoice()
  }, [bookingId])

  function handlePrint() {
    window.print()
  }

  const handleDownloadInvoice = async () => {
    if (!invoice) return

    const formatNumber = (n) =>
      (n ?? 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })

    const roomRows =
      invoice.room_selections && invoice.room_selections.length > 0
        ? invoice.room_selections
            .map(
              (sel) => `
              <tr>
                <td>${invoice.listing_name} — ${sel.room_type_name}</td>
                <td style="text-align:center;">${invoice.nights}</td>
                <td style="text-align:center;">${sel.quantity}</td>
                <td style="text-align:right;">${formatNumber(sel.subtotal)}</td>
              </tr>
            `,
            )
            .join('')
        : `
          <tr>
            <td>
              ${invoice.listing_name}${
                invoice.room_type_name ? ' — ' + invoice.room_type_name : ''
              }
              <div style="font-size:11px;color:#64748b;margin-top:2px;">
                ${invoice.check_in} to ${invoice.check_out} · ${invoice.listing_location}
              </div>
            </td>
            <td style="text-align:center;">${invoice.nights}</td>
            <td style="text-align:center;">${invoice.room_quantity}</td>
            <td style="text-align:right;">${formatNumber(invoice.subtotal)}</td>
          </tr>
        `

    const invoiceHtml = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 32px; color: #0f172a; max-width: 800px; margin: 0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #e2e8f0;padding-bottom:16px;">
          <div>
            <div style="font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.03em;">GB Tourism Platform</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">Gilgit-Baltistan, Pakistan</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:18px;font-weight:800;color:#0f172a;">TAX INVOICE</div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;">Invoice #: <strong>${invoice.invoice_number}</strong></div>
            <div style="font-size:12px;color:#64748b;">Date: <strong>${invoice.booking_date}</strong></div>
            <div style="font-size:12px;color:#64748b;">Booking ID: <strong>#${invoice.booking_id}</strong></div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;gap:24px;margin-bottom:24px;">
          <div style="flex:1;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;">
            <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">Billed To</div>
            <div style="font-size:14px;font-weight:600;color:#0f172a;">${invoice.guest_name}</div>
            <div style="font-size:12px;color:#64748b;margin-top:2px;">${invoice.guest_email}</div>
          </div>
          <div style="flex:1;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;">
            <div style="font-size:11px;font-weight:700;color:#64748b;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">Service Provider</div>
            <div style="font-size:14px;font-weight:600;color:#0f172a;">${invoice.provider_name}</div>
            <div style="font-size:12px;color:#64748b;margin-top:2px;">${invoice.provider_email}</div>
            ${
              invoice.provider_tax_id
                ? `<div style="font-size:12px;color:#64748b;margin-top:4px;">NTN/GST: <strong>${invoice.provider_tax_id}</strong></div>`
                : ''
            }
          </div>
        </div>

        <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr style="background:#f8fafc;color:#475569;">
                <th style="text-align:left;padding:8px 10px;">Description</th>
                <th style="text-align:center;padding:8px 10px;width:70px;">Nights</th>
                <th style="text-align:center;padding:8px 10px;width:60px;">Qty</th>
                <th style="text-align:right;padding:8px 10px;width:120px;">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody>
              ${roomRows}
            </tbody>
          </table>
        </div>

        <div style="display:flex;justify-content:flex-end;margin-bottom:32px;">
          <div style="width:260px;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;font-size:12px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span>Subtotal</span>
              <span><strong>PKR ${formatNumber(invoice.subtotal)}</strong></span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span>GST (${(invoice.gst_rate * 100).toFixed(0)}%)</span>
              <span><strong>PKR ${formatNumber(invoice.gst_amount)}</strong></span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span>Service Fee (${(invoice.service_fee_rate * 100).toFixed(0)}%)</span>
              <span><strong>PKR ${formatNumber(invoice.service_fee)}</strong></span>
            </div>
            <div style="border-top:1px dashed #cbd5e1;margin-top:6px;padding-top:8px;display:flex;justify-content:space-between;font-size:13px;font-weight:700;color:#0f172a;">
              <span>Grand Total</span>
              <span>PKR ${formatNumber(invoice.grand_total)}</span>
            </div>
          </div>
        </div>

        <div style="font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px;text-align:center;">
          This is a computer-generated invoice. No signature or stamp is required.
          <br />
          GB Tourism Platform · Gilgit-Baltistan, Pakistan
        </div>
      </div>
    `

    try {
      const html2pdf = (await import('html2pdf.js')).default
      const element = document.createElement('div')
      element.innerHTML = invoiceHtml
      document.body.appendChild(element)

      await html2pdf()
        .set({
          margin: 0,
          filename: `invoice-${invoice.invoice_number}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(element)
        .save()

      document.body.removeChild(element)
    } catch (err) {
      console.error('Invoice PDF generation failed:', err)
      alert('Failed to generate invoice PDF. Please try again.')
    }
  }

  async function handleDownloadPDF() {
    if (!voucherRef.current) return
    setDownloading(true)
    try {
      const html2pdf =
        (await import('html2pdf.js')).default
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `booking_voucher_${bookingId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2, useCORS: true, logging: false
        },
        jsPDF: {
          unit: 'in', format: 'a4',
          orientation: 'portrait'
        }
      }
      await html2pdf()
        .set(opt)
        .from(voucherRef.current)
        .save()
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  function formatDate(d) {
    if (!d) return '—'
    const s = typeof d === 'string' ? d : String(d)
    return new Date(s.includes('T') ? s : s + 'T00:00:00')
      .toLocaleDateString('en-PK', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
  }

  function formatPKR(v) {
    return formatPrice(v || 0)
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f4f8',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{textAlign: 'center'}}>
        <div style={{
          fontSize: '2.5rem', marginBottom: '12px'
        }}>
          🎫
        </div>
        Loading voucher...
      </div>
    </div>
  )

  if (!voucher) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{textAlign: 'center'}}>
        <div style={{fontSize: '3rem'}}>😕</div>
        <p>Voucher not found</p>
        <button type="button" onClick={() => navigate(-1)}
          style={{
            background: '#2563eb',
            color: 'white', border: 'none',
            borderRadius: '10px',
            padding: '10px 24px',
            cursor: 'pointer', fontWeight: 700
          }}>
          Go Back
        </button>
      </div>
    </div>
  )

  const isPaid =
    voucher.payment_status === 'paid'
  const isActive =
    voucher.status === 'active'

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          .voucher-wrapper {
            padding: 0 !important;
            background: white !important;
          }
        }
        @page {
          size: A4;
          margin: 12mm;
        }
      `}</style>

      <div className="no-print" style={{
        background: '#1e3a5f',
        padding: '12px 16px',
        display: 'flex', gap: '10px',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap'
      }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white', borderRadius: '8px',
            padding: '8px 16px', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.875rem'
          }}
        >
          ← Back
        </button>
        <div style={{
          color: 'white', fontWeight: 700,
          fontSize: '0.95rem'
        }}>
          🎫 Booking Voucher
        </div>
        <div style={{display: 'flex', gap: '8px'}}>
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloading}
            style={{
              background: downloading
                ? '#64748b' : '#16a34a',
              border: 'none', color: 'white',
              borderRadius: '8px',
              padding: '8px 20px',
              cursor: downloading
                ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '0.875rem',
              display: 'flex', alignItems: 'center',
              gap: '6px', opacity: downloading ? 0.8 : 1
            }}
          >
            {downloading
              ? '⏳ Generating PDF…'
              : '📄 Download PDF'}
          </button>
          <button
            type="button"
            onClick={handleDownloadInvoice}
            disabled={invoiceLoading || !invoice}
            style={{
              background: invoiceLoading || !invoice
                ? '#64748b' : '#0f766e',
              border: 'none', color: 'white',
              borderRadius: '8px',
              padding: '8px 20px',
              cursor: invoiceLoading || !invoice
                ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '0.875rem',
              display: 'flex', alignItems: 'center',
              gap: '6px', opacity: invoiceLoading || !invoice ? 0.85 : 1
            }}
          >
            {invoiceLoading
              ? 'Loading...'
              : 'Download Invoice (PDF)'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            style={{
              background: '#f59e0b',
              border: 'none', color: 'white',
              borderRadius: '8px',
              padding: '8px 20px',
              cursor: 'pointer', fontWeight: 700,
              fontSize: '0.875rem',
              display: 'flex', alignItems: 'center',
              gap: '6px'
            }}
          >
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      <div
        className="voucher-wrapper"
        style={{
          minHeight: '100vh',
          background: '#f0f4f8',
          padding: '24px 16px',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <div
          ref={voucherRef}
          style={{
            width: '100%', maxWidth: '680px',
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)'
          }}
        >
          <div style={{
            background:
              'linear-gradient(135deg, #1e3a5f 0%,' +
              ' #0ea5e9 100%)',
            padding: '28px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap', gap: '16px'
          }}>
            <div>
              <div style={{
                fontSize: '1.6rem',
                fontWeight: 900, color: 'white',
                letterSpacing: '-0.02em',
                marginBottom: '4px'
              }}>
                🏔️ GB Tourism
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.82rem'
              }}>
                Booking Confirmation Voucher
              </div>
              <div style={{
                marginTop: '12px',
                display: 'flex', gap: '8px',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  background:
                    isPaid ? '#16a34a' : '#d97706',
                  color: 'white',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {isPaid
                    ? '✅ PAID' : '⏳ PENDING'
                  }
                </span>
                <span style={{
                  background:
                    isActive
                      ? 'rgba(255,255,255,0.2)'
                      : '#dc2626',
                  color: 'white',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {isActive
                    ? '🟢 ACTIVE'
                    : '❌ CANCELLED'
                  }
                </span>
              </div>
            </div>

            <div style={{
              textAlign: 'center'
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '8px'
              }}>
                <div style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }}>
                  Booking Reference
                </div>
                <div style={{
                  color: 'white', fontWeight: 900,
                  fontSize: '1.3rem',
                  letterSpacing: '0.05em',
                  fontFamily: 'monospace'
                }}>
                  {voucher.booking_ref}
                </div>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f0f4f8'
          }}>
            <div style={{
              width: 20, height: 20,
              borderRadius: '50%',
              background: '#f0f4f8',
              flexShrink: 0
            }} />
            <div style={{
              flex: 1,
              borderTop: '2px dashed #cbd5e1',
              margin: '0 4px'
            }} />
            <div style={{
              width: 20, height: 20,
              borderRadius: '50%',
              background: '#f0f4f8',
              flexShrink: 0
            }} />
          </div>

          <div style={{padding: '24px 32px'}}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '24px', alignItems: 'start'
            }}>

              <div>
                <div style={{
                  marginBottom: '20px'
                }}>
                  <div style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '6px'
                  }}>
                    Service
                  </div>
                  <div style={{
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    color: '#1e293b',
                    marginBottom: '4px'
                  }}>
                    {voucher.listing.title}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center', gap: '6px'
                  }}>
                    <span>
                      {SERVICE_LABELS[
                        voucher.listing.service_type
                      ] || '🏢'}
                    </span>
                    <span>·</span>
                    <span>
                      📍 {voucher.listing.location}
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr auto 1fr',
                  gap: '8px', marginBottom: '20px',
                  alignItems: 'center'
                }}>
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '4px'
                    }}>
                      Check-In
                    </div>
                    <div style={{
                      fontWeight: 800,
                      color: '#1e293b',
                      fontSize: '0.9rem'
                    }}>
                      {formatDate(
                        voucher.dates.check_in
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.72rem',
                      color: '#0ea5e9',
                      fontWeight: 600,
                      marginTop: '2px'
                    }}>
                      After 2:00 PM
                    </div>
                  </div>

                  <div style={{
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#94a3b8'
                  }}>
                    <div style={{
                      fontSize: '1.2rem'
                    }}>
                      🌙
                    </div>
                    {voucher.dates.nights} night
                    {voucher.dates.nights > 1
                      ? 's' : ''}
                  </div>

                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '12px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '4px'
                    }}>
                      Check-Out
                    </div>
                    <div style={{
                      fontWeight: 800,
                      color: '#1e293b',
                      fontSize: '0.9rem'
                    }}>
                      {formatDate(
                        voucher.dates.check_out
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.72rem',
                      color: '#e11d48',
                      fontWeight: 600,
                      marginTop: '2px'
                    }}>
                      Before 12:00 PM
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px', marginBottom: '20px'
                }}>
                  {[
                    {
                      label: '👤 Guest Name',
                      value: voucher.group_lead_name
                        || voucher.guest.name
                    },
                    {
                      label: '📧 Email',
                      value: voucher.guest.email
                    },
                    {
                      label: '👥 Group Size',
                      value: `${voucher.group_size} person${
                        voucher.group_size > 1
                          ? 's' : ''
                      }`
                    },
                    voucher.room_type && {
                      label: '🛏️ Room Type',
                      value: voucher.room_type
                    },
                    {
                      label: '🏨 Provider',
                      value: voucher.provider.name
                    },
                    {
                      label: '📅 Booked On',
                      value: voucher.created_at
                        ? new Date(
                            voucher.created_at
                          ).toLocaleDateString(
                            'en-PK'
                          )
                        : '—'
                    }
                  ].filter(Boolean).map(
                    (item, i) => (
                    <div key={i} style={{
                      background: '#f8fafc',
                      borderRadius: '8px',
                      padding: '10px 12px'
                    }}>
                      <div style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '3px'
                      }}>
                        {item.label}
                      </div>
                      <div style={{
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        color: '#1e293b'
                      }}>
                        {item.value || '—'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Room breakdown — shown only for multi-room bookings */}
                {voucher.room_selections?.length > 0 && (
                  <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginBottom: '14px',
                  }}>
                    <div style={{
                      fontSize: '0.72rem', fontWeight: 800,
                      color: '#0369a1', textTransform: 'uppercase',
                      letterSpacing: '0.08em', marginBottom: '10px'
                    }}>
                      🛏️ Room Breakdown
                    </div>
                    {voucher.room_selections.map((sel, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 0',
                          borderBottom: i < voucher.room_selections.length - 1
                            ? '1px solid #e0f2fe' : 'none',
                          fontSize: '0.82rem',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700, color: '#0369a1' }}>
                            {sel.room_type_name}
                          </span>
                          <span style={{ color: '#64748b', marginLeft: '6px' }}>
                            ×{sel.quantity}
                          </span>
                          <span style={{ color: '#94a3b8', marginLeft: '6px', fontSize: '0.75rem' }}>
                            @ {formatPKR(sel.unit_price)}/night
                          </span>
                        </div>
                        <span style={{ fontWeight: 800, color: '#0369a1' }}>
                          {formatPKR(sel.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{
                  background:
                    'linear-gradient(135deg,' +
                    ' #f0fdf4, #dcfce7)',
                  border: '1px solid #86efac',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#15803d',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Total Amount Paid
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#16a34a',
                      marginTop: '1px'
                    }}>
                      Inclusive of all taxes & fees
                    </div>
                  </div>
                  <div style={{
                    fontSize: '1.6rem',
                    fontWeight: 900, color: '#15803d'
                  }}>
                    {formatPKR(voucher.total_price)}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center', gap: '8px'
              }}>
                <div style={{
                  background: 'white',
                  border: '3px solid #1e3a5f',
                  borderRadius: '12px',
                  padding: '10px'
                }}>
                  <QRCode
                    data={voucher.qr_data}
                    size={140}
                  />
                </div>
                <div style={{
                  fontSize: '0.68rem',
                  color: '#94a3b8',
                  textAlign: 'center',
                  maxWidth: '140px',
                  lineHeight: 1.4
                }}>
                  Scan at check-in for instant
                  verification
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '0.62rem',
                  color: '#64748b',
                  background: '#f8fafc',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  letterSpacing: '0.05em'
                }}>
                  {voucher.booking_ref}
                </div>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f0f4f8'
          }}>
            <div style={{
              width: 20, height: 20,
              borderRadius: '50%',
              background: '#f0f4f8', flexShrink: 0
            }} />
            <div style={{
              flex: 1,
              borderTop: '2px dashed #cbd5e1',
              margin: '0 4px'
            }} />
            <div style={{
              width: 20, height: 20,
              borderRadius: '50%',
              background: '#f0f4f8', flexShrink: 0
            }} />
          </div>

          <div style={{
            background: '#f8fafc',
            padding: '16px 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap', gap: '12px'
          }}>
            <div>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#64748b',
                marginBottom: '4px'
              }}>
                📞 Need Help?
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: '#94a3b8'
              }}>
                support@gbtourism.com
              </div>
            </div>

            <div style={{
              display: 'flex', gap: '8px'
            }}>
              {[
                '✅ Verified Booking',
                '🔒 Secure Payment',
                '📋 Official Voucher'
              ].map((tag, i) => (
                <span key={i} style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '999px',
                  padding: '3px 8px',
                  fontSize: '0.65rem',
                  fontWeight: 600, color: '#64748b'
                }}>
                  {tag}
                </span>
              ))}
            </div>

            <div style={{
              fontSize: '0.65rem',
              color: '#94a3b8', textAlign: 'right'
            }}>
              <div>
                Issued by GB Tourism Platform
              </div>
              <div>
                {new Date().toLocaleDateString(
                  'en-PK', {
                    day: 'numeric',
                    month: 'long', year: 'numeric'
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
