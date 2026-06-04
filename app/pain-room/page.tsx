'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PainLead {
  id: string
  address: string
  owner: string
  ps: number
  vs: number
  equity: string
  motivation: string[]
  liens: string
  status: 'saved' | 'archived' | 'deleted'
  flagged: boolean
  unread: boolean
}

function PainRoomContent() {
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

  const [leads, setLeads] = useState<PainLead[]>([
    { id: '1', address: '1428 Maple Ave, Detroit MI', owner: 'James Wilson', ps: 94, vs: 810, equity: '$87K', motivation: ['Divorce', 'Vacant'], liens: '$12K Tax', status: 'saved', flagged: true, unread: true },
    { id: '2', address: '8812 Oak St, Flint MI', owner: 'Maria Gonzalez', ps: 89, vs: 720, equity: '$62K', motivation: ['Pre-foreclosure'], liens: '$8K HOA', status: 'saved', flagged: false, unread: true },
    { id: '3', address: '3341 Pine Dr, Warren MI', owner: 'Robert Chen', ps: 76, vs: 650, equity: '$44K', motivation: ['Tired Landlord'], liens: 'Clean', status: 'saved', flagged: false, unread: false },
    { id: '4', address: '9901 Elm Rd, Southfield MI', owner: 'Lisa Johnson', ps: 68, vs: 590, equity: '$31K', motivation: ['Inherited'], liens: '$4K Water', status: 'archived', flagged: false, unread: false },
    { id: '5', address: '2200 Cedar Ln, Pontiac MI', owner: 'David Smith', ps: 45, vs: 420, equity: '$12K', motivation: ['Relocation'], liens: 'Clean', status: 'deleted', flagged: false, unread: false },
  ])

  const filteredLeads = leads.filter(l => l.status === filter)
  const counts = {
    saved: leads.filter(l => l.status === 'saved').length,
    archived: leads.filter(l => l.status === 'archived').length,
    deleted: leads.filter(l => l.status === 'deleted').length,
  }

  const updateStatus = (id: string, newStatus: 'saved' | 'archived' | 'deleted') => {
    setLeads(leads.map(l => l.id === id ? {...l, status: newStatus} : l))
  }

  const toggleFlag = (id: string) => {
    setLeads(leads.map(l => l.id === id ? {...l, flagged: !l.flagged} : l))
  }

  const getBorder = (lead: PainLead) => {
    if (lead.ps >= 90) return 'border-[#FF3B30] shadow-[0_0_20px_rgba(255,59,48,0.4)]'
    if (lead.vs >= 800) return 'border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.4)]'
    return 'border-[#333]'
  }

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white font-mono p-4 pb-20">
      <div className="border-b border-[#333] pb-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-[#FF3B30] text-xl font-bold">PAIN ROOM</div>
            <div className="text-[#666] text-xs">LEAD MANAGER</div>
          </div>
          <div className="text-[#666] text-xs text-right">
            SESSION ACTIVE | {time} CST
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setFilter('saved')} className={`py-3 text-xs font-bold border ${filter === 'saved' ? 'border-[#FF3B30] bg-[#FF3B30] text-white' : 'border-[#333] text-[#666]'}`}>
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
        {filteredLeads.map((lead) => (
          <div key={lead.id} className={`border-2 bg-[#1a1a1a] p-4 relative ${getBorder(lead)}`}>
            {lead.unread && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF3B30] rounded-full animate-ping" />}

            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="text-white font-bold text-sm">{lead.address}</div>
                <div className="text-[#666] text-xs">Owner: {lead.owner}</div>
              </div>
              <button onClick={() => toggleFlag(lead.id)} className={`text-2xl ${lead.flagged ? 'text-[#D4AF37]' : 'text-[#333]'}`}>
                ★
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
              <div>
                <div className="text-[#666]">PS</div>
                <div className={`font-bold text-lg ${lead.ps >= 90 ? 'text-[#FF3B30]' : 'text-white'}`}>{lead.ps}</div>
              </div>
              <div>
                <div className="text-[#666]">VS</div>
                <div className={`font-bold text-lg ${lead.vs >= 800 ? 'text-[#D4AF37]' : 'text-white'}`}>{lead.vs}</div>
              </div>
              <div>
                <div className="text-[#666]">EQUITY</div>
                <div className="text-[#34C759] font-bold">{lead.equity}</div>
              </div>
              <div>
                <div className="text-[#666]">LIENS</div>
                <div className="text-white font-bold text-xs">{lead.liens}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {lead.motivation.map((m, i) => (
                <span key={i} className="text-xs bg-[#333] text-[#D4AF37] px-2 py-1">{m}</span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {lead.status !== 'archived' && (
                <button onClick={() => updateStatus(lead.id, 'archived')} className="bg-[#FFA500] text-black py-2 text-xs font-bold">
                  [ARCHIVE]
                </button>
              )}
              {lead.status !== 'deleted' && (
                <button onClick={() => updateStatus(lead.id, 'deleted')} className="bg-[#FF3B30] text-white py-2 text-xs font-bold">
                  [DELETE]
                </button>
              )}
              {lead.status !== 'saved' && (
                <button onClick={() => updateStatus(lead.id, 'saved')} className="bg-[#34C759] text-white py-2 text-xs font-bold col-span-2">
                  [RESTORE]
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D] border-t border-[#333] grid grid-cols-4 text-xs">
        <button onClick={() => router.push('/pain-room')} className="py-4 text-center bg-[#1a1a1a]">
          <div className="text-[#FF3B30] font-bold">PAIN</div>
          <div className="text-[#666]">ROOM</div>
        </button>
        <button onClick={() => router.push('/command')} className="py-4 text-center hover:bg-[#1a1a1a] transition">
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

export default function PainRoom() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D0D0D] text-[#FF3B30] p-4">Loading Pain Room...</div>}>
      <PainRoomContent />
    </Suspense>
  )
}
