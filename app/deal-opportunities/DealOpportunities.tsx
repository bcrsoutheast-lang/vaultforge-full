'use client'

import { useState } from 'react'
import { archiveDeal, deleteDeal, saveDeal, unsaveDeal } from '@/app/actions/deals'
import DealDetailModal from '@/app/components/DealDetailModal'

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

type Props = {
  deals: Deal[]
  initialSavedIds: number[]
  currentUser: string
}

export default function DealOpportunities({ deals: initialDeals, initialSavedIds, currentUser }: Props) {
  const [deals, setDeals] = useState(initialDeals)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set(initialSavedIds))
  const [filter, setFilter] = useState<'all' | 'saved' | 'archived'>('all')

  async function handleArchive(dealId: number) {
    if (!confirm('Archive this deal?')) return
    const res = await archiveDeal(String(dealId))
    if (!res.error) {
      setDeals(deals.map(d => d.id === dealId ? {...d, status: 'archived'} : d))
      setSelectedDeal(null)
    }
  }

  async function handleDelete(dealId: number) {
    if (!confirm('Permanently delete this deal?')) return
    const res = await deleteDeal(String(dealId))
    if (!res.error) {
      setDeals(deals.filter(d => d.id !== dealId))
      setSelectedDeal(null)
    }
  }

  async function handleSave(dealId: number) {
    const isSaved = savedIds.has(dealId)
    const res = isSaved 
      ? await unsaveDeal(dealId, currentUser)
      : await saveDeal(dealId, currentUser)
    
    if (!res.error) {
      const newSaved = new Set(savedIds)
      isSaved ? newSaved.delete(dealId) : newSaved.add(dealId)
      setSavedIds(newSaved)
    }
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    background: active ? '#FFD700' : '#111',
    color: active ? '#000' : '#999',
    border: '1px solid #333',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer'
  })

  const filteredDeals = deals.filter(d => {
    if (filter === 'all') return d.status === 'active'
    if (filter === 'saved') return savedIds.has(d.id) && d.status === 'active'
    if (filter === 'archived') return d.status === 'archived' && d.user_email === currentUser
    return true
  })

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, color: '#fff', background: '#0a0a0a', minHeight: '100vh' }}>
      <a href="/" style={{ 
        fontSize: 12, color: '#666', textDecoration: 'none', 
        display: 'inline-block', marginBottom: 12 
      }}>
        ← Back to Home
      </a>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: 'serif', color: '#FFD700' }}>DEAL OPPORTUNITIES</h1>
        <a href="/my-work/deal-room" style={{ 
          border: '1px solid #FFD700', color: '#FFD700', padding: '8px 12px', 
          borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 700
        }}>
          + POST DEAL
        </a>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button onClick={() => setFilter('all')} style={tabStyle(filter === 'all')}>
          ALL DEALS ({deals.filter(d => d.status === 'active').length})
        </button>
        <button onClick={() => setFilter('saved')} style={tabStyle(filter === 'saved')}>
          SAVED ({savedIds.size})
        </button>
        <button onClick={() => setFilter('archived')} style={tabStyle(filter === 'archived')}>
          ARCHIVED ({deals.filter(d => d.status === 'archived' && d.user_email === currentUser).length})
        </button>
      </div>

      {filteredDeals.length === 0 && (
        <div style={{ textAlign: 'center', color: '#666', marginTop: 40, fontSize: 14 }}>
          {filter === 'saved' && 'No saved deals yet.'}
          {filter === 'archived' && 'No archived deals.'}
          {filter === 'all' && 'No active deals.'}
        </div>
      )}

      {filteredDeals.map(deal => {
        const repairEst = Number(deal.repair_cost) || 25000
        
        return (
          <div key={deal.id} style={{ background: '#111', border: '1px solid #222', borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
            {deal.photo_url && (
              <img src={deal.photo_url} alt={deal.city} style={{ width: '100%', height: 220, objectFit: 'cover' }} />
            )}
            
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FFD700', marginBottom: 4 }}>
                {deal.city}, {deal.state} • {deal.beds || '?'}bd {deal.baths || '?'}ba
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#666', letterSpacing: '1px' }}>ASKING</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#00bfff' }}>${deal.asking_price.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#666', letterSpacing: '1px' }}>ARV</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#22c55e' }}>${deal.arv.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#666', letterSpacing: '1px' }}>REPAIRS</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#eab308' }}>${repairEst.toLocaleString()}</div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedDeal(deal)}
                style={{ 
                  width: '100%', padding: 14, background: '#FFD700', color: '#000', 
                  fontWeight: 900, borderRadius: 8, border: 'none',
                  fontSize: 14, cursor: 'pointer', letterSpacing: '1px'
                }}
              >
                OPEN DEAL
              </button>
            </div>
          </div>
        )
      })}
      
      {selectedDeal && (
        <DealDetailModal 
          deal={selectedDeal} 
          currentUser={currentUser}
          isSaved={savedIds.has(selectedDeal.id)}
          onClose={() => setSelectedDeal(null)}
          onSave={() => handleSave(selectedDeal.id)}
          onArchive={() => handleArchive(selectedDeal.id)}
          onDelete={() => handleDelete(selectedDeal.id)}
        />
      )}
    </div>
  )
}
