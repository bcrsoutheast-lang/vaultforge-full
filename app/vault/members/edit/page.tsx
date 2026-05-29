'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EditMemberProfile() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    state_from: '',
    bio: '',
    avatar_url: '',
    deals_closed: 0
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
     .from('vault_members')
     .select('*')
     .eq('id', user.id)
     .single()

    if (error || !data) {
      setMessage('Profile not found. Complete onboarding first.')
      setTimeout(() => router.push('/vault/members/onboard'), 2000)
      return
    }

    setForm({
      full_name: data.full_name || '',
      phone: data.phone || '',
      city: data.city || '',
      state_from: data.state_from || '',
      bio: data.bio || '',
      avatar_url: data.avatar_url || '',
      deals_closed: data.deals_closed || 0
    })
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
     .from('vault_members')
     .update({
       full_name: form.full_name,
       phone: form.phone,
       city: form.city,
       state_from: form.state_from,
       bio: form.bio,
       avatar_url: form.avatar_url,
       deals_closed: form.deals_closed
     })
     .eq('id', user.id)

    if (error) {
      setMessage(`Error: ${error.message}`)
      setSaving(false)
      return
    }

    setMessage('Profile updated!')
    setTimeout(() => router.push('/vault/members'), 1500)
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-4">Loading profile...</div>

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-yellow-500">EDIT MEMBER PROFILE</h1>
          <button onClick={() => router.push('/vault/members')} className="text-zinc-400 text-sm">
            ← Directory
          </button>
        </div>

        <form onSubmit={handleSave} className="bg-zinc-900 p-6 rounded border border-zinc-800 space-y-4">
          <div>
            <label className="text-sm text-zinc-400">Full Name *</label>
            <input
              value={form.full_name}
              onChange={e => setForm({...form, full_name: e.target.value})}
              required
              className="w-full bg-zinc-800 p-3 rounded border border-zinc-700 mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400">City</label>
              <input
                value={form.city}
                onChange={e => setForm({...form, city: e.target.value})}
                className="w-full bg-zinc-800 p-3 rounded border border-zinc-700 mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400">State FROM *</label>
              <input
                value={form.state_from}
                onChange={e => setForm({...form, state_from: e.target.value.toUpperCase()})}
                required
                maxLength={2}
                placeholder="GA"
                className="w-full bg-zinc-800 p-3 rounded border border-zinc-700 mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-zinc-400">Phone</label>
            <input
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              placeholder="(555) 555-5555"
              className="w-full bg-zinc-800 p-3 rounded border border-zinc-700 mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400">Avatar URL</label>
            <input
              value={form.avatar_url}
              onChange={e => setForm({...form, avatar_url: e.target.value})}
              placeholder="https://..."
              className="w-full bg-zinc-800 p-3 rounded border border-zinc-700 mt-1"
            />
            {form.avatar_url && (
              <img src={form.avatar_url} alt="Preview" className="w-16 h-16 rounded-full mt-2 object-cover" />
            )}
          </div>

          <div>
            <label className="text-sm text-zinc-400">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm({...form, bio: e.target.value})}
              rows={3}
              placeholder="Real estate investor, wholesaler, hard money lender..."
              className="w-full bg-zinc-800 p-3 rounded border border-zinc-700 mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400">Deals Closed</label>
            <input
              type="number"
              value={form.deals_closed}
              onChange={e => setForm({...form, deals_closed: Number(e.target.value)})}
              min={0}
              className="w-full bg-zinc-800 p-3 rounded border border-zinc-700 mt-1"
            />
          </div>

          {message && (
            <div className={`p-3 rounded text-sm ${message.includes('Error')? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-yellow-500 text-black font-bold py-3 rounded disabled:opacity-50"
          >
            {saving? 'SAVING...' : 'SAVE PROFILE'}
          </button>
        </form>
      </div>
    </div>
  )
}
