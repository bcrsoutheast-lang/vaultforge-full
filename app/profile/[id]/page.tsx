'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

type Profile = {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  role: string | null
  city: string | null
  state: string | null
  bio: string | null
  deals_closed: number | null
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
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const supabase = createClient()
  const id = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
      
      const { data: dealsData } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })

      setProfile(profileData)
      setDeals(dealsData || [])
      setLoading(false)
    }
    fetchData()
  }, [id, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-500">Profile not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-zinc-900 border border-zinc-800 p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{profile.full_name || 'Unnamed User'}</h1>
          <div className="text-zinc-400 text-sm uppercase">{profile.role || 'Investor'}</div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">Location: </span>
              <span>{profile.city}, {profile.state}</span>
            </div>
            <div>
              <span className="text-zinc-500">Deals Closed: </span>
              <span className="text-red-500">{profile.deals_closed || 0}</span>
            </div>
            <div>
              <span className="text-zinc-500">Phone: </span>
              <span>{profile.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-zinc-500">Email: </span>
              <span>{profile.email}</span>
            </div>
          </div>
          {profile.bio && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <div className="text-zinc-500 text-xs mb-1">BIO</div>
              <div className="text-zinc-300">{profile.bio}</div>
            </div>
          )}
        </div>

        <h2 className="text-xl font-bold mb-4">Deals Posted</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deals.map(deal => (
            <div key={deal.id} className="bg-zinc-900 border border-zinc-800 p-4">
              <div className="font-bold">{deal.address}</div>
              <div className="text-zinc-400 text-sm">{deal.city}, {deal.state}</div>
              <div className="mt-3 flex justify-between text-sm">
                <span className="text-zinc-500">ARV:</span>
                <span>${deal.arv}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Profit:</span>
                <span className="text-red-400">${deal.profit}</span>
              </div>
              <div className="text-xs text-zinc-600 mt-2">
                {new Date(deal.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {deals.length === 0 && (
          <div className="text-center py-10 text-zinc-500">No deals posted yet</div>
        )}
      </div>
    </div>
  )
}
