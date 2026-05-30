'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Profile = {
  id: string
  full_name: string | null
  role: string | null
}

export default function Nav() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
      setLoading(false)
    }
    getProfile()

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        router.push('/login')
      }
      if (event === 'SIGNED_IN') getProfile()
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) return null

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/pain-room" className="text-xl font-bold text-white">
            6SIGMA
          </Link>
          
          {profile ? (
            <div className="flex items-center gap-6">
              <div className="hidden md:flex gap-6 text-sm">
                <Link href="/pain-room" className="text-zinc-400 hover:text-red-500 uppercase">
                  Pain Room
                </Link>
                <Link href="/pain-intake" className="text-zinc-400 hover:text-red-500 uppercase">
                  New Lead
                </Link>
                <Link href="/members" className="text-zinc-400 hover:text-red-500 uppercase">
                  Members
                </Link>
                <Link href="/deal-room/new" className="text-zinc-400 hover:text-red-500 uppercase">
                  Post Deal
                </Link>
              </div>

              <div className="flex items-center gap-4">
                <Link 
                  href={`/profile/${profile.id}`}
                  className="text-xs uppercase text-zinc-400 hover:text-white"
                >
                  {profile.full_name || 'Profile'}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs uppercase"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link 
              href="/login"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 border border-red-500 text-white text-xs uppercase font-bold"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
