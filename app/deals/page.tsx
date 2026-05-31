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
        <div>Loading VaultForge deals...</div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff' }}>
      <div style={{ borderBottom: '1px solid #27272a', padding: '16px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#facc15', marginBottom: '8px' }}>DEAL OPPORTUNITIES</h1>
          <p style={{ color: '#a1a1aa', fontSize: '14px' }}>Veteran Pride Exterior Services - We Fight Dirt. We Fight Bad Deals.</p>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px' }}>
        {deals.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#71717a', marginTop: '80px' }}>
            No deals available. Post your first deal.
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
                      <div style={{ color: '#facc15', fontWeight: 'bold' }}>
                        {(deal.repairs ?? 0) > 0 ? `$${(deal.repairs || 0)?.toLocaleString()}` : 'TBD'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#3f3f46', 
                      color: '#fff', 
                      fontWeight: 'bold', 
                      padding: '12px', 
                      borderRadius: '8px', 
                      border: 'none',
                      fontSize: '14px',
                      cursor: 'not-allowed'
                    }}
                    disabled
                  >
                    OPEN DEAL - COMING NEXT
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
