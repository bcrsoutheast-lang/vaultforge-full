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
    foreclosureLeads: 0,
    unreadDeals: 0,
    unreadPain: 0,
    unreadMessages: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    
    // Realtime listener for new deals/pain
    const channel = supabase.channel('vault-alerts')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'deals' }, () => fetchStats())
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pain_deals' }, () => fetchStats())
    .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [dealsRes, painRes, hotRes, foreclosureRes, unreadDealsRes, unreadPainRes] = await Promise.all([
      supabase.from('deals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'saved'),
      supabase.from('pain_deals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
      supabase.from('pain_deals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active').gte('motivation_level', 8),
      supabase.from('pain_deals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active').eq('facing_foreclosure', true),
      supabase.from('deals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'saved').eq('is_read', false),
      supabase.from('pain_deals').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active').eq('is_read', false)
    ])

    setStats({
      totalDeals: dealsRes.count || 0,
      totalPainDeals: painRes.count || 0,
      hotLeads: hotRes.count || 0,
      foreclosureLeads: foreclosureRes.count || 0,
      unreadDeals: unreadDealsRes.count || 0,
      unreadPain: unreadPainRes.count || 0,
      unreadMessages: 0 // wire this to your messages table later
    })
    setLoading(false)
  }

  const hasAlerts = stats.unreadDeals > 0 || stats.unreadPain > 0 || stats.unreadMessages > 0

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    await Promise.all([
      supabase.from('deals').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false),
      supabase.from('pain_deals').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    ])
    fetchStats()
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-4">Loading Dashboard...</div>

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
        }
        @keyframes pulse-bg {
          0%, 100% { background-color: rgb(127, 29, 29); }
          50% { background-color: rgb(185, 28, 28); }
        }
        .pulse-alert {
          animation: pulse-glow 2s infinite, pulse-bg 2s infinite;
        }
        .pulse-dot {
          animation: pulse-glow 2s infinite;
        }
      `}</style>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-yellow-500">VAULT DASHBOARD</h1>
        {hasAlerts && (
          <button 
            onClick={markAllRead}
            className="text-xs bg-zinc-800 px-3 py-2 rounded border border-zinc-700 hover:bg-zinc-700"
          >
            MARK ALL READ
          </button>
        )}
      </div>

      {hasAlerts && (
        <div className="pulse-alert mb-6 p-4 rounded border border-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full pulse-dot"></div>
              <p className="font-bold text-white">
                NEW ACTIVITY: {stats.unreadDeals > 0 && `${stats.unreadDeals} Deal${stats.unreadDeals > 1 ? 's' : ''}`}
                {stats.unreadDeals > 0 && stats.unreadPain > 0 && ' • '}
                {stats.unreadPain > 0 && `${stats.unreadPain} Pain Lead${stats.unreadPain > 1 ? 's' : ''}`}
              </p>
            </div>
            <button onClick={markAllRead} className="text-xs bg-black/30 px-3 py-1 rounded">
              CLEAR
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 p-4 rounded border border-zinc-800 relative">
          <p className="text-zinc-400 text-xs mb-1">TOTAL DEALS</p>
          <p className="text-3xl font-bold text-white">{stats.totalDeals}</p>
          {stats.unreadDeals > 0 && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full pulse-dot flex items-center justify-center text-xs font-bold">
              {stats.unreadDeals}
            </div>
          )}
        </div>
        <div className="bg-zinc-900 p-4 rounded border border-red-900 relative">
          <p className="text-zinc-400 text-xs mb-1">PAIN DEALS</p>
          <p className="text-3xl font-bold text-red-500">{stats.totalPainDeals}</p>
          {stats.unreadPain > 0 && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full pulse-dot flex items-center justify-center text-xs font-bold">
              {stats.unreadPain}
            </div>
          )}
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
          className={`bg-zinc-900 p-6 rounded border-2 cursor-pointer hover:bg-zinc-800 transition relative ${
            stats.unreadDeals > 0 ? 'border-yellow-500 pulse-alert' : 'border-yellow-600'
          }`}
        >
          {stats.unreadDeals > 0 && (
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full pulse-dot flex items-center justify-center text-sm font-bold">
              {stats.unreadDeals}
            </div>
          )}
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
          className={`bg-zinc-900 p-6 rounded border-2 cursor-pointer hover:bg-zinc-800 transition relative ${
            stats.unreadPain > 0 ? 'border-red-500 pulse-alert' : 'border-red-600'
          }`}
        >
          {stats.unreadPain > 0 && (
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full pulse-dot flex items-center justify-center text-sm font-bold">
              {stats.unreadPain}
            </div>
          )}
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
