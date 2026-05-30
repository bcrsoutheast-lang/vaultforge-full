'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function EditProfile() {
  const [loading, setLoading] = useState(true)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    getProfile()
  }, [])

  async function getProfile() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()
        
        if (data) setFullName(data.full_name)
      }
    } catch (error) {
      console.log('Error loading profile')
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, full_name: fullName })
      
      if (!error) router.push('/profile')
    }
    setSaving(false)
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-6">Loading...</div>

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
        <form onSubmit={updateProfile} className="space-y-4">
          <input 
            placeholder="Full Name" 
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full p-3 bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 outline-none"
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
              disabled={saving}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 border border-red-500 text-white uppercase font-bold disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
