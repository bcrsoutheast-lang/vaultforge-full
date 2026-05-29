'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const SPECIALTIES = ['Wholesale','Fix & Flip','Buy & Hold','Probate','Tax Liens','Foreclosure','Title Issues','DSCR Loans','Hard Money','Note Buying','Commercial','Land','Mobile Homes','New Construction']

export default function EditProfile() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [userId, setUserId] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')
  
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    state: 'GA',
    bio: '',
    avatar_url: '',
    specialties: [] as string[],
    states_operated: [] as string[]
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
        phone: data.phone || '',
        city: data.city || '',
        state: data.state || 'GA',
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
        specialties: data.specialties || [],
        states_operated: data.states_operated || []
      })
      
      if (data.avatar_url) {
        if (data.avatar_url.startsWith('http')) {
          setAvatarPreview(data.avatar_url)
        } else {
          const { data: urlData } = await supabase.rpc('get_signed_avatar_url', { bucket_path: data.avatar_url })
          if (urlData) setAvatarPreview(urlData)
        }
      }
    }
    setLoading(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file ||!userId) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `avatars/${userId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
   .from('vault')
   .upload(fileName, file, { upsert: true })

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    setForm(prev => ({...prev, avatar_url: fileName }))
    
    const { data } = await supabase.rpc('get_signed_avatar_url', { bucket_path: fileName })
    if (data) setAvatarPreview(data)
    
    setUploading(false)
  }

  const toggleSpecialty = (spec: string) => {
    setForm(prev => ({
      ...prev,
      specialties: prev.specialties.includes(spec)
      ? prev.specialties.filter(s => s!== spec)
        : [...prev.specialties, spec]
    }))
  }

  const toggleState = (state: string) => {
    setForm(prev => ({
      ...prev,
      states_operated: prev.states_operated.includes(state)
      ? prev.states_operated.filter(s => s!== state)
        : [...prev.states_operated, state]
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
    .from('vault_members')
    .upsert({
        id: userId,
        ...form,
        last_active: new Date().toISOString()
      })

    if (error) {
      alert('Error saving: ' + error.message)
    } else {
      router.push('/vault/members')
    }
    setSaving(false)
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-4">Loading...</div>

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-yellow-500">EDIT PROFILE</h1>
          <button onClick={() => router.back()} className="text-zinc-400 text-sm">
            Cancel
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center gap-4">
            <img
              src={avatarPreview || 'https://via.placeholder.com/80/333/666?text=M'}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover bg-zinc-800"
            />
            <div>
              <input
                type="file"
                id="avatar"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
              <label
                htmlFor="avatar"
                className="bg-zinc-800 text-white px-4 py-2 rounded text-sm cursor-pointer hover:bg-zinc-700"
              >
                {uploading? 'Uploading...' : 'Change Photo'}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({...form, full_name: e.target.value})}
              placeholder="Full Name"
              className="bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({...form, phone: e.target.value})}
              placeholder="Phone"
              className="bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({...form, city: e.target.value})}
              placeholder="City"
              className="bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={form.state}
              onChange={(e) => setForm({...form, state: e.target.value})}
              className="bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <textarea
            value={form.bio}
            onChange={(e) => setForm({...form, bio: e.target.value})}
            placeholder="Bio - What kind of deals do you do?"
            rows={4}
            className="w-full bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-2">
              States You Operate In — Check all that apply
            </label>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {US_STATES.map(state => (
                <button
                  key={state}
                  type="button"
                  onClick={() => toggleState(state)}
                  className={`px-2 py-2 rounded text-xs font-bold ${
                    form.states_operated.includes(state)
                    ? 'bg-blue-600 text-white'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {state}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-2">
              Specialties — What you focus on
            </label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map(spec => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpecialty(spec)}
                  className={`px-3 py-2 rounded text-sm ${
                    form.specialties.includes(spec)
                    ? 'bg-blue-600 text-white'
                      : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded hover:bg-blue-500 disabled:bg-zinc-700"
          >
            {saving? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
