'use client'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({ deals: 0, pain: 0, members: 0 })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      setUser(user)
      
      // Get counts for stats
      const { count: deals } = await supabase.from('deals').select('*', { count: 'exact', head: true })
      const { count: members } = await supabase.from('vault_members').select('*', { count: 'exact', head: true })
      setStats({ deals: deals || 0, pain: 0, members: members || 0 })
    }
    getUser()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">VAULTFORGE</h1>
            <p className="text-sm text-zinc-400">Private Deal Network</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-300">{user?.email}</span>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-md transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">VAULT DASHBOARD</h2>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <p className="text-zinc-400 text-sm">DEAL ROOM</p>
            <p className="text-3xl font-bold mt-2">{stats.deals}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <p className="text-zinc-400 text-sm">PAIN ROOM</p>
            <p className="text-3xl font-bold mt-2">{stats.pain}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <p className="text-zinc-400 text-sm">MESSAGES</p>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <p className="text-zinc-400 text-sm">MEMBERS</p>
            <p className="text-3xl font-bold mt-2">{stats.members}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => router.push('/post-deal')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-md font-medium transition"
          >
            + ADD NEW DEAL
          </button>
          <button 
            onClick={() => router.push('/post-pain')}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-md font-medium transition"
          >
            + ADD PAIN DEAL
          </button>
          <button 
            onClick={() => router.push('/directory')}
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-md font-medium transition border border-zinc-700"
          >
            MEMBER DIRECTORY
          </button>
        </div>
      </div>
    </div>
  )
}
