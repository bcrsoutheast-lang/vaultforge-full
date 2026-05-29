'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PainHelpPage() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  const [painDeals, setPainDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPainDeals()
  }, [])

  const fetchPainDeals = async () => {
    const { data } = await supabase
   .from('pain_deals')
   .select('*')
   .eq('status', 'active')
   .order('motivation_level', { ascending: false })
    
    setPainDeals(data || [])
    setLoading(false)
  }

  const handleArchive = async (id: number) => {
    await supabase.from('pain_deals').update({ status: 'archived' }).eq('id', id)
    setPainDeals(painDeals.filter(d => d.id!== id))
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this pain deal?')) return
    await supabase.from('pain_deals').delete().eq('id', id)
    setPainDeals(painDeals.filter(d => d.id!== id))
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-4">Loading...</div>

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-red-500">PAIN HELP</h1>
        <div className="flex gap-2">
          <button onClick={() => router.push('/vault/pain/new')} className="bg-red-600 text-white px-4 py-2 rounded font-bold text-sm">
            + NEW PAIN DEAL
          </button>
          <button onClick={() => router.push('/vault/opportunities')} className="bg-yellow-500 text-black px-4 py-2 rounded font-bold text-sm">
            DEAL ROOM
          </button>
        </div>
      </div>

      {painDeals.length === 0? (
        <div className="text-center text-zinc-500 mt-20">
          <p>No pain deals yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {painDeals.map(deal => (
            <div key={deal.id} className="bg-zinc-900 rounded border border-red-900 p-4">
              <div className="flex justify-between items-start mb-2">
                <p className="text-lg font-bold text-red-500">{deal.motivation_level}/10</p>
                {deal.facing_foreclosure && (
                  <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">FORECLOSURE</span>
                )}
              </div>
              
              <p className="text-sm text-white font-bold">{deal.address}</p>
              <p className="text-xs text-zinc-400 mb-3">{deal.city}, {deal.state}</p>
              
              {deal.seller_name && (
                <p className="text-xs text-zinc-300">Seller: {deal.seller_name}</p>
              )}
              {deal.seller_phone && (
                <p className="text-xs text-zinc-300 mb-2">Phone: {deal.seller_phone}</p>
              )}

              <div className="bg-zinc-800 p-2 rounded mb-3">
                <p className="text-xs text-zinc-400">Reason:</p>
                <p className="text-sm text-zinc-200">{deal.reason_for_selling}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <p className="text-zinc-500">Timeline</p>
                  <p className="text-white">{deal.timeline}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Wants</p>
                  <p className="text-green-500">${deal.wants_price?.toLocaleString() || 0}</p>
                </div>
                {deal.behind_on_payments && (
                  <div className="col-span-2 bg-orange-900/30 p-1 rounded">
                    <p className="text-orange-400 text-xs">⚠️ BEHIND ON PAYMENTS</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleArchive(deal.id)} className="flex-1 bg-blue-600 text-white py-2 rounded text-sm">
                  ARCHIVE
                </button>
                <button onClick={() => handleDelete(deal.id)} className="flex-1 bg-red-900 text-white py-2 rounded text-sm">
                  DELETE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
