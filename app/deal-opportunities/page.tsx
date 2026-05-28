import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

type Deal = {
  id: string
  title: string
  address: string
  city: string
  state: string
  zipcode: string
  asking_price: number
  arv: number
  beds: number | null
  baths: number | null
  sqft: number | null
  description: string
  user_email: string
  created_at: string
}

function analyzeDeal(deal: Deal) {
  const ask = Number(deal.asking_price) || 0
  const arv = Number(deal.arv) || 0
  const repairEst = 25000 // default repair estimate
  const mao = arv * 0.7 - repairEst
  const profit = arv - ask - repairEst
  
  let status = 'MAYBE'
  let color = '#eab308'
  let aiComment = 'Tight margins. Negotiate harder.'
  
  if (ask <= mao) {
    status = 'DEAL'
    color = '#22c55e'
    aiComment = `Strong deal. $${profit.toLocaleString()} est. profit. MAO: $${mao.toLocaleString()}.`
  } else if (ask > arv * 0.9) {
    status = 'PASS'
    color = '#ef4444'
    aiComment = `Overpriced. You'd lose $${Math.abs(profit).toLocaleString()}. Walk away.`
  } else {
    aiComment = `$${profit.toLocaleString()} est. profit. Negotiate $${(ask - mao).toLocaleString()} off to hit MAO.`
  }
  
  return { status, color, profit, mao, aiComment }
}

export default async function DealOpportunities() {
  const { data: deals, error } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return <div style={{ color: '#fff', padding: 20 }}>Error loading deals: {error.message}</div>
  }

  const cardStyle: React.CSSProperties = {
    background: '#111',
    border: '1px solid #222',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  }

  const pillStyle = (bg: string): React.CSSProperties => ({
    background: bg,
    color: '#000',
    fontSize: 11,
    fontWeight: 900,
    padding: '4px 8px',
    borderRadius: 6,
    display: 'inline-block'
  })

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, color: '#fff', background: '#0a0a0a', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'serif', color: '#FFD700' }}>DEAL OPPORTUNITIES</h1>
        <a href="/my-work/deal-room" style={{ 
          border: '1px solid #FFD700', 
          color: '#FFD700', 
          padding: '8px 12px', 
          borderRadius: 8, 
          textDecoration: 'none',
          fontSize: 12,
          fontWeight: 700
        }}>
          + POST DEAL
        </a>
      </div>

      {deals?.length === 0 && (
        <div style={{ textAlign: 'center', color: '#666', marginTop: 40 }}>
          No deals posted yet. Be the first.
        </div>
      )}

      {deals?.map(deal => {
        const { status, color, profit, aiComment } = analyzeDeal(deal)
        
        return (
          <div key={deal.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#FFD700' }}>
                  {deal.title || `${deal.beds}bd ${deal.baths}ba ${deal.city}`}
                </div>
                <div style={{ fontSize: 13, color: '#999' }}>
                  {deal.city}, {deal.state} • {deal.beds || '?'}bd {deal.baths || '?'}ba • {deal.sqft?.toLocaleString() || '?'} sqft
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#00bfff' }}>
                  ${Number(deal.asking_price).toLocaleString()}
                </div>
                <div style={pillStyle(color)}>{status}</div>
              </div>
            </div>

            <div style={{ 
              background: '#0a0a0a', 
              border: '1px solid #222', 
              borderRadius: 8, 
              padding: 12, 
              margin: '12px 0' 
            }}>
              <div style={{ fontSize: 11, color: '#999', letterSpacing: '1px', marginBottom: 4 }}>AI ANALYZER</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: profit > 0 ? '#22c55e' : '#ef4444' }}>
                Est. Profit: ${profit.toLocaleString()}
              </div>
              <div style={{ fontSize: 13, color: '#ccc', marginTop: 4 }}>{aiComment}</div>
            </div>

            {deal.description && (
              <div style={{ fontSize: 14, color: '#ddd', marginBottom: 8 }}>
                {deal.description}
              </div>
            )}

            <div style={{ fontSize: 11, color: '#666' }}>
              Posted by: {deal.user_email}
            </div>
          </div>
        )
      })}
    </div>
  )
