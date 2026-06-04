'use client'
import { useState } from 'react'

const DUMMY_DEALS = [
  {
    id: 1, address: '8901 Piedmont Ave, Atlanta GA', dealScore: 92, ask: 195000, arv: 310000, 
    repairs: 25000, assignmentFee: 15000, mao: 177000, spread: 90000,
    dealType: 'WHOLESALE', contractStatus: 'ASSIGNABLE', buyerType: 'CASH', dispoStage: 'ACTIVE',
    jvSplit: '50/50', emdAmount: 5000, beds: 3, baths: 2, sqft: 1650,
    contractDate: '2026-06-01', closeDate: '2026-07-01', inspectionEnd: '2026-06-08',
    titleClear: true, tenantOccupied: false, hasAccess: true, mediaDone: true, buyerBlasted: true,
    notes: 'Clean title. Vacant. Keys in lockbox. Seller motivated, moving out of state.',
    photos: ['https://picsum.photos/400/300?10','https://picsum.photos/400/300?11','https://picsum.photos/400/300?12'],
    buyerMatch: 5
  },
  {
    id: 2, address: '234 Cascade Rd, Atlanta GA', dealScore: 78, ask: 245000, arv: 325000,
    repairs: 15000, assignmentFee: 12000, mao: 200500, spread: 65000,
    dealType: 'FLIP', contractStatus: 'DOUBLE_CLOSE', buyerType: 'HARD_MONEY', dispoStage: 'NOT_LISTED',
    jvSplit: '60/40', emdAmount: 3000, beds: 4, baths: 3, sqft: 2200,
    contractDate: '2026-05-28', closeDate: '2026-06-28', inspectionEnd: '2026-06-04',
    titleClear: true, tenantOccupied: false, hasAccess: true, mediaDone: false, buyerBlasted: false,
    notes: 'Needs flooring and paint. Great comps. Tenant moving out next week.',
    photos: ['https://picsum.photos/400/300?13','https://picsum.photos/400/300?14'],
    buyerMatch: 2
  }
]

export default function DealRoom() {
  const [selected, setSelected] = useState<typeof DUMMY_DEALS[0] | null>(null)

  const dealBreakdown = (deal: typeof DUMMY_DEALS[0]) => {
    const spreadScore = deal.spread > 50000? 40 : deal.spread > 30000? 30 : deal.spread > 15000? 20 : 10
    const statusMap: Record<string, number> = {ASSIGNABLE:25,DOUBLE_CLOSE:20,SUBJECT_TO:15,WRAP:10}
    const buyerMap: Record<string, number> = {CASH:20,HARD_MONEY:15,CONVENTIONAL:10,CREATIVE:5}
    return {
      spread: spreadScore,
      contractStatus: statusMap[deal.contractStatus] || 0,
      buyerType: buyerMap[deal.buyerType] || 0,
      titleClear: deal.titleClear? 15 : 0
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-mono p-4">
      {!selected? (
        <div>
          <h1 className="text-yellow-500 text-2xl font-bold mb-4">DEAL ROOM // {DUMMY_DEALS.length} ACTIVE DEALS</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DUMMY_DEALS.map(deal => (
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
                  <div className="text-xs text-green-500">SPREAD: ${deal.spread.toLocaleString()} | FEE: ${deal.assignmentFee.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">{deal.dealType} | {deal.contractStatus} | {deal.buyerType}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setSelected(null)} className="bg-gray-700 px-4 py-2 mb-4">← BACK TO DEAL ROOM</button>
          <div className="border-2 border-yellow-500 bg-[#1A1A1A]">
            <div className="bg-yellow-600 text-black p-3 font-bold">DEAL DETAIL // SCORE: {selected.dealScore} {selected.dealScore >= 90 && '🔥 HOT'}</div>
            
            <div className="grid grid-cols-3 gap-2 p-3">
              {selected.photos.map((p,i) => <img key={i} src={p} className="w-full h-32 object-cover border border-gray-700" />)}
            </div>

            <div className="p-4 space-y-3 text-sm">
              <div className="border border-yellow-500 p-3">
                <div className="text-yellow-500 font-bold mb-2">DEAL SCORE BREAKDOWN: {selected.dealScore}/100</div>
                {Object.entries(dealBreakdown(selected)).map(([k,v]) => (
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
                  <div className="text-xs text-gray-500">DEAL TYPE</div>
                  <div>{selected.dealType} | {selected.contractStatus}</div>
                </div>
                <div className="border border-gray-800 p-2">
                  <div className="text-xs text-gray-500">SPECS</div>
                  <div>{selected.beds}BD {selected.baths}BA | {selected.sqft}SQFT</div>
                </div>
                <div className="border border-gray-800 p-2">
                  <div className="text-xs text-gray-500">BUYER TYPE</div>
                  <div>{selected.buyerType} | JV: {selected.jvSplit}</div>
                </div>
              </div>

              <div className="border border-gray-800 p-2">
                <div className="text-xs text-gray-500 mb-1">FINANCIALS</div>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  <div>ASK: ${selected.ask.toLocaleString()}</div>
                  <div>ARV: ${selected.arv.toLocaleString()}</div>
                  <div>REPAIRS: ${selected.repairs.toLocaleString()}</div>
                  <div className="text-yellow-500">MAO: ${selected.mao.toLocaleString()}</div>
                  <div className="text-green-500">SPREAD: ${selected.spread.toLocaleString()}</div>
                </div>
                <div className="text-xs mt-1">FEE: ${selected.assignmentFee.toLocaleString()} | EMD: ${selected.emdAmount.toLocaleString()}</div>
              </div>

              <div className="border border-gray-800 p-2">
                <div className="text-xs text-gray-500 mb-1">DATES</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>CONTRACT: {selected.contractDate}</div>
                  <div>CLOSE: {selected.closeDate}</div>
                  <div>INSPECT END: {selected.inspectionEnd}</div>
                </div>
              </div>

              <div className="border border-gray-800 p-2">
                <div className="text-xs text-gray-500">DISPO FLAGS</div>
                <div className="text-xs">
                  {selected.titleClear && '✓ TITLE CLEAR '} 
                  {selected.hasAccess && '✓ HAS ACCESS '}
                  {selected.mediaDone && '✓ MEDIA DONE '}
                  {selected.buyerBlasted && '✓ BUYER BLASTED '}
                  {selected.tenantOccupied && '⚠ TENANT OCCUPIED'}
                </div>
              </div>

              <div className="border border-gray-800 p-2">
                <div className="text-xs text-gray-500">NOTES</div>
                <div className="text-xs">{selected.notes}</div>
              </div>

              <div className="border border-yellow-500 p-2 bg-yellow-900/20">
                <div className="text-yellow-500 text-xs font-bold">ALPHA VAULT MATCH: {selected.buyerMatch} BUYERS FIT THIS DEAL</div>
                <div className="text-xs text-gray-400 mt-1">STATUS: {selected.dispoStage}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
