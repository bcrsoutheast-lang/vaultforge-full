// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState({
    totalDeals: 0,
    revenueMTD: 0,
    hotLeads: 0,
    closeRate: 0
  })
  const [pipeline, setPipeline] = useState({
    new: 0,
    contacted: 0,
    contract: 0,
    closed: 0
  })
  const [hotDeals, setHotDeals] = useState([])

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) {
        router.push('/login')
        return
      }

      // KPI: Total Deals
      const { count: totalDeals } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

      // KPI: Revenue MTD
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      const { data: revenueData } = await supabase
      .from('deals')
      .select('profit')
      .eq('user_id', user.id)
      .eq('status', 'closed')
      .gte('created_at', startOfMonth.toISOString())

      const revenueMTD = revenueData?.reduce((sum, d) => sum + (Number(d.profit) || 0), 0) || 0

      // KPI: Hot Leads = Pain Score 70+
      const { count: hotLeads } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('pain_score', 70)
      .neq('status', 'closed')

      // KPI: Close Rate
      const { count: closedDeals } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'closed')

      const closeRate = totalDeals > 0? Math.round((closedDeals / totalDeals) * 100) : 0

      setKpis({ totalDeals: totalDeals || 0, revenueMTD, hotLeads: hotLeads || 0, closeRate })

      // Pipeline counts
      const statuses = ['new', 'contacted', 'contract', 'closed']
      const pipelineCounts = {}
      for (const status of statuses) {
        const { count } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', status)
        pipelineCounts[status] = count || 0
      }
      setPipeline(pipelineCounts)

      // Hot Deals Feed
      const { data: hotDealsData } = await supabase
      .from('deals')
      .select('id, address, city, state, pain_score, seller_phone, profit')
      .eq('user_id', user.id)
      .gte('pain_score', 70)
      .neq('status', 'closed')
      .order('pain_score', { ascending: false })
      .limit(5)
      setHotDeals(hotDealsData || [])

    } catch (error) {
      console.error('Dashboard load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const KpiCard = ({ title, value, prefix = '', suffix = '', color = 'text-white' }) => (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
      <div className="text-zinc-500 text-sm font-mono uppercase tracking-wider">{title}</div>
      <div className={`text-3xl font-bold mt-2 font-mono ${color}`}>
        {prefix}{typeof value === 'number'? value.toLocaleString() : value}{suffix}
      </div>
    </div>
  )

  if (loading) return <div className="min-h-screen bg-black text-white p-4 flex items-center justify-center font-mono">LOADING INTEL...</div>

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-zinc-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">6SIGMA COMMAND</h1>
            <p className="text-zinc-500 text-sm font-mono">Welcome back, {user?.email?.split('@')[0]}</p>
          </div>
          <button
            onClick={() => router.push('/deal-room/new')}
            className="px-5 py-2.5 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-sm transition-colors"
          >
            + POST DEAL
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Total Deals" value={kpis.totalDeals} />
          <KpiCard title="Revenue MTD" value={kpis.revenueMTD} prefix="$" color="text-green-500" />
          <KpiCard title="Hot Leads" value={kpis.hotLeads} color="text-amber-500" />
          <KpiCard title="Close Rate" value={kpis.closeRate} suffix="%" color="text-blue-500" />
        </div>

        {/* Pipeline */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 font-mono uppercase tracking-wider text-zinc-400">Pipeline Status</h2>
          <div className="space-y-3">
            {Object.entries(pipeline).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between">
                <span className="text-zinc-300 capitalize font-mono">{stage}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${kpis.totalDeals > 0? (count / kpis.totalDeals) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-white font-mono font-bold w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hot Leads Feed */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold font-mono uppercase tracking-wider text-amber-500">Hot Leads - Pain Score 70+</h2>
            <button onClick={() => router.push('/opportunities')} className="text-zinc-400 hover:text-white text-sm">View All →</button>
          </div>
          {hotDeals.length === 0? (
            <div className="text-zinc-600 text-center py-8 font-mono">NO HOT LEADS. GET ON THE PHONES.</div>
          ) : (
            <div className="space-y-3">
              {hotDeals.map(deal => (
                <div key={deal.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between hover:border-amber-600 transition-colors cursor-pointer" onClick={() => router.push(`/deal-room/${deal.id}`)}>
                  <div>
                    <div className="font-semibold">{deal.address}</div>
                    <div className="text-zinc-500 text-sm font-mono">{deal.city}, {deal.state}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-500 font-bold font-mono text-xl">{deal.pain_score}</div>
                    <div className="text-zinc-500 text-xs">PAIN</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-500 font-bold font-mono">${Number(deal.profit || 0).toLocaleString()}</div>
                    <div className="text-zinc-500 text-xs">EST PROFIT</div>
                  </div>
                  {deal.seller_phone && (
                    <a href={`tel:${deal.seller_phone}`} onClick={e => e.stopPropagation()} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold">
                      CALL
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Post Deal', path: '/deal-room/new', color: 'bg-green-600 hover:bg-green-700' },
            { label: 'Add Lead', path: '/pain-intake', color: 'bg-blue-600 hover:bg-blue-700' },
            { label: 'Buyers List', path: '/buyers', color: 'bg-purple-600 hover:bg-purple-700' },
            { label: 'Messages', path: '/messages', color: 'bg-zinc-700 hover:bg-zinc-600' }
          ].map(action => (
            <button
              key={action.label}
              onClick={() => router.push(action.path)}
              className={`${action.color} rounded-xl p-6 text-left transition-colors`}
            >
              <div className="font-bold text-lg">{action.label}</div>
              <div className="text-white/70 text-sm mt-1">→</div>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
