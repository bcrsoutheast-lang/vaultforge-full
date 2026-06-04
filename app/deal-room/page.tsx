'use client'
import { useState } from 'react'

const DUMMY_DEALS = [
  { id: 1, address: '8901 Piedmont Ave, Atlanta GA', dealScore: 92, ask: 195000, arv: 310000, spread: 90000, status: 'LIVE',
    dealType: 'WHOLESALE', photos: ['https://picsum.photos/400/300?10'], notes: 'Hot deal.' },
  { id: 2, address: '234 Cascade Rd, Atlanta GA', dealScore: 78, ask: 245000, arv: 325000, spread: 65000, status: 'SAVED',
    dealType: 'FLIP', photos: ['https://picsum.photos/400/300?13'], notes: 'Buyer found.' },
  { id: 3, address: '555 Sold St, Atlanta GA', dealScore: 95, ask: 150000, arv: 280000, spread: 110000, status: 'SOLD',
    dealType: 'WHOLESALE', photos: ['https://picsum.photos/400/300?20'], notes: 'Made 25k fee.' },
  { id: 4, address: '777 Arch Ave, Atlanta GA', dealScore: 60, ask: 300000, arv: 320000, spread: 5000, status: 'ARCHIVED',
    dealType: 'FLIP', photos: ['https://picsum.photos/400/300?21'], notes: 'Spread too thin.' },
  { id: 5, address: '999 Del St, Atlanta GA', dealScore: 40, ask: 400000, arv: 390000, spread: -10000, status: 'DELETED',
    dealType: 'WHOLESALE', photos: ['https://picsum.photos/400/300?22'], notes: 'Upside down.' },
  { id: 6, address: '111 UC St, Atlanta GA', dealScore: 85, ask: 180000, arv: 260000, spread: 70000, status: 'UNDER_CONTRACT',
    dealType: 'WHOLESALE', photos: ['https://picsum.photos/400/300?23'], notes: 'EMD posted.' },
]

const TABS = ['LIVE','SAVED','UNDER_CONTRACT','SOLD','ARCHIVED','DELETED']

export default function DealRoom() {
  const [selected, setSelected] = useState<typeof DUMMY_DEALS[0] | null>(null)
  const [activeTab, setActiveTab] = useState('LIVE')
  const [deals, setDeals] = useState(DUMMY_DEALS)
  const [message, setMessage] = useState('')

  const filteredDeals = deals.filter(d => d.status === activeTab)

  const updateStatus = (id: number, newStatus: string) => {
    setDeals(deals.map(d => d.id === id? {...d, status: newStatus} : d))
    setMessage(`DEAL MOVED TO ${newStatus}`)
    setTimeout(() => setMessage(''), 2000)
    setSelected(null)
    setActiveTab(newStatus)
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-mono p-4">
      {message && <div className="fixed top-4 right-4 bg-green-600 px-4 py-2 text-sm z-50">{message}</div>}
      
      {!selected? (
        <div>
          <h1 className="text-yellow-500 text-2xl font-bold mb-4">DEAL ROOM // {filteredDeals.length} {activeTab}</h1>
          
          <div className="flex gap-2 mb-4 border-b border-yellow-500 pb-2 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-xs whitespace-nowrap ${activeTab === tab? 'bg-yellow-500 text-black' : 'bg-[#1A1A1A] border border-gray-700'}`}>
                {tab} ({deals.filter(d => d.status === tab).length})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDeals.map(deal => (
              <div key={deal.id} onClick={() => setSelected(deal)} 
                className="border-2 border-yellow-500 bg-[#1A1A1A] cursor-pointer hover:border-yellow-300">
                <img src={deal.photos[0]} alt="" className="w-full h-40 object-cover" />
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-gray-400">{deal.address}</div>
                    <div className={`px-2 py-1 text-xs font-bold ${deal.dealScore >= 90? 'bg-green-600' : 'bg-yellow-600 text-black'}`}>
                      SCORE: {deal.dealScore} {deal.dealScore >= 90 && '🔥'}
                    </div>
                  </div>
                  <div className="text-sm mt-2">ASK: ${deal.ask.toLocaleString()} | ARV: ${deal.arv.toLocaleString()}</div>
                  <div className="text-xs text-green-500">SPREAD: ${deal.spread.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">{deal.dealType}</div>
                  <div className="text-xs mt-1 text-yellow-500">{deal.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setSelected(null)} className="bg-gray-700 px-4 py-2 mb-4">← BACK TO {activeTab}</button>
          <div className="border-2 border-yellow-500 bg-[#1A1A1A]">
            <div className="bg-yellow-600 text-black p-3 font-bold">DEAL DETAIL // SCORE: {selected.dealScore}</div>
            
            <img src={selected.photos[0]} className="w-full h-48 object-cover" />

            <div className="p-4 space-y-3 text-sm">
              <div className="border border-gray-800 p-2">
                <div className="text-xs text-gray-500">ADDRESS</div>
                <div>{selected.address}</div>
              </div>
              <div className="border border-gray-800 p-2">
                <div className="text-xs text-gray-500">FINANCIALS</div>
                <div>ASK: ${selected.ask.toLocaleString()} | ARV: ${selected.arv.toLocaleString()} | SPREAD: ${selected.spread.toLocaleString()}</div>
              </div>
              <div className="border border-gray-800 p-2">
                <div className="text-xs text-gray-500">NOTES</div>
                <div className="text-xs">{selected.notes}</div>
              </div>
              <div className="border border-yellow-500 p-2 bg-yellow-900/20">
                <div className="text-yellow-500 text-xs font-bold">CURRENT: {selected.status}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 border-t border-yellow-500">
              <button onClick={() => updateStatus(selected.id, 'SAVED')} className="bg-blue-600 py-2 text-xs">SAVE</button>
              <button onClick={() => updateStatus(selected.id, 'UNDER_CONTRACT')} className="bg-green-600 py-2 text-xs">UNDER CONTRACT</button>
              <button onClick={() => updateStatus(selected.id, 'SOLD')} className="bg-green-800 py-2 text-xs">SOLD</button>
              <button onClick={() => updateStatus(selected.id, 'ARCHIVED')} className="bg-gray-600 py-2 text-xs">ARCHIVE</button>
              <button onClick={() => updateStatus(selected.id, 'DELETED')} className="bg-red-600 py-2 text-xs">DELETE</button>
              <button onClick={() => updateStatus(selected.id, 'LIVE')} className="bg-yellow-600 text-black py-2 text-xs">BACK TO LIVE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
