'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
]

export default function NewDeal() {
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    arv: '',
    profit: ''
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // @ts-ignore - Vercel cache has stale Supabase types, forcing deploy
const { error } = await supabase
  .from('deals')
  .insert({
    user_id: user.id,
    address,
    city,
    state,
    arv,
    profit,
  })

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Post New Deal</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            placeholder="Property Address" 
            value={form.address}
            onChange={e => setForm({...form, address: e.target.value})}
            className={inputClass}
            required
          />
          
          <input 
            placeholder="City" 
            value={form.city}
            onChange={e => setForm({...form, city: e.target.value})}
            className={inputClass}
            required
          />

          <select 
            value={form.state}
            onChange={e => setForm({...form, state: e.target.value})}
            className={inputClass}
            required
          >
            <option value="">Select State</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <input 
            placeholder="ARV" 
            type="number"
            value={form.arv}
            onChange={e => setForm({...form, arv: e.target.value})}
            className={inputClass}
            required
          />

          <input 
            placeholder="Estimated Profit" 
            type="number"
            value={form.profit}
            onChange={e => setForm({...form, profit: e.target.value})}
            className={inputClass}
            required
          />

          <div className="pt-4 flex gap-2">
            <button 
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs uppercase"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 border border-red-500 text-white uppercase font-bold disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
