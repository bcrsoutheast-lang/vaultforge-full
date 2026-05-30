'use client'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return router.push('/login')
      setUser(user)
    })
  }, [])

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded"></div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">VAULTFORGE</h1>
              <p className="text-xs text-zinc-500">Off-Market Intelligence Network</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400 hidden sm:block">{user?.email}</span>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 text-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-4xl font-bold mb-2">VAULT DASHBOARD</h2>
        <p className="text-zinc-400 mb-10">Live deal flow and operator network</p>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'DEAL ROOM', value: '0', color: 'from-blue-600 to-blue-400' },
            { label: 'PAIN ROOM', value: '0', color: 'from-red-600 to-red-400' },
            { label: 'MESSAGES', value: '0', color: 'from-purple-600 to-purple-400' },
            { label: 'MEMBERS', value: '1', color: 'from-emerald-600 to-emerald-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition">
              <div className={`w-10 h-1 bg-gradient-to-r ${stat.color} rounded mb-4`}></div>
              <p className="text-zinc-500 text-xs font-medium tracking-wider">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => router.push('/post-deal')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition shadow-lg shadow-blue-600/20"
          >
            + Post New Deal
          </button>
          <button 
            onClick={() => router.push('/post-pain')}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-semibold transition shadow-lg shadow-red-600/20"
          >
            + Post Pain Deal
          </button>
          <button 
            onClick={() => router.push('/directory')}
            className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-lg font-semibold transition border border-zinc-800"
          >
            Member Directory
          </button>
        </div>
      </main>
    </div>
  )
}
