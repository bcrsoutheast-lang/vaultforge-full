'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
  status: 'LIVE' | 'UNDER CONTRACT' | 'CLOSED'
  postedDate: string
  sellerName: string
  sellerPhone: string
  inspectionDays: number
  closeDate: string
}

export default function DealRoom() {
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>([])
  const [filterType, setFilterType] = useState('ALL')
  const [filterState, setFilterState] = useState('ALL')
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Replace with Supabase fetch
    // const { data } = await supabase.from('deals').select().eq('status', 'LIVE')
    
    // MOCK DATA FOR NOW:
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
        status: 'LIVE',
        postedDate: '2026-05-30',
        sellerName: 'VaultForge Ops',
        sellerPhone: '404-555-0100',
        inspectionDays: 10,
        closeDate: '2026-06-20'
      },
      {
        id: 'VF-B7H3L9',
        title: '456 Oak Ave | Duplex | Marietta',
        dealType: 'Subject-To',
        city: 'Marietta',
        state: 'GA',
        askingPrice: 185000,
        arv: 275000,
        rehab: 25000,
        assignmentFee: 10000,
        profit: 48000,
        mao: 158000,
        photos: ['/placeholder.jpg'],
        status: 'LIVE',
        postedDate: '2026-05-29',
        sellerName: 'VaultForge Ops',
        sellerPhone: '404-555-0100',
        inspectionDays: 7,
        closeDate: '2026-06-15'
      }
    ])
    setLoading(false)
  }, [])

  const filteredDeals = deals.filter(d => {
    if (filterType !== 'ALL' && d.dealType !== filterType) return false
    if (filterState !== 'ALL' && d.state !== filterState) return false
    return d.status === 'LIVE'
  })

  const dealTypes = ['ALL', 'Wholesale', 'Subject-To', 'Note Sale', 'Novation', 'Fix & Flip']
  const states = ['ALL', 'GA', 'FL', 'TX', 'NC', 'SC']

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* HEADER */}
        <div className="border-b border-zinc-800 pb-4 mb-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">VAULTFORGE // DEAL ROOM</h1>
              <p className="text-sm text-zinc-500 mt-1">LIVE DEALS // ANALYZER VERIFIED // {filteredDeals.length} OPPORTUNITIES</p>
            </div>
            <button 
              onClick={() => router.push('/post-deal')}
              className="bg-emerald-600 hover:bg-emerald-500 text-black px-4 py-2 text-sm font-bold"
            >
              + POST DEAL
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 mb-6">
          <div className="text-xs text-emerald-500 font-mono mb-3">FILTERS</div>
          <div className="flex gap-4">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">DEAL TYPE</label>
              <select 
                className="bg-black border border-zinc-700 px-3 py-1 text-xs font-mono"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                {dealTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">STATE</label>
              <select 
                className="bg-black border border-zinc-700 px-3 py-1 text-xs font-mono"
                value={filterState}
                onChange={e => setFilterState(e.target.value)}
              >
                {states.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs text-zinc-500">AVG PROFIT</div>
              <div className="text-lg font-mono text-emerald-400">
                ${filteredDeals.length > 0 ? Math.round(filteredDeals.reduce((sum, d) => sum + d.profit, 0) / filteredDeals.length).toLocaleString() : 0}
              </div>
            </div>
          </div>
        </div>

        {/* DEAL GRID */}
        {loading ? (
          <div className="text-center py-20 text-zinc-500 font-mono text-sm">LOADING DEAL FLOW...</div>
        ) : filteredDeals.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 p-12 text-center">
            <div className="text-zinc-500 text-sm mb-4">NO LIVE DEALS MATCH FILTERS</div>
            <button 
              onClick={() => router.push('/post-deal')}
              className="bg-emerald-600 hover:bg-emerald-500 text-black px-4 py-2 text-xs font-bold"
            >
              POST FIRST DEAL
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDeals.map(deal => (
              <div 
                key={deal.id}
                onClick={() => setSelectedDeal(deal)}
                className="bg-zinc-900 border border-zinc-800 hover:border-emerald-700 cursor-pointer transition-colors"
              >
                <div className="bg-black h-48 flex items-center justify-center text-zinc-700 text-xs">
                  {deal.photos.length} PHOTOS
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-mono text-emerald-500">{deal.id}</div>
                    <div className="text-xs font-mono bg-emerald-900/30 text-emerald-400 px-2 py-0.5">{deal.status}</div>
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
                      <div className="text-zinc-500">REHAB</div>
                      <div className="text-zinc-100">${deal.rehab.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500">ASSIGN</div>
                      <div className="text-zinc-100">${deal.assignmentFee.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-800 pt-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-xs text-zinc-500">PROFIT</div>
                        <div className="text-lg font-mono text-emerald-400">${deal.profit.toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-zinc-500">ASK vs MAO</div>
                        <div className={`text-sm font-mono ${deal.askingPrice <= deal.mao ? 'text-emerald-400' : 'text-red-400'}`}>
                          {deal.askingPrice <= deal.mao ? 'PASS' : 'OVER'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-500">
                    {deal.dealType} • {deal.city}, {deal.state} • {deal.inspectionDays}D INSPECT
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DEAL DETAIL MODAL */}
        {selectedDeal && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDeal(null)}>
            <div className="bg-zinc-900 border border-zinc-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-mono text-emerald-500 mb-1">{selectedDeal.id}</div>
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
                    <div className="text-xs text-emerald-500 font-mono mb-3">DEAL ANALYTICS</div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-xs text-zinc-500">ASKING</div>
                        <div className="text-lg font-mono">${selectedDeal.askingPrice.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-zinc-500">ARV</div>
                        <div className="text-lg font-mono">${selectedDeal.arv.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-emerald-500">MAO</div>
                        <div className="text-lg font-mono text-emerald-400">${selectedDeal.mao.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-emerald-500">PROFIT</div>
                        <div className="text-lg font-mono text-emerald-400">${selectedDeal.profit.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-zinc-950 border border-zinc-800 p-4">
                    <div className="text-xs text-emerald-500 font-mono mb-3">CONTACT SELLER</div>
                    <div className="text-sm mb-2">{selectedDeal.sellerName}</div>
                    <div className="text-xs font-mono text-zinc-400 mb-4">{selectedDeal.sellerPhone}</div>
                    <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-black py-2 text-xs font-bold mb-2">
                      CALL NOW
                    </button>
                    <button className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 py-2 text-xs font-mono">
                      REQUEST DETAILS
                    </button>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-4 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">INSPECTION:</span>
                      <span className="font-mono">{selectedDeal.inspectionDays} DAYS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">CLOSE DATE:</span>
                      <span className="font-mono">{selectedDeal.closeDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">POSTED:</span>
                      <span className="font-mono">{selectedDeal.postedDate}</span>
                    </div>
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
