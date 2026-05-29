'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VaultDashboard() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  const [stats, setStats] = useState({
    totalDeals: 0,
    totalPainDeals: 0,
    hotLeads: 0,
    foreclosureLeads: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [dealsRes, painRes, hotRes, foreclosureRes] = await Promise.all([
      supabase.from('deals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'saved'),
      supabase.from('pain_deals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
      supabase.from('pain_deals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active').gte('motivation_level', 8),
      supabase.from('pain_deals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active').eq('facing_foreclosure', true)
    ])

    setStats({
      totalDeals: dealsRes.count || 0,
      totalPainDeals: painRes.count || 0,
      hotLeads: hotRes.count || 0,
      foreclosureLeads: foreclosureRes.count || 0
    })
    setLoading(false)
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-4">Loading Dashboard...</div>

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <h1 className="text-3xl font-bold text-yellow-500 mb-8">VAULT DASHBOARD</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
          <p className="text-zinc-400 text-xs mb-1">TOTAL DEALS</p>
          <p className="text-3xl font-bold text-white">{stats.totalDeals}</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded border border-red-900">
          <p className="text-zinc-400 text-xs mb-1">PAIN DEALS</p>
          <p className="text-3xl font-bold text-red-500">{stats.totalPainDeals}</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded border border-orange-900">
          <p className="text-zinc-400 text-xs mb-1">HOT LEADS 8+</p>
          <p className="text-3xl font-bold text-orange-500">{stats.hotLeads}</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded border border-red-900">
          <p className="text-zinc-400 text-xs mb-1">FORECLOSURE</p>
          <p className="text-3xl font-bold text-red-600">{stats.foreclosureLeads}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          onClick={() => router.push('/vault/opportunities')}
          className="bg-zinc-900 p-6 rounded border border-yellow-600 cursor-pointer hover:bg-zinc-800 transition"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-yellow-500">DEAL OPPORTUNITIES</h2>
              <p className="text-zinc-400 text-sm mt-1">Regular property deals</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
          <p className="text-3xl font-bold text-white mb-4">{stats.totalDeals} Active</p>
          <button className="w-full bg-yellow-500 text-black font-bold py-3 rounded">
            ENTER DEAL ROOM
          </button>
        </div>

        <div 
          onClick={() => router.push('/vault/pain')}
          className="bg-zinc-900 p-6 rounded border border-red-600 cursor-pointer hover:bg-zinc-800 transition"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-red-500">PAIN HELP</h2>
              <p className="text-zinc-400 text-sm mt-1">Motivated seller leads</p>
            </div>
            <div className="text-4xl">🔥</div>
          </div>
          <p className="text-3xl font-bold text-white mb-4">{stats.totalPainDeals} Active</p>
          <button className="w-full bg-red-600 text-white font-bold py-3 rounded">
            ENTER PAIN ROOM
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <button 
          onClick={() => router.push('/vault/new')}
          className="bg-zinc-800 border border-zinc-700 text-white font-bold py-4 rounded hover:bg-zinc-700"
        >
          + ADD NEW DEAL
        </button>
        <button 
          onClick={() => router.push('/vault/pain/new')}
          className="bg-zinc-800 border border-red-900 text-red-500 font-bold py-4 rounded hover:bg-zinc-700"
        >
          + ADD NEW PAIN DEAL
        </button>
      </div>
    </div>
  )
}
