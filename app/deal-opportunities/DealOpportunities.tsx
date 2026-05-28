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
      <div className="bg-black min-h-screen text-white p-4">
        <div className="text-center mt-20">Loading deals...</div>
      </div>
    )
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="border-b border-zinc-800 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={() => router.push('/')}
              className="text-zinc-400 text-sm hover:text-white"
            >
              ← Back to Home
            </button>
            <button 
              onClick={() => router.push('/post-deal')}
              className="border border-yellow-400 text-yellow-400 px-4 py-2 rounded text-sm hover:bg-yellow-400 hover:text-black"
            >
              + POST DEAL
            </button>
          </div>
          
          <h1 className="text-3xl font-bold text-yellow-400 mb-4">DEAL OPPORTUNITIES</h1>
          
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded text-sm font-bold ${activeTab === 'all' ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-400'}`}
            >
              ALL DEALS ({deals.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 rounded text-sm font-bold ${activeTab === 'saved' ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-400'}`}
            >
              SAVED ({savedIds.size})
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-4 py-2 rounded text-sm font-bold ${activeTab === 'archived' ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-400'}`}
            >
              ARCHIVED (0)
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {filteredDeals.length === 0 ? (
          <div className="text-center text-zinc-500 mt-20">
            {activeTab === 'saved' ? 'No saved deals yet' : 'No deals available'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDeals.map((deal) => (
              <div key={deal.id} className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                <img 
                  src={deal.photo_url || 'https://via.placeholder.com/400x300?text=No+Image'} 
                  className="w-full h-48 object-cover"
                  alt={deal.address}
                />
                
                <div className="p-4">
                  <h3 className="text-yellow-400 font-bold text-lg mb-2">
                    {deal.city}, {deal.state} • {deal.beds}bd {deal.baths}ba
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                    <div>
                      <div className="text-xs text-zinc-500">ASKING</div>
                      <div className="text-blue-400 font-bold">${deal.asking_price?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">ARV</div>
                      <div className="text-green-400 font-bold">${deal.arv?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">REPAIRS</div>
                      <div className="text-yellow-400 font-bold">${(deal.repairs || 0)?.toLocaleString()}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('OPEN DEAL CLICKED:', deal.id)
                      setSelectedDeal(deal)
                    }}
                    className="w-full bg-yellow-400 text-black font-black py-3 rounded-lg hover:bg-yellow-300 active:bg-yellow-500 text-sm relative z-10"
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
