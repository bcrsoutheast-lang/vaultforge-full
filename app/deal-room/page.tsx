'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type DealStage = 'NEW' | 'REVIEWING' | 'LIVE' | 'UNDER CONTRACT' | 'CLOSED' | 'DEAD'
type UserDealAction = 'SAVED' | 'ARCHIVED' | 'HIDDEN'

type Deal = {
  id: string
  title: string
  dealType: string
  city: string
  state: string
  askingPrice: number
  arv: number
  rehab: number
  assignmentFee: number
  profit: number
  mao: number
  photos: string[]
  documents: string[]
  stage: DealStage
  postedDate: string
  sellerId: string
  sellerName: string
  sellerPhone: string
  sellerEmail: string
  inspectionDays: number
  closeDate: string
  userAction?: UserDealAction
  notes: { id: string, text: string, timestamp: string }[]
}

export default function DealRoom() {
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>([])
  const [filterType, setFilterType] = useState('ALL')
  const [filterState, setFilterState] = useState('ALL')
  const [viewMode, setViewMode] = useState<'LIVE' | 'SAVED' | 'ARCHIVED' | 'ALL'>('LIVE')
  const [sortBy, setSortBy] = useState<'newest' | 'profit' | 'spread' | 'closing'>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [selectedDeals, setSelectedDeals] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [newNote, setNewNote] = useState('')
  
  // TODO: Get from auth
  const currentUserId = 'user-123' // Mock: Replace with Supabase auth.uid()
  const isAdmin = false // Mock: Replace with role check

  useEffect(() => {
    // TODO: Supabase: SELECT * FROM deals WHERE stage = 'LIVE' 
    // LEFT JOIN user_deals ON deals.id = user_deals.deal_id AND user_deals.user_id = currentUserId
    setDeals([
      {
        id: 'VF-A4F9K2',
        title: '123 Main St | 3BD/2BA | Atlanta',
        dealType: 'Wholesale',
        city: 'Atlanta',
        state: 'GA',
        askingPrice: 275000,
        arv: 350000,
        rehab: 45000,
        assignmentFee: 15000,
        profit: 22000,
        mao: 162000,
        photos: ['/placeholder.jpg'],
        documents: [],
        stage: 'LIVE',
        postedDate: '2026-05-30',
        sellerId: 'user-456',
        sellerName: 'VaultForge Ops',
        sellerPhone: '404-555-0100',
        sellerEmail: 'ops@vaultforge.com',
        inspectionDays: 10,
        closeDate: '2026-06-20',
        notes: []
      }
    ])
    setLoading(false)
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSave = (dealId: string) => {
    setDeals(deals.map(d => d.id === dealId? {...d, userAction: d.userAction === 'SAVED' ? undefined : 'SAVED'} : d))
    showToast(deals.find(d => d.id === dealId)?.userAction === 'SAVED'? 'REMOVED FROM SAVED' : 'SAVED TO YOUR ROOM')
  }

  const handleArchive = (dealId: string) => {
    setDeals(deals.map(d => d.id === dealId? {...d, userAction: 'ARCHIVED'} : d))
    showToast('ARCHIVED FROM YOUR ROOM')
    setSelectedDeal(null)
  }

  const handleDeleteFromRoom = (dealId: string) => {
    if (!confirm('Remove this deal from YOUR Deal Room? The deal stays live for others.')) return
    setDeals(deals.map(d => d.id === dealId? {...d, userAction: 'HIDDEN'} : d))
    showToast('REMOVED FROM YOUR ROOM')
    setSelectedDeal(null)
  }

  const handleDeleteGlobal = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId)
    if (deal?.sellerId !== currentUserId && !isAdmin) {
      showToast('ERROR: You can only delete deals you posted')
      return
    }
    if (!confirm('DELETE DEAL FOR EVERYONE? This cannot be undone.')) return
    setDeals(deals.filter(d => d.id !== dealId))
    showToast('DEAL DELETED GLOBALLY')
    setSelectedDeal(null)
  }

  const handleBulkArchive = () => {
    setDeals(deals.map(d => selectedDeals.includes(d.id)? {...d, userAction: 'ARCHIVED'} : d))
    showToast(`ARCHIVED ${selectedDeals.length} DEALS`)
    setSelectedDeals([])
  }

  const handleAddNote = (dealId: string) => {
    if (!newNote.trim()) return
    setDeals(deals.map(d => d.id === dealId? {
      ...d, 
      notes: [...d.notes, { id: Date.now().toString(), text: newNote, timestamp: new Date().toISOString() }]
    } : d))
    setNewNote('')
    showToast('NOTE ADDED')
  }

  const handleExport = () => {
    const csv = [
      ['VAULT ID', 'TITLE', 'ASK', 'ARV', 'MAO', 'PROFIT', 'STAGE'].join(','),
      ...filteredDeals.map(d => [d.id, d.title, d.askingPrice, d.arv, d.mao, d.profit, d.stage].join(','))
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vaultforge-deals-${Date.now()}.csv`
    a.click()
    showToast('EXPORTED TO CSV')
  }

  const filteredDeals = deals
    .filter(d => {
      if (d.userAction === 'HIDDEN') return false
      if (viewMode === 'LIVE' && d.stage !== 'LIVE') return false
      if (viewMode === 'SAVED' && d.userAction !== 'SAVED') return false
      if (viewMode === 'ARCHIVED' && d.userAction !== 'ARCHIVED') return false
      if (filterType !== 'ALL' && d.dealType !== filterType) return false
      if (filterState !== 'ALL' && d.state !== filterState) return false
      if (searchQuery && !`${d.title} ${d.city} ${d.id} ${d.sellerName}`.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'profit') return b.profit - a.profit
      if (sortBy === 'spread') return (b.arv - b.askingPrice) - (a.arv - a.askingPrice)
      if (sortBy === 'closing') return new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime()
      return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
    })

  const dealTypes = ['ALL', 'Wholesale', 'Subject-To', 'Note Sale', 'Novation', 'Fix & Flip']
  const states = ['ALL', 'GA', 'FL', 'TX', 'NC', 'SC']

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans">
      
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-900/90 border border-emerald-600 px-4 py-2 font-mono text-xs">
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        
        <div className="border-b border-zinc-800 pb-4 mb-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">VAULTFORGE // DEAL ROOM</h1>
              <p className="text-sm text-zinc-500 mt-1">YOUR ROOM // {filteredDeals.length} OPPORTUNITIES</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => router.push('/')} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 text-xs font-mono">
                ← COMMAND CENTER
              </button>
              <button onClick={() => router.push('/post-deal')} className="bg-emerald-600 hover:bg-emerald-500 text-black px-4 py-2 text-sm font-bold">
                + POST DEAL
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {(['LIVE', 'SAVED', 'ARCHIVED', 'ALL'] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`px-4 py-2 text-xs font-mono border ${
                viewMode === mode? 'bg-emerald-600 text-black border-emerald-600' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {mode} ({deals.filter(d => 
                mode === 'LIVE'? d.stage === 'LIVE' && d.userAction !== 'ARCHIVED' && d.userAction !== 'HIDDEN' : 
                mode === 'SAVED'? d.userAction === 'SAVED' : 
                mode === 'ARCHIVED'? d.userAction === 'ARCHIVED' :
                true
              ).length})
            </button>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 mb-6">
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-zinc-500 block mb-1">SEARCH</label>
              <input 
                className="w-full bg-black border border-zinc-700 px-3 py-1 text-xs font-mono"
                placeholder="Address, City, Vault ID, Seller..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">DEAL TYPE</label>
              <select className="w-full bg-black border border-zinc-700 px-3 py-1 text-xs font-mono"
                value={filterType} onChange={e => setFilterType(e.target.value)}>
                {dealTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">SORT BY</label>
              <select className="w-full bg-black border border-zinc-700 px-3 py-1 text-xs font-mono"
                value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                <option value="newest">NEWEST</option>
                <option value="profit">HIGHEST PROFIT</option>
                <option value="spread">BIGGEST SPREAD</option>
                <option value="closing">CLOSING SOON</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={handleExport} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1 text-xs font-mono">
                EXPORT CSV
              </button>
              {selectedDeals.length > 0 && (
                <button onClick={handleBulkArchive} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-1 text-xs font-mono">
                  ARCHIVE ({selectedDeals.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {loading? (
          <div className="text-center py-20 text-zinc-500 font-mono text-sm">LOADING DEAL FLOW...</div>
        ) : filteredDeals.length === 0? (
          <div className="bg-zinc-900 border border-zinc-800 p-12 text-center">
            <div className="text-zinc-500 text-sm mb-4">NO {viewMode} DEALS</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDeals.map(deal => (
              <div key={deal.id} className="bg-zinc-900 border border-zinc-800 hover:border-emerald-700 transition-colors">
                <div className="bg-black h-48 flex items-center justify-center text-zinc-700 text-xs relative">
                  {deal.photos.length} PHOTOS
                  <input 
                    type="checkbox" 
                    className="absolute top-2 left-2"
                    checked={selectedDeals.includes(deal.id)}
                    onChange={e => {
                      if (e.target.checked) setSelectedDeals([...selectedDeals, deal.id])
                      else setSelectedDeals(selectedDeals.filter(id => id !== deal.id))
                    }}
                  />
                  <button 
                    onClick={(e) => {e.stopPropagation(); handleSave(deal.id)}}
                    className={`absolute top-2 right-2 px-2 py-1 text-xs font-mono ${deal.userAction === 'SAVED'? 'bg-emerald-600 text-black' : 'bg-zinc-800 text-zinc-400'}`}
                  >
                    {deal.userAction === 'SAVED'? 'SAVED' : 'SAVE'}
                  </button>
                </div>
                <div className="p-4 cursor-pointer" onClick={() => setSelectedDeal(deal)}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-mono text-emerald-500">{deal.id}</div>
                    <div className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5">{deal.stage}</div>
                  </div>
                  
                  <div className="text-sm font-bold mb-3 line-clamp-2">{deal.title}</div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
                    <div>
                      <div className="text-zinc-500">ASK</div>
                      <div className="text-zinc-100">${deal.askingPrice.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">ARV</div>
                      <div className="text-zinc-100">${deal.arv.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">MAO</div>
                      <div className="text-emerald-400">${deal.mao.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">PROFIT</div>
                      <div className="text-emerald-400">${deal.profit.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-800 pt-3 text-xs text-zinc-500">
                    {deal.dealType} • {deal.city}, {deal.state} • {deal.inspectionDays}D INSPECT
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedDeal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDeal(null)}>
            <div className="bg-zinc-900 border border-zinc-700 max-w-5xl w-full max-h- overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-mono text-emerald-500 mb-1">{selectedDeal.id} // {selectedDeal.stage}</div>
                    <div className="text-2xl font-bold">{selectedDeal.title}</div>
                    <div className="text-sm text-zinc-400 mt-1">{selectedDeal.dealType} • {selectedDeal.city}, {selectedDeal.state}</div>
                  </div>
                  <button onClick={() => setSelectedDeal(null)} className="text-zinc-500 hover:text-zinc-300 text-2xl">×</button>
                </div>
              </div>

              <div className="p-6 grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                  <div className="bg-black h-64 flex items-center justify-center text-zinc-600">PHOTO GALLERY // {selectedDeal.photos.length} IMAGES</div>
                  
                  <div className="bg-zinc-950 border border-zinc-800 p-4">
                    <div className="text-xs text-emerald-500 font-mono mb-3">NOTES</div>
                    <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                      {selectedDeal.notes.map(note => (
                        <div key={note.id} className="text-xs border-l-2 border-zinc-700 pl-2">
                          <div className="text-zinc-500 font-mono">{new Date(note.timestamp).toLocaleString()}</div>
                          <div className="text-zinc-300">{note.text}</div>
                        </div>
                      ))}
                      {selectedDeal.notes.length === 0 && <div className="text-xs text-zinc-600">No notes yet</div>}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        className="flex-1 bg-black border border-zinc-700 px-2 py-1 text-xs"
                        placeholder="Add note..."
                        value={newNote}
                        onChange={e => setNewNote(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddNote(selectedDeal.id)}
                      />
                      <button onClick={() => handleAddNote(selectedDeal.id)} className="bg-emerald-600 text-black px-3 py-1 text-xs font-bold">
                        ADD
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-zinc-950 border border-emerald-800 p-4">
                    <div className="text-xs text-emerald-500 font-mono mb-3">COMMAND CENTER</div>
                    <div className="space-y-2">
                      <button onClick={() => handleSave(selectedDeal.id)}
                        className={`w-full py-2 text-xs font-bold ${selectedDeal.userAction === 'SAVED'? 'bg-zinc-800 text-zinc-400' : 'bg-emerald-600 text-black hover:bg-emerald-500'}`}>
                        {selectedDeal.userAction === 'SAVED'? 'UNSAVE DEAL' : 'SAVE TO YOUR ROOM'}
                      </button>
                      <button onClick={() => window.location.href = `mailto:${selectedDeal.sellerEmail}?subject=Re: ${selectedDeal.id}`}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 py-2 text-xs font-mono">
                        MESSAGE SELLER
                      </button>
                      <button onClick={() => handleArchive(selectedDeal.id)}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 py-2 text-xs font-mono">
                        ARCHIVE FROM YOUR ROOM
                      </button>
                      <button onClick={() => handleDeleteFromRoom(selectedDeal.id)}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 py-2 text-xs font-mono">
                        REMOVE FROM YOUR ROOM
                      </button>
                      {(selectedDeal.sellerId === currentUserId || isAdmin) && (
                        <button onClick={() => handleDeleteGlobal(selectedDeal.id)}
                          className="w-full bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-400 py-2 text-xs font-mono">
                          DELETE DEAL GLOBALLY
                        </button>
                      )}
                      <button onClick={() => router.push('/')}
                        className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 py-2 text-xs font-mono">
                        ← BACK TO COMMAND CENTER
                      </button>
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-4 text-xs space-y-2">
                    <div className="text-emerald-500 font-mono mb-2">DEAL TERMS</div>
                    <div className="flex justify-between"><span className="text-zinc-500">INSPECTION:</span><span className="font-mono">{selectedDeal.inspectionDays} DAYS</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">CLOSE DATE:</span><span className="font-mono">{selectedDeal.closeDate}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">POSTED:</span><span className="font-mono">{selectedDeal.postedDate}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
