'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Profile = {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
  city: string
  state: string
  deals_closed: number
  bio: string
  created_at: string
}

type Deal = {
  id: string
  address: string
  city: string
  state: string
  arv: string
  profit: string
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClientComponentClient()
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      
      const { data: profileData } = await supabase
       .from('profiles')
       .select('*')
       .eq('id', id)
       .single()
      
      setProfile(profileData)

      const { data: dealsData } = await supabase
       .from('deals')
       .select('*')
       .eq('user_id', id)
       .order('created_at', { ascending: false })
       .limit(6)
      
      setDeals(dealsData || [])
    }
    init()
  }, [id])

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/members" className="text-sm text-zinc-500 hover:text-red-500 uppercase">
            ← Back to Members
          </Link>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 mb-8">
          <div className="p-6 border-b border-zinc-800 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{profile.full_name}</h1>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wider text-red-500">{profile.role}</span>
                <span className="text-zinc-500">•</span>
                <span className="text-sm text-zinc-400">{profile.city}, {profile.state}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-500">{profile.deals_closed}</div>
              <div className="text-xs uppercase text-zinc-500">Deals Closed</div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="text-xs uppercase text-zinc-500 mb-1">Email</div>
                <div className="text-sm">{profile.email}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-zinc-500 mb-1">Phone</div>
                <div className="text-sm">{profile.phone || 'Not provided'}</div>
              </div>
            </div>

            {profile.bio && (
              <div>
                <div className="text-xs uppercase text-zinc-500 mb-2">Bio</div>
                <p className="text-sm text-zinc-300">{profile.bio}</p>
              </div>
            )}

            {currentUser?.id === id && (
              <div className="mt-6">
                <Link 
                  href="/profile/edit"
                  className="inline-block px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs uppercase"
                >
                  Edit Profile
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Deals</h2>
          {currentUser?.id === id && (
            <Link 
              href="/deal-room/new"
              className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-500 text-xs uppercase"
            >
              + Post Deal
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deals.map(deal => (
            <div key={deal.id} className="bg-zinc-900 border border-zinc-800">
              <div className="p-4 border-b border-zinc-800">
                <h3 className="font-bold">{deal.address}</h3>
                <p className="text-sm text-zinc-400">{deal.city}, {deal.state}</p>
              </div>
              <div className="p-4 flex gap-2 text-xs">
                <span className="px-2 py-1 bg-zinc-800 border border-zinc-700">ARV: ${deal.arv}</span>
                <span className="px-2 py-1 bg-zinc-800 border border-zinc-700">Profit: ${deal.profit}</span>
              </div>
            </div>
          ))}
        </div>

        {deals.length === 0 && (
          <div className="text-center py-12 text-zinc-500 bg-zinc-900 border border-zinc-800">
            No deals posted yet.
          </div>
        )}
      </div>
    </div>
  )
}
