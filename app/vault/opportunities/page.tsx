'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DealRoomPage() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDeals()
  }, [])

  const fetchDeals = async () => {
    const { data } = await supabase
   .from('deals')
   .select('*')
   .eq('status', 'saved')
   .order('created_at', { ascending: false })
    
    setDeals(data || [])
    setLoading(false)
  }

  const handleArchive = async (dealId: number) => {
    await supabase.from('deals').update({ status: 'archive' }).eq('id', dealId)
    setDeals(deals.filter(d => d.id!== dealId))
  }

  const handleDelete = async (dealId: number) => {
    if (!confirm('Delete this deal?')) return
    await supabase.from('deals').update({ status: 'deleted' }).eq('id', dealId)
    setDeals(deals.filter(d => d.id!== dealId))
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-4">Loading...</div>

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-yellow-500">DEAL OPPORTUNITIES</h1>
        <div className="flex gap-2">
          <button onClick={() => router.push('/vault/new')} className="bg-yellow-500 text-black px-4 py-2 rounded font-bold text-sm">
            + NEW DEAL
          </button>
          <button onClick={() => router.push('/vault/pain')} className="bg-red-600 text-white px-4 py-2 rounded font-bold text-sm">
            PAIN ROOM
          </button>
        </div>
      </div>

      {deals.length === 0? (
        <div className="text-center text-zinc-500 mt-20">
          <p>No deals yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map(deal => (
            <div key={deal.id} className="bg-zinc-900 rounded border border-zinc-800 p-4">
              <img 
                src={deal.image_urls?.[0] || 'https://via.placeholder.com/400x200/333/666?text=No+Image'} 
                alt="Deal"
                className="w-full h-40 object-cover rounded mb-3"
              />
              <p className="text-xl font-bold text-green-500">${deal.price?.toLocaleString()}</p>
              <p className="text-sm text-white truncate">{deal.address}</p>
              <p className="text-xs text-zinc-400 mb-3">{deal.city}, {deal.state}</p>
              
              <div className="flex gap-2 text-xs text-zinc-400 mb-3">
                <span>{deal.bedrooms}bd</span>
                <span>{deal.bathrooms}ba</span>
                <span>{deal.sqft?.toLocaleString()} sqft</span>
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
