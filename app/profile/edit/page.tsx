'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
]

export default function EditProfile() {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    role: 'INVESTOR',
    city: '',
    state: '',
    bio: ''
  })
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setForm({
            full_name: data.full_name || '',
            phone: data.phone || '',
            role: data.role || 'INVESTOR',
            city: data.city || '',
            state: data.state || '',
            bio: data.bio || ''
          })
        }
      }
    }
    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update(form)
      .eq('id', user.id)

    setLoading(false)
    if (!error) router.push(`/profile/${user.id}`)
  }

  const inputClass = "w-full p-3 bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 outline-none"

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            placeholder="Full Name" 
            value={form.full_name}
            onChange={e => setForm({...form, full_name: e.target.value})}
            className={inputClass}
            required
          />
          
          <input 
            placeholder="Phone Number" 
            value={form.phone}
            onChange={e => setForm({...form, phone: e.target.value})}
            className={inputClass}
          />

          <select 
            value={form.role}
            onChange={e => setForm({...form, role: e.target.value})}
            className={inputClass}
          >
            <option value="INVESTOR">Investor</option>
            <option value="WHOLESALER">Wholesaler</option>
            <option value="AGENT">Agent</option>
            <option value="LENDER">Lender</option>
            <option value="CONTRACTOR">Contractor</option>
          </select>

          <input 
            placeholder="City" 
            value={form.city}
            onChange={e => setForm({...form, city: e.target.value})}
            className={inputClass}
          />

          <select 
            value={form.state}
            onChange={e => setForm({...form, state: e.target.value})}
            className={inputClass}
          >
            <option value="">Select State</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <textarea 
            placeholder="Bio" 
            value={form.bio}
            onChange={e => setForm({...form, bio: e.target.value})}
            className={inputClass}
            rows={4}
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
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
