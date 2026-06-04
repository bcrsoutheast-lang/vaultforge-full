'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Message {
  id: string
  type: 'deal' | 'pain'
  status: 'saved' | 'archived' | 'deleted'
  sender: string
  timestamp: string
  seller: { name: string; ps: number; address: string }
  deal: { ask: number; arv: number; spread: number }
  message: string
  unread: boolean
  flagged: boolean
}

function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [time, setTime] = useState('')
  const [filter, setFilter] = useState(searchParams.get('filter') || 'dealSaved')

  useEffect(() => {
    setTime(new Date().toLocaleTimeString('en-US', {hour12: false}))
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', {hour12: false}))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', type: 'deal', status: 'saved', sender: 'VaultForge AI', timestamp: '2m ago', seller: { name: 'James Wilson', ps: 94, address: '1428 Maple Ave' }, deal: { ask: 142000, arv: 245000, spread: 42 }, message: 'ALPHA buyer Marcus King wants to walk this property ASAP. Cash ready.', unread: true, flagged: true },
    { id: '2', type: 'deal', status: 'saved', sender: 'VaultForge AI', timestamp: '8m ago', seller: { name: 'Maria Gonzalez', ps: 89, address: '8812 Oak St' }, deal: { ask: 98000, arv: 165000, spread: 40 }, message: 'Sarah Chen submitted proof of funds. Ready to assign.', unread: true, flagged: false },
    { id: '3', type: 'pain', status: 'saved', sender: 'VaultForge AI', timestamp: '15m ago', seller: { name: 'Robert Chen', ps: 76, address: '3341 Pine Dr' }, deal: { ask: 75000, arv: 128000, spread: 41 }, message: 'Seller motivation increased. Divorce finalized. PS now 76.', unread: true, flagged: false },
    { id: '4', type: 'deal', status: 'archived', sender: 'VaultForge AI', timestamp: '1h ago', seller: { name: 'Lisa Johnson', ps: 68, address: '9901 Elm Rd' }, deal: { ask: 120000, arv: 185000, spread: 35 }, message: 'Deal closed. Assignment fee $9,500 collected.', unread: false, flagged: false },
  ])

  const filterMap = {
    dealSaved: { type: 'deal', status: 'saved' },
    dealArchived: { type: 'deal', status: 'archived' },
    dealDeleted: { type: 'deal', status: 'deleted' },
    painSaved: { type: 'pain', status: 'saved' },
    painArchived: { type: 'pain', status: 'archived' },
    painDeleted: { type: 'pain', status: 'deleted' },
  }

  const currentFilter = filterMap[filter as keyof typeof filterMap] || filterMap.dealSaved
  const filteredMessages = messages.filter(m => m.type === currentFilter.type && m.status === currentFilter.status)

  const counts = {
    dealSaved: messages.filter(m => m.type === 'deal' && m.status === 'saved').length,
    dealArchived: messages.filter(m => m.type === 'deal' && m.status === 'archived').length,
    dealDeleted: messages.filter(m => m.type === 'deal' && m.status === 'deleted').length,
    painSaved: messages.filter(m => m.type === 'pain' && m.status === 'saved').length,
    painArchived: messages.filter(m => m.type === 'pain' && m.status === 'archived').length,
    painDeleted: messages.filter(m => m.type === 'pain' && m.status === 'deleted').length,
  }

  const updateStatus = (id: string, newStatus: 'saved' | 'archived' | 'deleted') => {
    setMessages(messages.map(m => m.id === id ? {...m, status: newStatus} : m))
  }

  const formatCurrency = (num: number) => `$${(num / 1000).toFixed(0)}K`

  const getBorderColor = (type: string) => {
    return type === 'deal' ? 'border-[#D4AF37]' : 'border-[#FF3B30]'
  }

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white font-mono p-4 pb-20">
      <div className="border-b border-[#333] pb-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-white text-xl font-bold">MESSAGE CENTER</div>
            <div className="text-[#666] text-xs">VAULTFORGE AI</div>
          </div>
          <div className="text-[#666] text-xs text-right">
            SESSION ACTIVE | {time} CST
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-2">
          <button onClick={() => setFilter('dealSaved')} className={`py-2 text-xs font-bold border ${filter === 'dealSaved' ? 'border-[#D4AF37] bg-[#D4AF37] text-black' : 'border-[#333] text-[#666]'}`}>
            DEAL SAVED [{counts.dealSaved}]
          </button>
          <button onClick={() => setFilter('dealArchived')} className={`py-2 text-xs font-bold border ${filter === 'dealArchived' ? 'border-[#FFA500] bg-[#FFA500] text-black' : 'border-[#333] text-[#666]'}`}>
            ARCHIVED [{counts.dealArchived}]
          </button>
          <button onClick={() => setFilter('dealDeleted')} className={`py-2 text-xs font-bold border ${filter === 'dealDeleted' ? 'border-[#FF3B30] bg-[#FF3B30] text-white' : 'border-[#333] text-[#666]'}`}>
            DELETED [{counts.dealDeleted}]
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setFilter('painSaved')} className={`py-2 text-xs font-bold border ${filter === 'painSaved' ? 'border-[#FF3B30] bg-[#FF3B30] text-white' : 'border-[#333] text-[#666]'}`}>
            PAIN SAVED [{counts.painSaved}]
          </button>
          <button onClick={() => setFilter('painArchived')} className={`py-2 text-xs font-bold border ${filter === 'painArchived' ? 'border-[#FFA500] bg-[#FFA500] text-black' : 'border-[#333] text-[#666]'}`}>
            ARCHIVED [{counts.painArchived}]
          </button>
          <button onClick={() => setFilter('painDeleted')} className={`py-2 text-xs font-bold border ${filter === 'painDeleted' ? 'border-[#FF3B30] bg-[#FF3B30] text-white' : 'border-[#333] text-[#666]'}`}>
            DELETED [{counts.painDeleted}]
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredMessages.map((msg) => (
          <div key={msg.id} className={`border-2 bg-[#1a1a1a] p-4 relative ${getBorderColor(msg.type)}`}>
            {msg.unread && <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping ${msg.type === 'deal' ? 'bg-[#D4AF37]' : 'bg-[#FF3B30]'}`} />}

            <div className="flex justify-between items-start mb-3">
              <div>
                <div className={`text-xs font-bold ${msg.type === 'deal' ? 'text-[#D4AF37]' : 'text-[#FF3B30]'}`}>
                  {msg.sender} • {msg.timestamp}
                </div>
                <div className="text-white font-bold text-sm mt-1">{msg.seller.address}</div>
                <div className="text-[#666] text-xs">Seller: {msg.seller.name} | PS: {msg.seller.ps}</div>
              </div>
              <div className={`text-2xl ${msg.flagged ? 'text-[#D4AF37]' : 'text-[#333]'}`}>★</div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
              <div>
                <div className="text-[#666]">ASK</div>
                <div className="text-white font-bold">{formatCurrency(msg.deal.ask)}</div>
              </div>
              <div>
                <div className="text-[#666]">ARV</div>
                <div className="text-[#34C759] font-bold">{formatCurrency(msg.deal.arv)}</div>
              </div>
              <div>
                <div className="text-[#666]">SPREAD</div>
                <div className="text-white font-bold">{msg.deal.spread}%</div>
              </div>
            </div>

            <div className="bg-[#0D0D0D] border border-[#333] p-3 mb-3">
              <div className="text-[#D4AF37] text-xs font-bold mb-1">MESSAGE:</div>
              <div className="text-white text-xs">{msg.message}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {msg.status !== 'archived' && (
                <button onClick={() => updateStatus(msg.id, 'archived')} className="bg-[#FFA500] text-black py-2 text-xs font-bold">
                  [ARCHIVE]
                </button>
              )}
              {msg.status !== 'deleted' && (
                <button onClick={() => updateStatus(msg.id, 'deleted')} className="bg-[#FF3B30] text-white py-2 text-xs font-bold">
                  [DELETE]
                </button>
              )}
              {msg.status !== 'saved' && (
                <button onClick={() => updateStatus(msg.id, 'saved')} className="bg-[#34C759] text-white py-2 text-xs font-bold col-span-2">
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
        <button onClick={() => router.push('/command')} className="py-4 text-center hover:bg-[#1a1a1a] transition">
          <div className="text-[#D4AF37] font-bold">DEAL</div>
          <div className="text-[#666]">ROOM</div>
        </button>
        <button onClick={() => router.push('/messages')} className="py-4 text-center bg-[#1a1a1a]">
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

export default function Messages() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D0D0D] text-[#D4AF37] p-4">Loading Messages...</div>}>
      <MessagesContent />
    </Suspense>
  )
}
