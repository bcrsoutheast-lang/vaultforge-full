'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

type PainLead = {
  id: string
  address: string
  phone: string
  motivation: string
  timeline: string
  drop_dead_price: string
  arv: string
  mortgage_balance: string
  occupancy: string
  condition: string
  notes: string
  pain_score: number
  priority: 'CRITICAL' | 'HOT' | 'WARM' | 'COLD'
  user_status?: 'CONTACTED' | 'NEGOTIATING' | 'CLOSED'
  created_at: string
}

export default function PainRoom() {
  const [leads, setLeads] = useState<PainLead[]>([])
  const [counts, setCounts] = useState({ critical: 0, hot: 0, warm: 0, cold: 0 })
  const [activeTab, setActiveTab] = useState<'CRITICAL' | 'HOT' | 'WARM' | 'COLD'>('CRITICAL')
  const [user, setUser] = useState<any>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [messageOpen, setMessageOpen] = useState<string | null>(null)
  const [smsText, setSmsText] = useState('')
  const [newCritical, setNewCritical] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        fetchLeads(user.id, 'CRITICAL')
        fetchCounts(user.id)

        const channel = supabase
          .channel('pain_intake_changes')
          .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'pain_intake', filter: `user_id=eq.${user.id}` }, 
            (payload) => {
              if (payload.new.priority === 'CRITICAL') {
                setNewCritical(true)
                fetchCounts(user.id)
                if (activeTab === 'CRITICAL') fetchLeads(user.id, 'CRITICAL')
                setTimeout(() => setNewCritical(false), 5000)
              } else {
                fetchCounts(user.id)
              }
            }
          )
          .subscribe()

        return () => { supabase.removeChannel(channel) }
      }
    }
    init()
  }, [activeTab])

  const fetchLeads = async (userId: string, tab: string) => {
    const { data } = await supabase
      .from('pain_intake')
      .select('*')
      .eq('user_id', userId)
      .eq('priority', tab)
      .is('user_status', null)
      .order('pain_score', { ascending: false })
    setLeads(data || [])
  }

  const fetchCounts = async (userId: string) => {
    const { data } = await supabase
      .from('pain_intake')
      .select('priority')
      .eq('user_id', userId)
      .is('user_status', null)

    setCounts({
      critical: data?.filter(d => d.priority === 'CRITICAL').length || 0,
      hot: data?.filter(d => d.priority === 'HOT').length || 0,
      warm: data?.filter(d => d.priority === 'WARM').length || 0,
      cold: data?.filter(d => d.priority === 'COLD').length || 0,
    })
  }

  const handleAction = async (leadId: string, newStatus: 'CONTACTED' | 'NEGOTIATING' | 'CLOSED') => {
    await supabase.from('pain_intake').update({ user_status: newStatus }).eq('id', leadId)
    if (user) {
      fetchLeads(user.id, activeTab)
      fetchCounts(user.id)
    }
    setConfirmDelete(null)
  }

  const handleCleanup = async () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    await supabase
      .from('pain_intake')
      .delete()
      .eq('priority', 'COLD')
      .lt('created_at', thirtyDaysAgo.toISOString())
    
    if (user) {
      fetchLeads(user.id, activeTab)
      fetchCounts(user.id)
    }
  }

  const handleTabChange = (tab: 'CRITICAL' | 'HOT' | 'WARM' | 'COLD') => {
    setActiveTab(tab)
    if (tab === 'CRITICAL') setNewCritical(false)
    if (user) fetchLeads(user.id, tab)
  }

  const openMessage = (lead: PainLead) => {
    setSmsText(`Hey, saw your property at ${lead.address}. Still looking to sell? I can close in ${lead.timeline}.`)
    setMessageOpen(lead.id)
  }

  const MessageModal = ({ lead }: { lead: PainLead }) => (
    messageOpen === lead.id && (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={() => setMessageOpen(null)}>
        <div className="bg-zinc-900 border border-red-500/50 p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold mb-4 text-red-500">MESSAGE SELLER</h3>
          <p className="text-sm text-zinc-400 mb-2">{lead.address}</p>
          <p className="text-sm text-zinc-400 mb-4">{lead.phone}</p>
          <textarea 
            value={smsText}
            onChange={e => setSmsText(e.target.value)}
            className="w-full p-3 bg-zinc-800 border border-zinc-700 mb-4 text-white" 
            rows={4}
          />
          <div className="flex gap-2">
            <button 
              onClick={() => {
                handleAction(lead.id, 'CONTACTED')
                setMessageOpen(null)
              }}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 border border-red-500 text-white uppercase text-xs"
            >
              Send & Mark Contacted
            </button>
            <button onClick={() => setMessageOpen(null)} className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-xs">Exit</button>
          </div>
        </div>
      </div>
    )
  )

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Pain Room</h1>
            <Link href="/pain-intake" className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 text-red-500 text-xs uppercase">
              + Pain Intake
            </Link>
          </div>
          <button 
            onClick={handleCleanup}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs uppercase"
          >
            Clean Up Cold {'>'}30 Days
          </button>
        </div>

        <div className="flex gap-2 mb-6 border-b border-zinc-800">
          <button 
            onClick={() => handleTabChange('CRITICAL')}
            className={`px-4 py-2 text-sm uppercase relative ${activeTab === 'CRITICAL' ? 'border-b-2 border-red-500 text-red-500' : 'text-zinc-500 hover:text-white'}`}
          >
            Critical ({counts.critical})
            {newCritical && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
            )}
          </button>
          <button 
            onClick={() => handleTabChange('HOT')}
            className={`px-4 py-2 text-sm uppercase ${activeTab === 'HOT' ? 'border-b-2 border-amber-500 text-amber-500' : 'text-zinc-500 hover:text-white'}`}
          >
            Hot ({counts.hot})
          </button>
          <button 
            onClick={() => handleTabChange('WARM')}
            className={`px-4 py-2 text-sm uppercase ${activeTab === 'WARM' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-zinc-500 hover:text-white'}`}
          >
            Warm ({counts.warm})
          </button>
          <button 
            onClick={() => handleTabChange('COLD')}
            className={`px-4 py-2 text-sm uppercase ${activeTab === 'COLD' ? 'border-b-2 border-zinc-500 text-zinc-500' : 'text-zinc-500 hover:text-white'}`}
          >
            Cold ({counts.cold})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map(lead => (
            <div key={lead.id}>
              {confirmDelete === lead.id ? (
                <div className="bg-zinc-900 border border-red-500/50 shadow-lg shadow-red-500/10">
                  <div className="p-4 border-b border-red-500/30 bg-red-950/20">
                    <span className="text-xs uppercase tracking-wider text-red-500">Confirm Delete</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold mb-2">{lead.address}</h3>
                    <p className="text-sm text-zinc-400">Delete this lead permanently?</p>
                  </div>
                  <div className="p-4 pt-0 flex gap-2">
                    <button 
                      onClick={() => setConfirmDelete(null)}
                      className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs uppercase"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleAction(lead.id, 'CLOSED')}
                      className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 border border-red-500 text-white text-xs uppercase font-bold"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`bg-zinc-900 border border-zinc-800 transition-all ${
                  activeTab === 'CRITICAL' ? 'hover:border-red-500/50' : 
                  activeTab === 'HOT' ? 'hover:border-amber-500/50' : 
                  activeTab === 'WARM' ? 'hover:border-yellow-500/50' : 
                  'hover:border-zinc-500/50 opacity-75'
                }`}>
                  <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        activeTab === 'CRITICAL' ? 'bg-red-500' : 
                        activeTab === 'HOT' ? 'bg-amber-500' : 
                        activeTab === 'WARM' ? 'bg-yellow-500' : 'bg-zinc-500'
                      }`}></div>
                      <span className={`text-xs uppercase tracking-wider ${
                        activeTab === 'CRITICAL' ? 'text-red-500' : 
                        activeTab === 'HOT' ? 'text-amber-500' : 
                        activeTab === 'WARM' ? 'text-yellow-500' : 'text-zinc-500'
                      }`}>{activeTab}</span>
                    </div>
                    <span className="text-lg font-bold text-red-500">{lead.pain_score}</span>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold mb-1">{lead.address}</h3>
                    <p className="text-sm text-zinc-400 mb-3">{lead.phone}</p>
                    <div className="flex gap-2 text-xs mb-2">
                      <span className="px-2 py-1 bg-zinc-800 border border-zinc-700">DDP: ${lead.drop_dead_price}</span>
                      <span className="px-2 py-1 bg-zinc-800 border border-zinc-700">ARV: ${lead.arv}</span>
                    </div>
                    <p className="text-xs text-zinc-500">Pain: {lead.motivation}</p>
                    <p className="text-xs text-zinc-500">Close: {lead.timeline}</p>
                  </div>

                  <div className="p-4 pt-0 flex gap-2">
                    <button 
                      onClick={() => openMessage(lead)}
                      className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs uppercase"
                    >
                      Message
                    </button>
                    <button 
                      onClick={() => handleAction(lead.id, 'NEGOTIATING')}
                      className="px-3 py-2 bg-green-900/30 hover:bg-green-900/50 border border-green-500/30 text-green-500 text-xs"
                    >
                      ✓
                    </button>
                    <button 
                      onClick={() => setConfirmDelete(lead.id)}
                      className="px-3 py-2 bg-zinc-800 hover:bg-red-900/50 border border-zinc-700 hover:border-red-500/50 text-xs"
                    >
                      Exit
                    </button>
                  </div>
                </div>
              )}
              <MessageModal lead={lead} />
            </div>
          ))}
        </div>

        {leads.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
            No {activeTab.toLowerCase()} leads yet. Run Pain Intake.
          </div>
        )}
      </div>
    </div>
  )
}
