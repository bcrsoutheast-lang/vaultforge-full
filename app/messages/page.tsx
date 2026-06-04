'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Message {
  id: string
  type: 'deal' | 'pain'
  status: 'saved' | 'archived' | 'deleted'
  from: string
  timestamp: string
  sellerName: string
  sellerPhone: string
  ps: number
  address: string
  ask: number
  arv: number
  spread: number
  unread: boolean
  flagged: boolean
}

function MessageCenterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'deal',
      status: 'saved',
      from: 'VaultForge OS',
      timestamp: '14 MIN AGO',
      sellerName: 'John Smith',
      sellerPhone: '404-555-0192',
      ps: 94,
      address: '123 Main St Atlanta, GA',
      ask: 180000,
      arv: 285000,
      spread: 22000,
      unread: true,
      flagged: false
    },
    {
      id: '2',
      type: 'pain',
      status: 'saved',
      from: 'VaultForge AI',
      timestamp: '1 HR AGO',
      sellerName: 'Lisa Johnson',
      sellerPhone: '404-555-0143',
      ps: 88,
      address: '456 Oak Ave Atlanta, GA',
      ask: 210000,
      arv: 295000,
      spread: 18000,
      unread: true,
      flagged: false
    }
  ])

  const counts = {
    dealSaved: messages.filter(m => m.type === 'deal' && m.status === 'saved').length,
    dealArchived: messages.filter(m => m.type === 'deal' && m.status === 'archived').length,
    dealDeleted: messages.filter(m => m.type === 'deal' && m.status === 'deleted').length,
    painSaved: messages.filter(m => m.type === 'pain' && m.status === 'saved').length,
    painArchived: messages.filter(m => m.type === 'pain' && m.status === 'archived').length,
    painDeleted: messages.filter(m => m.type === 'pain' && m.status === 'deleted').length
  }

  const unread = {
    dealSaved: messages.filter(m => m.type === 'deal' && m.status === 'saved' && m.unread).length,
    painSaved: messages.filter(m => m.type === 'pain' && m.status === 'saved' && m.unread).length
  }

  const updateMessageStatus = (id: string, newStatus: 'saved' | 'archived' | 'deleted') => {
    setMessages(prev => prev.map(m => m.id === id? {...m, status: newStatus, unread: false} : m))
  }

  const cards = [
    { key: 'dealSaved', label: 'DEAL MSG SAVED', count: counts.dealSaved, unread: unread.dealSaved, color: '#D4AF37' },
    { key: 'dealArchived', label: 'DEAL MSG ARCHIVED', count: counts.dealArchived, unread: 0, color: '#FFA500' },
    { key: 'dealDeleted', label: 'DEAL MSG DELETED', count: counts.dealDeleted, unread: 0, color: '#666' },
    { key: 'painSaved', label: 'PAIN MSG SAVED', count: counts.painSaved, unread: unread.painSaved, color: '#FF3B30' },
    { key: 'painArchived', label: 'PAIN MSG ARCHIVED', count: counts.painArchived, unread: 0, color: '#FFA500' },
    { key: 'painDeleted', label: 'PAIN MSG DELETED', count: counts.painDeleted, unread: 0, color: '#666' }
  ]

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white font-mono p-4">
      <div className="border-b border-[#333] pb-4 mb-4">
        <div className="text-[#D4AF37] text-lg font-bold">MESSAGE CENTER</div>
        <div className="text-[#666] text-xs">INBOX</div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {cards.map((card) => {
          const hasNew = card.unread > 0
          return (
            <button
              key={card.key}
              onClick={() => setFilter(card.key)}
              className={`border-2 p-3 text-left transition border-[#333] bg-[#0D0D0D] ${
                hasNew? `ring-2 animate-pulse` : ''
              }`}
              style={{ borderColor: hasNew? card.color : '#333' }}
            >
              <div className="text-xs font-bold mb-1" style={{ color: card.color }}>{card.label}</div>
              <div className="text-white text-2xl font-bold">{card.count}</div>
              <div className="text-[#666] text-xs mt-1">
                {card.unread > 0? `UNREAD: ${card.unread}` : card.key.includes('Deleted')? `TRASH: ${card.count}` : `FLAGGED: 0`}
              </div>
              <div className="text-xs mt-2" style={{ color: card.color }}>[VIEW ALL]</div>
            </button>
          )
        })}
      </div>

      <div className="space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`border-2 bg-[#1a1a1a] p-3 ${msg.type === 'deal'? 'border-[#D4AF37]' : 'border-[#FF3B30]'} ${msg.unread? 'animate-pulse' : ''}`}>
            <div className="flex justify-between mb-2">
              <div className="text-xs">
                <span className={`font-bold ${msg.type === 'deal'? 'text-[#D4AF37]' : 'text-[#FF3B30]'}`}>
                  {msg.type.toUpperCase()} MESSAGE
                </span>
                <span className="text-[#666] ml-2">FROM: {msg.from}</span>
                <span className="text-[#666] ml-2">{msg.timestamp}</span>
              </div>
            </div>
            
            <div className="border-t border-[#333] pt-2 mb-2">
              <div className="text-white text-sm">[SELLER] {msg.sellerName} | PS: {msg.ps} | {msg.sellerPhone}</div>
              <div className="text-white text-sm mt-1">{msg.address}</div>
              <div className="text-[#999] text-xs mt-1">ASK: ${(msg.ask/1000).toFixed(0)}K | ARV: ${(msg.arv/1000).toFixed(0)}K | SPREAD: ${(msg.spread/1000).toFixed(0)}K</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => updateMessageStatus(msg.id, 'saved')} className={`py-2 text-xs font-bold rounded ${msg.status === 'saved'? 'bg-[#34C759] text-white' : 'bg-[#1a1a1a] border border-[#333] text-[#999]'}`}>
                
              </button>
              <button onClick={() => updateMessageStatus(msg.id, 'archived')} className={`py-2 text-xs font-bold rounded ${msg.status === 'archived'? 'bg-[#FFA500] text-white' : 'bg-[#1a1a1a] border border-[#333] text-[#999]'}`}>
                [ARCHIVE]
              </button>
              <button onClick={() => updateMessageStatus(msg.id, 'deleted')} className={`py-2 text-xs font-bold rounded ${msg.status === 'deleted'? 'bg-[#FF3B30] text-white' : 'bg-[#1a1a1a] border border-[#333] text-[#999]'}`}>
                [DELETE]
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

export default function MessageCenter() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D0D0D] text-[#D4AF37] p-4">Loading Messages...</div>}>
      <MessageCenterContent />
    </Suspense>
  )
}
