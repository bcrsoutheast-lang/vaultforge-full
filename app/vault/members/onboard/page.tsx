'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardMember() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [status, setStatus] = useState('Checking profile...')

  useEffect(() => {
    createProfile()
  }, [])

  const createProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // 1. Check if already in vault_members
    const { data: existing } = await supabase
     .from('vault_members')
     .select('id')
     .eq('id', user.id)
     .single()

    if (existing) {
      setStatus('Profile exists. Redirecting to directory...')
      setTimeout(() => router.push('/vault/members'), 1000)
      return
    }

    // 2. Pull from auth.users metadata + public profiles table if you have one
    const { data: authUser } = await supabase.auth.getUser()
    const meta = authUser.user?.user_metadata || {}

    setStatus('Creating your member profile...')

    // 3. Insert into vault_members using uploaded profile data
    const { error } = await supabase.from('vault_members').insert({
      id: user.id,
      full_name: meta.full_name || user.email?.split('@')[0] || 'Vault Member',
      email: user.email,
      phone: meta.phone || null,
      state_from: meta.state || meta.state_from || 'GA', // defaults to GA if missing
      city: meta.city || null,
      bio: meta.bio || 'Real estate investor',
      avatar_url: meta.avatar_url || user.user_metadata?.avatar_url || null,
      deals_closed: meta.deals_closed || 0,
      verified: false
    })

    if (error) {
      setStatus(`Error: ${error.message}`)
      return
    }

    setStatus('Profile created! Redirecting to directory...')
    setTimeout(() => router.push('/vault/members'), 1500)
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="bg-zinc-900 p-8 rounded border border-yellow-600 text-center max-w-md">
        <h1 className="text-2xl font-bold text-yellow-500 mb-4">VAULT MEMBER SETUP</h1>
        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-zinc-300">{status}</p>
      </div>
    </div>
  )
}
