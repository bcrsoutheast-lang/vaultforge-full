'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function CommandCenter() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [signals, setSignals] = useState<any[]>([])
  const [tickerAlerts, setTickerAlerts] = useState<string[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [members, setMembers] = useState<any[]>([])
  const [selectedState, setSelectedState] = useState('GA')
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchSignals()
    fetchMessages()
    fetchMembers()
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
    
    // Fetch profile for avatar + tier
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

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('member_profiles')
      .select('*')
      .eq('state', selectedState)
      .order('tier', { ascending: false })
    
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
            background: unreadCount > 0 ? '#dc2626' : '#333',
            padding: '8px 16px',
            fontSize: '11px',
            fontWeight: '700',
            animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: '1px', background: '#333' }}>
        
        {/* SIGNALS COLUMN */}
        <div style={{ background: '#111', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '12px', letterSpacing: '0.1em' }}>
            LIVE SIGNALS
          </div>
          {signals.map(s => (
            <div key={s.id} onClick={() => acknowledgeSignal(s.id)} style={{
              background: '#000',
              border: `1px solid ${s.severity === 'CRITICAL' ? '#dc2626' : '#facc15'}`,
              padding: '12px',
              marginBottom: '8px',
              cursor: 'pointer',
              animation: s.severity === 'CRITICAL' ? 'pulse 2s infinite' : 'none'
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

        {/* NETWORK COLUMN */}
        <div style={{ background: '#111', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '12px', letterSpacing: '0.1em' }}>
            NETWORK // {selectedState}
          </div>
          <select 
            value={selectedState} 
            onChange={(e) => { setSelectedState(e.target.value); fetchMembers(); }}
            style={{
              width: '100%',
              background: '#000',
              border: '1px solid #333',
              color: '#f8f8f8',
              padding: '8px',
              fontSize: '11px',
              marginBottom: '12px'
            }}
          >
            {['GA','FL','TX','CA','NY','IL','NC','SC','AL','TN'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {members.map(m => (
            <div key={m.id} style={{
              background: '#000',
              border: '1px solid #333',
              padding: '8px',
              marginBottom: '6px',
              fontSize: '10px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              {m.avatar_url && (
                <img 
                  src={m.avatar_url} 
                  alt="" 
                  style={{ width: '24px', height: '24px', objectFit: 'cover' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', color: m.tier === 'INSTITUTIONAL' ? '#facc15' : '#f8f8f8' }}>
                  {m.email}
                </div>
                <div style={{ color: '#666', fontSize: '9px' }}>
                  {m.tier} // {m.investor_types?.join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
