'use client'

import { useState } from 'react'
import MakeOfferModal from './MakeOfferModal'

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
  owner_phone?: string | null
  owner_name?: string | null
  repair_cost?: number | null
}

function analyzeDeal(deal: Deal) {
  const ask = Number(deal.asking_price) || 0
  const arv = Number(deal.arv) || 0
  const repairEst = Number(deal.repair_cost) || 25000
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
  
  return { status, color, profit, mao, repairEst, aiComment }
}

export default function DealDetailModal({ 
  deal, 
  currentUser, 
  isSaved, 
  onClose, 
  onSave,
  onArchive,
  onDelete 
}: { 
  deal: Deal
  currentUser: string
  isSaved: boolean
  onClose: () => void
  onSave: () => void
  onArchive: () => void
  onDelete: () => void
}) {
  const [showOfferForm, setShowOfferForm] = useState(false)
  const { status, color, profit, mao, repairEst, aiComment } = analyzeDeal(deal)
  const isOwner = deal.user_email === currentUser

  if (showOfferForm) {
    return <MakeOfferModal deal={deal} onClose={() => setShowOfferForm(false)} />
  }

  const buttonStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderRadius: 8,
    border: '1px solid #333',
    background: '#111',
    color: '#999',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    flex: 1
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20 }}>
      <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: 16, maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {deal.photo_url && (
          <img src={deal.photo_url} alt={deal.city} style={{ width: '100%', height: 300, objectFit: 'cover' }} />
        )}
        
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#FFD700' }}>
                {deal.city}, {deal.state} {deal.zipcode}
              </div>
              <div style={{ fontSize: 14, color: '#999', marginTop: 4 }}>
                {deal.beds || '?'} Beds • {deal.baths || '?'} Baths • {deal.sqft?.toLocaleString() || '?'} Sqft
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#999', fontSize: 28, cursor: 'pointer', padding: 0 }}>×</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ background: '#111', padding: 12, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#666' }}>ASKING</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#00bfff' }}>${deal.asking_price.toLocaleString()}</div>
            </div>
            <div style={{ background: '#111', padding: 12, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#666' }}>ARV</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#22c55e' }}>${deal.arv.toLocaleString()}</div>
            </div>
            <div style={{ background: '#111', padding: 12, borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#666' }}>REPAIRS</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#eab308' }}>${repairEst.toLocaleString()}</div>
            </div>
          </div>

          <div style={{ background: '#0a0a0a', border: `2px solid ${color}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#999', letterSpacing: '1px' }}>SMART AI ANALYZER</div>
              <div style={{ background: color, color: '#000', fontSize: 12, fontWeight: 900, padding: '4px 12px', borderRadius: 6 }}>
                {status}
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: profit > 0 ? '#22c55e' : '#ef4444', marginBottom: 8 }}>
              Est. Profit: ${profit.toLocaleString()}
            </div>
            <div style={{ fontSize: 13, color: '#ccc', marginBottom: 8 }}>{aiComment}</div>
            <div style={{ fontSize: 12, color: '#999' }}>
              Max Allowable Offer: ${mao.toLocaleString()}
            </div>
          </div>

          <div style={{ background: '#111', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 8 }}>PROPERTY DETAILS</div>
            {deal.description && <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>{deal.description}</div>}
            <div style={{ fontSize: 14, color: '#ddd' }}>
              Location: {deal.city}, {deal.state} {deal.zipcode}
            </div>
          </div>

          <div style={{ background: '#111', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 8 }}>OWNER CONTACT</div>
            <div style={{ fontSize: 14, color: '#ddd' }}>
              {deal.owner_name || deal.user_email}
            </div>
            {deal.owner_phone && <div style={{ fontSize: 14, color: '#00bfff', marginTop: 4 }}>{deal.owner_phone}</div>}
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button 
              onClick={() => setShowOfferForm(true)}
              style={{ ...buttonStyle, background: '#FFD700', color: '#000', border: 'none', flex: 2 }}
            >
              MAKE OFFER
            </button>
            <button onClick={onClose} style={buttonStyle}>
              EXIT
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={onSave}
              style={{ 
                ...buttonStyle, 
                background: isSaved ? '#22c55e' : '#111',
                color: isSaved ? '#000' : '#999',
                borderColor: isSaved ? '#22c55e' : '#333'
              }}
            >
              {isSaved ? 'SAVED ✓' : 'SAVE'}
            </button>
            {isOwner && (
              <>
                <button onClick={onArchive} style={buttonStyle}>
                  {deal.status === 'archived' ? 'UNARCHIVE' : 'ARCHIVE'}
                </button>
                <button onClick={onDelete} style={{...buttonStyle, color: '#ef4444', borderColor: '#ef4444' }}>
                  DELETE
                </button>
              </>
            )}
          </div>

          <div style={{ fontSize: 11, color: '#666', textAlign: 'center', marginTop: 16 }}>
            Posted by: {deal.user_email} • {new Date(deal.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}
