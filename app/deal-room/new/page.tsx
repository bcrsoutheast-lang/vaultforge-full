'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function NewDealPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    arv: '',
    profit: '',
  })

  const inputClass = "w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"

  const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('You must be logged in')
      setLoading(false)
      return
    }

    // @ts-ignore
    const { error } = await supabase
      .from('deals')
      .insert({
        user_id: user.id,
        address: form.address,
        city: form.city,
        state: form.state,
        arv: Number(form.arv),
        profit: Number(form.profit),
      })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    router.push('/deal-room')
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Post New Deal</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input placeholder="Property Address" type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={inputClass} required />
          <input placeholder="City" type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className={inputClass} required />
          <select value={form.state} onChange={e => setForm({...form, state: e.target.value})} className={inputClass} required>
            <option value="">Select State</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input placeholder="ARV" type="number" value={form.arv} onChange={e => setForm({...form, arv: e.target.value})} className={inputClass} required />
          <input placeholder="Estimated Profit" type="number" value={form.profit} onChange={e => setForm({...form, profit: e.target.value})} className={inputClass} required />
          <div className="pt-4 flex gap-2">
            <button type="button" onClick={() => router.back()} className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded text-white">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded text-white disabled:opacity-50">{loading ? 'Posting...' : 'Post Deal'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
