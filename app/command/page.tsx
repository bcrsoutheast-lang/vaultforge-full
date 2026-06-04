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
  phone: string
  email: string
  lastActive: string
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
  zip: string
  beds: number
  baths: number
  sqft: number
  yearBuilt: number
  ask: number
  arv: number
  spread: number
  contractPrice: number
  rehab: number
  painScore: number
  vaultScore: number
  liens: string
  title: string
  dom: number
  closeDate: string
  exitStrategy: string
  motivation: string[]
  route: 'ALPHA' | 'AUCTION' | 'EXCHANGE'
  buyersNotified: Buyer[]
  firstLook: number
  bidCount: number
  highBid: number
  isNew: boolean
  unread: boolean
  flagged: boolean
  notes: string
  photos: string[]
}

function DealRoomContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [time, setTime] = useState('')
  const [filter, setFilter] = useState(searchParams.get('status') || 'all')
  
  useEffect(() => {
    setTime(new Date().toLocaleTimeString('en-US', {hour12: false}))
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', {hour12: false}))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

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
      zip: '30308',
      beds: 3,
      baths: 2,
      sqft: 1840,
      yearBuilt: 1985,
      ask: 180000,
      arv: 285000,
      spread: 22000,
      contractPrice: 180000,
      rehab: 25000,
      painScore: 94,
      vaultScore: 820,
      liens: '$8.4K TAX',
      title: 'CLEAN',
      dom: 187,
      closeDate: '2026-06-17',
      exitStrategy: 'Wholesale',
      motivation: ['DIVORCE', 'FORECLOSURE NOD', 'PROBATE'],
      route: 'ALPHA',
      buyersNotified: [
        { id: 'jd', name: 'John D.', vaultScore: 847, closes: 12, cash: 340000, photo: 'https://i.pravatar.cc/150?img=1', phone: '404-555-1001', email: 'jd@vault.com', lastActive: '2h ago' },
        { id: 'mr', name: 'Mike R.', vaultScore: 832, closes: 9, cash: 210000, photo: 'https://i.pravatar.cc/150?img=2', phone: '404-555-1002', email: 'mr@vault.com', lastActive: '1h ago' },
        { id: 'sk', name: 'Sarah K.', vaultScore: 825, closes: 14, cash: 180000, photo: 'https://i.pravatar.cc/150?img=3', phone: '404-555-1003', email: 'sk@vault.com', lastActive: '5m ago' }
      ],
      firstLook: 1723,
      bidCount: 0,
      highBid: 0,
      isNew: true,
      unread: true,
      flagged: false,
      notes: 'Seller motivated. Wants 15 day close. Divorce case.',
      photos: [
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400',
        'https://images.unsplash.com/photo-1518780664697-55e365304249?w=400'
      ]
    },
    {
      id: '2',
      status: 'archived',
      sellerName: 'Lisa Johnson',
      sellerPhone: '404-555-0143',
      sellerEmail: 'lisa@gmail.com',
      photo: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400',
      address: '456 Oak Ave',
      city: 'Atlanta',
      state: 'GA',
      zip: '30309',
      beds: 4,
      baths: 2,
      sqft: 2100,
      yearBuilt: 1992,
      ask: 210000,
      arv: 295000,
      spread: 18000,
      contractPrice: 205000,
      rehab: 32000,
      painScore: 72,
      vaultScore: 701,
      liens: '$4.2K TAX',
      title: 'CLEAN',
      dom: 120,
      closeDate: '2026-07-01',
      exitStrategy: 'Fix & Flip',
      motivation: ['TIRED LANDLORD'],
      route: 'AUCTION',
      buyersNotified: [],
      firstLook: 0,
      bidCount: 7,
      highBid: 208000,
      isNew: false,
      unread: false,
      flagged: true,
      notes: 'Tenant occupied. Needs eviction.',
      photos: [
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400'
      ]
    },
    {
      id: '3',
      status: 'saved',
      sellerName: 'Robert Chen',
      sellerPhone: '404-555-0177',
      sellerEmail: 'rchen@gmail.com',
      photo: 'https://images.unsplash.com/photo-1518780664697-55e365304249?w=400',
      address: '789 Pine Rd',
      city: 'Atlanta',
      state: 'GA',
      zip: '30310',
      beds: 5,
      baths: 3,
      sqft: 2800,
      yearBuilt: 2001,
      ask: 295000,
      arv: 420000,
      spread: 45000,
      contractPrice: 290000,
      rehab: 40000,
      painScore: 88,
      vaultScore: 910,
      liens: 'NONE',
      title: 'CLEAN',
      dom: 45,
      closeDate: '2026-06-25',
      exitStrategy: 'BRRRR',
      motivation: ['JOB RELOCATION', 'OUT OF STATE'],
      route: 'ALPHA',
      buyersNotified: [
        { id: 'tl', name: 'Tom L.', vaultScore: 901, closes: 22, cash: 500000, photo: 'https://i.pravatar.cc/150?img=4', phone: '404-555-1004', email: 'tl@vault.com', lastActive: '30m ago' },
        { id: 'ab', name: 'Amy B.', vaultScore: 888, closes: 18, cash: 425000, photo: 'https://i.pravatar.cc/150?img=5', phone: '404-555-1005', email: 'ab@vault.com', lastActive: '1h ago' }
      ],
      firstLook: 0,
      bidCount: 0,
      highBid: 0,
      isNew: false,
      unread: false,
      flagged: false,
      notes: 'Corporate relocation. Must close by end of month.',
      photos: [
        'https://images.unsplash.com/photo-1518780664697-55e365304249?w=400',
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400'
      ]
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
    saved: Math.round(deals.filter(d => d.status === 'saved').reduce((a,b) => a + b.spread, 0) / (counts.saved || 1) / 1000),
    archived: Math.round(deals.filter(d => d.status === 'archived').reduce((a,b) => a + b.spread, 0) / (counts.archived || 1) / 1000),
    deleted: Math.round(deals.filter(d => d.status === 'deleted').reduce((a,b) => a + b.spread, 0) / (counts.deleted || 1) / 1000)
  }

  const alphaDeals = deals.filter(d => d.status === 'saved' && d.route === 'ALPHA').length
  const unreadCount = deals.filter(d => d.unread).length
  const filteredDeals = filter === 'all'? deals.filter(d => d.status!== 'deleted') : deals.filter(d => d.status === filter)

  const updateDealStatus = (id: string, newStatus: 'saved' | 'archived' | 'deleted') => {
    setDeals(prev => prev.map(d => d.id === id? {...d, status: newStatus, unread: false, isNew: false} : d))
  }

  const toggleFlag = (id: string) => {
    setDeals(prev => prev.map(d => d.id === id? {...d, flagged:!d.flagged} : d))
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
            SESSION ACTIVE | TOTAL: {deals.length} | UNREAD: {unreadCount} |<br/>
            {time} CST
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

      <div className="flex gap-3 mb-4">
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 border border-[#333] text-[#999] text-xs hover:border-[#D4AF37]">
          BACK TO DASHBOARD
        </button>
        <button onClick={() => router.push('/deal-intake')} className="px-4 py-2 bg-[#D4AF37] text-[#0D0D0D] text-xs font-bold hover:bg-[#FFD700]">
          + NEW DEAL
        </button>
      </div>

      <div className="space-y-3">
        {filteredDeals.map((deal) => {
          const timeLeft = timers[deal.id]?? deal.firstLook
          const isFirstLook = deal.route === 'ALPHA' && timeLeft > 0
          
          return (
            <div key={deal.id} className={`border-2 bg-[#1a1a1a] p-3 transition relative ${getBorderColor(deal)} ${getGlow(deal)} ${deal.isNew? 'animate-pulse' : ''}`}>
              {deal.unread && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#D4AF37] rounded-full animate-ping" />}
              {deal.flagged && <div className="absolute -top-1 -left-1 text-[#FF3B30] text-lg">🚩</div>}
              
              <div className="flex justify-between items-start mb-3 pb-3 border-b border-[#333]">
                <div className="flex gap-3">
                  <img src={deal.photo} alt="" className="w-16 h-16 object-cover rounded" />
                  <div>
                    <div className="text-white text-sm font-bold">{deal.sellerName.toUpperCase()}</div>
                    <div className="text-[#666] text-xs">Owner | {deal.city}, {deal.state} {deal.zip}</div>
                    <div className="text-[#D4AF37] text-xs mt-1">{deal.sellerPhone}</div>
                    <div className="text-[#666] text-xs">{deal.sellerEmail}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#D4AF37] text-sm font-bold">VS: {deal.vaultScore} ⚡</div>
                  <div className="text-[#FF3B30] text-xs mt-1">PS: {deal.painScore} 🔥</div>
                  <button onClick={() => toggleFlag(deal.id)} className="text-xs mt-1 hover:text-[#FF3B30]">
                    {deal.flagged? 'UNFLAG' : 'FLAG'}
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-white text-sm font-bold mb-1">{deal.address.toUpperCase()} {deal.city.toUpperCase()}, {deal.state}</div>
                <div className="text-[#999] text-xs">{deal.beds}BD {deal.baths}BA {deal.sqft.toLocaleString()}SQFT | BUILT {deal.yearBuilt} | CONTRACT: ${(deal.contractPrice/1000).toFixed(0)}K</div>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-3 text-xs">
                <div><div className="text-[#666]">ASK</div><div className="text-[#D4AF37] font-bold">${(deal.ask/1000).toFixed(0)}K</div></div>
                <div><div className="text-[#666]">ARV</div><div className="text-white font-bold">${(deal.arv/1000).toFixed(0)}K</div></div>
                <div><div className="text-[#666]">REHAB</div><div className="text-white font-bold">${(deal.rehab/1000).toFixed(0)}K</div></div>
                <div><div className="text-[#666]">PROFIT</div><div className="text-[#D4AF37] font-bold">${(deal.spread/1000).toFixed(0)}K</div></div>
                <div><div className="text-[#666]">%</div><div className="text-white font-bold">{Math.round((deal.spread/deal.arv)*100)}%</div></div>
              </div>

              <div className="text-xs mb-3 pb-3 border-b border-[#333]">
                <span className="text-[#666]">LIENS:</span> <span className="text-white">{deal.liens}</span>
                <span className="text-[#666] ml-3">TITLE:</span> <span className="text-white">{deal.title}</span>
                <span className="text-[#666] ml-3">DOM:</span> <span className="text-white">{deal.dom}</span>
                <span className="text-[#666] ml-3">CLOSE:</span> <span className="text-white">{deal.closeDate}</span>
              </div>

              <div className="text-xs mb-3">
                <span className="text-[#666]">MOTIVATION:</span> 
                <span className="text-[#FF3B30] ml-2">{deal.motivation.join(' + ')}</span>
                <span className="text-[#666] ml-3">EXIT:</span> 
                <span className="text-[#D4AF37] ml-2
