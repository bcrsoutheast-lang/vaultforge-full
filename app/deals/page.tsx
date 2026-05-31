'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Deal = {
  id: number
  city: string
  state: string
  zipcode: string | null
  address: string
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
  repairs?: number | null
  property_type?: string
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDeals()
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

  if (loading) {
    return (
      <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Loading VaultForge Intelligence...</div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff' }}>
      <div style={{ borderBottom: '1px solid #27272a', padding: '16px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#facc15', marginBottom: '8px' }}>DEAL ROOM</h1>
          <p style={{ color: '#a1a1aa', fontSize: '14px' }}>Private members only. Residential • Commercial • Land</p>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
        {deals.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#71717a', marginTop: '80px' }}>
            No active deals. Check your profile states or submit a pain deal.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {deals.map((deal) => (
              <div key={deal.id} style={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a', overflow: 'hidden' }}>
                <img 
                  src={deal.photo_url || 'https://via.placeholder.com/400x300?text=No+Image'} 
                  style={{ width: '100%', height: '192px', objectFit: 'cover' }}
                  alt={deal.address}
                  onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image'}
                />
                
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <h3 style={{ color: '#facc15', fontWeight: 'bold', fontSize: '18px' }}>
                      {deal.city}, {deal.state}
                    </h3>
                    <span style={{ fontSize: '12px', color: '#71717a', backgroundColor: '#27272a', padding: '4px 8px', borderRadius: '4px' }}>
                      {deal.property_type || 'RESIDENTIAL'}
                    </span>
                  </div>
                  
                  {deal.beds && deal.baths && (
                    <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '12px' }}>
                      {deal.beds}bd {deal.baths}ba {deal.sqft ? `• ${deal.sqft.toLocaleString()} sqft` : ''}
                    </p>
                  )}
                  
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
                      <div style={{ color: '#facc15', fontWeight: 'bold' }}>
                        {(deal.repairs ?? 0) > 0 ? `$${(deal.repairs || 0)?.toLocaleString()}` : 'TBD'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#facc15', 
                      color: '#000', 
                      fontWeight: 'bold', 
                      padding: '12px', 
                      borderRadius: '8px', 
                      border: 'none',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    VIEW DEAL INTEL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
