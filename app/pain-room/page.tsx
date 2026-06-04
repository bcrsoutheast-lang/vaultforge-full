'use client'
import { useState } from 'react'

const DUMMY_LEADS = [
  {
    id: 1, address: '1234 Peachtree St, Atlanta GA', psScore: 93, ask: 185000, arv: 275000,
    equity: 90000, motivation: 'FORECLOSURE', condition: 'MAJOR_REPAIR', occupancy: 'VACANT',
    beds: 3, baths: 2, sqft: 1450, owner: 'John Smith', phone: '404-555-0199',
    lien: 'TAX', mortgage: 95000, lender: 'Wells Fargo', auctionDate: '2026-07-15',
    notes: 'Roof leak, needs kitchen. Owner relocated to Texas.', 
    photos: ['https://picsum.photos/400/300?1','https://picsum.photos/400/300?2','https://picsum.photos/400/300?3'],
    skipTraced: true, vacantConfirm: true, buyerMatch: 3
  },
  {
    id: 2, address: '567 MLK Dr, Atlanta GA', psScore: 76, ask: 220000, arv: 295000,
    equity: 75000, motivation: 'DIVORCE', condition: 'COSMETIC', occupancy: 'OWNER',
    beds: 4, baths: 2.5, sqft: 2100, owner: 'Sarah Johnson', phone: '404-555-0142',
    lien: 'NONE', mortgage: 145000, lender: 'Chase', auctionDate: '',
    notes: 'Paint and carpet. Motivated seller.', 
    photos: ['https://picsum.photos/400/300?4','https://picsum.photos/400/300?5'],
    skipTraced: false, vacantConfirm: false, buyerMatch: 1
  }
]

export default function PainRoom() {
  const [selected, setSelected] = useState<typeof DUMMY_LEADS[0] | null>(null)

  const psBreakdown = (lead: typeof DUMMY_LEADS[0]) => {
    const m: Record<string, number> = {FORECLOSURE:40,DIVORCE:35}
    const c: Record<string, number> = {MAJOR_REPAIR:20,COSMETIC:15}
    const o: Record<string, number> = {VACANT:15,OWNER:10}
    return {
      motivation: m[lead.motivation] || 0,
      condition: c[lead.condition] || 0,
      occupancy: o[lead.occupancy] || 0,
      equity: lead.equity > 50000? 15 : 10
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-mono p-4">
      {!selected? (
        <div>
          <h1 className="text-red-500 text-2xl font-bold mb-4">PAIN ROOM // {DUMMY_LEADS.length} ACTIVE LEADS</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DUMMY_LEADS.map(lead => (
              <div key={lead.id} onClick={() => setSelected(lead)} 
                className="border-2 border-red-500 bg-[#1A1A1A] cursor-pointer hover:border-yellow-500">
                <img src={lead.photos[0]} alt="" className="w-full h-40 object-cover" />
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-gray-400">{lead.address}</div>
                    <div className={`px-2 py-1 text-xs font-bold ${lead.psScore >= 70? 'bg-red-600' : 'bg-yellow-600 text-black'}`}>
                      PS: {lead.psScore} {lead.psScore >= 70 && '🔥'}
                    </div>
                  </div>
                  <div className="text-sm mt-2">ASK: ${lead.ask.toLocaleString()} | ARV: ${lead.arv.toLocaleString()}</div>
                  <div className="text-xs text-green-500">EQUITY: ${lead.equity.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">{lead.beds}BD {lead.baths}BA | {lead.sqft}SQFT | {lead.motivation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setSelected(null)} className="bg-gray-700 px-4 py-2 mb-4">← BACK TO PAIN ROOM</button>
          <div className="border-2 border-red-500 bg-[#1A1A1A]">
            <div className="bg-red-600 p-3 font-bold">PAIN LEAD DETAIL // PS SCORE: {selected.psScore} {selected.psScore >= 70 && '🔥 HOT'}</div>
            
            <div className="grid grid-cols-3 gap-2 p-3">
              {selected.photos.map((p,i) => <img key={i} src={p} className="w-full h-32 object-cover border border-gray-700" />)}
            </div>

            <div className="p-4 space-y-3 text-sm">
              <div className="border border-yellow-500 p-3">
                <div className="text-yellow-500 font-bold mb-2">PS SCORE BREAKDOWN: {selected.psScore}/100</div>
                {Object.entries(psBreakdown(selected)).map(([k,v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-gray-400">{k.toUpperCase()}</span>
                    <span>{v} PTS</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-800 p-2">
                  <div className="text-xs text-gray-500">ADDRESS</div>
                  <div>{selected.address}</div>
                </div>
                <div className="border border-gray-800 p-2">
                  <div className="text-xs text-gray-500">OWNER</div>
                  <div>{selected.owner} | {selected.phone}</div>
                </div>
                <div className="border border-gray-800 p-2">
                  <div className="text-xs text-gray-500">SPECS</div>
                  <div>{selected.beds}BD {selected.baths}BA | {selected.sqft}SQFT</div>
                </div>
                <div className="border border-gray-800 p-2">
                  <div className="text-xs text-gray-500">STATUS</div>
                  <div>{selected.motivation} | {selected.condition} | {selected.occupancy}</div>
                </div>
              </div>

              <div className="border border-gray-800 p-2">
                <div className="text-xs text-gray-500 mb-1">FINANCIALS</div>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>ASK: ${selected.ask.toLocaleString()}</div>
                  <div>ARV: ${selected.arv.toLocaleString()}</div>
                  <div className="text-green-500">EQUITY: ${selected.equity.toLocaleString()}</div>
                  <div>MORTGAGE: ${selected.mortgage.toLocaleString()}</div>
                </div>
                <div className="text-xs mt-1">LENDER: {selected.lender} | LIEN: {selected.lien}</div>
              </div>

              {selected.auctionDate && (
                <div className="border border-red-500 p-2 bg-red-900/20">
                  <div className="text-red-500 text-xs font-bold">URGENCY: AUCTION DATE {selected.auctionDate}</div>
                </div>
              )}

              <div className="border border-gray-800 p-2">
                <div className="text-xs text-gray-500">SKIP TRACE FLAGS</div>
                <div className="text-xs">
                  {selected.skipTraced && '✓ SKIP TRACED '} 
                  {selected.vacantConfirm && '✓ VACANT CONFIRMED'}
                </div>
              </div>

              <div className="border border-gray-800 p-2">
                <div className="text-xs text-gray-500">NOTES</div>
                <div className="text-xs">{selected.notes}</div>
              </div>

              <div className="border border-yellow-500 p-2 bg-yellow-900/20">
                <div className="text-yellow-500 text-xs font-bold">ALPHA VAULT MATCH: {selected.buyerMatch} BUYERS FIT THIS DEAL</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
