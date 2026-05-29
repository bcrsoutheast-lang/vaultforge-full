'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Deal = {
  id: string
  address: string
  city: string
  state: string
  price: number
  bedrooms: number
  bathrooms: number
  sqft: number
  property_type: string
  card_image_url: string | null
  photos: string[] | null
  ai_analysis: any
  exit_strategy: string | null
  owner_contact: string | null
  notes: string | null
  created_at: string
}

export default function SavedDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadDeals()
  }, [])

  const loadDeals = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
     .from('deals')
     .select('*')
     .eq('user_id', user.id)
     .order('created_at', { ascending: false })

    if (!error && data) setDeals(data as Deal[])
    setLoading(false)
  }

  const deleteDeal = async (id: string) => {
    if (!confirm('Delete this deal from vault?')) return
    await supabase.from('deals').delete().eq('id', id)
    loadDeals()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-yellow-500">LOADING VAULT...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-yellow-500/20 sticky top-0 bg-black/95 backdrop-blur z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-yellow-500 tracking-wider">VAULT</h1>
            <p className="text-xs text-zinc-500">{deals.length} ACTIVE DEALS</p>
          </div>
          <button
            onClick={() => router.push('/vault/new')}
            className="bg-yellow-500 text-black px-6 py-2.5 font-bold text-sm hover:bg-yellow-400 transition"
          >
            + NEW DEAL
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {deals.length === 0? (
          <div className="text-center py-20 border border-zinc-800 rounded">
            <p className="text-zinc-600 mb-4">VAULT IS EMPTY</p>
            <button
              onClick={() => router.push('/vault/new')}
              className="text-yellow-500 border border-yellow-500 px-6 py-2 text-sm"
            >
              ADD FIRST DEAL
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => {
              const imageUrl = deal.card_image_url || deal.photos?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'
              const score = deal.ai_analysis?.score || 0
              const arv = deal.ai_analysis?.estimated_arv || 0

              return (
                <div
                  key={deal.id}
                  className="group relative bg-zinc-950 border border-zinc-800 hover:border-yellow-500/50 transition-all duration-300 overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden bg-zinc-900">
                    <img
                      src={imageUrl}
                      alt={deal.address}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Score Badge */}
                    {score > 0 && (
                      <div className="absolute top-3 right-3 bg-black/90 border border-yellow-500 px-3 py-1.5">
                        <p className="text-[10px] text-zinc-500 leading-none">SCORE</p>
                        <p className="text-xl font-bold text-yellow-500 leading-none">{score}</p>
                      </div>
                    )}
                    {/* Property Type */}
                    <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1">
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{deal.property_type}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Price */}
                    <div className="flex items-baseline justify-between mb-3">
                      <p className="text-2xl font-bold text-white">
                        ${deal.price?.toLocaleString() || '0'}
                      </p>
                      {arv > 0 && (
                        <p className="text-xs text-zinc-500">
                          ARV: <span className="text-zinc-300">${arv.toLocaleString()}</span>
                        </p>
                      )}
                    </div>

                    {/* Address */}
                    <p className="text-sm text-zinc-300 mb-1 truncate">{deal.address}</p>
                    <p className="text-xs text-zinc-600 mb-4">
                      {deal.city}, {deal.state}
                    </p>

                    {/* Specs */}
                    <div className="flex items-center gap-4 text-xs text-zinc-500 border-t border-zinc-900 pt-3 mb-4">
                      <span>{deal.bedrooms || 0} BD</span>
                      <span>•</span>
                      <span>{deal.bathrooms || 0} BA</span>
                      <span>•</span>
                      <span>{deal.sqft?.toLocaleString() || 0} SQFT</span>
                    </div>

                    {/* AI Summary */}
                    {deal.ai_analysis?.summary && (
                      <p className="text-xs text-zinc-600 italic mb-4 line-clamp-2">
                        "{deal.ai_analysis.summary}"
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/vault/deal/${deal.id}`)}
                        className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs py-2.5 transition"
                      >
                        VIEW
                      </button>
                      {deal.owner_contact && (
                        <button
                          onClick={() => window.open(`tel:${deal.owner_contact}`)}
                          className="flex-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-500 text-xs py-2.5 transition"
                        >
                          MESSAGE OWNER
                        </button>
                      )}
                      <button
                        onClick={() => deleteDeal(deal.id)}
                        className="px-3 bg-zinc-900 hover:bg-red-950 border border-zinc-800 hover:border-red-900 text-zinc-600 hover:text-red-500 transition"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
