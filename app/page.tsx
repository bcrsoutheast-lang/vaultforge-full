'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CommandCenter() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [counts, setCounts] = useState({ saved: 0, archive: 0, bin: 0 })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      const { data } = await supabase.from('deals').select('status').eq('user_id', user.id)
      if (data) {
        setCounts({
          saved: data.filter(d => d.status === 'saved').length,
          archive: data.filter(d => d.status === 'archive').length,
          bin: data.filter(d => d.status === 'bin').length
        })
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-yellow-500">COMMAND CENTER</h1>
          <p className="text-zinc-400 text-sm">PRIVATE INVESTOR ARCHITECTURE</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="border border-red-500 text-red-500 px-4 py-2 text-sm">EXIT VAULT</button>
      </div>

      <div className="space-y-4 mb-8">
        <div onClick={() => router.push('/vault/saved')} className="border border-yellow-500 p-8 text-center cursor-pointer">
          <div className="text-5xl font-bold text-yellow-500">{counts.saved}</div>
          <div className="text-zinc-300 mt-2">SAVED DEALS</div>
        </div>
        <div className="border border-yellow-500 p-8 text-center">
          <div className="text-5xl font-bold text-yellow-500">{counts.archive}</div>
          <div className="text-zinc-300 mt-2">DEAL ARCHIVE</div>
        </div>
        <div className="border border-yellow-500 p-8 text-center">
          <div className="text-5xl font-bold text-yellow-500">{counts.bin}</div>
          <div className="text-zinc-300 mt-2">RECYCLE BIN</div>
        </div>
      </div>

      <button onClick={() => router.push('/vault/new')} className="w-full bg-yellow-500 text-black font-bold p-4 text-lg">
        + ADD DEAL
      </button>
    </div>
  )
}
