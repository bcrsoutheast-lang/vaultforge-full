'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://YOUR-PROJECT.supabase.co', // <-- REPLACE
  'YOUR-ANON-KEY' // <-- REPLACE
)

export default function DealRoom() {
  const [showDealForm, setShowDealForm] = useState(false)
  const [dealForm, setDealForm] = useState({
    propertyType: 'RESIDENTIAL',
    address: '', city: '', state: '', zip: '',
    beds: '', baths: '', sqft: '', yearBuilt: '',
    dealType: '', contractStatus: '', buyerType: '', dispoStage: '', jvSplit: '',
    askingPrice: '', arv: '', repairs: '', assignmentFee: '', emdAmount: '',
    contractDate: '', closeDate: '', inspectionEnd: '',
    titleClear: false, tenantOccupied: false, hasAccess: false, mediaDone: false, buyerBlasted: false,
    notes: '', photos: [] as File[]
  })
  const [incomplete, setIncomplete] = useState(false)

  const calcMAO = () => {
    const arv = Number(dealForm.arv) || 0
    const repairs = Number(dealForm.repairs) || 0
    const fee = Number(dealForm.assignmentFee) || 0
    return Math.round(arv * 0.7 - repairs - fee)
  }

  const calcSpread = () => {
    const arv = Number(dealForm.arv) || 0
    const ask = Number(dealForm.askingPrice) || 0
    const repairs = Number(dealForm.repairs) || 0
    return arv - ask - repairs
  }

  const calcDealScore = () => {
    let score = 0
    const spread = calcSpread()
    if (spread > 50000) score += 40
    else if (spread > 30000) score += 30
    else if (spread > 15000) score += 20
    else score += 10
    const statusMap: Record<string, number> = {ASSIGNABLE:25,DOUBLE_CLOSE:20,SUBJECT_TO:15,WRAP:10}
    score += statusMap[dealForm.contractStatus] || 0
    const buyerMap: Record<string, number> = {CASH:20,HARD_MONEY:15,CONVENTIONAL:10,CREATIVE:5}
    score += buyerMap[dealForm.buyerType] || 0
    if (dealForm.titleClear) score += 15
    return Math.min(score, 100)
  }

  const handleSubmit = async () => {
    const req = ['address','city','state','zip','askingPrice','arv','assignmentFee','dealType','contractStatus']
    if (req.some(f =>!dealForm[f as keyof typeof dealForm]) || dealForm.photos.length === 0) {
      setIncomplete(true)
      return
    }
    
    const photoUrls = await Promise.all(
      dealForm.photos.map(async (file) => {
        const fileName = `${Date.now()}-${file.name}`
        const { error } = await supabase.storage.from('lead-photos').upload(fileName, file)
        if (error) throw error
        const { data } = supabase.storage.from('lead-photos').getPublicUrl(fileName)
        return data.publicUrl
      })
    )

    const mao = calcMAO()
    const spread = calcSpread()
    const score = calcDealScore()
    
    const { error } = await supabase.from('deals').insert({
     ...dealForm,
      sqft: Number(dealForm.sqft) || null,
      year_built: Number(dealForm.yearBuilt) || null,
      asking_price: Number(dealForm.askingPrice),
      arv: Number(dealForm.arv),
      repairs: Number(dealForm.repairs) || null,
      assignment_fee: Number(dealForm.assignmentFee),
      emd_amount: Number(dealForm.emdAmount) || null,
      mao: mao,
      spread: spread,
      deal_score: score,
      contract_date: dealForm.contractDate || null,
      close_date: dealForm.closeDate || null,
      inspection_end: dealForm.inspectionEnd || null,
      photos: photoUrls,
      buyer_match: 5
    })
    
    if (error) return alert('ERROR: ' + error.message)
    alert(`DEAL SAVED\nMAO: $${mao.toLocaleString()}\nSPREAD: $${spread.toLocaleString()}\nSCORE: ${score}`)
    setShowDealForm(false)
    setIncomplete(false)
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-mono p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-yellow-500 text-2xl font-bold">DEAL ROOM // COMMAND CENTER</h1>
          <button onClick={() => setShowDealForm(true)} className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-6 rounded border-2 border-yellow-400">
            + NEW DEAL
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="border-2 border-yellow-500 p-4">
            <div className="text-yellow-500 text-sm">DEAL SAVED</div>
            <div className="text-4xl font-bold">23</div>
            <div className="text-xs">AVG: $31K 🔥 3</div>
          </div>
          <div className="border-2 border-yellow-500 p-4">
            <div className="text-yellow-500 text-sm">UNDER CONTRACT</div>
            <div className="text-4xl font-bold">8</div>
            <div className="text-xs">AVG: $18K</div>
          </div>
          <div className="border-2 border-yellow-500 p-4">
            <div className="text-yellow-500 text-sm">CLOSED</div>
            <div className="text-4xl font-bold">12</div>
            <div className="text-xs">TOTAL: $412K</div>
          </div>
        </div>
      </div>

      {showDealForm && (
        <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
          <div className="min-h-screen p-2">
            <div className="bg-[#0D0D0D] border-2 border-yellow-500 max-w-3xl mx-auto">
              <div className="flex justify-between items-center border-b border-yellow-500 p-3">
                <div className="text-yellow-500 font-bold text-sm">DEAL INTAKE FORM // NEW DEAL SUBMISSION</div>
                <button onClick={() => setShowDealForm(false)} className="bg-red-600 px-3 py-1 text-xs">CLOSE [X]</button>
              </div>

              <div className="flex border-b border-yellow-500">
                {['RESIDENTIAL','COMMERCIAL','LAND'].map(type => (
                  <button key={type} onClick={() => setDealForm({...dealForm, propertyType: type})}
                    className={`flex-1 py-2 text-xs border-r border-yellow-500 last:border-r-0 ${dealForm.propertyType === type? 'bg-yellow-500 text-black' : 'bg-[#1A1A1A]'}`}>
                    {type}
                  </button>
                ))}
              </div>

              {incomplete && <div className="bg-red-600 p-2 text-center text-xs font-bold">INCOMPLETE: FILL REQUIRED + UPLOAD MIN 1 PHOTO</div>}

              <div className="p-3 space-y-2 max-h-96 overflow-y-auto text-xs">
                {[
                  {l:'PROPERTY ADDRESS *',k:'address'},{l:'CITY *',k:'city'},
                  {l:'STATE *',k:'state',t:'select',o:['AL','GA','FL','TX','CA','NY','IL','OH']},
                  {l:'ZIP *',k:'zip'},{l:'BEDS',k:'beds',t:'select',o:['1','2','3','4','5','6+']},
                  {l:'BATHS',k:'baths',t:'select',o:['1','1.5','2','2.5','3','3.5','4+']},
                  {l:'SQFT',k:'sqft'},{l:'YEAR BUILT',k:'yearBuilt'},
                  {l:'DEAL TYPE *',k:'dealType',t:'select',o:['WHOLESALE','FLIP','BUY & HOLD','NOVATION']},
                  {l:'CONTRACT STATUS *',k:'contractStatus',t:'select',o:['ASSIGNABLE','DOUBLE_CLOSE','SUBJECT_TO','WRAP']},
                  {l:'BUYER TYPE',k:'buyerType',t:'select',o:['CASH','HARD_MONEY','CONVENTIONAL','CREATIVE']},
                  {l:'DISPO STAGE',k:'dispoStage',t:'select',o:['NOT_LISTED','ACTIVE','PENDING','CLOSED']},
                  {l:'JV SPLIT',k:'jvSplit',t:'select',o:['50/50','60/40','70/30','CUSTOM']},
                  {l:'ASKING PRICE *',k:'askingPrice',t:'number'},{l:'ARV *',k:'arv',t:'number'},
                  {l:'REPAIRS',k:'repairs',t:'number'},{l:'ASSIGNMENT FEE *',k:'assignmentFee',t:'number'},
                  {l:'EMD AMOUNT',k:'emdAmount',t:'number'},{l:'CONTRACT DATE',k:'contractDate',t:'date'},
                  {l:'CLOSE DATE',k:'closeDate',t:'date'},{l:'INSPECTION END',k:'inspectionEnd',t:'date'}
                ].map(f => (
                  <div key={f.k} className="border border-gray-800 p-2">
                    <label className="text-gray-500">{f.l}</label>
                    {f.t === 'select'? (
                      <select value={dealForm[f.k as keyof typeof dealForm] as string} onChange={e => setDealForm({...dealForm, [f.k]: e.target.value})}
                        className="w-full bg-black border border-gray-700 p-1 mt-1">
                        <option value="">SELECT...</option>
                        {f.o?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input type={f.t || 'text'} value={dealForm[f.k as keyof typeof dealForm] as string} 
                        onChange={e => setDealForm({...dealForm, [f.k]: e.target.value})}
                        className="w-full bg-black border border-gray-700 p-1 mt-1" />
                    )}
                  </div>
                ))}

                <div className="border border-gray-800 p-2">
                  <label className="text-gray-500">DEAL FLAGS</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {[{l:'TITLE CLEAR',k:'titleClear'},{l:'TENANT OCCUPIED',k:'tenantOccupied'},{l:'HAS ACCESS',k:'hasAccess'},{l:'MEDIA DONE',k:'mediaDone'},{l:'BUYER LIST BLASTED',k:'buyerBlasted'}].map(f => (
                      <label key={f.k} className="flex items-center gap-2">
                        <input type="checkbox" checked={dealForm[f.k as keyof typeof form] as boolean} 
                          onChange={e => setDealForm({...dealForm, [f.k]: e.target.checked})} />
                        <span>{f.l}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-800 p-2">
                  <label className="text-gray-500">NOTES</label>
                  <textarea value={dealForm.notes} onChange={e => setDealForm({...dealForm, notes: e.target.value})}
                    className="w-full bg-black border border-gray-700 p-1 mt-1 h-16" />
                </div>

                <div className="border border-gray-800 p-2">
                  <div className="flex justify-between text-gray-500 mb-1">
                    <span>PHOTOS *</span><span className="text-yellow-500">{dealForm.photos.length} / 10</span>
                  </div>
                  <label className="block border-2 border-dashed border-gray-700 p-4 text-center cursor-pointer hover:border-yellow-500">
                    <input type="file" multiple accept="image/*" onChange={e => e.target.files && setDealForm({...dealForm, photos: Array.from(e.target.files).slice(0,10)})} className="hidden" />
                    <div>CLICK OR DRAG TO UPLOAD // MAX 10 // JPG PNG ONLY</div>
                  </label>
                </div>

                <div className="bg-[#1A1A1A] border border-yellow-500 p-2">
                  <div className="text-yellow-500 font-bold">LIVE DEAL SCORE: {calcDealScore()} / 100</div>
                  <div className="grid grid-cols-3 gap-2 text-xs mt-1">
                    <div>MAO: ${calcMAO().toLocaleString()}</div>
                    <div>SPREAD: ${calcSpread().toLocaleString()}</div>
                    <div className="text-green-500">BUYERS: 5 MATCH</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-3 border-t border-yellow-500">
                <button onClick={() => setShowDealForm(false)} className="flex-1 bg-gray-700 py-2">CANCEL</button>
                <button onClick={handleSubmit} className="flex-1 bg-yellow-500 text-black py-2 font-bold">SUBMIT DEAL</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
