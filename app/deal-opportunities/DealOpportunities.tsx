'use client'

import { useState } from 'react'
import { archiveDeal, deleteDeal } from '@/app/actions/deals'
import MakeOfferModal from '@/app/components/MakeOfferModal'

type Deal = {
  id: number
  title: string | null
  address: string
  city: string
  state: string
  zipcode: string | null
  asking_price: number
  arv: number
  beds: number | null
  baths: number | null
  sqft: number | null
  description: string | null
  photo_url: string | null
  user_email: string
  status: string
  created_at: string
}

function analyzeDeal(deal: Deal) {
  const ask = Number(deal.asking_price) || 0
  const arv = Number(deal.arv) || 0
  const repairEst = 25000
  const mao = arv * 0.7 - repairEst
  const profit = arv - ask - repairEst
  
  let status = 'PASS'
  let color = '#ef4444'
  let aiComment = `Overpriced. You'd lose $${Math.abs(profit).toLocaleString()}. Walk away.`
  
  if (ask <= mao && profit > 0) {
    status = 'DEAL'
    color = '#22c55e'
    aiComment = `Strong deal. $${profit.toLocaleString()} est. profit. MAO: $${mao.toLocaleString()}.`
  } else if (ask <= arv * 0.8 && profit > 0) {
    status = 'MAYBE'
    color = '#eab308'
    aiComment = `$${profit.toLocaleString()} est. profit. Negotiate $${(ask - mao).toLocaleString()} off to hit MAO.`
  }
  
  return { status, color, profit, mao, aiComment }
}

export default function DealOpportunities({ deals: initialDeals }: { deals: Deal[] }) {
  const [deals, setDeals] = useState(initialDeals)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const currentUser = 'dm2107137@gmail.com' // Replace with auth session later

  async function handleArchive(dealId: number) {
    if (!confirm('Archive this deal? It will be hidden from public view but saved in your account.')) return
    const res = await archiveDeal(String(dealId))
    if (!res.error) {
      setDeals(deals.filter(d => d.id !== dealId))
    } else {
      alert('Failed to archive: ' + res.error)
    }
  }

  async function handleDelete(dealId: number) {
    if (!confirm('Permanently delete this deal? This cannot be undone.')) return
    const res = await deleteDeal(String(dealId))
    if (!res.error) {
      setDeals(deals.filter(d => d.id !== dealId))
    } else {
      alert('Failed to delete: ' + res.error)
    }
  }

  const buttonStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #333',
    background: '#111',
    color: '#999',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer'
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, color: '#fff', background: '#0a0a0a', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'serif', color: '#FFD700' }}>DEAL OPPORTUNITIES</h1>
        <a href="/my-work/deal-room" style={{ 
          border: '1px solid #FFD700', color: '#FFD700', padding: '8px 12px', 
          borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 700
        }}>
          + POST DEAL
        </a>
      </div>

      {deals?.length === 0 && (
        <div style={{ textAlign: 'center', color: '#666', marginTop: 40, fontSize: 14 }}>
          No active deals. Post one to get started.
        </div>
      )}

      {deals?.map(deal => {
        const { status, color, profit, aiComment } = analyzeDeal(deal)
        const isOwner = deal.user_email === currentUser
        
        return (
          <div key={deal.id} style={{ background: '#111', border: '1px solid #222', borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
            {deal.photo_url && (
              <img src={deal.photo_url} alt={deal.title || deal.address} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
            )}
            
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#FFD700' }}>
                    {deal.title || `${deal.beds || '?'}bd ${deal.baths || '?'}ba ${deal.city}`}
                  </div>
                  <div style={{ fontSize: 13, color: '#999' }}>
                    {deal.city}, {deal.state} • {deal.beds || '?'}bd {deal.baths || '?'}ba • {deal.sqft?.toLocaleString() || '?'} sqft
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginLeft: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#00bfff' }}>
                    ${Number(deal.asking_price).toLocaleString()}
                  </div>
                  <div style={{ background: color, color: '#000', fontSize: 11, fontWeight: 900, padding: '4px 8px', borderRadius: 6, display: 'inline-block' }}>
                    {status}
                  </div>
                </div>
              </div>

              <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: 8, padding: 12, margin: '12px 0' }}>
                <div style={{ fontSize: 11, color: '#999', letterSpacing: '1px', marginBottom: 4 }}>AI ANALYZER</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: profit > 0 ? '#22c55e' : '#ef4444' }}>
                  Est. Profit: ${profit.toLocaleString()}
                </div>
                <div style={{ fontSize: 13, color: '#ccc', marginTop: 4 }}>{aiComment}</div>
              </div>

              {deal.description && (
                <div style={{ fontSize: 14, color: '#ddd', marginBottom: 12 }}>{deal.description}</div>
              )}

              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button 
                  onClick={() => setSelectedDeal(deal)}
                  style={{ ...buttonStyle, background: '#FFD700', color: '#000', border: 'none', flex: 1 }}
                >
                  MAKE OFFER
                </button>
                {isOwner && (
                  <>
                    <button onClick={() => handleArchive(deal.id)} style={buttonStyle}>ARCHIVE</button>
                    <button onClick={() => handleDelete(deal.id)} style={{...buttonStyle, color: '#ef4444', borderColor: '#ef4444' }}>DELETE</button>
                  </>
                )}
              </div>

              <div style={{ fontSize: 11, color: '#666' }}>
                Posted by: {deal.user_email}
              </div>
            </div>
          </div>
        )
      })}
      
      {selectedDeal && (
        <MakeOfferModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
      )}
    </div>
  )
}
