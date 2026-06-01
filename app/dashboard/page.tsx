'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function CommandCenter() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    activeDeals: 0,
    painIntakes: 0,
    savedDeals: 0,
    unreadMessages: 0
  })
  const [membersByState, setMembersByState] = useState<{[key: string]: any[]}>({})
  const [recentSignals, setRecentSignals] = useState<any[]>([])
  const [selectedMember, setSelectedMember] = useState<any | null>(null)
  const [messageText, setMessageText] = useState('')
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    getUser()
    fetchStats()
    fetchMembersNetwork()
    fetchRecentSignals()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      const { data } = await supabase
     .from('member_profiles')
     .select('*')
     .eq('user_id', user.id)
     .single()
      setProfile(data)
    }
  }

  const fetchStats = async () => {
    const { data: deals } = await supabase.from('deals').select('id', { count: 'exact' }).eq('status', 'active')
    const { data: pain } = await supabase.from('pain_deals').select('id', { count: 'exact' }).eq('intel_status', 'PASS')
    const { data: saved } = await supabase.from('deals').select('id', { count: 'exact' }).eq('status', 'saved')
    const { data: msgs } = await supabase.from('deal_messages').select('id', { count: 'exact' }).eq('read', false)

    setStats({
      activeDeals: deals?.length || 0,
      painIntakes: pain?.length || 0,
      savedDeals: saved?.length || 0,
      unreadMessages: msgs?.length || 0
    })
  }

  const fetchMembersNetwork = async () => {
    const { data } = await supabase
   .from('member_profiles')
   .select('user_id, email, state, city, investor_types, created_at')
   .order('state', { ascending: true })

    const grouped: {[key: string]: any[]} = {}
    data?.forEach(member => {
      const state = member.state || 'UNKNOWN'
      if (!grouped[state]) grouped[state] = []
      grouped[state].push(member)
    })
    setMembersByState(grouped)
  }

  const fetchRecentSignals = async () => {
    const { data } = await supabase
   .from('deals')
   .select('*')
   .in('intel_status', ['PASS', 'REVIEW'])
   .order('analyzed_at', { ascending: false })
   .limit(5)
    setRecentSignals(data || [])
  }

  const sendMessage = async () => {
    if (!messageText.trim() ||!selectedMember ||!user) return

    const { error } = await supabase.from('deal_messages').insert([{
      deal_id: 'NETWORK_MSG',
      sender_id: user.id,
      sender_email: user.email,
      receiver_email: selectedMember.email,
      subject: `VAULTFORGE NETWORK // ${profile?.state || 'UNKNOWN'} OPERATOR`,
      message: messageText,
      read: false
    }])

    if (!error) {
      setMessageText('')
      setSelectedMember(null)
      alert('MESSAGE TRANSMITTED')
    }
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '16px' }}>
      <div style={{ maxWidth: '1800px', margin: '0 auto' }}>
        <div className="grid-header">VAULTFORGE COMMAND CENTER // OPERATOR: {profile?.email || 'LOADING...'}</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#27272a', marginTop: '1px', marginBottom: '16px' }}>
          <div className="grid-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#4ade80' }}>{stats.activeDeals}</div>
            <div style={{ fontSize: '10px', color: '#71717a', letterSpacing: '0.1em' }}>ACTIVE DEALS</div>
          </div>
          <div className="grid-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#facc15' }}>{stats.painIntakes}</div>
            <div style={{ fontSize: '10px', color: '#71717a', letterSpacing: '0.1em' }}>PAIN INTAKES</div>
          </div>
          <div className="grid-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#60a5fa' }}>{stats.savedDeals}</div>
            <div style={{ fontSize: '10px', color: '#71717a', letterSpacing: '0.1em' }}>SAVED DEALS</div>
          </div>
          <div className="grid-panel" style={{ padding: '16px', textAlign: 'center', position: 'relative' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: '#f87171' }}>{stats.unreadMessages}</div>
            <div style={{ fontSize: '10px', color: '#71717a', letterSpacing: '0.1em' }}>UNREAD SIGNALS</div>
            {stats.unreadMessages > 0 && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '8px',
                height: '8px',
                background: '#f87171',
                borderRadius: '50%',
                animation: 'pulse 1.5s infinite'
              }} />
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>

          <div>
            <div className="grid-header" style={{ marginBottom: '1px' }}>OPERATIONS MODULES</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: '#27272a' }}>

              <div className="grid-panel" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => router.push('/deals')}>
                <div style={{ fontSize: '11px', color: '#facc15', marginBottom: '8px', letterSpacing: '0.1em' }}>DEAL ROOM</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#fafafa', marginBottom: '8px' }}>{stats.activeDeals}</div>
                <div style={{ fontSize: '10px', color: '#71717a' }}>ACTIVE OPPORTUNITIES // DQI SCANNED // 10 PHOTO UPLOADS</div>
                <div style={{ marginTop: '12px', fontSize: '9px', color: '#4ade80' }}>STATUS: OPERATIONAL</div>
              </div>

              <div className="grid-panel" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => router.push('/pain-intake')}>
                <div style={{ fontSize: '11px', color: '#f87171', marginBottom: '8px', letterSpacing: '0.1em' }}>PAIN INTAKE</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#fafafa', marginBottom: '8px' }}>{stats.painIntakes}</div>
                <div style={{ fontSize: '10px', color: '#71717a' }}>DISTRESSED ASSETS // INTEL ANALYZER // ROUTING ACTIVE</div>
                <div style={{ marginTop: '12px', fontSize: '9px', color: '#4ade80' }}>STATUS: OPERATIONAL</div>
              </div>

              <div className="grid-panel" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => router.push('/pain-help')}>
                <div style={{ fontSize: '11px', color: '#60a5fa', marginBottom: '8px', letterSpacing: '0.1em' }}>PAIN HELP</div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#fafafa', marginBottom: '8px' }}>ASSIST</div>
                <div style={{ fontSize: '10px', color: '#71717a' }}>CONTRACTOR NETWORK // TITLE RESOLUTION // FUNDING</div>
                <div style={{ marginTop: '12px', fontSize: '9px', color: '#fbbf24' }}>STATUS: STANDBY</div>
              </div>

              <div className="grid-panel" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => router.push('/profile')}>
                <div style={{ fontSize: '11px', color: '#a1a1aa', marginBottom: '8px', letterSpacing: '0.1em' }}>OPERATOR PROFILE</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fafafa', marginBottom: '8px' }}>{profile?.email || 'UNKNOWN'}</div>
                <div style={{ fontSize: '10px', color: '#71717a' }}>STATE: {profile?.state || 'N/A'} // TIER: {profile?.tier || 'STANDARD'}</div>
                <div style={{ marginTop: '12px', fontSize: '9px', color: '#4ade80' }}>STATUS: AUTHENTICATED</div>
              </div>

            </div>

            <div className="grid-header" style={{ marginTop: '16px', marginBottom: '1px' }}>RECENT INTEL SIGNALS // LAST 5</div>
            <div style={{ display: 'grid', gap: '1px', background: '#27272a' }}>
              {recentSignals.map((deal, i) => (
                <div key={deal.id} className="grid-panel" style={{ padding: '12px', cursor: 'pointer' }} onClick={() => router.push('/deals')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#fafafa', fontWeight: '700' }}>{deal.address}, {deal.city} {deal.state}</div>
                      <div style={{ fontSize: '9px', color: '#71717a', marginTop: '4px' }}>
                        DQI {deal.dqi_score} // {deal.intel_status} // {deal.rehab_level}
                      </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: '900', color: '#60a5fa' }}>${Number(deal.asking_price).toLocaleString()}</div>
                      <div style={{ fontSize: '9px', color: '#4ade80' }}>ARV ${Number(deal.arv).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
              {recentSignals.length === 0 && (
                <div className="grid-panel" style={{ padding: '24px', textAlign: 'center', color: '#71717a', fontSize: '10px' }}>
                  NO RECENT SIGNALS // AWAITING INTEL
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="grid-header" style={{ marginBottom: '1px' }}>MEMBERS NETWORK // BY STATE // DIRECT MESSAGE</div>
            <div className="grid-panel" style={{ padding: '0', maxHeight: '600px', overflowY: 'auto' }}>
              {Object.keys(membersByState).sort().map(state => (
                <div key={state}>
                  <div style={{ background: '#18181b', padding: '8px 12px', fontSize: '10px', fontWeight: '900', color: '#facc15', letterSpacing: '0.1em', borderBottom: '1px solid #27272a' }}>
                    {state} // {membersByState[state].length} OPERATORS
                  </div>
                  {membersByState[state].map(member => (
                    <div key={member.user_id} style={{ padding: '8px 12px', borderBottom: '1px solid #27272a', cursor: 'pointer', background: selectedMember?.user_id === member.user_id? '#18181b' : 'transparent' }}
                      onClick={() => setSelectedMember(member)}>
                      <div style={{ fontSize: '10px', color: '#fafafa' }}>{member.email}</div>
                      <div style={{ fontSize: '9px', color: '#71717a', marginTop: '2px' }}>
                        {member.city} // {member.investor_types?.join(', ') || 'GENERAL'}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {selectedMember && (
              <div className="grid-panel" style={{ marginTop: '1px', padding: '12px' }}>
                <div style={{ fontSize: '9px', color: '#facc15', marginBottom: '8px' }}>MESSAGE: {selectedMember.email}</div>
                <textarea
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  placeholder="TYPE MESSAGE..."
                  rows={3}
                  style={{ width: '100%', background: '#000', border: '1px solid #27272a', padding: '8px', color: '#fafafa', fontSize: '11px', resize: 'none', marginBottom: '8px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={sendMessage}
                    style={{ flex: 1, padding: '8px', background: '#facc15', color: '#000', border: 'none', fontSize: '10px', fontWeight: '900', cursor: 'pointer' }}>
                    TRANSMIT
                  </button>
                  <button onClick={() => setSelectedMember(null)}
                    style={{ padding: '8px 16px', background: '#27272a', color: '#fafafa', border: 'none', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
