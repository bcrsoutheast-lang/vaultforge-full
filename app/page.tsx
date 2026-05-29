'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function CommandCenter() {
  const [counts, setCounts] = useState({opportunity: 0, saved: 0, archive: 0, deleted: 0})
  const [user, setUser] = useState<any>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      setUser(user)
      
      const { data } = await supabase.from('deals').select('status')
      if (data) {
        const c = {opportunity: 0, saved: 0, archive: 0, deleted: 0}
        data.forEach(d => c[d.status as keyof typeof c]++)
        setCounts(c)
      }
    }
    getData()
  }, [])

  const tiles = [
    {title: 'DEAL OPPORTUNITY ROOM', count: counts.opportunity, path: '/vault/opportunity', color: 'border-amber-500'},
    {title: 'SAVED DEALS', count: counts.saved, path: '/vault/saved', color: 'border-green-500'},
    {title: 'DEAL ARCHIVE', count: counts.archive, path: '/vault/archive', color: 'border-blue-500'},
    {title: 'RECYCLE BIN', count: counts.deleted, path: '/vault/bin', color: 'border-red-500'},
  ]

  return (
    <div className="min-h-screen bg-black text-amber-400 font-mono p-4">
      <header className="flex justify-between items-center border-b border-amber-900 pb-4 mb-6">
        <div>
          <h1 className="text-2xl tracking-widest">VAULTFORGE COMMAND CENTER</h1>
          <p className="text-xs text-amber-600">CLASSIFIED ACCESS: {user?.email}</p>
        </div>
        <Image src="/IMG_4751.png" alt="VaultForge" width={80} height={80} className="opacity-90" />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {tiles.map(t => (
          <button key={t.title} onClick={() => router.push(t.path)} 
            className={`bg-zinc-900 border ${t.color} p-6 text-left hover:bg-zinc-800 transition-all`}>
            <div className="text-4xl font-bold">{t.count}</div>
            <div className="text-sm tracking-wider mt-2">{t.title}</div>
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        <button onClick={() => router.push('/vault/new')} 
          className="bg-amber-600 text-black px-6 py-3 font-bold tracking-wider hover:bg-amber-500">
          + ADD DEAL
        </button>
        <button onClick={() => supabase.auth.signOut()} 
          className="border border-red-700 text-red-500 px-6 py-3 font-bold tracking-wider hover:bg-red-950">
          EXIT VAULT
        </button>
      </div>

      <div className="mt-8 text-xs text-zinc-600 border-t border-zinc-800 pt-4">
        FORTIFY YOUR PORTFOLIO. VETERAN PRIDE. DISCIPLINE. STRATEGY. RESULTS.
      </div>
    </div>
  )
}
