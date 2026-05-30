'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Member = {
  id: string
  email: string
  full_name: string
  phone: string
  role: 'INVESTOR' | 'WHOLESALER' | 'AGENT' | 'LENDER' | 'CONTRACTOR'
  city: string
  state: string
  deals_closed: number
  created_at: string
}

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
]

export default function MembersDirectory() {
  const [members, setMembers] = useState<Member[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [stateFilter, setStateFilter] = useState<string>('ALL')
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchMembers()
  }, [roleFilter, stateFilter])

  const fetchMembers = async () => {
    let query = supabase.from('profiles').select('*').order('deals_closed', { ascending: false })

    if (roleFilter !== 'ALL') query = query.eq('role', roleFilter)
    if (stateFilter !== 'ALL') query = query.eq('state', stateFilter)

    const { data } = await query
    setMembers(data || [])
  }

  const filteredMembers = members.filter(m =>
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.city?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Members Directory</h1>

        <div className="flex gap-2 mb-6">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, city..."
            className="flex-1 p-3 bg-zinc-800 border border-zinc-700 text-white"
          />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="p-3 bg-zinc-800 border border-zinc-700 text-white"
          >
            <option value="ALL">All Roles</option>
            <option value="INVESTOR">Investors</option>
            <option value="WHOLESALER">Wholesalers</option>
            <option value="AGENT">Agents</option>
            <option value="LENDER">Lenders</option>
            <option value="CONTRACTOR">Contractors</option>
          </select>
          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
            className="p-3 bg-zinc-800 border border-zinc-700 text-white"
          >
            <option value="ALL">All States</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map(member => (
            <div key={member.id} className="bg-zinc-900 border border-zinc-800 hover:border-red-500/50 transition-all">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-red-500">{member.role}</span>
                <span className="text-xs text-zinc-500">{member.deals_closed} deals</span>
              </div>

              <div className="p-4">
                <h3 className="font-bold mb-1">{member.full_name || 'No Name'}</h3>
                <p className="text-sm text-zinc-400 mb-2">{member.email}</p>
                <p className="text-sm text-zinc-400 mb-3">{member.phone}</p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-zinc-800 border border-zinc-700 text-xs">{member.city || 'No City'}, {member.state}</span>
                  <span className="px-2 py-1 bg-zinc-800 border border-zinc-700 text-xs">
                    Joined {new Date(member.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="p-4 pt-0 flex gap-2">
                <button className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs uppercase">
                  Message
                </button>
                <button className="flex-1 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-500 text-xs uppercase">
                  View Deals
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
            No members found.
          </div>
        )}
      </div>
    </div>
  )
}
