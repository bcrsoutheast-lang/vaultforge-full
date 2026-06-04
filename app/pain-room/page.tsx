'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface PainLead {
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
  painScore: number
  vaultScore: number
  liens: string
  title: string
  dom: number
  motivation: string[]
  isNew: boolean
  unread: boolean
}

function PainRoomContent() {
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

  const [leads, setLeads] = useState<PainLead[]>([
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
      painScore: 94,
      vaultScore: 820,
      liens: '$8.4K TAX',
      title: 'PROBATE FILED',
      dom: 187,
      motivation: ['DIVORCE', 'FORECLOSURE NOD'],
      isNew: true,
      unread: true
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
      painScore: 72,
      vaultScore: 701,
      liens: '$4.2K TAX',
      title: 'CLEAN',
      dom: 120,
      motivation: ['TIRED LANDLORD'],
      isNew: false,
      unread: false
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
      painScore: 88,
      vaultScore: 910,
      liens: 'NONE',
      title: 'CLEAN',
      dom: 45,
      motivation: ['JOB RELOCATION', 'OUT OF STATE'],
      isNew: false,
      unread: false
    }
  ])

  const counts = {
    saved: leads.filter(l => l.status === 'saved').length,
    archived: leads.filter(l => l.status === 'archived').length,
    deleted: leads.filter(l => l.status === 'deleted').length
  }

  const avgPS = {
    saved: Math.round(leads.filter(l => l.status === 'saved').reduce((a,b) => a + b.painScore, 0) / (counts.saved || 1)),
    archived: Math.round(leads.filter(l => l.status === 'archived').reduce((a,b) => a + b.painScore, 0) / (counts.archived || 1)),
    deleted: Math.round(leads.filter(l => l.status === 'deleted').reduce((a,b) => a + b.painScore, 0) / (counts.deleted || 1))
  }

  const hotLeads = leads.filter(l => l.status === 'saved' && l.painScore >= 90).length
  const filteredLeads = filter === 'all'? leads.filter(l => l.status!== 'deleted') : leads.filter(l => l.status === filter)

  const updateLeadStatus = (id: string, newStatus: 'saved' | 'archived' | 'deleted') => {
    setLeads(prev => prev.map(l => l.id === id? {...l, status: newStatus, unread: false, isNew: false} : l))
  }

  const getBorderColor = (lead: PainLead) => {
    if (lead.painScore >= 90) return 'border-[#FF3B30]'
    if (lead.vaultScore >= 800) return 'border-[#D4AF37]'
    return 'border-[#333]'
  }

  const getGlow = (lead: PainLead) => {
    if (lead.painScore >= 90) return 'shadow-[0_0_20px_rgba(255,59,48,0.6)]'
    if (lead.vaultScore >= 800) return 'shadow-[0_0_20px_rgba(212,175,55,0.6)]'
    return ''
  }

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white font-mono p-4">
      <div className="border-b border-[#333] pb-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[#D4AF37] text-lg font-bold">PAIN ROOM</div>
            <div className="text-[#666] text-xs">DASHBOARD</div>
          </div>
          <div className="text-[#666] text-xs text-right">
            SESSION ACTIVE | TOTAL: {leads.length} |<br/>
            {time} CST
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {(['saved', 'archived', 'deleted'] as const).map((status) => {
          const isActive = filter === status
          const hasNew = leads.some(l => l.status === status && l.unread)
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`border-2 p-3 text-left transition ${
                isActive? 'border-[#D4AF37] bg-[#1a1a1a]' : 'border-[#333] bg-[#0D0D0D]'
              } ${hasNew? 'ring-2 ring-[#FF3B30] animate-pulse' : ''}`}
            >
              <div className="text-[#D4AF37] text-xs font-bold mb-1">PAIN {status.toUpperCase()}</div>
              <div className="text-white text-2xl font-bold">{counts[status]}</div>
              <div className="text-[#666] text-xs mt-1">
                PS AVG: {avgPS[status]}
                {status === 'saved' && hotLeads > 0 && <span className="text-[#FF3B30] ml-2">HOT: {hotLeads}</span>}
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
        {filteredLeads.map((lead) => (
          <div key={lead.id} className={`border-2 bg-[#1a1a1a] p-3 transition relative ${getBorderColor(lead)} ${getGlow(lead)} ${lead.isNew? 'animate-pulse' : ''}`}>
            {lead.unread && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF3B30] rounded-full animate-ping" />}
            
            <div className="flex justify-between items-start mb-3 pb-3 border-b border-[#333]">
              <div className="flex gap-3">
                <img src={lead.photo} alt="" className="w-16 h-16 object-cover rounded" />
                <div>
                  <div className="text-white text-sm font-bold">{lead.sellerName.toUpperCase()}</div>
                  <div className="text-[#666] text-xs">Owner | {lead.city}, {lead.state} {lead.zip}</div>
                  <div className="text-[#D4AF37] text-xs mt-1">{lead.sellerPhone}</div>
                  <div className="text-[#666] text-xs">{lead.sellerEmail}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[#FF3B30] text-sm font-bold">PS: {lead.painScore} 🔥</div>
                <div className="text-[#666] text-xs mt-1">DNC: Clean</div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-white text-sm font-bold mb-1">{lead.address.toUpperCase()} {lead.city.toUpperCase()}, {lead.state}</div>
              <div className="text-[#999] text-xs">{lead.beds}BD {lead.baths}BA {lead.sqft.toLocaleString()}SQFT | BUILT {lead.yearBuilt}</div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
              <div><div className="text-[#666]">ASK</div><div className="text-[#D4AF37] font-bold">${(lead.ask/1000).toFixed(0)}K</div></div>
              <div><div className="text-[#666]">ARV</div><div className="text-white font-bold">${(lead.arv/1000).toFixed(0)}K</div></div>
              <div><div className="text-[#666]">SPREAD</div><div className="text-white font-bold">${(lead.spread/1000).toFixed(0)}K</div></div>
              <div><div className="text-[#666]">VS</div><div className="text-[#D4AF37] font-bold">{lead.vaultScore} ⚡</div></div>
            </div>

            <div className="text-xs mb-3 pb-3 border-b border-[#333]">
              <span className="text-[#666]">LIENS:</span> <span className="text-white">{lead.liens}</span>
              <span className="text-[#666] ml-3">TITLE:</span> <span className="text-white">{lead.title}</span>
              <span className="text-[#666] ml-3">DOM:</span> <span className="text-white">{lead.dom}</span>
            </div>

            <div className="text-xs mb-3">
              <span className="text-[#666]">MOTIVATION:</span> 
              <span className="text-[#FF3B30] ml-2">{lead.motivation.join(' + ')}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => updateLeadStatus(lead.id, 'saved')} className={`py-3 text-xs font-bold rounded transition ${lead.status === 'saved'? 'bg-[#34C759] text-white' : 'bg-[#1a1a1a] border border-[#333] text-[#999] hover:border-[#34C759]'}`}>
                
              </button>
              <button onClick={() => updateLeadStatus(lead.id, 'archived')} className={`py-3 text-xs font-bold rounded transition ${lead.status === 'archived'? 'bg-[#FFA500] text-white' : 'bg-[#1a1a1a] border border-[#333] text-[#999] hover:border-[#FFA500]'}`}>
                [ARCHIVE]
              </button>
              <button onClick={() => updateLeadStatus(lead.id, 'deleted')} className={`py-3 text-xs font-bold rounded transition ${lead.status === 'deleted'? 'bg-[#FF3B30] text-white' : 'bg-[#1a1a1a] border border-[#333] text-[#999] hover:border-[#FF3B30]'}`}>
                [DELETE]
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

export default function PainRoom() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0D0D0D] text-[#D4AF37] p-4">Loading Pain Room...</div>}>
      <PainRoomContent />
    </Suspense>
  )
}
