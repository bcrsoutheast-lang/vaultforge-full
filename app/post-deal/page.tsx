'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PostDeal() {
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [arv, setArv] = useState('')
  const [profit, setProfit] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('deals').insert({
      user_id: user.id,
      address, city, state, arv, profit
    })

    if (!error) router.push(`/profile/${user.id}`)
    setLoading(false)
  }

  const inputClass = "w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white text-sm focus:border-red-500 outline-none"

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Post Deal</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} className={inputClass} required />
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="City" value={city} onChange={e => setCity(e.target.value)} className={inputClass} required />
            <input type="text" placeholder="State" value={state} onChange={e => setState(e.target.value)} className={inputClass} required />
          </div>
          <input type="text" placeholder="ARV" value={arv} onChange={e => setArv(e.target.value)} className={inputClass} required />
          <input type="text" placeholder="Profit" value={profit} onChange={e => setProfit(e.target.value)} className={inputClass} required />
          <button type="submit" disabled={loading} className="w-full py-3 bg-red-600 hover:bg-red-700 border border-red-500 text-white font-bold uppercase disabled:opacity-50">
            {loading ? 'Posting...' : 'Post Deal'}
          </button>
        </form>
      </div>
    </div>
  )
}
