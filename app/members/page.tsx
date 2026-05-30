'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Profile = {
  id: string
  full_name: string
  role: string
  city: string
  state: string
  deals_closed: number
}

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
]

export default function Members() {
  const [members, setMembers] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchMembers()
  }, [search, roleFilter, stateFilter])

  const fetchMembers = async () => {
    let query = supabase.from('profiles').select('id, full_name, role, city, state, deals_closed')

    if (search) query = query.ilike('full_name', `%${search}%`)
    if (roleFilter) query = query.eq('role', roleFilter)
    if (stateFilter) query = query.eq('state', stateFilter)

    const { data } = await query.order('deals_closed', { ascending: false })
    setMembers(data || [])
  }

  const inputClass = "px-3 py-2 bg-zinc-800 border border-zinc-700 text-white text-sm focus:border-red-500 outline-none"

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Members Directory</h1>
        
        <div className="flex flex-wrap gap-3 mb-6">
          <input 
            placeholder="Search by name..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`${inputClass} flex-1 min-w-[200px]`}
          />
          
          <select 
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className={inputClass}
          >
            <option value="">All Roles</option>
            <option value="INVESTOR">Investor</option>
            <option value="WHOLESALER">Wholesaler</option>
            <option value="AGENT">Agent</option>
            <option value="LENDER">Lender</option>
            <option value="CONTRACTOR">Contractor</option>
          </select>

          <select 
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
            className={inputClass}
          >
            <option value="">All States</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(member => (
            <div key={member.id} className="bg-zinc-900 border border-zinc-800 hover:border-red-500/50 transition-all">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-red-500">{member.role}</span>
                <span className="text-lg font-bold text-red-500">{member.deals_closed}</span>
              </div>
              
              <div className="p-4">
                <h3 className="font-bold mb-2">{member.full_name}</h3>
                <p className="text-sm text-zinc-400">{member.city}, {member.state}</p>
              </div>

              <div className="p-4 pt-0">
                <Link 
                  href={`/profile/${member.id}`}
                  className="block w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs uppercase text-center"
                >
                  View Deals
                </Link>
              </div>
            </div>
          ))}
        </div>

        {members.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
            No members found. Adjust filters.
          </div>
        )}
      </div>
    </div>
  )
}
