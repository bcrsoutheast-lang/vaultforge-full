'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import DealDetailModal from '@/app/components/DealDetailModal'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  repairs?: number | null
  property_type?: string | null
}

export default function DealOpportunities() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [currentUser, setCurrentUser] = useState<string>('dm2107137@gmail.com')
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const [activeTab, setActiveTab] = useState<'all' | 'saved' | 'archived'>('all')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDeals()
    fetchSavedDeals()
  }, [])

  async function fetchDeals() {
    setLoading(true)
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    
    if (error) console.error('Error fetching deals:', error)
    else setDeals(data || [])
    setLoading(false)
  }

  async function fetchSavedDeals() {
    const { data } = await supabase
      .from('saved_deals')
      .select('deal_id')
      .eq('user_email', currentUser)
    
    if (data) setSavedIds(new Set(data.map(d => d.deal_id)))
  }

  async function handleSave(dealId: number) {
    const isSaved = savedIds.has(dealId)
    
    if (isSaved) {
      await supabase.from('saved_deals').delete().eq('deal_id', dealId).eq('user_email', currentUser)
      const newSaved = new Set(savedIds)
      newSaved.delete(dealId)
      setSavedIds(newSaved)
    } else {
      await supabase.from('saved_deals').insert({ deal_id: dealId, user_email: currentUser })
      const newSaved = new Set(savedIds)
      newSaved.add(dealId)
      setSavedIds(newSaved)
    }
  }

  const filteredDeals = activeTab === 'saved' 
    ? deals.filter(d => savedIds.has(d.id))
    : activeTab === 'archived'
    ? deals.filter(d => d.status === 'archived')
    : deals

  if (loading) {
    return (
      <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '16px' }}>
        <div style={{ textAlign: 'center', marginTop: '80px' }}>Loading deals...</div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff' }}>
      <div style={{ borderBottom: '1px solid #27272a', padding: '16px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button 
              onClick={() => router.push('/')}
              style={{ color: '#a1a1aa', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ← Back to Home
            </button>
            <button 
              onClick={() => router.push('/post-deal')}
              style={{ border: '1px solid #facc15', color: '#facc15', padding: '8px 16px', borderRadius: '4px', fontSize: '14px', background: 'none', cursor: 'pointer' }}
            >
              + POST DEAL
            </button>
          </div>
          
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#facc15', marginBottom: '16px' }}>DEAL OPPORTUNITIES</h1>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('all')}
              style={{ 
                padding: '8px 16px', 
                borderRadius: '4px', 
                fontSize: '14px', 
                fontWeight: 'bold',
                backgroundColor: activeTab === 'all'? '#facc15' : '#27272a',
                color: activeTab === 'all'? '#000' : '#a1a1aa',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              ALL DEALS ({deals.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              style={{ 
                padding: '8px 16px', 
                borderRadius: '4px', 
                fontSize: '14px', 
                fontWeight: 'bold',
                backgroundColor: activeTab === 'saved'? '#facc15' : '#27272a',
                color: activeTab === 'saved'? '#000' : '#a1a1aa',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              SAVED ({savedIds.size})
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
        {filteredDeals.length === 0? (
          <div style={{ textAlign: 'center', color: '#71717a', marginTop: '80px' }}>
            {activeTab === 'saved'? 'No saved deals yet' : 'No deals available'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {filteredDeals.map((deal) => (
              <div key={deal.id} style={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a', overflow: 'hidden' }}>
                <img 
                  src={deal.photo_url || 'https://via.placeholder.com/400x300?text=No+Image'} 
                  style={{ width: '100%', height: '192px', objectFit: 'cover' }}
                  alt={deal.address}
                />
                
                <div style={{ padding: '16px' }}>
                  <h3 style={{ color: '#facc15', fontWeight: 'bold', fontSize: '18px', marginBottom: '8px' }}>
                    {deal.city}, {deal.state} • {deal.beds}bd {deal.baths}ba
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px', fontSize: '14px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#71717a' }}>ASKING</div>
                      <div style={{ color: '#60a5fa', fontWeight: 'bold' }}>${deal.asking_price?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#71717a' }}>ARV</div>
                      <div style={{ color: '#4ade80', fontWeight: 'bold' }}>${deal.arv?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#71717a' }}>REPAIRS</div>
                      <div style={{ color: '#facc15', fontWeight: 'bold' }}>${(deal.repairs || 0)?.toLocaleString()}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSelectedDeal(deal)
                    }}
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#facc15', 
                      color: '#000', 
                      fontWeight: '900', 
                      padding: '12px', 
                      borderRadius: '8px', 
                      border: 'none',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    OPEN DEAL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDeal && (
        <DealDetailModal
          deal={selectedDeal}
          currentUser={{
            email: currentUser,
            name: 'Deeve Moneyy',
            avatar: null
          }}
          isSaved={savedIds.has(selectedDeal.id)}
          onClose={() => setSelectedDeal(null)}
          onSave={() => handleSave(selectedDeal.id)}
        />
      )}
    </div>
  )
}
