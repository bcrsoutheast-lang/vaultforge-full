'use client'

import { Suspense, useState, useEffect } from 'react'
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
  sellerEmail: string
  ps: number
  vs?: number
  address: string
  ask: number
  arv: number
  spread: number
  unread: boolean
  flagged: boolean
  photo: string
}

function MessageCenterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [time, setTime] = useState('')
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all')
  
  useEffect(() => {
    setTime(new Date().toLocaleTimeString('en-US', {hour12: false}))
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', {hour12: false}))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'deal',
      status: 'saved',
      from: 'VaultForge OS',
      timestamp: '14 MIN AGO',
      sellerName: 'John Smith',
      sellerPhone: '404-555-0192',
      sellerEmail: 'jsmith@gmail.com',
      ps: 94,
      vs: 820,
      address: '123 Main St Atlanta, GA',
      ask: 180000,
      arv: 285000,
      spread: 22000,
      unread: true,
      flagged: false,
      photo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'
    },
    {
      id: '2',
      type: 'pain',
      status: 'saved',
      from: 'VaultForge AI',
      timestamp: '1 HR AGO',
      sellerName: 'Lisa Johnson',
      sellerPhone: '404-555-0143',
      sellerEmail: 'lisa@gmail.com',
      ps: 88,
      vs: 701,
      address: '456 Oak Ave Atlanta, GA',
      ask: 210000,
      arv: 295000,
      spread: 18000,
      unread: true,
      flagged: false,
      photo: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400'
    }
  ])

  const counts = {
    dealSaved: messages.filter(function(m) { return m.type === 'deal' && m.status === 'saved' }).length,
    dealArchived: messages.filter(function(m) { return m.type === 'deal' && m.status === 'archived' }).length,
    dealDeleted: messages.filter(function(m) { return m.type === 'deal' && m.status === 'deleted' }).length,
    painSaved: messages.filter(function(m) { return m.type === 'pain' && m.status === 'saved' }).length,
    painArchived: messages.filter(function(m) { return m.type === 'pain' && m.status === 'archived' }).length,
    painDeleted: messages.filter(function(m) { return m.type === 'pain' && m.status === 'deleted' }).length
  }

  const unread = {
    dealSaved: messages.filter(function(m) { return m.type === 'deal' && m.status === 'saved' && m.unread }).length,
    dealArchived: messages.filter(function(m) { return m.type === 'deal' && m.status === 'archived' && m.unread }).length,
    dealDeleted: messages.filter(function(m) { return m.type === 'deal' && m.status === 'deleted' && m.unread }).length,
    painSaved: messages.filter(function(m) { return m.type === 'pain' && m.status === 'saved' && m.unread }).length,
    painArchived: messages.filter(function(m) { return m.type === 'pain' && m.status === 'archived' && m.unread }).length,
    painDeleted: messages.filter(function(m) { return m.type === 'pain' && m.status === 'deleted' && m.unread }).length
  }

  const updateMessageStatus = (id: string, newStatus: 'saved' | 'archived' | 'deleted') => {
    setMessages(function(prev) {
      return prev.map(function(m) {
        return m.id === id? {...m, status: newStatus, unread: false} : m
      })
    })
  }

  const toggleFlag = (id: string) => {
    setMessages(function(prev) {
      return prev.map(function(m) {
        return m.id === id? {...m, flagged:!m.flagged} : m
      })
    })
  }

  const cards = [
    { key: 'dealSaved', label: 'DEAL MSG SAVED', count: counts.dealSaved, unread: unread.dealSaved, color: '#D4AF37' },
    { key: 'dealArchived', label: 'DEAL MSG ARCHIVED', count: counts.dealArchived, unread: unread.dealArchived, color: '#FFA500' },
    { key: 'dealDeleted', label: 'DEAL MSG DELETED', count: counts.dealDeleted, unread: unread.dealDeleted, color: '#666' },
    { key: 'painSaved', label: 'PAIN MSG SAVED', count: counts.painSaved, unread: unread.painSaved, color: '#FF3B30' },
    { key: 'painArchived', label: 'PAIN MSG ARCHIVED', count: counts.painArchived, unread: unread.painArchived, color: '#FFA500' },
    { key: 'painDeleted', label: 'PAIN MSG DELETED', count: counts.painDeleted, unread: unread.painDeleted, color: '#666' }
  ]

  const filteredMessages = filter === 'all' 
   ? messages.filter(function(m) { return m.status!== 'deleted' })
    : messages.filter(function(m) {
        if (filter === 'dealSaved') return m.type === 'deal' && m.status === 'saved'
        if (filter === 'dealArchived') return m.type === 'deal' && m.status === 'archived'
        if (filter === 'dealDeleted') return m.type === 'deal' && m.status === 'deleted'
        if (filter === 'painSaved') return m.type === 'pain' && m.status === 'saved'
        if (filter === 'painArchived') return m.type === 'pain' && m.status === 'archived'
        if (filter === 'painDeleted') return m.type === 'pain' && m.status === 'deleted'
        return true
      })

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white font-mono p-4">
      <div className="border-b border-[#333] pb-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[#D4AF37] text-lg font-bold">MESSAGE CENTER</div>
            <div className="text-[#666] text-xs">INBOX</div>
          </div>
          <div className="text-[#666] text-xs text-right">
            TOTAL: {messages.length} | UNREAD: {messages.filter(function(m) { return m.unread }).length} |<br/>
            {time} CST
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {cards.map(function(card) {
          const hasNew = card.unread > 0
          return (
            <button
              key={card.key}
              onClick={function() { setFilter(card.key) }}
              className={'border-2 p-3 text-left transition ' + (filter === card.key? 'border-[#D4AF37] bg-[#1a1a1a]' : 'border-[#333] bg-[#0D0D0D]') + (hasNew? ' ring-2 animate-pulse' : '')}
              style={{ borderColor: hasNew? card.color : '#333' }}
            >
              <div className="text-xs font-bold mb-1" style={{ color: card.color }}>{card.label}</div>
              <div className="text-white text-2xl font-bold">{card.count}</div>
              <div className="text-[#666] text-xs mt-1">
                {card.unread > 0? 'UNREAD: ' + card.unread : card.key.includes('Deleted')? 'TRASH: ' + card.count : 'FLAGGED: 0'}
              </div>
              <div className="text-xs mt-2" style={{ color: card.color }}>[VIEW ALL]</div>
            </button>
          )
        })}
      </div>

      <button onClick={function() { router.push('/dashboard') }} className="mb-4 px-4 py-2 border border-[#333] text-[#999] text-xs hover:border-[#D4AF37]">
        BACK TO DASHBOARD
      </button>

      <div className="space-y-3">
        {filteredMessages.map(function(msg) {
          return (
            <div key={msg.id} className={'border-2 bg-[#1a1a1a] p-3 transition relative ' + (msg.type === 'deal'? 'border-[#D4AF37]' : 'border-[#FF3B30]') + (msg.unread? ' animate-pulse' : '')}>
              {msg.unread && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping"
                     style={{ backgroundColor: msg.type === 'deal'? '#D4AF37' : '#FF3B30' }} />
              )}
              {msg.flagged && <div className="absolute -top-1 -left-1 text-[#FF3B30] text-lg">🚩</div>}
              
              <div className="flex justify-between mb-2">
                <div className="text-xs">
                  <span className="font-bold" style={{ color: msg.type === 'deal'? '#D4AF37' : '#FF3B30' }}>
                    {msg.type.toUpperCase()} MESSAGE
                  </span>
                  <span className="text-[#666] ml-2">FROM: {msg.from}</span>
                  <span className="text-[#666] ml-2">{msg.timestamp}</span>
                </div>
                <button onClick={function() { toggleFlag(msg.id) }} className="text-xs hover:text-[#FF3B30]">
                  {msg.flagged? 'UNFLAG' : 'FLAG'}
                </button>
              </div>
              
              <div className="border-t border-[#333] pt-2 mb-2">
                <div className="flex gap-3 mb-2">
                  <img src={msg.photo} alt="" className="w-12 h-12 object-cover rounded" />
                  <div>
                    <div className="text-white text-sm font-bold">[SELLER] {msg.sellerName}</div>
                    <div className="text-[#666] text-xs">PS: {msg.ps} {msg.vs? '| VS: ' + msg.vs : ''} | {msg.sellerPhone}</div>
                    <div className="text-[#666] text-xs">{msg.sellerEmail}</div>
                  </div>
                </div>
                <div className="text-white text-sm">{msg.address}</div>
                <div className="text-[#999] text-xs mt-1">
                  ASK: ${(msg.ask/1000).toFixed(0)}K | ARV: ${(msg.arv/1000).toFixed(0)}K | SPREAD: ${(msg.spread/1000).toFixed(0)}K
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button onClick={function() { updateMessageStatus(msg.id, 'saved') }} className={'py-2 text-xs font-bold rounded transition ' + (msg.status === 'saved'? 'bg-[#34C759] text-white' : 'bg-[#1a1a1a] border border-[#333] text-[#999] hover:border-[#34C759]')}>
                  [SAVE]
                </button>
                <button onClick={function() { updateMessageStatus(msg.id, 'archived') }} className={'py-2 text-xs font-bold rounded transition ' + (msg.status === 'archived'? 'bg-[#FFA500] text-white' : 'bg-[#1a1a1a] border border-[#333] text-[#999] hover:border-[#FFA500]')}>
                  [ARCHIVE]
                </button>
                <button onClick={function() { updateMessageStatus(msg.id, 'deleted') }} className={'py-2 text-xs font-bold rounded transition ' + (msg.status === 'deleted'? 'bg-[#FF3B30] text-white' : 'bg-[#1a1a1a] border border-[#333] text-[#999] hover:border-[#FF3B30]')}>
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

export default function MessageCenter() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D0D0D] text-[#D4AF37] p-4">Loading Messages...</div>}>
      <MessageCenterContent />
    </Suspense>
  )
}
