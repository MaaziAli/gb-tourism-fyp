import { useState, useEffect, useRef }
  from 'react'
import { useNavigate, useSearchParams }
  from 'react-router-dom'
import api from '../api/axios'
import useWindowSize from '../hooks/useWindowSize'

function timeStr(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString(
    'en-PK', { hour: '2-digit', minute: '2-digit' }
  )
}

function dateStr(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString(
    'en-PK', {
      day: 'numeric', month: 'short'
    }
  )
}

export default function MessagesPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isMobile } = useWindowSize()
  const messagesEndRef = useRef(null)

  const [conversations, setConversations] =
    useState([])
  const [activeThread, setActiveThread] =
    useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversations()

    const lid = searchParams.get('listing_id')
    const uid = searchParams.get('user_id')
    const uname = searchParams.get('name')
    if (lid && uid) {
      openThread(
        parseInt(lid, 10), parseInt(uid, 10),
        uname || 'User'
      )
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    })
  }, [messages])

  async function loadConversations() {
    setLoading(true)
    try {
      const res = await api.get(
        '/messages/conversations'
      )
      setConversations(res.data || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function openThread(
    listingId, otherUserId, otherName
  ) {
    setActiveThread({
      listing_id: listingId,
      other_user_id: otherUserId,
      other_name: otherName
    })
    try {
      const res = await api.get(
        `/messages/thread/${listingId}/${otherUserId}`
      )
      setMessages(res.data.messages || [])
    } catch(e) { console.error(e) }
  }

  async function sendMessage() {
    if (!newMsg.trim() || !activeThread) return
    setSending(true)
    try {
      const res = await api.post(
        '/messages/send', {
          receiver_id: activeThread.other_user_id,
          listing_id: activeThread.listing_id,
          message: newMsg.trim()
        }
      )
      setMessages(prev => [...prev, res.data])
      setNewMsg('')
      loadConversations()
    } catch(e) { console.error(e) }
    finally { setSending(false) }
  }

  const showConversations =
    !isMobile || !activeThread
  const showThread =
    !isMobile || activeThread

  return (
    <div style={{
      height: 'calc(100vh - 58px)',
      display: 'flex', overflow: 'hidden',
      background: 'var(--bg-primary)'
    }}>

      {showConversations && (
        <div style={{
          width: isMobile ? '100%' : '300px',
          flexShrink: 0,
          borderRight:
            '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px',
            borderBottom:
              '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              fontWeight: 800, fontSize: '1rem',
              color: 'var(--text-primary)',
              display: 'flex', alignItems: 'center',
              gap: '8px'
            }}>
              💬 Messages
            </div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                background: 'var(--bg-secondary)',
                border: 'none', cursor: 'pointer',
                borderRadius: '8px',
                padding: '6px 12px',
                color: 'var(--text-secondary)',
                fontSize: '0.82rem'
              }}
            >
              ← Back
            </button>
          </div>

          <div style={{
            flex: 1, overflowY: 'auto'
          }}>
            {loading ? (
              <div style={{
                textAlign: 'center', padding: '32px',
                color: 'var(--text-muted)'
              }}>
                Loading...
              </div>
            ) : conversations.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 16px',
                color: 'var(--text-muted)'
              }}>
                <div style={{
                  fontSize: '2.5rem',
                  marginBottom: '12px'
                }}>
                  💬
                </div>
                <div style={{
                  fontWeight: 600,
                  marginBottom: '4px'
                }}>
                  No messages yet
                </div>
                <div style={{
                  fontSize: '0.8rem'
                }}>
                  Message a provider from
                  their listing page
                </div>
              </div>
            ) : (
              conversations.map((conv, i) => {
                const isActive = activeThread &&
                  activeThread.listing_id ===
                    conv.listing_id &&
                  activeThread.other_user_id ===
                    conv.other_user_id
                return (
                  <div key={i}
                    role="button"
                    tabIndex={0}
                    onClick={() => openThread(
                      conv.listing_id,
                      conv.other_user_id,
                      conv.other_user_name
                    )}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        openThread(
                          conv.listing_id,
                          conv.other_user_id,
                          conv.other_user_name
                        )
                      }
                    }}
                    style={{
                      padding: '14px 16px',
                      borderBottom:
                        '1px solid var(--border-color)',
                      cursor: 'pointer',
                      background: isActive
                        ? 'var(--accent-light)'
                        : 'transparent',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => {
                      if (!isActive)
                        e.currentTarget.style
                          .background =
                          'var(--bg-secondary)'
                    }}
                    onMouseLeave={e => {
                      if (!isActive)
                        e.currentTarget.style
                          .background = 'transparent'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '4px'
                    }}>
                      <div style={{
                        fontWeight: conv.unread_count
                          ? 700 : 600,
                        fontSize: '0.875rem',
                        color: isActive
                          ? 'var(--accent)'
                          : 'var(--text-primary)'
                      }}>
                        {conv.other_user_name}
                      </div>
                      {conv.unread_count > 0 && (
                        <span style={{
                          background: 'var(--accent)',
                          color: 'white',
                          borderRadius: '999px',
                          padding: '1px 6px',
                          fontSize: '0.68rem',
                          fontWeight: 800
                        }}>
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      🏨 {conv.listing_title}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {showThread && (
        <div style={{
          flex: 1, display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {activeThread ? (
            <>
              <div style={{
                padding: '14px 16px',
                borderBottom:
                  '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center', gap: '10px'
              }}>
                {isMobile && (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveThread(null)
                    }
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    ←
                  </button>
                )}
                <div style={{
                  width: 36, height: 36,
                  borderRadius: '50%',
                  background: 'var(--accent-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800, color: 'var(--accent)',
                  fontSize: '0.875rem', flexShrink: 0
                }}>
                  {activeThread.other_name
                    ?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)'
                  }}>
                    {activeThread.other_name}
                  </div>
                  <div style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)'
                  }}>
                    Re: Listing #{
                      activeThread.listing_id
                    }
                  </div>
                </div>
              </div>

              <div style={{
                flex: 1, overflowY: 'auto',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column', gap: '8px',
                background: 'var(--bg-primary)'
              }}>
                {messages.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '32px',
                    color: 'var(--text-muted)'
                  }}>
                    Start the conversation! 👋
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMine = msg.is_mine
                    const showDate = i === 0 ||
                      dateStr(msg.created_at) !==
                      dateStr(
                        messages[i-1]?.created_at
                      )
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div style={{
                            textAlign: 'center',
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            margin: '8px 0',
                            fontWeight: 600
                          }}>
                            {dateStr(msg.created_at)}
                          </div>
                        )}
                        <div style={{
                          display: 'flex',
                          justifyContent: isMine
                            ? 'flex-end' : 'flex-start'
                        }}>
                          <div style={{
                            maxWidth: '70%',
                            background: isMine
                              ? 'var(--accent)'
                              : 'var(--bg-card)',
                            color: isMine
                              ? 'white'
                              : 'var(--text-primary)',
                            borderRadius: isMine
                              ? '16px 16px 4px 16px'
                              : '16px 16px 16px 4px',
                            padding: '10px 14px',
                            border: isMine
                              ? 'none'
                              : '1px solid var(--border-color)',
                            boxShadow:
                              'var(--shadow-sm)'
                          }}>
                            <div style={{
                              fontSize: '0.875rem',
                              lineHeight: 1.5
                            }}>
                              {msg.message}
                            </div>
                            <div style={{
                              fontSize: '0.65rem',
                              opacity: 0.7,
                              marginTop: '4px',
                              textAlign: 'right'
                            }}>
                              {timeStr(msg.created_at)}
                              {isMine && (
                                <span style={{
                                  marginLeft: '4px'
                                }}>
                                  {msg.is_read
                                    ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div style={{
                padding: '12px 16px',
                borderTop:
                  '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                display: 'flex', gap: '8px'
              }}>
                <input type="text"
                  value={newMsg}
                  onChange={e =>
                    setNewMsg(e.target.value)
                  }
                  onKeyDown={e => {
                    if (e.key === 'Enter' &&
                        !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '999px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem', outline: 'none',
                    fontFamily: 'var(--font-primary)'
                  }}
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={
                    sending || !newMsg.trim()
                  }
                  style={{
                    width: 42, height: 42,
                    borderRadius: '50%', border: 'none',
                    background: 'var(--accent)',
                    color: 'white', cursor: 'pointer',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    opacity: sending ||
                      !newMsg.trim() ? 0.5 : 1
                  }}
                >
                  {sending ? '⏳' : '➤'}
                </button>
              </div>
            </>
          ) : (
            <div style={{
              flex: 1, display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column', gap: '12px',
              color: 'var(--text-muted)'
            }}>
              <div style={{fontSize: '3rem'}}>
                💬
              </div>
              <div style={{fontWeight: 600}}>
                Select a conversation
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
