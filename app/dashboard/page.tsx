'use client'
import { useState } from 'react'

export default function Dashboard() {
  const [showPainForm, setShowPainForm] = useState(false)
  const [painForm, setPainForm] = useState({
    propertyType: 'RESIDENTIAL',
    address: '', city: '', state: '', zip: '',
    beds: '', baths: '', sqft: '', yearBuilt: '',
    ownerName: '', phone: '', email: '',
    motivation: '', condition: '', occupancy: '',
    askingPrice: '', estARV: '', estRepairs: '',
    mortgageBalance: '', lenderName: '', lienType: '',
    auctionDate: '', leadSource: '',
    skipTraced: false, dncList: false, probate: false, vacantConfirm: false,
    sendSMS: false, notes: '', photos: [] as File[]
  })
  const [incomplete, setIncomplete] = useState(false)

  const calcPS = () => {
    let score = 0
    const m: Record<string, number> = {FORECLOSURE:40,TAX_LIEN:38,DIVORCE:35,DEATH:33,RELOCATION:25,TIRED_LANDLORD:30,INHERITED:28,DOWNSIZING:20,OTHER:15}
    score += m[painForm.motivation] || 0
    const c: Record<string, number> = {TEARDOWN:25,MAJOR_REPAIR:20,COSMETIC:15,RENT_READY:10,TURNKEY:5}
    score += c[painForm.condition] || 0
    const o: Record<string, number> = {VACANT:15,OWNER:10,TENANT:5}
    score += o[painForm.occupancy] || 0
    const ask = Number(painForm.askingPrice) || 0
    const arv = Number(painForm.estARV) || 0
    const equity = arv - ask
    if (equity > 100000) score += 20
    else if (equity > 50000) score += 15
    else if (equity > 25000) score += 10
    else if (equity > 10000) score += 5
    return Math.min(score, 100)
  }

  const handleSubmit = () => {
    const req = ['address','city','state','zip','beds','baths','sqft','ownerName','phone','motivation','condition','occupancy','askingPrice']
    if (req.some(f =>!painForm[f as keyof typeof painForm]) || painForm.photos.length === 0) {
      setIncomplete(true)
      return
    }
    const finalPS = calcPS()
    console.log('PAIN LEAD:', {...painForm, psScore: finalPS})
    alert(`PAIN SAVED\nPS: ${finalPS}\nBuyers Matched: 3\nSMS Sent: ${painForm.sendSMS? 'YES' : 'NO'}`)
    setShowPainForm(false)
    setIncomplete(false)
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-mono p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4 mb-6">
          <button onClick={() => setShowPainForm(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded border-2 border-red-400">
            + NEW PAIN LEAD
          </button>
          <button className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-6 rounded border-2 border-yellow-400">
            + NEW DEAL
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="border-2 border-red-500 p-4">
            <div className="text-red-500 text-sm">PAIN SAVED</div>
            <div className="text-4xl font-bold">47</div>
            <div className="text-xs">PS AVG: 74 🔥 8</div>
            <div className="text-red-500 text-xs mt-2">[ENTER]</div>
          </div>
          <div className="border-2 border-yellow-500 p-4">
            <div className="text-yellow-500 text-sm">DEAL SAVED</div>
            <div className="text-4xl font-bold">23</div>
            <div className="text-xs">AVG: $31K 🔥 3</div>
            <div className="text-yellow-500 text-xs mt-2">[ENTER]</div>
          </div>
          <div className="border-2 border-yellow-500 p-4">
            <div className="text-yellow-500 text-sm">ALPHA VAULT</div>
            <div className="text-4xl font-bold">5</div>
            <div className="text-xs">TOP 3 FIRST</div>
          </div>
        </div>
      </div>

      {showPainForm && (
        <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
          <div className="min-h-screen p-2">
            <div className="bg-[#0D0D0D] border-2 border-yellow-500 max-w-3xl mx-auto">
              <div className="flex justify-between items-center border-b border-yellow-500 p-3">
                <div className="text-yellow-500 font-bold text-sm">PAIN INTAKE FORM // NEW LEAD SUBMISSION</div>
                <button onClick={() => setShowPainForm(false)} className="bg-red-600 px-3 py-1 text-xs">CLOSE [X]</button>
              </div>

              <div className="flex border-b border-yellow-500">
                {['RESIDENTIAL','COMMERCIAL','LAND'].map(type => (
                  <button key={type} onClick={() => setPainForm({...painForm, propertyType: type})}
                    className={`flex-1 py-2 text-xs border-r border-yellow-500 last:border-r-0 ${painForm.propertyType === type? 'bg-yellow-500 text-black' : 'bg-[#1A1A1A]'}`}>
                    {type}
                  </button>
                ))}
              </div>

              {incomplete && <div className="bg-red-600 p-2 text-center text-xs font-bold">INCOMPLETE: FILL REQUIRED + UPLOAD MIN 1 PHOTO</div>}

              <div className="p-3 space-y-2 max-h-[70vh] overflow-y-auto text-xs">
                {[
                  {l:'PROPERTY ADDRESS *',k:'address'},{l:'CITY *',k:'city'},
                  {l:'STATE *',k:'state',t:'select',o:['AL','GA','FL','TX','CA','NY','IL','OH']},
                  {l:'ZIP *',k:'zip'},{l:'BEDS *',k:'beds',t:'select',o:['1','2','3','4','5','6+']},
                  {l:'BATHS *',k:'baths',t:'select',o:['1','1.5','2','2.5','3','3.5','4+']},
                  {l:'SQFT *',k:'sqft'},{l:'YEAR BUILT',k:'yearBuilt'},
                  {l:'OWNER NAME *',k:'ownerName'},{l:'PHONE *',k:'phone'},{l:'EMAIL',k:'email'},
                  {l:'MOTIVATION *',k:'motivation',t:'select',o:['FORECLOSURE','TAX_LIEN','DIVORCE','DEATH','RELOCATION','TIRED_LANDLORD','INHERITED','DOWNSIZING','OTHER']},
                  {l:'CONDITION *',k:'condition',t:'select',o:['TEARDOWN','MAJOR_REPAIR','COSMETIC','RENT_READY','TURNKEY']},
                  {l:'OCCUPANCY *',k:'occupancy',t:'select',o:['VACANT','OWNER','TENANT']},
                  {l:'ASKING PRICE *',k:'askingPrice',t:'number'},{l:'EST ARV',k:'estARV',t:'number'},{l:'EST REPAIRS',k:'estRepairs',t:'number'},
                  {l:'MORTGAGE BALANCE',k:'mortgageBalance',t:'number'},{l:'LENDER NAME',k:'lenderName'},
                  {l:'LIEN TYPE',k:'lienType',t:'select',o:['NONE','TAX','HOA','MECHANIC','IRS']},
                  {l:'AUCTION DATE',k:'auctionDate',t:'date'},{l:'LEAD SOURCE',k:'leadSource',t:'select',o:['DRIVING FOR DOLLARS','COLD CALL','PPC','DIRECT MAIL','REFERRAL','MLS']}
                ].map(f => (
                  <div key={f.k} className="border border-gray-800 p-2">
                    <label className="text-gray-500">{f.l}</label>
                    {f.t === 'select'? (
                      <select value={painForm[f.k as keyof typeof painForm] as string} onChange={e => setPainForm({...painForm, [f.k]: e.target.value})}
                        className="w-full bg-black border border-gray-700 p-1 mt-1">
                        <option value="">SELECT...</option>
                        {f.o?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input type={f.t || 'text'} value={painForm[f.k as keyof typeof painForm] as string} 
                        onChange={e => setPainForm({...painForm, [f.k]: e.target.value})}
                        className="w-full bg-black border border-gray-700 p-1 mt-1" />
                    )}
                  </div>
                ))}

                <div className="border border-gray-800 p-2">
                  <label className="text-gray-500">SKIP TRACE FLAGS</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {[{l:'SKIP TRACED',k:'skipTraced'},{l:'DNC LIST',k:'dncList'},{l:'PROBATE CASE',k:'probate'},{l:'VACANT CONFIRMED',k:'vacantConfirm'}].map(f => (
                      <label key={f.k} className="flex items-center gap-2">
                        <input type="checkbox" checked={painForm[f.k as keyof typeof painForm] as boolean} 
                          onChange={e => setPainForm({...painForm, [f.k]: e.target.checked})} />
                        <span>{f.l}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-800 p-2">
                  <label className="text-gray-500">NOTES</label>
                  <textarea value={painForm.notes} onChange={e => setPainForm({...painForm, notes: e.target.value})}
                    className="w-full bg-black border border-gray-700 p-1 mt-1 h-16" />
                </div>

                <div className="border border-gray-800 p-2">
                  <div className="flex justify-between text-gray-500 mb-1">
                    <span>PHOTOS *</span><span className="text-yellow-500">{painForm.photos.length} / 10</span>
                  </div>
                  <label className="block border-2 border-dashed border-gray-700 p-4 text-center cursor-pointer hover:border-yellow-500">
                    <input type="file" multiple accept="image/*" onChange={e => e.target.files && setPainForm({...painForm, photos: Array.from(e.target.files).slice(0,10)})} className="hidden" />
                    <div>CLICK OR DRAG TO UPLOAD // MAX 10 // JPG PNG ONLY</div>
                  </label>
                </div>

                <label className="flex items-center gap-2 border border-gray-800 p-2">
                  <input type="checkbox" checked={painForm.sendSMS} onChange={e => setPainForm({...painForm, sendSMS: e.target.checked})} />
                  <span>SEND PAIN SCRIPT TO OWNER ON SAVE</span>
                </label>

                <div className="bg-[#1A1A1A] border border-yellow-500 p-2">
                  <div className="text-yellow-500 font-bold">LIVE PS SCORE: {calcPS()} / 100 {calcPS() >= 70 && '🔥 HOT'}</div>
                  <div className="text-xs text-gray-400 mt-1">BUYER MATCH PREVIEW: 3 BUYERS IN ALPHA VAULT MATCH</div>
                </div>
              </div>

              <div className="flex gap-3 p-3 border-t border-yellow-500">
                <button onClick={() => setShowPainForm(false)} className="flex-1 bg-gray-700 py-2">CANCEL</button>
                <button onClick={handleSubmit} className="flex-1 bg-yellow-500 text-black py-2 font-bold">SUBMIT PAIN</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
