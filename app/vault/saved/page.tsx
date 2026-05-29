'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SavedDealsPage() {
  const [deals, setDeals] = useState<any[]>([])
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    const getDeals = async () => {
      const { data } = await supabase.from('deals').select('*').eq('status', 'active').order('created_at', { ascending: false })
      setDeals(data || [])
    }
    getDeals()
  }, [])

  return (
    <div className="bg-black min-h-screen text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center border-b border-yellow-500/30 pb-4 mb-8">
          <h1 className="text-yellow-500 text-2xl font-bold">SAVED DEALS</h1>
          <Link href="/vault/new" className="bg-yellow-500 text-black px-6 py-2 text-sm font-bold">+ ADD DEAL</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {deals.map(deal => (
            <div key={deal.id} className="bg-zinc-900 border border-zinc-800">
              <div className="h-48 bg-zinc-800 relative">
                {deal.card_image_url ? (
                  <img src={deal.card_image_url} alt={deal.address} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">🏠</div>
                )}
                <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 text-xs text-yellow-500">{deal.property_type}</div>
                {deal.ai_analysis?.score && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 text-xs font-bold">
                    SCORE: {deal.ai_analysis.score}
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-yellow-500 text-2xl">${deal.price?.toLocaleString()}</p>
                <p className="text-zinc-300">{deal.city}, {deal.state}</p>
                <p className="text-zinc-500 text-sm mt-2">{deal.bedrooms} BD {deal.bathrooms} BA {deal.sqft} SQFT</p>
                <div className="flex gap-2 mt-4">
                  <Link href={`/vault/deal/${deal.id}`} className="flex-1 border border-yellow-500 text-yellow-500 py-2 text-center text-sm">VIEW</Link>
                  <button className="flex-1 border border-zinc-700 py-2 text-sm">MESSAGE OWNER</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
