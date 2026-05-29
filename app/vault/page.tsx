'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Deal = {
  id: string
  address: string
  price: number
  status: string
  bedrooms: number
  bathrooms: number
}

export default function VaultDashboard() {
  const [user, setUser] = useState<any>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [stats, setStats] = useState({ saved: 0, archived: 0, recycled: 0 })
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      const { data: dealData } = await supabase
        .from('deals')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6)
      
      if (dealData) setDeals(dealData)
      
      const { count: savedCount } = await supabase.from('deals').select('*', { count: 'exact', head: true }).eq('status', 'active')
      const { count: archiveCount } = await supabase.from('deals').select('*', { count: 'exact', head: true }).eq('status', 'archived')
      setStats({ saved: savedCount || 0, archived: archiveCount || 0, recycled: 0 })
    }
    loadData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="border-b border-yellow-500/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-500" />
            <div>
              <h1 className="text-yellow-500 text-lg font-bold tracking-wider">COMMAND CENTER</h1>
              <p className="text-zinc-500 text-xs">PRIVATE INVESTOR ARCHITECTURE</p>
            </div>
          </div>
          <button onClick={handleLogout} className="border border-red-500 text-red-500 px-4 py-2 text-xs hover:bg-red-500/10">
            EXIT VAULT
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Link href="/vault/saved" className="border border-yellow-500 p-8 text-center hover:bg-yellow-500/5 transition">
            <p className="text-5xl text-yellow-500 font-light mb-2">{stats.saved}</p>
            <p className="text-zinc-400 text-xs tracking-widest">SAVED DEALS</p>
          </Link>
          <Link href="/vault/archive" className="border border-yellow-500 p-8 text-center hover:bg-yellow-500/5 transition">
            <p className="text-5xl text-yellow-500 font-light mb-2">{stats.archived}</p>
            <p className="text-zinc-400 text-xs tracking-widest">DEAL ARCHIVE</p>
          </Link>
          <div className="border border-yellow-500 p-8 text-center">
            <p className="text-5xl text-yellow-500 font-light mb-2">{stats.recycled}</p>
            <p className="text-zinc-400 text-xs tracking-widest">RECYCLE BIN</p>
          </div>
        </div>

        {/* Deal Cards - The "pain cards" you wanted */}
        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-xl text-yellow-500 tracking-wider">ACTIVE DEALS</h3>
          <Link href="/vault/new" className="bg-yellow-500 text-black px-6 py-2 text-sm font-bold hover:bg-yellow-400">
            + ADD DEAL
          </Link>
        </div>
        
        {deals.length === 0 ? (
          <div className="border border-zinc-800 p-12 text-center">
            <p className="text-zinc-500">NO DEALS IN VAULT. ADD ONE.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {deals.map(deal => (
              <div key={deal.id} className="bg-zinc-900 border border-zinc-800 overflow-hidden group hover:border-yellow-500/50 transition">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-light">{deal.address || 'New Deal'}</h4>
                    <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1">{deal.status?.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-6">
                    <div>
                      <p className="text-zinc-500 text-xs">PRICE</p>
                      <p className="text-yellow-500">${deal.price?.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-500 text-xs">BDS / BA</p>
                      <p className="text-white">{deal.bedrooms} / {deal.bathrooms}</p>
                    </div>
                  </div>
                  <button className="w-full border border-yellow-500 text-yellow-500 py-3 text-sm hover:bg-yellow-500 hover:text-black transition">
                    VIEW DEAL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
