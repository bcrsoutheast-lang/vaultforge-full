'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
]

export default function CommandCenter() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [signals, setSignals] = useState<any[]>([])
  const [tickerAlerts, setTickerAlerts] = useState<string[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [members, setMembers] = useState<any[]>([])
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [stateCounts, setStateCounts] = useState<Record<string, number>>({})
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageText, setMessageText] = useState('')
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchSignals()
    fetchMessages()
    fetchStateCounts()
  }, [])

  useEffect(() => {
    if (selectedState) fetchMembersByState(selectedState)
  }, [selectedState])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchSignals()
      fetchMessages()
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)

    const { data: profileData } = await supabase
    .from('member_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

    if (profileData) setProfile(profileData)
  }

  const fetchSignals = async () => {
    const { data } = await supabase
    .from('signal_alerts')
    .select('*')
    .eq('acknowledged', false)
    .gte('created_at', new Date(Date.now() - 3600000).toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

    if (data) {
      setSignals(data)
      setTickerAlerts(data.map(s => s.message))
    }
  }

  const fetchMessages = async () => {
    if (!user?.email) return
    const { data } = await supabase
    .from('deal_messages')
    .select('*')
    .eq('receiver_email', user.email)
    .eq('read', false)
    .order('created_at', { ascending: false })

    if (data) {
      setMessages(data)
      setUnreadCount(data.length)
    }
  }

  const fetchStateCounts = async () => {
    const { data } = await supabase
    .from('member_profiles')
    .select('state')

    if (data) {
      const counts: Record<string, number> = {}
      data.forEach(m => {
        if (m.state) {
          counts[m.state] = (counts[m.state] || 0) + 1
        }
      })
      setStateCounts(counts)
    }
  }

  const fetchMembersByState = async (state: string) => {
    const { data } = await supabase
    .from('member_profiles')
    .select('*')
    .eq('state', state)
    .order('tier', { ascending: false })
    .limit(50)

    if (data) setMembers(data)
  }

  const markMessageRead = async (id: string) => {
    await supabase.from('deal_messages').update({ read: true }).eq('id', id)
    fetchMessages()
  }

  const acknowledgeSignal = async (id: string) => {
    await supabase.from('signal_alerts').update({ acknowledged: true }).eq('id', id)
    fetchSignals()
  }

  const sendMessage = async () => {
    if (!messageText ||!selectedMember) return

    const { error } = await supabase.from('deal_messages').insert({
      sender_id: user?.id,
      sender_email: user?.email,
      receiver_email: selectedMember.email,
      subject: `NETWORK MESSAGE from ${profile?.email}`,
      message: messageText,
      deal_id: null
    })

    if (!error) {
      alert('MESSAGE SENT // MEMBER NOTIFIED')
      setShowMessageModal(false)
      setMessageText('')
      setSelectedMember(null)
    } else {
      alert('ERROR: ' + error.message)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#f8f8f8', fontFamily: 'monospace' }}>

      {/* BLOOMBERG TICKER */}
      {tickerAlerts.length > 0 && (
        <div style={{
          background: '#dc2626',
          padding: '8px 16px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          borderBottom: '1px solid #f87171'
        }}>
          <div style={{
            display: 'inline-block',
            animation: 'scroll 30s linear infinite',
            fontSize: '11px',
            fontWeight: '700',
            color: '#000',
            letterSpacing: '0.05em'
          }}>
            {tickerAlerts.join(' // ')} // {tickerAlerts.join(' // ')}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{
        background: '#111',
        borderBottom: '1px solid #333',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {profile?.avatar_url && (
            <img
              src={profile.avatar_url}
              alt="Profile"
              style={{
                width: '40px',
                height: '40px',
                border: '1px solid #333',
                objectFit: 'cover'
              }}
            />
          )}
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '0.05em' }}>
              VAULTFORGE COMMAND CENTER
            </div>
            <div style={{ fontSize: '10px', color: '#888', letterSpacing: '0.1em' }}>
              {profile?.tier || 'STANDARD'} // {user?.email}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{
            background: unreadCount > 0? '#dc2626' : '#333',
            padding: '8px 16px',
            fontSize: '11px',
            fontWeight: '700',
            animation: unreadCount > 0? 'pulse 2s infinite' : 'none',
            cursor: 'pointer'
          }}>
            {unreadCount} UNREAD SIGNALS
          </div>
          <button
            onClick={() => router.push('/profile')}
            style={{
              background: '#111',
              color: '#f8f8f8',
              border: '1px solid #333',
              padding: '8px 16px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            PROFILE
          </button>
          <button
            onClick={() => router.push('/deals')}
            style={{
              background: '#f8f8f8',
              color: '#000',
              border: 'none',
              padding: '8px 16px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            DEALS GRID
          </button>
          <button
            onClick={() => router.push('/comp-map')}
            style={{
              background: '#1a1a1a',
              color: '#dc2626',
              border: '1px solid #dc2626',
              padding: '8px 16px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            COMP MAP // LOCKED
            <span style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              background: '#dc2626',
              color: '#000',
              fontSize: '8px',
              padding: '2px 4px',
              fontWeight: '700'
            }}>
              SOON
            </span>
          </button>
        </div>
      </div>

      {/* GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 400px', gap: '1px', background: '#333' }}>

        {/* SIGNALS COLUMN */}
        <div style={{ background: '#111', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '12px', letterSpacing: '0.1em' }}>
            LIVE SIGNALS
          </div>
          {signals.map(s => (
            <div key={s.id} onClick={() => acknowledgeSignal(s.id)} style={{
              background: '#000',
              border: `1px solid ${s.severity === 'CRITICAL'? '#dc2626' : '#facc15'}`,
              padding: '12px',
              marginBottom: '8px',
              cursor: 'pointer',
              animation: s.severity === 'CRITICAL'? 'pulse 2s infinite' : 'none'
            }}>
              <div style={{ fontSize: '10px', color: '#f87171', marginBottom: '4px' }}>
                {s.signal_type} // {s.severity}
              </div>
              <div style={{ fontSize: '11px' }}>{s.message}</div>
              <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
                DQI {s.dqi_score} // {new Date(s.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
          {signals.length === 0 && (
            <div style={{ fontSize: '10px', color: '#666', textAlign: 'center', padding: '32px' }}>
              NO ACTIVE SIGNALS // AWAITING INTEL
            </div>
          )}
        </div>

        {/* MESSAGES COLUMN */}
        <div style={{ background: '#111', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '12px', letterSpacing: '0.1em' }}>
            INBOUND OFFERS
          </div>
          {messages.map(m => (
            <div key={m.id} onClick={() => markMessageRead(m.id)} style={{
              background: '#000',
              border: '1px solid #333',
              padding: '12px',
              marginBottom: '8px',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '10px', color: '#4ade80', marginBottom: '4px' }}>
                FROM: {m.sender_email}
              </div>
              <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>
                {m.subject}
              </div>
              <div style={{ fontSize: '10px', color: '#888' }}>{m.message}</div>
              <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
                {new Date(m.created_at).toLocaleString()}
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div style={{ fontSize: '10px', color: '#666', textAlign: 'center', padding: '32px' }}>
              NO INBOUND OFFERS
            </div>
          )}
        </div>

        {/* NETWORK COLUMN - BY RESIDENCE STATE */}
        <div style={{ background: '#111', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '12px', letterSpacing: '0.1em' }}>
            NETWORK // BY RESIDENCE STATE
          </div>

          {/* STATE GRID WITH COUNTS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '4px',
            marginBottom: '16px',
            maxHeight: '200px',
            overflowY: 'auto',
            paddingRight: '4px'
          }}>
            {US_STATES.map(state => (
              <button
                key={state}
                onClick={() => setSelectedState(state)}
                style={{
                  background: selectedState === state? '#f8f8f8' : '#000',
                  color: selectedState === state? '#000' : '#f8f8f8',
                  border: `1px solid ${stateCounts[state] > 0? '#4ade80' : '#333'}`,
                  padding: '8px 4px',
                  fontSize: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                <div>{state}</div>
                <div style={{
                  fontSize: '8px',
                  color: selectedState === state? '#000' : '#4ade80'
                }}>
                  {stateCounts[state] || 0}
                </div>
              </button>
            ))}
          </div>

          {/* SELECTED STATE MEMBERS */}
          {selectedState && (
            <div>
              <div style={{
                fontSize: '10px',
                color: '#888',
                marginBottom: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid #222'
              }}>
                {members.length} MEMBERS RESIDE IN {selectedState}
              </div>
              {members.map(m => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMember(m)}
                  style={{
                    background: '#000',
                    border: '1px solid #333',
                    padding: '12px',
                    marginBottom: '8px',
                    fontSize: '10px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f8f8f8'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333'}
                >
                  {m.avatar_url? (
                    <img
                      src={m.avatar_url}
                      alt=""
                      style={{ width: '40px', height: '40px', objectFit: 'cover', border: '1px solid #333' }}
                    />
                  ) : (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: '#111',
                      border: '1px solid #333',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '700'
                    }}>
                      {m.email?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', color: m.tier === 'INSTITUTIONAL'? '#facc15' : '#f8f8f8' }}>
                      {m.email?.split('@')[0]}
                    </div>
                    <div style={{ color: '#666', fontSize: '9px' }}>
                      {m.tier} // {m.city || 'CITY N/A'}
                    </div>
                    <div style={{ color: '#4ade80', fontSize: '9px' }}>
                      {m.investor_types?.join(', ') || 'INVESTOR'}
                    </div>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <div style={{ fontSize: '10px', color: '#666', textAlign: 'center', padding: '32px' }}>
                  NO MEMBERS IN {selectedState}
                </div>
              )}
            </div>
          )}

          {!selectedState && (
            <div style={{ fontSize: '10px', color: '#666', textAlign: 'center', padding: '32px' }}>
              SELECT A STATE ABOVE TO VIEW MEMBERS
            </div>
          )}
        </div>
      </div>

      {/* MEMBER PROFILE MODAL */}
      {selectedMember && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: '#111',
            border: '1px solid #333',
            padding: '24px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              {selectedMember.avatar_url? (
                <img
                  src={selectedMember.avatar_url}
                  alt=""
                  style={{ width: '80px', height: '80px', objectFit: 'cover', border: '1px solid #333' }}
                />
              ) : (
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: '#000',
                  border: '1px solid #333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: '700'
                }}>
                  {selectedMember.email?.[0]?.toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
                  {selectedMember.email?.split('@')[0]}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: selectedMember.tier === 'INSTITUTIONAL'? '#facc15' : '#888',
                  marginBottom: '8px'
                }}>
                  {selectedMember.tier} TIER
                </div>
                <div style={{ fontSize: '10px', color: '#666' }}>
                  {selectedMember.city}, {selectedMember.state}
                </div>
              </div>
              <button
                onClick={() => setSelectedMember(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f8f8f8',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '0',
                  height: 'fit-content'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #222' }}>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>INVESTOR TYPE</div>
              <div style={{ fontSize: '11px' }}>{selectedMember.investor_types?.join(', ') || 'NOT SPECIFIED'}</div>
            </div>

            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #222' }}>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>BUY BOX</div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#4ade80' }}>
                {selectedMember.buy_box_min && selectedMember.buy_box_max
               ? `$${Number(selectedMember.buy_box_min).toLocaleString()} - $${Number(selectedMember.buy_box_max).toLocaleString()}`
                  : 'NOT SPECIFIED'}
              </div>
            </div>

            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #222' }}>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>STATES OPERATED</div>
              <div style={{ fontSize: '11px' }}>{selectedMember.states_operated?.join(', ') || 'NOT SPECIFIED'}</div>
            </div>

            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #222' }}>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>PREFERRED REHAB</div>
              <div style={{ fontSize: '11px' }}>{selectedMember.preferred_rehab || 'NOT SPECIFIED'}</div>
            </div>

            {selectedMember.bio && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>BIO</div>
                <div style={{ fontSize: '10px', color: '#888', lineHeight: '1.5' }}>{selectedMember.bio}</div>
              </div>
            )}

            <button
              onClick={() => setShowMessageModal(true)}
              style={{
                width: '100%',
                background: '#f8f8f8',
                color: '#000',
                border: 'none',
                padding: '12px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                letterSpacing: '0.1em'
              }}
            >
              SEND MESSAGE
            </button>
          </div>
        </div>
      )}

      {/* MESSAGE MODAL */}
      {showMessageModal && selectedMember && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '16px'
        }}>
          <div style={{
            background: '#111',
            border: '1px solid #333',
            padding: '24px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px' }}>
              MESSAGE {selectedMember.email?.split('@')[0]}
            </div>
            <textarea
              placeholder="Enter your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={6}
              style={{
                width: '100%',
                background: '#000',
                border: '1px solid #333',
                color: '#f8f8f8',
                padding: '12px',
                fontSize: '11px',
                fontFamily: 'monospace',
                marginBottom: '16px',
                resize: 'vertical'
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => {
                  setShowMessageModal(false)
                  setMessageText('')
                }}
                style={{
                  background: '#111',
                  color: '#f8f8f8',
                  border: '1px solid #333',
                  padding: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                CANCEL
              </button>
              <button
                onClick={sendMessage}
                style={{
                  background: '#f8f8f8',
                  color: '#000',
                  border: 'none',
                  padding: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                SEND SIGNAL
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 rgba(220, 38, 38, 0.7); }
          50% { opacity: 0.9; box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
        }
      `}</style>
    </div>
  )
}
