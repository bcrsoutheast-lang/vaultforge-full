'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [filter, setFilter] = useState('ALL')
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchDeals()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
  }

  const fetchDeals = async () => {
    setLoading(true)
    const { data, error } = await supabase
   .from('deals')
   .select('*')
   .eq('status', 'active')
   .order('dqi_score', { ascending: false })

    if (data) setDeals(data)
    setLoading(false)
  }

  const calculateSpread = (deal: any) => {
    if (!deal.arv ||!deal.asking_price) return 0
    return Math.round(((deal.arv - deal.asking_price) / deal.arv) * 100)
  }

  const getStatusColor = (status: string) => {
    if (status === 'PASS') return '#4ade80'
    if (status === 'REVIEW') return '#facc15'
    return '#f87171'
  }

  const handleMessageOwner = async (deal: any) => {
    const subject = `OFFER: ${deal.address}`
    const message = prompt('Enter your offer message:')
    if (!message) return

    const { error } = await supabase.from('deal_messages').insert({
      deal_id: deal.id,
      sender_id: user?.id,
      sender_email: user?.email,
      receiver_email: deal.owner_email,
      subject,
      message
    })

    if (!error) alert('SIGNAL SENT // OWNER NOTIFIED // TICKER ACTIVE')
    else alert('ERROR: ' + error.message)
  }

  const handleMarkClosed = async (deal: any) => {
    const closedPrice = prompt('Enter final closed price:')
    if (!closedPrice) return

    const { error: outcomeError } = await supabase.from('deal_outcomes').insert({
      deal_id: deal.id,
      dqi_score: deal.dqi_score,
      intel_flags: deal.intel_flags,
      intel_status: deal.intel_status,
      rehab_level: deal.rehab_level,
      spread_pct: calculateSpread(deal),
      zipcode: deal.zipcode,
      asking_price: deal.asking_price,
      arv: deal.arv,
      closed: true,
      closed_price: Number(closedPrice),
      closed_by_user_id: user?.id
    })

    const { error: dealError } = await supabase
   .from('deals')
   .update({ status: 'closed', closed_price: Number(closedPrice), closed_at: new Date().toISOString() })
   .eq('id', deal.id)

    if (!outcomeError &&!dealError) {
      alert('DEAL CLOSED // VAULTFORGE ARV UPDATED // NETWORK SMARTER')
      fetchDeals()
    }
  }

  const filteredDeals = deals.filter(d => {
    if (filter === 'ALL') return true
    if (filter === 'INSTITUTIONAL') return d.dqi_score >= 90
    if (filter === 'PASS') return d.intel_status === 'PASS'
    if (filter === 'MY_DEALS') return d.owner_email === user?.email
    return true
  })

  if (loading) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', color: '#f8f8f8', padding: '16px' }}>
        LOADING INTEL...
      </div>
    )
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '16px', color: '#f8f8f8', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{
          fontSize: '14px',
          fontWeight: '700',
          letterSpacing: '0.1em',
          borderBottom: '1px solid #333',
          paddingBottom: '8px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>DEAL OPPORTUNITIES // VAULTFORGE INTEL // {filteredDeals.length} ACTIVE</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['ALL', 'INSTITUTIONAL', 'PASS', 'MY_DEALS'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f? '#f8f8f8' : '#111',
                  color: filter === f? '#000' : '#f8f8f8',
                  border: '1px solid #333',
                  padding: '6px 12px',
                  fontSize: '10px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* DEALS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1px', background: '#333' }}>
          {filteredDeals.map(deal => (
            <div key={deal.id} style={{ background: '#111', padding: '16px', border: `2px solid ${getStatusColor(deal.intel_status)}` }}>

              {/* DQI BADGE */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #222'
              }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: getStatusColor(deal.intel_status) }}>
                    DQI {deal.dqi_score || 0}
                  </div>
                  <div style={{ fontSize: '9px', color: '#666', letterSpacing: '0.1em' }}>
                    {deal.intel_status || 'PENDING'}
                  </div>
                </div>
                {deal.dqi_score >= 90 && (
                  <div style={{
                    background: '#facc15',
                    color: '#000',
                    padding: '4px 8px',
                    fontSize: '9px',
                    fontWeight: '700',
                    height: 'fit-content'
                  }}>
                    INSTITUTIONAL
                  </div>
                )}
              </div>

              {/* ADDRESS */}
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>
                {deal.address}
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '12px' }}>
                {deal.city}, {deal.zipcode} // {deal.beds}BD {deal.baths}BA {deal.sqft}SF
              </div>

              {/* METRICS */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '10px',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid #222'
              }}>
                <div>
                  <div style={{ color: '#666' }}>ASK</div>
                  <div style={{ fontWeight: '700' }}>${deal.asking_price?.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ color: '#666' }}>ARV</div>
                  <div style={{ fontWeight: '700' }}>${deal.arv?.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ color: '#666' }}>SPREAD</div>
                  <div style={{ fontWeight: '700', color: '#4ade80' }}>{calculateSpread(deal)}%</div>
                </div>
                <div>
                  <div style={{ color: '#666' }}>REHAB</div>
                  <div style={{ fontWeight: '700' }}>{deal.rehab_level || 'N/A'}</div>
                </div>
              </div>

              {/* FLAGS */}
              {deal.intel_flags && deal.intel_flags.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  {deal.intel_flags.map((flag: string, i: number) => (
                    <span key={i} style={{
                      display: 'inline-block',
                      background: '#000',
                      border: '1px solid #f87171',
                      color: '#f87171',
                      padding: '2px 6px',
                      fontSize: '9px',
                      marginRight: '4px',
                      marginBottom: '4px'
                    }}>
                      {flag}
                    </span>
                  ))}
                </div>
              )}

              {/* ACTIONS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {deal.owner_email!== user?.email? (
                  <button
                    onClick={() => handleMessageOwner(deal)}
                    style={{
                      background: '#f8f8f8',
                      color: '#000',
                      border: 'none',
                      padding: '10px',
                      fontSize: '10px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    MESSAGE OWNER
                  </button>
                ) : (
                  <button
                    onClick={() => handleMarkClosed(deal)}
                    style={{
                      background: '#4ade80',
                      color: '#000',
                      border: 'none',
                      padding: '10px',
                      fontSize: '10px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    MARK CLOSED
                  </button>
                )}
                <button
                  onClick={() => router.push(`/deals/${deal.id}`)}
                  style={{
                    background: '#111',
                    color: '#f8f8f8',
                    border: '1px solid #333',
                    padding: '10px',
                    fontSize: '10px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  VIEW INTEL
                </button>
              </div>

              {/* OWNER */}
              <div style={{ fontSize: '9px', color: '#444', marginTop: '8px', textAlign: 'center' }}>
                OWNER: {deal.owner_email === user?.email? 'YOU' : deal.owner_email?.split('@')[0]}
              </div>
            </div>
          ))}
        </div>

        {filteredDeals.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px', color: '#666', fontSize: '11px' }}>
            NO DEALS FOUND // SUBMIT PAIN INTAKE TO POPULATE INTEL
          </div>
        )}
      </div>
    </div>
  )
}
