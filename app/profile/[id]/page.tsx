'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams } from 'next/navigation'

type Profile = {
  id: string
  email: string
  full_name: string
  phone: string
  role: string
  city: string
  state: string
  deals_closed: number
  bio: string
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [deals, setDeals] = useState<any[]>([])
  const params = useParams()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()
      
      setProfile(profileData)

      const { data: dealsData } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', params.id)
        .order('created_at', { ascending: false })
        .limit(6)
      
      setDeals(dealsData || [])
    }
    fetchProfile()
  }, [params.id])

  if (!profile) return <div className="min-h-screen bg-black text-white p-6">Loading...</div>

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-zinc-900 border border-zinc-800 mb-6">
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{profile.full_name}</h1>
                <span className="text-xs uppercase tracking-wider text-red-500">{profile.role}</span>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-red-500">{profile.deals_closed}</div>
                <div className="text-xs text-zinc-500 uppercase">Deals Closed</div>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-zinc-500 uppercase mb-1">Email</div>
              <div>{profile.email}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 uppercase mb-1">Phone</div>
              <div>{profile.phone || 'Not provided'}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 uppercase mb-1">Location</div>
              <div>{profile.city}, {profile.state}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 uppercase mb-1">Member Since</div>
              <div>{new Date(profile.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          {profile.bio && (
            <div className="p-6 pt-0">
              <div className="text-xs text-zinc-500 uppercase mb-2">Bio</div>
              <p className="text-zinc-300">{profile.bio}</p>
            </div>
          )}

          <div className="p-6 pt-0 flex gap-2">
            <button className="flex-1 py-3 bg-red-600 hover:bg-red-700 border border-red-500 text-white uppercase text-sm font-bold">
              Message
            </button>
            <button className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs uppercase">
              Add to Network
            </button>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4">Recent Deals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deals.map(deal => (
            <div key={deal.id} className="bg-zinc-900 border border-zinc-800 p-4">
              <h3 className="font-bold mb-1">{deal.address}</h3>
              <p className="text-sm text-zinc-400">{deal.city}, {deal.state}</p>
              <div className="flex gap-2 mt-3 text-xs">
                <span className="px-2 py-1 bg-zinc-800 border border-zinc-700">ARV: ${deal.arv}</span>
                <span className="px-2 py-1 bg-zinc-800 border border-zinc-700">Profit: ${deal.profit}</span>
              </div>
            </div>
          ))}
        </div>

        {deals.length === 0 && (
          <div className="text-center py-12 text-zinc-500">No deals posted yet.</div>
        )}
      </div>
    </div>
  )
}
