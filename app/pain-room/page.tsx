'use client'
import { useState } from 'react'

const DUMMY_LEADS = [
  { id: 1, address: '7420 N Decatur Rd, Atlanta GA', psScore: 92, ask: 89000, arv: 220000, repairs: 25000, 
    motivation: 'T', condition: 'POOR', occupancy: 'VACANT', status: 'NEW', owner: 'John Smith', phone: '404-555-1212',
    photos: ['https://picsum.photos/400/300?1','https://picsum.photos/400/300?2'],
    notes: 'Tax delinquent. Needs roof.' 
  },
  { id: 2, address: '1421 Pine St, Atlanta GA', psScore: 78, ask: 125000, arv: 180000, repairs: 15000,
    motivation: 'D', condition: 'FAIR', occupancy: 'OWNER', status: 'CONTACTED', owner: 'Jane Doe', phone: '678-555-3434',
    photos: ['https://picsum.photos/400/300?3'],
    notes: 'Divorce. Motivated.'
  },
  { id: 3, address: '9900 Oak Ave, Atlanta GA', psScore: 65, ask: 200000, arv: 250000, repairs: 10000,
    motivation: 'M', condition: 'GOOD', occupancy: 'TENANT', status: 'UNDER_CONTRACT', owner: 'Bob Jones', phone: '770-555-5656',
    photos: ['https://picsum.photos/400/300?4'],
    notes: 'Moving out of state.'
  },
  { id: 4, address: '123 Main St, Atlanta GA', psScore: 88, ask: 95000, arv: 200000, repairs: 20000,
    motivation: 'PR', condition: 'POOR', occupancy: 'VACANT', status: 'CLOSED', owner: 'Mary Johnson', phone: '404-555-7878',
    photos: ['https://picsum.photos/400/300?5'],
    notes: 'Closed 5/15. Made 40k.'
  },
  { id: 5, address: '555 Elm Rd, Atlanta GA', psScore: 45, ask: 180000, arv: 190000, repairs: 5000,
    motivation: 'F', condition: 'EXCELLENT', occupancy: 'OWNER', status: 'ARCHIVED', owner: 'Steve Ray', phone: '678-555-9090',
    photos: ['https://picsum.photos/400/300?6'],
    notes: 'Not motivated. Low equity.'
  },
  { id: 6, address: '777 Dead St, Atlanta GA', psScore: 30, ask: 300000, arv: 290000, repairs: 0,
    motivation: 'M', condition: 'EXCELLENT', occupancy: 'OWNER', status: 'DELETED', owner: 'Karen White', phone: '770-555-0000',
    photos: ['https://picsum.photos/400/300?7'],
    notes: 'Waste of time. Deleted.'
  },
]

const TABS = ['NEW','CONTACTED','UNDER_CONTRACT','CLOSED','ARCHIVED','DELETED']

export default function PainRoom() {
  const [selected, setSelected] = useState<typeof DUMMY_LEADS[0] | null>(null)
  const [activeTab, setActiveTab] = useState('NEW')
  const [leads, setLeads] = useState(DUMMY_LEADS)

  const filteredLeads = leads.filter(l => l.status === activeTab)

  const updateStatus = (id: number, newStatus: string) => {
    setLeads(leads.map(l => l.id === id? {...l, status: newStatus} : l))
    setSelected(null)
    setActiveTab(newStatus)
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-mono p-4">
      {!selected? (
        <div>
          <h1 className="text-yellow-500 text-2xl font-bold mb-4">PAIN ROOM // {filteredLeads.length} {activeTab}</h1>
          
          <div className="flex gap-2 mb-4 border-b border-yellow-500 pb-2 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-xs whitespace-nowrap ${activeTab === tab? 'bg-yellow-500 text-black' : 'bg-[#1A1A1A] border border-gray-700'}`}>
                {tab} ({leads.filter(l => l.status === tab).length})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map(lead => (
              <div key={lead.id} onClick={() => setSelected(lead)} 
                className="border-2 border-yellow-500 bg-[#1A1A1A] cursor-pointer hover:border-yellow-300">
                <img src={lead.photos[0]} alt="" className="w-full h-40 object-cover" />
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-gray-400">{lead.address}</div>
                    <div className={`px-2 py-1 text-xs font-bold ${lead.psScore >= 90? 'bg-green-600' : 'bg-yellow-600 text-black'}`}>
                      PS: {lead.psScore} {lead.psScore >= 90 && '🔥'}
                    </div>
                  </div>
                  <div className="text-sm mt-2">ASK: ${lead.ask.toLocaleString()} | ARV: ${lead.arv.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">{lead.motivation} | {lead.condition} | {lead.occupancy}</div>
                  <div className="text-xs mt-1 text-yellow-500">{lead.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setSelected(null)} className="bg-gray-700 px-4 py-2 mb-4">← BACK TO {activeTab}</button>
          <div className="border-2 border-yellow-500 bg-[#1A1A1A]">
            <div className="bg-yellow-600 text-black p-3 font-bold">LEAD DETAIL // PS SCORE: {selected.psScore}</div>
            
            <div className="grid grid-cols-3 gap-2 p-3">
              {selected.photos.map((p,i) => <img key={i} src={p} className="w-full h-32 object-cover border border-gray-700" />)}
            </div>

            <div className="p-4 space-y-3 text-sm">
              <div className="border border-gray-800 p-2">
                <div className="text-xs text-gray-500">OWNER</div>
                <div>{selected.owner} | {selected.phone}</div>
              </div>
              <div className="border border-gray-800 p-2">
                <div className="text-xs text-gray-500">ADDRESS</div>
                <div>{selected.address}</div>
              </div>
              <div className="border border-gray-800 p-2">
                <div className="text-xs text-gray-500">NOTES</div>
                <div className="text-xs">{selected.notes}</div>
              </div>
              <div className="border border-yellow-500 p-2 bg-yellow-900/20">
                <div className="text-yellow-500 text-xs font-bold">CURRENT STATUS: {selected.status}</div>
              </div>
            </div>

            <div className="flex gap-2 p-3 border-t border-yellow-500">
              <button onClick={() => updateStatus(selected.id, 'CONTACTED')} className="flex-1 bg-blue-600 py-2 text-xs">CONTACTED</button>
              <button onClick={() => updateStatus(selected.id, 'UNDER_CONTRACT')} className="flex-1 bg-green-600 py-2 text-xs">UNDER CONTRACT</button>
              <button onClick={() => updateStatus(selected.id, 'CLOSED')} className="flex-1 bg-green-800 py-2 text-xs">CLOSED</button>
              <button onClick={() => updateStatus(selected.id, 'ARCHIVED')} className="flex-1 bg-gray-600 py-2 text-xs">ARCHIVE</button>
              <button onClick={() => updateStatus(selected.id, 'DELETED')} className="flex-1 bg-red-600 py-2 text-xs">DELETE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
