'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Deal = {
  id: string
  title: string
  location: string
  price: string
  arv: string
  user_action?: 'SAVED' | 'ARCHIVED' | 'HIDDEN'
  seller_id: string
  archived_at?: string
  notes?: string
}

export default function DealRoom() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [counts, setCounts] = useState({ saved: 0, archived: 0, hidden: 0 })
  const [activeTab, setActiveTab] = useState<'SAVED' | 'ARCHIVED' | 'HIDDEN'>('SAVED')
  const [user, setUser] = useState<any>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        fetchDeals(user.id)
        fetchCounts(user.id)
      }
    }
    init()
  }, [])

  const fetchDeals = async (userId: string) => {
    const { data } = await supabase
      .from('user_deals')
      .select('*, deals(*)')
      .eq('user_id', userId)
      .eq('action', activeTab)
    
    const mapped = data?.map((d: any) => ({ ...d.deals, user_action: d.action })) || []
    setDeals(mapped)
  }

  const fetchCounts = async (userId: string) => {
    const { data } = await supabase
      .from('user_deals')
      .select('action')
      .eq('user_id', userId)

    const saved = data?.filter(d => d.action === 'SAVED').length || 0
    const archived = data?.filter(d => d.action === 'ARCHIVED').length || 0
    const hidden = data?.filter(d => d.action === 'HIDDEN').length || 0
    
    setCounts({ saved, archived, hidden })
  }

  const handleAction = async (dealId: string, newAction: 'SAVED' | 'ARCHIVED' | 'HIDDEN') => {
    if (!user) return
    
    const oldDeal = deals.find(d => d.id === dealId)
    const oldAction = oldDeal?.user_action

    await supabase.from('user_deals').upsert({ 
      deal_id: dealId, 
      user_id: user.id, 
      action: newAction,
      archived_at: newAction === 'ARCHIVED' ? new Date().toISOString() : null
    })

    setCounts(prev => ({
      saved: prev.saved + (newAction === 'SAVED' ? 1 : 0) - (oldAction === 'SAVED' ? 1 : 0),
      archived: prev.archived + (newAction === 'ARCHIVED' ? 1 : 0) - (oldAction === 'ARCHIVED' ? 1 : 0),
      hidden: prev.hidden + (newAction === 'HIDDEN' ? 1 : 0) - (oldAction === 'HIDDEN' ? 1 : 0),
    }))

    setDeals(deals.filter(d => d.id !== dealId))
    setConfirmDelete(null)
  }

  const handleTabChange = (tab: 'SAVED' | 'ARCHIVED' | 'HIDDEN') => {
    setActiveTab(tab)
    if (user) fetchDeals(user.id)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Deal Room</h1>

        <div className="flex gap-2 mb-6 border-b border-zinc-800">
          <button 
            onClick={() => handleTabChange('SAVED')}
            className={`px-4 py-2 text-sm uppercase ${activeTab === 'SAVED' ? 'border-b-2 border-green-500 text-green-500' : 'text-zinc-500 hover:text-white'}`}
          >
            Saved ({counts.saved})
          </button>
          <button 
            onClick={() => handleTabChange('ARCHIVED')}
            className={`px-4 py-2 text-sm uppercase ${activeTab === 'ARCHIVED' ? 'border-b-2 border-amber-500 text-amber-500' : 'text-zinc-500 hover:text-white'}`}
          >
            Archived ({counts.archived})
          </button>
          <button 
            onClick={() => handleTabChange('HIDDEN')}
            className={`px-4 py-2 text-sm uppercase ${activeTab === 'HIDDEN' ? 'border-b-2 border-red-500 text-red-500' : 'text-zinc-500 hover:text-white'}`}
          >
            Hidden ({counts.hidden})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map(deal => (
            confirmDelete === deal.id ? (
              <div key={deal.id} className="bg-zinc-900 border border-red-500/50 shadow-lg shadow-red-500/10">
                <div className="p-4 border-b border-red-500/30 bg-red-950/20">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-red-500">Confirm Hide</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold mb-2">{deal.title}</h3>
                  <p className="text-sm text-zinc-400">This hides the deal from your room.</p>
                </div>
                <div className="p-4 pt-0 flex gap-2">
                  <button 
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleAction(deal.id, 'HIDDEN')}
                    className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 border border-red-500 text-white text-xs uppercase font-bold"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            ) : (
              <div key={deal.id} className={`bg-zinc-900 border border-zinc-800 transition-all ${
                activeTab === 'SAVED' ? 'hover:border-green-500/50' : 
                activeTab === 'ARCHIVED' ? 'hover:border-amber-500/50 opacity-75' : 
                'hover:border-red-500/50'
              }`}>
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      activeTab === 'SAVED' ? 'bg-green-500' : 
                      activeTab === 'ARCHIVED' ? 'bg-amber-500' : 'bg-red-500'
                    }`}></div>
                    <span className={`text-xs uppercase tracking-wider ${
                      activeTab === 'SAVED' ? 'text-green-500' : 
                      activeTab === 'ARCHIVED' ? 'text-amber-500' : 'text-red-500'
                    }`}>{activeTab}</span>
                  </div>
                  {activeTab === 'ARCHIVED' && <span className="text-xs text-zinc-500">{formatDate(deal.archived_at)}</span>}
                </div>
                
                <div className="p-4">
                  <h3 className={`font-bold mb-1 ${activeTab !== 'SAVED' ? 'text-zinc-300' : ''}`}>{deal.title}</h3>
                  <p className="text-sm text-zinc-400 mb-3">{deal.location}</p>
                  {activeTab === 'SAVED' ? (
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 bg-zinc-800 border border-zinc-700">{deal.price}</span>
                      <span className="px-2 py-1 bg-zinc-800 border border-zinc-700">{deal.arv}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">Reason: {deal.notes || 'No notes'}</p>
                  )}
                </div>

                <div className="p-4 pt-0 flex gap-2">
                  {activeTab === 'SAVED' && (
                    <>
                      <button 
                        onClick={() => handleAction(deal.id, 'ARCHIVED')}
                        className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs uppercase"
                      >
                        Archive
                      </button>
                      <button 
                        onClick={() => setConfirmDelete(deal.id)}
                        className="px-3 py-2 bg-zinc-800 hover:bg-red-900/50 border border-zinc-700 hover:border-red-500/50 text-xs"
                      >
                        Hide
                      </button>
                    </>
                  )}
                  {activeTab === 'ARCHIVED' && (
                    <>
                      <button 
                        onClick={() => handleAction(deal.id, 'SAVED')}
                        className="flex-1 px-3 py-2 bg-green-900/30 hover:bg-green-900/50 border border-green-500/30 text-green-500 text-xs uppercase"
                      >
                        Restore
                      </button>
                      <button 
                        onClick={() => setConfirmDelete(deal.id)}
                        className="px-3 py-2 bg-zinc-800 hover:bg-red-900/50 border border-zinc-700 hover:border-red-500/50 text-xs"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {activeTab === 'HIDDEN' && (
                    <button 
                      onClick={() => handleAction(deal.id, 'SAVED')}
                      className="flex-1 px-3 py-2 bg-green-900/30 hover:bg-green-900/50 border border-green-500/30 text-green-500 text-xs uppercase"
                    >
                      Restore to Saved
                    </button>
                  )}
                </div>
              </div>
            )
          ))}
        </div>

        {deals.length === 0 && (
          <div className="text-center py-20 text-zinc-500">
            No {activeTab.toLowerCase()} deals yet.
          </div>
        )}
      </div>
    </div>
  )
}
