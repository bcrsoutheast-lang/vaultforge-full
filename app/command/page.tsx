'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Buyer {
  id: string
  name: string
  vaultScore: number
  closes: number
  cash: number
  photo: string
}

interface Deal {
  id: string
  status: 'saved' | 'archived' | 'deleted'
  sellerName: string
  sellerPhone: string
  sellerEmail: string
  photo: string
  address: string
  city: string
  state: string
  beds: number
  baths: number
  sqft: number
  ask: number
  arv: number
  spread: number
  contractPrice: number
  rehab: number
  painScore: number
  vaultScore: number
  liens: string
  title: string
  closeDate: string
  exitStrategy: string
  route: 'ALPHA' | 'AUCTION' | 'EXCHANGE'
  buyersNotified: Buyer[]
  firstLook: number
  isNew: boolean
  unread: boolean
}

function DealRoomContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState(searchParams.get('status') || 'all')
  const [deals, setDeals] = useState<Deal[]>([
    {
      id: '1',
      status: 'saved',
      sellerName: 'John Smith',
      sellerPhone: '404-555-0192',
      sellerEmail: 'jsmith@gmail.com',
      photo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
      address: '123 Main St',
      city: 'Atlanta',
      state: 'GA',
      beds: 3,
      baths: 2,
      sqft: 1840,
      ask: 180000,
      arv: 285000,
      spread: 22000,
      contractPrice: 180000,
      rehab: 25000,
      painScore: 94,
      vaultScore: 820,
      liens: '$8.4K TAX',
      title: 'CLEAN',
      closeDate: '2026-06-17',
      exitStrategy: 'Wholesale',
      route: 'ALPHA',
      buyersNotified: [
        { id: 'jd', name: 'John D.', vaultScore: 847, closes: 12, cash: 340000, photo: 'https://i.pravatar.cc/150?img=1' },
        { id: 'mr', name: 'Mike R.', vaultScore: 832, closes: 9, cash: 210000, photo: 'https://i.pravatar.cc/150?img=2' },
        { id: 'sk', name: 'Sarah K.', vaultScore: 825, closes: 14, cash: 180000, photo: 'https://i.pravatar.cc/150?img=3' }
      ],
      firstLook: 1723,
      isNew: true,
      unread: true
    }
  ])

  const [timers, setTimers] = useState<Record<string, number>>({})

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const updated = {...prev}
        deals.forEach(deal => {
          if (deal.firstLook > 0 && deal.route === 'ALPHA') {
            const current = updated[deal.id]?? deal.firstLook
            if (current > 0) updated[deal.id] = current - 1
          }
        })
        return updated
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [deals])

  const counts = {
    saved: deals.filter(d => d.status === 'saved').length,
    archived: deals.filter(d => d.status === 'archived').length,
    deleted: deals.filter(d => d.status === 'deleted').length
  }

  const avgSpread = {
    saved: Math.round(deals.filter(d => d.status === 'saved').reduce((a,b) => a + b.spread, 0) / counts.saved / 1000 || 0),
    archived: Math.round(deals.filter(d => d.status === 'archived').reduce((a,b) => a + b.spread, 0) / counts.archived / 1000 || 0),
    deleted: Math.round(deals.filter(d => d.status === 'deleted').reduce((a,b) => a + b.spread, 0) / counts.deleted / 1000 || 0)
  }

  const alphaDeals = deals.filter(d => d.status === 'saved' && d.route === 'ALPHA').length
  const filteredDeals = filter === 'all'? deals.filter(d => d.status!== 'deleted') : deals.filter(d => d.status === filter)

  const updateDealStatus = (id: string, newStatus: 'saved' | 'archived' | 'deleted') => {
    setDeals(deals.map(d => d.id === id? {...d, status: newStatus, unread: false, isNew: false} : d))
  }

  const getBorderColor = (deal: Deal) => {
    if (deal.route === 'ALPHA') return 'border-[#D4AF37]'
    if (deal.route === 'AUCTION') return 'border-[#FFA500]'
    if (deal.painScore >= 90) return 'border-[#FF3B30]'
    return 'border-[#333]'
  }

  const getGlow = (deal: Deal) => {
    if (deal.route === 'ALPHA') return 'shadow-[0_0_20px_rgba(212,175,55,0.6)]'
    if (deal.painScore >= 90) return 'shadow-[0_0_20px_rgba(255,59,48,0.6)]'
    return ''
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white font-mono p-4">
      <div className="border-b border-[#333] pb-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[#D4AF37] text-lg font-bold">DEAL ROOM</div>
            <div className="text-[#666] text-xs">COMMAND CENTER</div>
          </div>
          <div className="text-[#666] text-xs text-right">
            SESSION ACTIVE | TOTAL: {deals.length} |<br/>
            {new Date().toLocaleTimeString('en-US', {hour12: false})} CST
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {(['saved', 'archived', 'deleted'] as const).map((status) => {
          const isActive = filter === status
          const hasNew = deals.some(d => d.status === status && d.unread)
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`border-2 p-3 text-left transition ${
                isActive? 'border-[#D4AF37] bg-[#1a1a1a]' : 'border-[#333] bg-[#0D0D0D]'
              } ${hasNew? 'ring-2 ring-[#D4AF37] animate-pulse' : ''}`}
            >
              <div className="text-[#D4AF37] text-xs font-bold mb-1">DEAL {status.toUpperCase()}</div>
              <div className="text-white text-2xl font-bold">{counts[status]}</div>
              <div className="text-[#666] text-xs mt-1">
                AVG: ${avgSpread[status]}K
                {status === 'saved' && alphaDeals > 0 && <span className="text-[#D4AF37] ml-2">ALPHA: {alphaDeals}</span>}
              </div>
              <div className="text-[#D4AF37] text-xs mt-2">[VIEW ALL]</div>
            </button>
          )
        })}
      </div>

      <button onClick={() => router.push('/dashboard')} className="mb-4 px-4 py-2 border border-[#333] text-[#999] text-xs hover:border-[#D4AF37]">
        BACK TO DASHBOARD
      </button>

      <div className="space-y-3">
        {filteredDeals.map((deal) => {
          const timeLeft = timers[deal.id]?? deal.firstLook
          const isFirstLook = deal.route === 'ALPHA' && timeLeft > 0
          
          return (
            <div key={deal.id} className={`border-2 bg-[#1a1a1a] p-3 transition relative ${getBorderColor(deal)} ${getGlow(deal)} ${deal.isNew? 'animate-pulse' : ''}`}>
              {deal.unread && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#D4AF37] rounded-full animate-ping" />}
              
              <div className="flex justify-between items-start mb-3 pb-3 border-b border-[#333]">
                <div className="flex gap-3">
                  <img src={deal.photo} alt="" className="w-16 h-16 object-cover rounded" />
                  <div>
                    <div className="text-white text-sm font-bold">{deal.sellerName.toUpperCase()}</div>
                    <div className="text-[#666] text-xs">Owner | {deal.city}, {deal.state}</div>
                    <div className="text-[#D4AF37] text-xs mt-1">{deal.sellerPhone}</div>
                    <div className="text-[#666] text-xs">{deal.sellerEmail}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#D4AF37] text-sm font-bold">VS: {deal.vaultScore} ⚡</div>
                  <div className="text-[#FF3B30] text-xs mt-1">PS: {deal.painScore} 🔥</div>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-white text-sm font-bold mb-1">{deal.address.toUpperCase()} {deal.city.toUpperCase()}, {deal.state}</div>
                <div className="text-[#999] text-xs">{deal.beds}BD {deal.baths}BA {deal.sqft.toLocaleString()}SQFT | CONTRACT: ${(deal.contractPrice/1000).toFixed(0)}K</div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                <div><div className="text-[#666]">ARV</div><div className="text-white font-bold">${(deal.arv/1000).toFixed(0)}K</div></div>
                <div><div className="text-[#666]">REHAB</div><div className="text-white font-bold">${(deal.rehab/1000).toFixed(0)}K</div></div>
                <div><div className="text-[#666]">PROFIT</div><div className="text-[#D4AF37] font-bold">${(deal.spread/1000).toFixed(0)}K</div></div>
                <div><div className="text-[#666]">%</div><div className="text-white font-bold">{Math.round((deal.spread/deal.arv)*100)}%</div></div>
              </div>

              <div className="text-xs mb-3 pb-3 border-b border-[#333]">
                <span className="text-[#666]">LIENS:</span> <span className="text-white">{deal.liens}</span>
                <span className="text-[#666] ml-3">TITLE:</span> <span className="text-white">{deal.title}</span>
                <span className="text-[#666] ml-3">CLOSE:</span> <span className="text-white">{deal.closeDate}</span>
              </div>

              <div className="mb-3 pb-3 border-b border-[#333]">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs">
                    <span className="text-[#666]">ROUTE:</span> 
                    <span className={`ml-2 font-bold ${
                      deal.route === 'ALPHA'? 'text-[#D4AF37]' : 
                      deal.route === 'AUCTION'? 'text-[#FFA500]' : 'text-[#999]'
                    }`}>
                      {deal.route} VAULT {isFirstLook && `→ TOP 3 FIRST LOOK`}
                    </span>
                  </div>
                  {isFirstLook && (
                    <div className={`text-xs font-bold ${timeLeft < 300? 'text-[#FF3B30] animate-pulse' : 'text-[#D4AF37]'}`}>
                      {formatTime(timeLeft)} LEFT
                    </div>
                  )}
                </div>
                
                {deal.buyersNotified.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {deal.buyersNotified.map(buyer => (
                      <div key={buyer.id} className="flex items-center gap-1 bg-[#0D0D0D] px-2 py-1 rounded border border-[#333]">
                        <img src={buyer.photo} alt="" className="w-4 h-4 rounded-full" />
                        <span className="text-[#D4AF37] text-xs font-bold">VS {buyer.vaultScore}</span>
                        <button className="text-[#666] text-xs hover:text-[#D4AF37]">[MSG]</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => updateDealStatus(deal.id, 'saved')} className={`py-3 text-xs font-bold rounded transition ${deal.status === 'saved'? 'bg-[#34C759] text-white' : 'bg-[#1a1a1a] border border-[#333] text-[#999] hover:border-[#34C759]'}`}>
                  
                </button>
                <button onClick={() => updateDealStatus(deal.id, 'archived')} className={`py-3 text-xs font-bold rounded transition ${deal.status === 'archived'? 'bg-[#FFA500] text-white' : 'bg-[#1a1a1a] border border-[#333] text-[#999] hover:border-[#FFA500]'}`}>
                  [ARCHIVE]
                </button>
                <button onClick={() => updateDealStatus(deal.id, 'deleted')} className={`py-3 text-xs font-bold rounded transition ${deal.status === 'deleted'? 'bg-[#FF3B30] text-white' : 'bg-[#1a1a1a] border border-[#333] text-[#999] hover:border-[#FF3B30]'}`}>
                  [DELETE]
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}

export default function DealRoom() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D0D0D] text-[#D4AF37] p-4">Loading Deal Room...</div>}>
      <DealRoomContent />
    </Suspense>
  )
}
