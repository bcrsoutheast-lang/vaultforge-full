'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

type PainLead = {
  id: string
  address: string
  phone: string
  motivation: string
  timeline: string
  drop_dead_price: string
  arv: string
  mortgage_balance: string | null
  occupancy: string | null
  condition: string
  notes: string | null
  pain_score: number
  priority: string
  user_status: string | null
  created_at: string
}

export default function PainRoom() {
  const [leads, setLeads] = useState<PainLead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'HOT' | 'WARM' | 'COLD'>('ALL')
  const supabase = createClient()

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('pain_intake')
      .select('*')
      .eq('user_id', user.id)
      .order('pain_score', { ascending: false })
      .order('created_at', { ascending: false })

    setLeads(data || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from('pain_intake')
      .update({ user_status: status })
      .eq('id', id)
    fetchLeads()
  }

  const deleteLead = async (id: string) => {
    if (!confirm('Delete this lead?')) return
    await supabase.from('pain_intake').delete().eq('id', id)
    fetchLeads()
  }

  const filteredLeads = leads.filter(lead => 
    filter === 'ALL' ? true : lead.priority === filter
  )

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'HOT': return 'text-red-500 border-red-500/30 bg-red-900/20'
      case 'WARM': return 'text-orange-500 border-orange-500/30 bg-orange-900/20'
      case 'COLD': return 'text-blue-500 border-blue-500/30 bg-blue-900/20'
      default: return 'text-zinc-500 border-zinc-700 bg-zinc-900/20'
    }
  }

  const inputClass = "px-3 py-2 bg-zinc-800 border border-zinc-700 text-white text-sm focus:border-red-500 outline-none"

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-500">Loading Pain Room...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Pain Room</h1>
          <Link 
            href="/pain-intake"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 border border-red-500 text-white text-sm uppercase font-bold"
          >
            + New Lead
          </Link>
        </div>

        <div className="flex gap-2 mb-6">
          {(['ALL', 'HOT', 'WARM', 'COLD'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs uppercase font-bold border ${
                filter === f 
                  ? 'bg-red-600 border-red-500 text-white' 
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              {f} {f !== 'ALL' && `(${leads.filter(l => l.priority === f).length})`}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredLeads.map(lead => (
            <div key={lead.id} className="bg-zinc-900 border border-zinc-800 hover:border-red-500/50 transition-all">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <span className={`text-xs uppercase tracking-wider px-2 py-1 border ${getPriorityColor(lead.priority)}`}>
                  {lead.priority} • Score: {lead.pain_score}
                </span>
                <span className="text-xs text-zinc-500">
                  {new Date(lead.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{lead.address}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Phone:</span>
                    <span>{lead.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">ARV:</span>
                    <span>${lead.arv}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Drop Dead:</span>
                    <span className="text-red-400">${lead.drop_dead_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Timeline:</span>
                    <span>{lead.timeline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Condition:</span>
                    <span>{lead.condition}</span>
                  </div>
                  {lead.mortgage_balance && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Mortgage:</span>
                      <span>${lead.mortgage_balance}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <div className="text-xs text-zinc-500 mb-1">Motivation:</div>
                  <div className="text-sm text-zinc-300">{lead.motivation}</div>
                </div>

                {lead.notes && (
                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <div className="text-xs text-zinc-500 mb-1">Notes:</div>
                    <div className="text-sm text-zinc-300">{lead.notes}</div>
                  </div>
                )}
              </div>

              <div className="p-4 pt-0 flex gap-2">
                <select
                  value={lead.user_status || ''}
                  onChange={e => updateStatus(lead.id, e.target.value)}
                  className={`${inputClass} flex-1 text-xs`}
                >
                  <option value="">Set Status</option>
                  <option value="CALL">Call</option>
                  <option value="FOLLOW_UP">Follow Up</option>
                  <option value="CONTRACT">Under Contract</option>
                  <option value="DEAD">Dead</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <button
                  onClick={() => deleteLead(lead.id)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-red-900/30 border border-zinc-700 hover:border-red-500/30 text-xs uppercase"
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
            {filter === 'ALL' ? 'No leads yet. Add your first lead.' : `No ${filter} leads.`}
          </div>
        )}
      </div>
    </div>
  )
}
