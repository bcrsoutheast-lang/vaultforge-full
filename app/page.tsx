'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://YOUR-PROJECT.supabase.co', // <-- REPLACE
  'YOUR-ANON-KEY' // <-- REPLACE
)

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    propertyType: 'RESIDENTIAL',
    address: '', city: '', state: '', zip: '', beds: '', baths: '', sqft: '', yearBuilt: '',
    ownerName: '', phone: '', email: '',
    motivation: '', condition: '', occupancy: '', askingPrice: '', estARV: '', estRepairs: '',
    mortgage: '', lenderName: '', lienType: '', auctionDate: '', leadSource: '',
    skipTraced: false, dncList: false, probate: false, vacantConfirm: false, sendSMS: false,
    notes: '', photos: [] as File[]
  })
  const [incomplete, setIncomplete] = useState(false)

  const calcPS = () => {
    let score = 0
    const map = {M:10,F:20,D:30,T:40,PR:50}
    score += map[form.motivation as keyof typeof map] || 0
    const condMap = {POOR:30,FAIR:20,GOOD:10,EXCELLENT:5}
    score += condMap[form.condition as keyof typeof condMap] || 0
    if (form.occupancy === 'VACANT') score += 20
    return Math.min(score, 100)
  }

  const handleSubmit = async () => {
    const req = ['ownerName','phone','address','city','state','zip','motivation','condition','occupancy','askingPrice']
    if (req.some(f =>!form[f as keyof typeof form]) || form.photos.length === 0) {
      setIncomplete(true)
      return
    }
    
    const photoUrls = await Promise.all(
      form.photos.map(async (file) => {
        const fileName = `${Date.now()}-${file.name}`
        const { error } = await supabase.storage.from('lead-photos').upload(fileName, file)
        if (error) throw error
        const { data } = supabase.storage.from('lead-photos').getPublicUrl(fileName)
        return data.publicUrl
      })
    )

    const ps = calcPS()
    const equity = (Number(form.estARV) || 0) - (Number(form.mortgage) || 0)
    
    const { error } = await supabase.from('pain_leads').insert({
     ...form,
      sqft: Number(form.sqft) || null,
      year_built: Number(form.yearBuilt) || null,
      asking_price: Number(form.askingPrice),
      est_arv: Number(form.estARV) || null,
      est_repairs: Number(form.estRepairs) || null,
      mortgage_balance: Number(form.mortgage) || null,
      auction_date: form.auctionDate || null,
      ps_score: ps,
      equity: equity,
      photos: photoUrls
    })
    
    if (error) return alert('ERROR: ' + error.message)
    alert(`SAVED TO DB\nPS SCORE: ${ps}\nPHOTOS: ${photoUrls.length}`)
    setShowForm(false)
    setIncomplete(false)
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-mono p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-yellow-500 text-2xl font-bold">ALPHA VEST COMMAND CENTER</h1>
          <button onClick={() => setShowForm(true)} className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-3 px-6 rounded border-2 border-yellow-400">
            + NEW LEAD
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="border-2 border-yellow-500 p-4">
            <div className="text-yellow-500 text-sm">NEW LEADS</div>
            <div className="text-4xl font-bold">12</div>
          </div>
          <div className="border-2 border-yellow-500 p-4">
            <div className="text-yellow-500 text-sm">ACTIVE DEALS</div>
            <div className="text-4xl font-bold">8</div>
          </div>
          <div className="border-2 border-yellow-500 p-4">
            <div className="text-yellow-500 text-sm">UNDER CONTRACT</div>
            <div className="text-4xl font-bold">3</div>
          </div>
          <div className="border-2 border-yellow-500 p-4">
            <div className="text-yellow-500 text-sm">CLOSED</div>
            <div className="text-4xl font-bold">27</div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto">
          <div className="min-h-screen p-2">
            <div className="bg-[#0D0D0D] border-2 border-yellow-500 max-w-3xl mx-auto">
              <div className="flex justify-between items-center border-b border-yellow-500 p-3">
                <div className="text-yellow-500 font-bold text-sm">PAIN ANALYZER // NEW LEAD INTAKE</div>
                <button onClick={() => setShowForm(false)} className="bg-red-600 px-3 py-1 text-xs">CLOSE [X]</button>
              </div>

              <div className="flex border-b border-yellow-500">
                {['RESIDENTIAL','COMMERCIAL','LAND'].map(type => (
                  <button key={type} onClick={() => setForm({...form, propertyType: type})}
                    className={`flex-1 py-2 text-xs border-r border-yellow-500 last:border-r-0 ${form.propertyType === type? 'bg-yellow-500 text-black' : 'bg-[#1A1A1A]'}`}>
                    {type}
                  </button>
                ))}
              </div>

              {incomplete && <div className="bg-red-600 p-2 text-center text-xs font-bold">INCOMPLETE: FILL REQUIRED + UPLOAD MIN 1 PHOTO</div>}

              <div className="p-3 space-y-2 text-xs max-h-96 overflow-y-auto">
                {[
                  {l:'PROPERTY ADDRESS *',k:'address'},{l:'CITY *',k:'city'},{l:'STATE *',k:'state',t:'select',o:['AL','GA','FL','TX','CA','NY','IL','OH']},
                  {l:'ZIP *',k:'zip'},{l:'BEDS',k:'beds',t:'select',o:['1','2','3','4','5','6+']},{l:'BATHS',k:'baths',t:'select',o:['1','1.5','2','2.5','3','3.5','4+']},
                  {l:'SQFT',k:'sqft'},{l:'YEAR BUILT',k:'yearBuilt'},{l:'OWNER NAME *',k:'ownerName'},{l:'PHONE *',k:'phone'},{l:'EMAIL',k:'email'},
                  {l:'MOTIVATION *',k:'motivation',t:'select',o:['M','F','D','T','PR']},{l:'CONDITION *',k:'condition',t:'select',o:['POOR','FAIR','GOOD','EXCELLENT']},
                  {l:'OCCUPANCY *',k:'occupancy',t:'select',o:['OWNER','TENANT','VACANT']},{l:'ASKING PRICE *',k:'askingPrice',t:'number'},{l:'EST ARV',k:'estARV',t:'number'},
                  {l:'EST REPAIRS',k:'estRepairs',t:'number'},{l:'MORTGAGE BAL',k:'mortgage',t:'number'},{l:'LENDER NAME',k:'lenderName'},
                  {l:'LIEN TYPE',k:'lienType',t:'select',o:['1ST','2ND','TAX','MECHANIC']},{l:'AUCTION DATE',k:'auctionDate',t:'date'},
                  {l:'LEAD SOURCE',k:'leadSource',t:'select',o:['DRIVE','COLD_CALL','PPC','REFERRAL','DIRECT_MAIL']}
                ].map(f => (
                  <div key={f.k} className="border border-gray-800 p-2">
                    <label className="text-gray-500">{f.l}</label>
                    {f.t === 'select'? (
                      <select value={form[f.k as keyof typeof form] as string} onChange={e => setForm({...form, [f.k]: e.target.value})}
                        className="w-full bg-black border border-gray-700 p-1 mt-1">
                        <option value="">SELECT...</option>
                        {f.o?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input type={f.t || 'text'} value={form[f.k as keyof typeof form] as string} 
                        onChange={e => setForm({...form, [f.k]: e.target.value})}
                        className="w-full bg-black border border-gray-700 p-1 mt-1" />
                    )}
                  </div>
                ))}

                <div className="border border-gray-800 p-2">
                  <label className="text-gray-500">SKIP TRACE FLAGS</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {[{l:'SKIP TRACED',k:'skipTraced'},{l:'DNC LIST',k:'dncList'},{l:'PROBATE',k:'probate'},{l:'VACANT CONFIRM',k:'vacantConfirm'},{l:'SEND SMS',k:'sendSMS'}].map(f => (
                      <label key={f.k} className="flex items-center gap-2">
                        <input type="checkbox" checked={form[f.k as keyof typeof form] as boolean} 
                          onChange={e => setForm({...form, [f.k]: e.target.checked})} />
                        <span>{f.l}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-800 p-2">
                  <label className="text-gray-500">NOTES</label>
                  <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                    className="w-full bg-black border border-gray-700 p-1 mt-1 h-16" />
                </div>

                <div className="border border-gray-800 p-2">
                  <div className="flex justify-between text-gray-500 mb-1">
                    <span>PHOTOS *</span><span className="text-yellow-500">{form.photos.length} / 10</span>
                  </div>
                  <label className="block border-2 border-dashed border-gray-700 p-4 text-center cursor-pointer hover:border-yellow-500">
                    <input type="file" multiple accept="image/*" onChange={e => e.target.files && setForm({...form, photos: Array.from(e.target.files).slice(0,10)})} className="hidden" />
                    <div>CLICK OR DRAG TO UPLOAD // MAX 10 // JPG PNG ONLY</div>
                  </label>
                </div>

                <div className="bg-[#1A1A1A] border border-yellow-500 p-2">
                  <div className="text-yellow-500 font-bold">LIVE PS SCORE: {calcPS()} / 100</div>
                  <div className="text-xs">EQUITY: ${((Number(form.estARV) || 0) - (Number(form.mortgage) || 0)).toLocaleString()}</div>
                </div>
              </div>

              <div className="flex gap-3 p-3 border-t border-yellow-500">
                <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-700 py-2">CANCEL</button>
                <button onClick={handleSubmit} className="flex-1 bg-yellow-500 text-black py-2 font-bold">SUBMIT LEAD</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
