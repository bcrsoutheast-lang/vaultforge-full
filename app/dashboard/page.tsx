'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface RouteCard {
  id: string
  title: string
  count: number
  sublabel: string
  hotCount?: number
  unread: boolean
  route: string
  color: 'gold' | 'red' | 'yellow' | 'green'
}

function DashboardContent() {
  const router = useRouter()
  const [time, setTime] = useState('')
  
  useEffect(() => {
    setTime(new Date().toLocaleTimeString('en-US', {hour12: false}))
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', {hour12: false}))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const [routes] = useState<RouteCard[]>([
    { id: 'pain-saved', title: 'PAIN SAVED', count: 47, sublabel: 'PS AVG: 74', hotCount: 8, unread: true, route: '/pain-room?status=saved', color: 'red' },
    { id: 'pain-archived', title: 'PAIN ARCHIVED', count: 12, sublabel: 'PS AVG: 61', unread: false, route: '/pain-room?status=archived', color: 'yellow' },
    { id: 'pain-deleted', title: 'PAIN DELETED', count: 3, sublabel: 'TRASH: 3', unread: false, route: '/pain-room?status=deleted', color: 'red' },
    { id: 'deal-saved', title: 'DEAL SAVED', count: 23, sublabel: 'AVG: $31K', hotCount: 3, unread: true, route: '/command?status=saved', color: 'gold' },
    { id: 'deal-archived', title: 'DEAL ARCHIVED', count: 8, sublabel: 'AVG: $18K', unread: false, route: '/command?status=archived', color: 'yellow' },
    { id: 'deal-deleted', title: 'DEAL DELETED', count: 2, sublabel: 'TRASH: 2', unread: false, route: '/command?status=deleted', color: 'gold' },
    { id: 'msg-deal-saved', title: 'DEAL MSG SAVED', count: 18, sublabel: 'UNREAD: 3', unread: true, route: '/messages?filter=dealSaved', color: 'gold' },
    { id: 'msg-pain-saved', title: 'PAIN MSG SAVED', count: 16, sublabel: 'UNREAD: 4', unread: true, route: '/messages?filter=painSaved', color: 'red' },
    { id: 'alpha-vault', title: 'ALPHA VAULT', count: 5, sublabel: 'TOP 3 FIRST LOOK', hotCount: 2, unread: true, route: '/command?status=saved&route=alpha', color: 'gold' }
  ])

  const totalLeads = 47
  const totalDeals = 23
  const totalMessages = 34
  const hotLeads = routes.find(r => r.id === 'pain-saved')?.hotCount || 0
  const alphaDeals = routes.find(r => r.id === 'alpha-vault')?.hotCount || 0

  const getBorderColor = (color: string) => {
    switch(color) {
      case 'gold': return 'border-[#D4AF37]'
      case 'red': return 'border-[#FF3B30]'
      case 'yellow': return 'border-[#FFA500]'
      case 'green': return 'border-[#34C759]'
      default: return 'border-[#333]'
    }
  }

  const getGlow = (route: RouteCard) => {
    if (route.unread && route.color === 'red') return 'shadow-[0_0_20px_rgba(255,59,48,0.6)]'
    if (route.unread && route.color === 'gold') return 'shadow-[0_0_20px_rgba(212,175,55,0.6)]'
    return ''
  }

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white font-mono p-4">
      <div className="border-b border-[#333] pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[#D4AF37] text-xl font-bold">VAULTFORGE OS</div>
            <div className="text-[#666] text-xs">COMMAND CENTER</div>
          </div>
          <div className="text-[#666] text-xs text-right">
            SESSION ACTIVE | {time} CST
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6 text-xs">
        <div className="border border-[#333] bg-[#1a1a1a] p-3">
          <div className="text-[#666]">PAIN LEADS</div>
          <div className="text-[#FF3B30] text-2xl font-bold">{totalLeads}</div>
          <div className="text-[#666]">HOT: {hotLeads}</div>
        </div>
        <div className="border border-[#333] bg-[#1a1a1a] p-3">
          <div className="text-[#666]">DEALS</div>
          <div className="text-[#D4AF37] text-2xl font-bold">{totalDeals}</div>
          <div className="text-[#666]">ALPHA: {alphaDeals}</div>
        </div>
        <div className="border border-[#333] bg-[#1a1a1a] p-3">
          <div className="text-[#666]">MESSAGES</div>
          <div className="text-white text-2xl font-bold">{totalMessages}</div>
          <div className="text-[#666]">UNREAD: 7</div>
        </div>
        <div className="border border-[#333] bg-[#1a1a1a] p-3">
          <div className="text-[#666]">PIPELINE</div>
          <div className="text-[#34C759] text-2xl font-bold">$1.2M</div>
          <div className="text-[#666]">EST ARV</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={() => router.push('/pain-intake')} className="bg-[#FF3B30] text-white py-4 text-sm font-bold rounded hover:bg-[#FF5252] transition">
          + NEW PAIN LEAD
        </button>
        <button onClick={() => router.push('/deal-intake')} className="bg-[#D4AF37] text-[#0D0D0D] py-4 text-sm font-bold rounded hover:bg-[#FFD700] transition">
          + NEW DEAL
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {routes.map((route) => (
          <button
            key={route.id}
            onClick={() => router.push(route.route)}
            className={`border-2 bg-[#1a1a1a] p-4 text-left transition relative ${getBorderColor(route.color)} ${getGlow(route)} ${route.unread? 'animate-pulse' : ''}`}
          >
            {route.unread && (
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping`} 
                   style={{ backgroundColor: route.color === 'red'? '#FF3B30' : '#D4AF37' }} />
            )}
            <div className="text-xs font-bold mb-2" 
                 style={{ color: route.color === 'gold'? '#D4AF37' : route.color === 'red'? '#FF3B30' : route.color === 'yellow'? '#FFA500' : '#34C759' }}>
              {route.title}
            </div>
            <div className="text-white text-3xl font-bold mb-1">{route.count}</div>
            <div className="text-[#666] text-xs mb-2">
              {route.sublabel}
              {route.hotCount && route.hotCount > 0 && (
                <span className={`ml-2 font-bold`} 
                      style={{ color: route.color === 'red'? '#FF3B30' : '#D4AF37' }}>
                  {route.id.includes('alpha')? '⚡' : '🔥'} {route.hotCount}
                </span>
              )}
            </div>
            <div className="text-xs" 
                 style={{ color: route.color === 'gold'? '#D4AF37' : route.color === 'red'? '#FF3B30' : route.color === 'yellow'? '#FFA500' : '#34C759' }}>
              [ENTER]
            </div>
          </button>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D] border-t border-[#333] grid grid-cols-4 text-xs">
        <button onClick={() => router.push('/pain-room')} className="py-4 text-center hover:bg-[#1a1a1a] transition">
          <div className="text-[#FF3B30] font-bold">PAIN</div>
          <div className="text-[#666]">ROOM</div>
          {routes.find(r => r.id === 'pain-saved')?.unread && (
            <div className="w-2 h-2 bg-[#FF3B30] rounded-full mx-auto mt-1 animate-pulse" />
          )}
        </button>
        <button onClick={() => router.push('/command')} className="py-4 text-center hover:bg-[#1a1a1a] transition">
          <div className="text-[#D4AF37] font-bold">DEAL</div>
          <div className="text-[#666]">ROOM</div>
          {routes.find(r => r.id === 'deal-saved')?.unread && (
            <div className="w-2 h-2 bg-[#D4AF37] rounded-full mx-auto mt-1 animate-pulse" />
          )}
        </button>
        <button onClick={() => router.push('/messages')} className="py-4 text-center hover:bg-[#1a1a1a] transition">
          <div className="text-white font-bold">MSG</div>
          <div className="text-[#666]">CENTER</div>
          {(routes.find(r => r.id === 'msg-deal-saved')?.unread || routes.find(r => r.id === 'msg-pain-saved')?.unread) && (
            <div className="w-2 h-2 bg-[#FF3B30] rounded-full mx-auto mt-1 animate-pulse" />
          )}
        </button>
        <button onClick={() => router.push('/dashboard')} className="py-4 text-center bg-[#1a1a1a]">
          <div className="text-[#D4AF37] font-bold">HUB</div>
          <div className="text-[#666]">HOME</div>
        </button>
      </div>
    </main>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D0D0D] text-[#D4AF37] p-4">Loading Hub...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
