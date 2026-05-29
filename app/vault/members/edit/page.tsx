'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const ALL_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
]

const SPECIALTIES = [
  'Hard Money','DSCR Loans','Sub-To','Novation','Probate','Liens','Foreclosure','Tax Deeds',
  'Contractor Financing','Title Issues','Wholesaling','Fix & Flip','Buy & Hold','Creative Finance'
]

type MemberData = {
  full_name: string
  email: string
  phone: string
  state_from: string
  states_operated: string[]
  city: string
  bio: string
  specialties: string[]
  avatar_url: string | null
}

export default function MemberProfileForm() {
  const router = useRouter()
  const pathname = usePathname()
  const isOnboarding = pathname.includes('/onboard')
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState<MemberData>({
    full_name: '',
    email: '',
    phone: '',
    state_from: 'GA',
    states_operated: ['GA'],
    city: '',
    bio: '',
    specialties: [],
    avatar_url: null
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUserId(user.id)

    const { data } = await supabase
     .from('vault_members')
     .select('*')
     .eq('id', user.id)
     .single()

    if (data) {
      setForm({
        full_name: data.full_name || '',
        email: data.email || user.email || '',
        phone: data.phone || '',
        state_from: data.state_from || 'GA',
        states_operated: data.states_operated || ['GA'],
        city: data.city || '',
        bio: data.bio || '',
        specialties: data.specialties || [],
        avatar_url: data.avatar_url
      })
    } else {
      setForm(prev => ({...prev, email: user.email || '' }))
    }
    setLoading(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file ||!userId) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
     .from('vault')
     .upload(filePath, file, { upsert: true })

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage
     .from('vault')
     .getPublicUrl(filePath)

    setForm(prev => ({...prev, avatar_url: data.publicUrl }))
    setUploading(false)
  }

  const toggleState = (state: string) => {
    setForm(prev => ({
     ...prev,
      states_operated: prev.states_operated.includes(state)
       ? prev.states_operated.filter(s => s!== state)
        : [...prev.states_operated, state]
    }))
  }

  const toggleSpecialty = (spec: string) => {
    setForm(prev => ({
     ...prev,
      specialties: prev.specialties.includes(spec)
       ? prev.specialties.filter(s => s!== spec)
        : [...prev.specialties, spec]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId ||!form.full_name ||!form.email || form.states_operated.length === 0) {
      alert('Name, email, and at least 1 operating state are required')
      return
    }

    setSaving(true)
    
    const { error } = await supabase
     .from('vault_members')
     .upsert({
        id: userId,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        state_from: form.state_from,
        states_operated: form.states_operated,
        city: form.city || null,
        bio: form.bio || null,
        specialties: form.specialties,
        avatar_url: form.avatar_url
      })

    if (error) {
      alert('Save failed: ' + error.message)
      setSaving(false)
      return
    }

    router.push('/vault/members')
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-4">Loading...</div>

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-yellow-500">
            {isOnboarding? 'JOIN DIRECTORY' : 'EDIT PROFILE'}
          </h1>
          <button onClick={() => router.back()} className="text-zinc-400 text-sm">
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center">
            <img
              src={form.avatar_url || 'https://via.placeholder.com/120/333/666?text=Upload'}
              alt="Avatar"
              className="w-32 h-32 rounded-full object-cover border-2 border-zinc-700"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-3 bg-zinc-800 text-white px-4 py-2 rounded text-sm hover:bg-zinc-700 disabled:text-zinc-500"
            >
              {uploading? 'Uploading...' : 'Change Photo'}
            </button>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Full Name *</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm(prev => ({...prev, full_name: e.target.value }))}
              className="w-full bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm(prev => ({...prev, email: e.target.value }))}
              className="w-full bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm(prev => ({...prev, phone: e.target.value }))}
              className="w-full bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(555) 555-5555"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Home State</label>
              <select
                value={form.state_from}
                onChange={(e) => setForm(prev => ({...prev, state_from: e.target.value }))}
                className="w-full bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ALL_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm(prev => ({...prev, city: e.target.value }))}
                className="w-full bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Atlanta"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">States You Actively Invest In *</label>
            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto bg-zinc-900 p-3 rounded border border-zinc-800">
              {ALL_STATES.map(state => (
                <label key={state} className="flex items-center gap-1 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.states_operated.includes(state)}
                    onChange={() => toggleState(state)}
                    className="w-4 h-4"
                  />
                  {state}
                </label>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-1">This controls which deals you see and who gets matched to you</p>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Specialties</label>
            <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-3 rounded border border-zinc-800">
              {SPECIALTIES.map(spec => (
                <label key={spec} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.specialties.includes(spec)}
                    onChange={() => toggleSpecialty(spec)}
                    className="w-4 h-4"
                  />
                  {spec}
                </label>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-1">Smart AI uses this to route deals to you</p>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm(prev => ({...prev, bio: e.target.value }))}
              rows={4}
              className="w-full bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Investor, hard money broker, looking for off-market deals..."
            />
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500"
          >
            {saving? 'Saving...' : isOnboarding? 'Join Directory' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
