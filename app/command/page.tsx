'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Deal {
  id: string
  address: string
  ask: number
  arv: number
  assignmentFee: number
  ps: number
  status: 'saved' | 'archived' | 'deleted'
  route: 'alpha' | 'core' | 'blast'
  routeExpires: number
  buyers: { name: string; vs: number; cash: number }[]
  flagged: boolean
  unread: boolean
}

function CommandContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [time, setTime] = useState('')
  const [filter, setFilter] = useState(searchParams.get('status') || 'saved')

  useEffect(() => {
    setTime(new Date().toLocaleTimeString('en-US', {hour12: false}))
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', {hour12: false}))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const [deals, setDeals] = useState<Deal[]>([
    { id: '1', address: '1428 Maple Ave, Detroit MI', ask: 142000, arv: 245000, assignmentFee: 18000, ps: 94, status: 'saved', route: 'alpha', routeExpires: 1728, buyers: [{name: 'Marcus King', vs: 920, cash: 450000}, {name: 'Sarah Chen', vs: 880, cash: 320000}, {name: 'Devon Wright', vs: 850, cash: 280000}], flagged: true, unread: true },
    { id: '2', address: '8812 Oak St, Flint MI', ask: 98000, arv: 165000, assignmentFee: 12000, ps: 89, status: 'saved', route: 'core', routeExpires: 0, buyers: [{name: 'James Liu', vs: 790, cash: 180000}], flagged: false, unread: true },
    { id: '3', address: '3341 Pine Dr, Warren MI', ask: 75000, arv: 128000, assignmentFee: 8500, ps: 76, status: 'saved', route: 'blast', routeExpires: 0, buyers: [], flagged: false, unread: false },
    { id: '4', address: '9901 Elm Rd, Southfield MI', ask: 120000, arv: 185000, assignmentFee: 9500, ps: 68, status: 'archived', route: 'core', routeExpires: 0, buyers: [], flagged: false, unread: false },
  ])

  const filteredDeals = deals.filter(d => d.status === filter)
  const counts = {
    saved: deals.filter(d => d.status === 'saved').length,
    archived: deals.filter(d => d.status === 'archived').length,
    deleted: deals.filter(d => d.status === 'deleted').length,
  }

  const updateStatus = (id: string, newStatus: 'saved' | 'archived' | 'deleted') => {
    setDeals(deals.map(d => d.id === id ? {...d, status: newStatus} : d))
  }

  const toggleFlag = (id: string) => {
    setDeals(deals.map(d => d.id === id ? {...d, flagged: !d.flagged} : d))
  }

  const formatCurrency = (num: number) => `$${(num / 1000).toFixed(0)}K`
  const calcSpread = (deal: Deal) => ((deal.arv - deal.ask) / deal.arv * 100).toFixed(0)
  const calcProfit = (deal: Deal) => deal.arv - deal.ask - deal.assignmentFee

  const getBorder = (deal: Deal) => {
    if (deal.route === 'alpha') return 'border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.4)]'
    if (deal.ps >= 90) return 'border-[#FF3B30] shadow-[0_0_20px_rgba(255,59,48,0.4)]'
    return 'border-[#333]'
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setDeals(prev => prev.map(d => d.routeExpires > 0 ? {...d, routeExpires: d.routeExpires - 1} : d))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white font-mono p-4 pb-20">
      <div className="border-b border-[#333] pb-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-[#D4AF37] text-xl font-bold">DEAL ROOM</div>
            <div className="text-[#666] text-xs">COMMAND CENTER</div>
          </div>
          <div className="text-[#666] text-xs text-right">
            SESSION ACTIVE | {time} CST
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setFilter('saved')} className={`py-3 text-xs font-bold border ${filter === 'saved' ? 'border-[#D4AF37] bg-[#D4AF37] text-black' : 'border-[#333] text-[#666]'}`}>
            SAVED [{counts.saved}]
          </button>
          <button onClick={() => setFilter('archived')} className={`py-3 text-xs font-bold border ${filter === 'archived' ? 'border-[#FFA500] bg-[#FFA500] text-black' : 'border-[#333] text-[#666]'}`}>
            ARCHIVED [{counts.archived}]
          </button>
          <button onClick={() => setFilter('deleted')} className={`py-3 text-xs font-bold border ${filter === 'deleted' ? 'border-[#FF3B30] bg-[#FF3B30] text-white' : 'border-[#333] text-[#666]'}`}>
            DELETED [{counts.deleted}]
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredDeals.map((deal) => (
          <div key={deal.id} className={`border-2 bg-[#1a1a1a] p-4 relative ${getBorder(deal)}`}>
            {deal.unread && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#D4AF37] rounded-full animate-ping" />}

            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="text-white font-bold text-sm">{deal.address}</div>
                <div className="text-[#666] text-xs">PS: {deal.ps} | ASK: {formatCurrency(deal.ask)}</div>
              </div>
              <button onClick={() => toggleFlag(deal.id)} className={`text-2xl ${deal.flagged ? 'text-[#D4AF37]' : 'text-[#333]'}`}>
                ★
              </button>
            </div>

            {deal.route === 'alpha' && deal.routeExpires > 0 && (
              <div className="bg-[#D4AF37] text-black text-xs font-bold p-2 mb-3 text-center">
                ⚡ ROUTE: ALPHA VAULT → TOP 3 FIRST LOOK | {formatTime(deal.routeExpires)}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
              <div>
                <div className="text-[#666]">ARV</div>
                <div className="text-[#34C759] font-bold">{formatCurrency(deal.arv)}</div>
              </div>
              <div>
                <div className="text-[#666]">SPREAD</div>
                <div className="text-white font-bold">{calcSpread(deal)}%</div>
              </div>
              <div>
                <div className="text-[#666]">FEE</div>
                <div className="text-[#D4AF37] font-bold">{formatCurrency(deal.assignmentFee)}</div>
              </div>
              <div>
                <div className="text-[#666]">PROFIT</div>
                <div className="text-[#34C759] font-bold">{formatCurrency(calcProfit(deal))}</div>
              </div>
            </div>

            {deal.buyers.length > 0 && (
              <div className="mb-3">
                <div className="text-[#666] text-xs mb-2">MATCHED BUYERS:</div>
                <div className="flex gap-2">
                  {deal.buyers.map((b, i) => (
                    <div key={i} className="flex-1 border border-[#333] p-2 text-xs">
                      <div className="text-white font-bold">{b.name}</div>
                      <div className="text-[#D4AF37]">VS: {b.vs}</div>
                      <div className="text-[#666]">{formatCurrency(b.cash)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {deal.status !== 'archived' && (
                <button onClick={() => updateStatus(deal.id, 'archived')} className="bg-[#FFA500] text-black py-2 text-xs font-bold">
                  [ARCHIVE]
                </button>
              )}
              {deal.status !== 'deleted' && (
                <button onClick={() => updateStatus(deal.id, 'deleted')} className="bg-[#FF3B30] text-white py-2 text-xs font-bold">
                  [DELETE]
                </button>
              )}
              {deal.status !== 'saved' && (
                <button onClick={() => updateStatus(deal.id, 'saved')} className="bg-[#34C759] text-white py-2 text-xs font-bold col-span-2">
                  [RESTORE]
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D] border-t border-[#333] grid grid-cols-4 text-xs">
        <button onClick={() => router.push('/pain-room')} className="py-4 text-center hover:bg-[#1a1a1a] transition">
          <div className="text-[#FF3B30] font-bold">PAIN</div>
          <div className="text-[#666]">ROOM</div>
        </button>
        <button onClick={() => router.push('/command')} className="py-4 text-center bg-[#1a1a1a]">
          <div className="text-[#D4AF37] font-bold">DEAL</div>
          <div className="text-[#666]">ROOM</div>
        </button>
        <button onClick={() => router.push('/messages')} className="py-4 text-center hover:bg-[#1a1a1a] transition">
          <div className="text-white font-bold">MSG</div>
          <div className="text-[#666]">CENTER</div>
        </button>
        <button onClick={() => router.push('/dashboard')} className="py-4 text-center hover:bg-[#1a1a1a] transition">
          <div className="text-[#D4AF37] font-bold">HUB</div>
          <div className="text-[#666]">HOME</div>
        </button>
      </div>
    </main>
  )
}

export default function Command() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D0D0D] text-[#D4AF37] p-4">Loading Command...</div>}>
      <CommandContent />
    </Suspense>
  )
}
