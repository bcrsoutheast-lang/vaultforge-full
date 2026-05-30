// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function NewDealPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [comps, setComps] = useState([])
  const [suggestedARV, setSuggestedARV] = useState(0)
  const [pullingComps, setPullingComps] = useState(false)
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    arv: '',
    purchase_price: '',
    rehab_cost: '',
    profit: '',
    seller_name: '',
    seller_phone: '',
    seller_email: '',
    motivation: '',
    timeline: '',
    occupancy: '',
    condition: '',
    notes: '',
    status: 'live',
    beds: '',
    baths: '',
    sqft: ''
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
  
  const label = "block text-sm font-medium text-zinc-400 mb-1.5"
  const input = "w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
  const select = input

  const mao = form.arv && form.rehab_cost ? Math.round(Number(form.arv) * 0.7 - Number(form.rehab_cost) - 10000) : 0
  const overMAO = form.purchase_price && mao > 0 && Number(form.purchase_price) > mao

  const calcPainScore = () => {
    let score = 0
    const weights = {
      motivation: { Foreclosure: 25, Divorce: 20, Inherited: 20, 'Tired Landlord': 15, 'Job Loss': 15, 'Tax Liens': 25, 'Code Violations': 20 },
      timeline: { ASAP: 25, '30 Days': 20, '60 Days': 10, '90+ Days': 0 },
      occupancy: { Vacant: 25, 'Tenant Occupied': 10, 'Owner Occupied': 15 },
      condition: { Teardown: 25, 'Heavy Rehab': 20, 'Medium Rehab': 10, 'Light Rehab': 5, Turnkey: 0 }
    }
    score += weights.motivation[form.motivation] || 0
    score += weights.timeline[form.timeline] || 0
    score += weights.occupancy[form.occupancy] || 0
    score += weights.condition[form.condition] || 0
    return Math.min(score, 100)
  }
  const painScore = calcPainScore()
  const painLabel = painScore >= 70 ? 'HOT' : painScore >= 40 ? 'WARM' : 'COLD'
  const painColor = painScore >= 70 ? 'text-red-500' : painScore >= 40 ? 'text-yellow-500' : 'text-blue-500'

  const pullInternalComps = async () => {
    if (!form.city || !form.state) return alert('Enter City and State first')
    setPullingComps(true)
    
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const { data } = await supabase
      .from('deals')
      .select('address, city, state, zip, arv, beds, baths, sqft, created_at')
      .eq('city', form.city)
      .eq('state', form.state)
      .eq('status', 'closed')
      .not('arv', 'is', null)
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (data && data.length > 0) {
      setComps(data)
      const avg = Math.round(data.reduce((sum, d) => sum + Number(d.arv), 0) / data.length)
      setSuggestedARV(avg)
      setForm({...form, arv: avg})
    } else {
      alert('No closed comps in database yet for this city. Enter ARV manually.')
    }
    setPullingComps(false)
  }

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 10)
    if (!files.length) return
    setUploading(true)
    
    const uploadedUrls = []
    for (const file of files) {
      const fileName = `${user?.id}/${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage.from('deal-photos').upload(fileName, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('deal-photos').getPublicUrl(fileName)
        uploadedUrls.push(publicUrl)
      }
    }
    setPhotos([...photos, ...uploadedUrls])
    setUploading(false)
  }

  const handleSubmit = async (e, status = 'live') => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user) {
        alert('You must be logged in to post a deal')
        router.push('/login')
        return
      }

      const { error } = await supabase
        .from('deals')
        .insert({
          user_id: user.id,
          address: form.address,
          city: form.city,
          state: form.state,
          zip: form.zip,
          arv: form.arv ? Number(form.arv) : null,
          purchase_price: form.purchase_price ? Number(form.purchase_price) : null,
          rehab_cost: form.rehab_cost ? Number(form.rehab_cost) : null,
          profit: form.profit ? Number(form.profit) : null,
          seller_name: form.seller_name,
          seller_phone: form.seller_phone,
          seller_email: form.seller_email,
          motivation: form.motivation,
          timeline: form.timeline,
          occupancy: form.occupancy,
          condition: form.condition,
          notes: form.notes,
          status: status,
          photos: photos,
          pain_score: painScore,
          beds: form.beds ? Number(form.beds) : null,
          baths: form.baths ? Number(form.baths) : null,
          sqft: form.sqft ? Number(form.sqft) : null
        })

      if (error) throw error
      router.push('/deal-room')
    } catch (err) {
      alert(err.message || 'Error posting deal')
    } finally {
      setLoading(false)
    }
  }

  const zillowUrl = form.address ? `https://www.zillow.com/homes/${encodeURIComponent(`${form.address}-${form.city}-${form.state}-${form.zip}`)}` : ''
  const mapsUrl = form.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${form.address} ${form.city} ${form.state} ${form.zip}`)}` : ''

  if (!user) return (<div className="min-h-screen bg-black text-white p-4 flex items-center justify-center font-mono">LOADING INTEL...</div>)

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur border-b border-zinc-800 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">6SIGMA DEAL ANALYZER</h1>
          <div className="text-right">
            <div className="text-xs text-zinc-500 font-mono">PAIN SCORE</div>
            <div className={`text-2xl font-bold font-mono ${painColor}`}>{painScore} {painLabel}</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <form onSubmit={(e) => handleSubmit(e, 'live')} className="space-y-6">
          
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-5 text-red-500 font-mono">PROPERTY DETAILS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={label}>Property Address *</label>
                <input required type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={input} placeholder="123 Main St" />
                {form.address && (
                  <div className="flex gap-3 mt-2 text-sm">
                    <a href={zillowUrl} target="_blank" className="text-blue-400 hover:underline">Zillow →</a>
                    <a href={mapsUrl} target="_blank" className="text-blue-400 hover:underline">Google Maps →</a>
                  </div>
                )}
              </div>
              <div>
                <label className={label}>City *</label>
                <input required type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className={input} placeholder="Atlanta" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label}>State *</label>
                  <select required value={form.state} onChange={e => setForm({...form, state: e.target.value})} className={select}>
                    <option value="">Select</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label}>Zip</label>
                  <input type="text" value={form.zip} onChange={e => setForm({...form, zip: e.target.value})} className={input} placeholder="30303" />
                </div>
              <div>
                <label className={label}>Beds</label>
                <input type="number" value={form.beds} onChange={e => setForm({...form, beds: e.target.value})} className={input} placeholder="3" />
              </div>
              <div>
                <label className={label}>Baths</label>
                <input type="number" step="0.5" value={form.baths} onChange={e => setForm({...form, baths: e.target.value})} className={input} placeholder="2" />
              </div>
              <div className="md:col-span-2">
                <label className={label}>Sqft</label>
                <input type="number" value={form.sqft} onChange={e => setForm({...form, sqft: e.target.value})} className={input} placeholder="1800" />
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-5 text-red-500 font-mono">DEAL FINANCIALS</h2>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-zinc-400 font-mono text-sm uppercase">6Sigma Comps Engine</span>
                <button type="button" onClick={pullInternalComps} disabled={pullingComps} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold disabled:opacity-50">
                  {pullingComps ? 'Scanning...' : 'Pull Comps →'}
                </button>
              </div>
              {comps.length > 0 ? (
                <div className="space-y-1 mt-3">
                  {comps.map((c, i) => (
                    <div key={i} className="text-xs font-mono text-zinc-400 flex justify-between">
                      <span>{c.address}</span>
                      <span>${Number(c.arv).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="text-green-500 font-bold font-mono mt-2 pt-2 border-t border-zinc-800">
                    SUGGESTED ARV: ${suggestedARV.toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-zinc-600 text-xs font-mono">No closed comps in DB yet. Close deals to build your comp engine.</div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={label}>ARV - After Repair Value</label>
                <input type="number" min="0" value={form.arv} onChange={e => setForm({...form, arv: e.target.value})} className={input} placeholder="250000" />
              </div>
              <div>
                <label className={label}>Purchase Price</label>
                <input type="number" min="0" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} className={`${input} ${overMAO ? 'border-red-600' : ''}`} placeholder="150000" />
              </div>
              <div>
                <label className={label}>Est. Rehab Cost</label>
                <input type="number" min="0" value={form.rehab_cost} onChange={e => setForm({...form, rehab_cost: e.target.value})} className={input} placeholder="30000" />
              </div>
              <div>
                <label className={label}>Est. Profit</label>
                <input type="number" value={form.profit} onChange={e => setForm({...form, profit: e.target.value})} className={input} placeholder="70000" />
              </div>
              {mao > 0 && (
                <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 font-mono text-sm">MAX ALLOWABLE OFFER (70% RULE)</span>
                    <span className={`text-2xl font-bold font-mono ${overMAO ? 'text-red-500' : 'text-green-500'}`}>
                      ${mao.toLocaleString()}
                    </span>
                  </div>
                  {overMAO && <p className="text-red-500 text-sm mt-1 font-mono">WARNING: PURCHASE ABOVE MAO</p>}
                </div>
              )}
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-5 text-red-500 font-mono">SELLER INTEL</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={label}>Seller Name</label>
                <input type="text" value={form.seller_name} onChange={e => setForm({...form, seller_name: e.target.value})} className={input} placeholder="John Doe" />
              </div>
              <div>
                <label className={label}>Seller Phone</label>
                <input type="tel" value={form.seller_phone} onChange={e => setForm({...form, seller_phone: e.target.value})} className={input} placeholder="(555) 123-4567" />
              </div>
              <div className="md:col-span-2">
                <label className={label}>Seller Email</label>
                <input type="email" value={form.seller_email} onChange={e => setForm({...form, seller_email: e.target.value})} className={input} placeholder="seller@email.com" />
              </div>
              <div>
                <label className={label}>Seller Motivation</label>
                <select value={form.motivation} onChange={e => setForm({...form, motivation: e.target.value})} className={select}>
                  <option value="">Select Motivation</option>
                  <option value="Foreclosure">Foreclosure</option>
                  <option value="Divorce">Divorce</option>
                  <option value="Inherited">Inherited Property</option>
                  <option value="Tired Landlord">Tired Landlord</option>
                  <option value="Job Loss">Job Loss/Relocation</option>
                  <option value="Tax Liens">Tax Liens</option>
                  <option value="Code Violations">Code Violations</option>
                </select>
              </div>
              <div>
                <label className={label}>Timeline to Sell</label>
                <select value={form.timeline} onChange={e => setForm({...form, timeline: e.target.value})} className={select}>
                  <option value="">Select Timeline</option>
                  <option value="ASAP">ASAP - Under 2 Weeks</option>
                  <option value="30 Days">Within 30 Days</option>
                  <option value="60 Days">Within 60 Days</option>
                  <option value="90+ Days">90+ Days</option>
                </select>
              </div>
              <div>
                <label className={label}>Occupancy Status</label>
                <select value={form.occupancy} onChange={e => setForm({...form, occupancy: e.target.value})} className={select}>
                  <option value="">Select Status</option>
                  <option value="Vacant">Vacant</option>
                  <option value="Owner Occupied">Owner Occupied</option>
                  <option value="Tenant Occupied">Tenant Occupied</option>
                </select>
              </div>
              <div>
                <label className={label}>Property Condition</label>
                <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} className={select}>
                  <option value="">Select Condition</option>
                  <option value="Turnkey">Turnkey</option>
                  <option value="Light Rehab">Light Rehab - Cosmetic</option>
                  <option value="Medium Rehab">Medium Rehab</option>
                  <option value="Heavy Rehab">Heavy Rehab - Gut</option>
                  <option value="Teardown">Teardown/Land Value</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-5 text-red-500 font-mono">PHOTOS & NOTES</h2>
            <div className="space-y-5">
              <div>
                <label className={label}>Property Photos (Max 10)</label>
                <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="block w-full text-sm text-zinc-400 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 file:cursor-pointer cursor-pointer" />
                {uploading && <p className="text-yellow-500 text-sm mt-2 font-mono">UPLOADING...</p>}
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {photos.map((url, i) => (
                      <img key={i} src={url} className="w-full h-24 object-cover rounded-lg" />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className={label}>Deal Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={input} rows={5} placeholder="Seller needs to close in 2 weeks. Roof replaced 2021. AC is out. Motivated due to job transfer. Needs $5k to move..." />
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur border-t border-zinc-800 p-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <button type="button" onClick={(e) => handleSubmit(e, 'draft')} disabled={loading} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-semibold text-lg transition-colors disabled:opacity-50 font-mono">
            {loading ? 'SAVING...' : 'SAVE DRAFT'}
          </button>
          <button type="button" onClick={(e) => handleSubmit(e, 'live')} disabled={loading} className="flex-1 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold text-lg transition-colors disabled:opacity-50 font-mono">
            {loading ? 'POSTING...' : 'POST DEAL LIVE'}
          </button>
        </div>
      </div>
    </div>
  )
}
