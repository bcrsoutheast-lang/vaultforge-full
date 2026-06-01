'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [filter, setFilter] = useState('ALL')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchDeals()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
  }

  const fetchDeals = async () => {
    const { data } = await supabase
      .from('deals')
      .select('*')
      .order('dqi_score', { ascending: false })
      .limit(100)
    
    if (data) setDeals(data)
    setLoading(false)
  }

  const filteredDeals = deals.filter(d => {
    if (filter === 'PAIN') return d.bps_score >= 50
    if (filter === 'INSTITUTIONAL') return d.dqi_score >= 90
    return true
  })

  if (loading) return <div className="bg-black text-white min-h-screen p-8">LOADING INTEL...</div>

  return (
    <div className="bg-black text-white min-h-screen p-8 font-mono">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">DEALS GRID // {filteredDeals.length} LIVE</h1>
        <div className="flex gap-2">
          <button onClick={() => setFilter('ALL')} className={`px-4 py-2 text-xs border ${filter === 'ALL' ? 'bg-white text-black' : 'border-zinc-700'}`}>ALL</button>
          <button onClick={() => setFilter('PAIN')} className={`px-4 py-2 text-xs border ${filter === 'PAIN' ? 'bg-orange-600 text-black' : 'border-zinc-700'}`}>HIGH MOTIVATION</button>
          <button onClick={() => setFilter('INSTITUTIONAL')} className={`px-4 py-2 text-xs border ${filter === 'INSTITUTIONAL' ? 'bg-blue-600 text-black' : 'border-zinc-700'}`}>DQI 90+</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDeals.map(deal => (
          <div key={deal.id} className="bg-zinc-900 border border-zinc-800 p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs text-gray-400">{deal.state}</div>
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-1 ${deal.dqi_score >= 90 ? 'bg-blue-600' : 'bg-zinc-700'}`}>
                  DQI {deal.dqi_score}
                </span>
                {deal.bps_score >= 50 && (
                  <span className="text-xs px-2 py-1 bg-orange-600">
                    BPS {deal.bps_score}
                  </span>
                )}
              </div>
            </div>
            <div className="text-lg font-bold mb-2">ARV ${deal.arv?.toLocaleString()}</div>
            <div className="text-sm text-gray-400 mb-4">ASK ${deal.asking_price?.toLocaleString()}</div>
            <div className="flex gap-1 mb-4">
              {deal.pain_flags?.slice(0,3).map((flag: string) => (
                <span key={flag} className="text-xs bg-zinc-800 px-2 py-1">{flag}</span>
              ))}
            </div>
            <div className="text-xs text-gray-600">{deal.beds}BD / {deal.baths}BA / {deal.sqft}SQFT</div>
          </div>
        ))}
      </div>
      {filteredDeals.length === 0 && (
        <div className="text-center text-gray-600 py-20">NO DEALS MATCH FILTER // AWAITING INTEL</div>
      )}
    </div>
  )
}
