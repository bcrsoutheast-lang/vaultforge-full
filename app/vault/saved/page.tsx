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
  image_url?: string
}

export default function SavedDeals() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [deals, setDeals] = useState<Deal[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      const { data } = await supabase.from('deals').select('*').eq('user_id', user.id).eq('status', 'saved').order('created_at', { ascending: false })
      if (data) setDeals(data)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">VAULT</h1>
          <p className="text-zinc-400 text-sm">{deals.length} ACTIVE DEALS</p>
        </div>
        <button onClick={() => router.push('/vault/new')} className="bg-zinc-800 text-blue-400 px-4 py-2 rounded text-sm font-semibold">+ NEW DEAL</button>
      </div>

      <div className="space-y-4">
        {deals.map((deal) => (
          <div key={deal.id} className="bg-zinc-900 rounded border border-zinc-800 overflow-hidden">
            {deal.image_url && (
              <img 
                src={deal.image_url} 
                alt={deal.address}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-4">
              <div className="text-2xl font-bold text-white">${deal.price?.toLocaleString()}</div>
              <div className="text-zinc-300 mt-1">{deal.address}</div>
              <div className="text-zinc-400 text-sm">{deal.city}, {deal.state}</div>
              <div className="text-zinc-400 text-sm mt-2">
                {deal.bedrooms} BD · {deal.bathrooms} BA · {deal.sqft} SQFT
              </div>
              <div className="flex gap-2 mt-4">
                <button className="border border-blue-400 text-blue-400 px-4 py-1 rounded text-sm">VIEW</button>
                <button className="border border-zinc-600 text-zinc-400 px-3 py-1 rounded text-sm">×</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
