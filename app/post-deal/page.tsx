'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type DealForm = {
  title: string
  dealType: string
  exitStrategy: string
  propertyType: string
  street: string
  city: string
  state: string
  zip: string
  askingPrice: number | ''
  assignmentFee: number | ''
  arv: number | ''
  rehab: number | ''
  comp1Addr: string
  comp1Price: number | ''
  comp2Addr: string
  comp2Price: number | ''
  comp3Addr: string
  comp3Price: number | ''
  loanBalance: number | ''
  loanRate: number | ''
  condition: string
  occupancy: string
  access: string
  inspectionDays: number | ''
  closeDate: string
  whySelling: string
  sellerName: string
  sellerPhone: string
  sellerEmail: string
  licensed: boolean
  photos: File[]
}

export default function PostDeal() {
  const router = useRouter()
  const [form, setForm] = useState<DealForm>({
    title: '', dealType: 'Wholesale', exitStrategy: 'Flip', propertyType: 'SFR',
    street: '', city: '', state: 'GA', zip: '',
    askingPrice: '', assignmentFee: '', arv: '', rehab: '',
    comp1Addr: '', comp1Price: '', comp2Addr: '', comp2Price: '', comp3Addr: '', comp3Price: '',
    loanBalance: '', loanRate: '',
    condition: 'Needs Some Work', occupancy: 'Vacant', access: 'Appointment Only',
    inspectionDays: 10, closeDate: '', whySelling: 'Tired Landlord',
    sellerName: '', sellerPhone: '', sellerEmail: '', licensed: false,
    photos: []
  })
  const [analysis, setAnalysis] = useState<any>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [dealId, setDealId] = useState('')

  const calculateMAO = () => {
    if (!form.arv ||!form.rehab ||!form.assignmentFee) return 0
    const arv = Number(form.arv)
    const rehab = Number(form.rehab)
    const assign = Number(form.assignmentFee)
    const closing = arv * 0.03
    const contingency = arv * 0.1
    return Math.round((arv * 0.7) - rehab - closing - assign - contingency)
  }

  const runAnalyzer = () => {
    const mao = calculateMAO()
    const asking = Number(form.askingPrice) || 0
    const profit = Number(form.arv) - Number(form.rehab) - asking - Number(form.assignmentFee) - (Number(form.arv) * 0.13)
    
    const flags: string[] = []
    if (form.photos.length === 0) flags.push('NO PHOTOS: Deals without photos get ignored')
    if (!form.inspectionDays) flags.push('NO INSPECTION: No safety valve = dead deal')
    if (asking > mao && mao > 0) flags.push(`OVER MAO: $${(asking - mao).toLocaleString()} over. Buyers will pass`)
    if (profit < 20000 && form.propertyType === 'SFR') flags.push('THIN DEAL: <$20k profit. Only for newbies')
    if (!form.comp1Price ||!form.comp2Price ||!form.comp3Price) flags.push('NO COMPS: ARV unverified')
    if (!form.sellerName ||!form.sellerPhone ||!form.sellerEmail) flags.push('NO CONTACT: Buyers cannot reach you')

    setAnalysis({ mao, profit: Math.round(profit), flags })
    return flags.length === 0
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 10)
    setForm({...form, photos: files})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    setSubmitError('')

    const passed = runAnalyzer()
    if (!passed) {
      setErrors(['ANALYZER REJECT: Fix red flags before posting.'])
      return
    }

    try {
      // TODO: Replace with actual Supabase insert
      // const { data, error } = await supabase.from('deals').insert()
      // if (error) throw error
      
      const mockId = 'VF-' + Math.random().toString(36).substring(2, 8).toUpperCase()
      setDealId(mockId)
      setSubmitted(true)
    } catch (err: any) {
      setSubmitError(`SUBMIT FAILED: ${err.message || 'Database error. Check connection.'}`)
    }
  }

  const resetForm = () => {
    setSubmitted(false)
    setSubmitError('')
    setAnalysis(null)
    setErrors([])
    setForm({
      title: '', dealType: 'Wholesale', exitStrategy: 'Flip', propertyType: 'SFR',
      street: '', city: '', state: 'GA', zip: '',
      askingPrice: '', assignmentFee: '', arv: '', rehab: '',
      comp1Addr: '', comp1Price: '', comp2Addr: '', comp2Price: '', comp3Addr: '', comp3Price: '',
      loanBalance: '', loanRate: '',
      condition: 'Needs Some Work', occupancy: 'Vacant', access: 'Appointment Only',
      inspectionDays: 10, closeDate: '', whySelling: 'Tired Landlord',
      sellerName: '', sellerPhone: '', sellerEmail: '', licensed: false,
      photos: []
    })
  }

  const mao = calculateMAO()
  const profit = form.arv? Number(form.arv) - Number(form.rehab) - Number(form.askingPrice) - Number(form.assignmentFee) - (Number(form.arv) * 0.13) : 0

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans">
        <div className="max-w-2xl mx-auto p-6 pt-20">
          <div className="bg-emerald-900/20 border border-emerald-700 p-8 text-center">
            <div className="text-emerald-400 font-mono text-sm mb-2">TRANSACTION COMPLETE</div>
            <div className="text-2xl font-bold mb-4">DEAL SUBMITTED</div>
            <div className="text-zinc-400 text-sm mb-6">VAULT ID: <span className="text-emerald-400 font-mono">{dealId}</span></div>
            <div className="text-xs text-zinc-500 mb-8">Deal is now live in the Deal Room pending admin review.</div>
            <button onClick={resetForm} className="bg-emerald-600 hover:bg-emerald-500 text-black px-6 py-3 text-sm font-bold">
              POST ANOTHER DEAL
            </button>
            <button onClick={() => router.push('/')} className="block mx-auto mt-3 text-xs text-zinc-500 hover:text-zinc-300">
              RETURN TO COMMAND CENTER
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans">
      <div className="max-w-6xl mx-auto p-6">
        
        {submitError && (
          <div className="bg-red-900/20 border border-red-700 p-4 mb-6 text-center">
            <div className="text-red-400 font-mono text-xs">ERROR</div>
            <div className="text-sm text-red-300">{submitError}</div>
          </div>
        )}

        <div className="border-b border-zinc-800 pb-4 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">VAULTFORGE // POST DEAL</h1>
          <p className="text-sm text-zinc-500 mt-1">Deal must pass analyzer to enter Deal Room. No exceptions.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <div className="text-xs text-emerald-500 font-mono mb-4">SECTION 01 // THE HOOK</div>
              <div className="grid grid-cols-2 gap-4">
                <input className="bg-black border border-zinc-700 px-3 py-2 text-sm focus:border-emerald-500 outline-none col-span-2" 
                  placeholder="Deal Title: 123 Main St | 3BD/2BA | Atlanta"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  required
                />
                <select className="bg-black border border-zinc-700 px-3 py-2 text-sm" value={form.dealType} onChange={e => setForm({...form, dealType: e.target.value})}>
                  <option>Wholesale</option><option>Note Sale</option><option>Subject-To</option>
                  <option>Novation</option><option>Fix & Flip</option><option>Buy & Hold</option>
                </select>
                <select className="bg-black border border-zinc-700 px-3 py-2 text-sm" value={form.exitStrategy} onChange={e => setForm({...form, exitStrategy: e.target.value})}>
                  <option>Flip</option><option>Rental</option><option>Wholesale to End Buyer</option>
                </select>
                <select className="bg-black border border-zinc-700 px-3 py-2 text-sm" value={form.propertyType} onChange={e => setForm({...form, propertyType: e.target.value})}>
                  <option>SFR</option><option>2-4 Unit</option><option>5+ Unit</option><option>Land</option>
                </select>
                <select className="bg-black border border-zinc-700 px-3 py-2 text-sm" value={form.condition} onChange={e => setForm({...form, condition: e.target.value})}>
                  <option>Good</option><option>Needs Some Work</option><option>Needs Lot of Work</option><option>Teardown</option>
                </select>
              </div>
              <div className="mt-4">
                <label className="text-xs text-zinc-500 block mb-2">PHOTOS // UP TO 10 // REQUIRED</label>
                <input type="file" multiple accept="image/*" onChange={handlePhotoUpload}
                  className="block w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-mono file:bg-emerald-600 file:text-black hover:file:bg-emerald-500"
                />
                <div className="text-xs text-zinc-600 mt-1">{form.photos.length}/10 uploaded</div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <div className="text-xs text-emerald-500 font-mono mb-4">SECTION 02 // THE NUMBERS</div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-zinc-500">ASKING PRICE*</label>
                  <input type="number" className="w-full bg-black border border-zinc-700 px-3 py-2 text-sm font-mono focus:border-emerald-500 outline-none" 
                    value={form.askingPrice} onChange={e => setForm({...form, askingPrice: Number(e.target.value)})} required
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">ASSIGNMENT FEE*</label>
                  <input type="number" className="w-full bg-black border border-zinc-700 px-3 py-2 text-sm font-mono" 
                    value={form.assignmentFee} onChange={e => setForm({...form, assignmentFee: Number(e.target.value)})} required
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">ARV*</label>
                  <input type="number" className="w-full bg-black border border-zinc-700 px-3 py-2 text-sm font-mono" 
                    value={form.arv} onChange={e => setForm({...form, arv: Number(e.target.value)})} required
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-xs text-zinc-500">REHAB ESTIMATE*</label>
                  <input type="number" className="w-full bg-black border border-zinc-700 px-3 py-2 text-sm font-mono" 
                    value={form.rehab} onChange={e => setForm({...form, rehab: Number(e.target.value)})} required
                  />
                </div>
              </div>
              
              <div className="mt-4 border-t border-zinc-800 pt-4">
                <div className="text-xs text-zinc-500 mb-2">ARV COMPS // REQUIRED</div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input className="bg-black border border-zinc-700 px-2 py-1 text-xs" placeholder="Comp 1 Address"
                      value={form.comp1Addr} onChange={e => setForm({...form, comp1Addr: e.target.value})} />
                    <input type="number" className="bg-black border border-zinc-700 px-2 py-1 text-xs font-mono" placeholder="Sold Price"
                      value={form.comp1Price} onChange={e => setForm({...form, comp1Price: Number(e.target.value)})} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="bg-black border border-zinc-700 px-2 py-1 text-xs" placeholder="Comp 2 Address"
                      value={form.comp2Addr} onChange={e => setForm({...form, comp2Addr: e.target.value})} />
                    <input type="number" className="bg-black border border-zinc-700 px-2 py-1 text-xs font-mono" placeholder="Sold Price"
                      value={form.comp2Price} onChange={e => setForm({...form, comp2Price: Number(e.target.value)})} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="bg-black border border-zinc-700 px-2 py-1 text-xs" placeholder="Comp 3 Address"
                      value={form.comp3Addr} onChange={e => setForm({...form, comp3Addr: e.target.value})} />
                    <input type="number" className="bg-black border border-zinc-700 px-2 py-1 text-xs font-mono" placeholder="Sold Price"
                      value={form.comp3Price} onChange={e => setForm({...form, comp3Price: Number(e.target.value)})} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <div className="text-xs text-emerald-500 font-mono mb-4">SECTION 03 // PROPERTY ADDRESS</div>
              <div className="grid grid-cols-2 gap-4">
                <input className="bg-black border border-zinc-700 px-3 py-2 text-sm col-span-2" placeholder="Street Address*" 
                  value={form.street} onChange={e => setForm({...form, street: e.target.value})} required />
                <input className="bg-black border border-zinc-700 px-3 py-2 text-sm" placeholder="City*" 
                  value={form.city} onChange={e => setForm({...form, city: e.target.value})} required />
                <input className="bg-black border border-zinc-700 px-3 py-2 text-sm" placeholder="State*" 
                  value={form.state} onChange={e => setForm({...form, state: e.target.value})} required />
                <input className="bg-black border border-zinc-700 px-3 py-2 text-sm" placeholder="ZIP*" 
                  value={form.zip} onChange={e => setForm({...form, zip: e.target.value})} required />
                <select className="bg-black border border-zinc-700 px-3 py-2 text-sm" value={form.occupancy} onChange={e => setForm({...form, occupancy: e.target.value})}>
                  <option>Vacant</option><option>Tenant-Occupied</option><option>Owner-Occupied</option>
                </select>
                <select className="bg-black border border-zinc-700 px-3 py-2 text-sm" value={form.access} onChange={e => setForm({...form, access: e.target.value})}>
                  <option>Lockbox</option><option>Appointment Only</option><option>Drive-by Only</option>
                </select>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <div className="text-xs text-emerald-500 font-mono mb-4">SECTION 04 // CONTACT & TERMS</div>
              <div className="grid grid-cols-2 gap-4">
                <input className="bg-black border border-zinc-700 px-3 py-2 text-sm" placeholder="Your Name*" required
                  value={form.sellerName} onChange={e => setForm({...form, sellerName: e.target.value})} />
                <input className="bg-black border border-zinc-700 px-3 py-2 text-sm" placeholder="Phone*" required
                  value={form.sellerPhone} onChange={e => setForm({...form, sellerPhone: e.target.value})} />
                <input className="bg-black border border-zinc-700 px-3 py-2 text-sm col-span-2" placeholder="Email*" required
                  value={form.sellerEmail} onChange={e => setForm({...form, sellerEmail: e.target.value})} />
                <input type="number" className="bg-black border border-zinc-700 px-3 py-2 text-sm" placeholder="Inspection Days*" 
                  value={form.inspectionDays} onChange={e => setForm({...form, inspectionDays: Number(e.target.value)})} required />
                <input type="date" className="bg-black border border-zinc-700 px-3 py-2 text-sm" 
                  value={form.closeDate} onChange={e => setForm({...form, closeDate: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-zinc-900 border border-zinc-800 p-6 sticky top-6">
              <div className="text-xs text-emerald-500 font-mono mb-4">LIVE ANALYZER</div>
              
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">MAO:</span>
                  <span className="text-emerald-400">${mao.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">PROFIT:</span>
                  <span className={profit > 20000? 'text-emerald-400' : 'text-red-400'}>${Math.round(profit).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-800 pt-3">
                  <span className="text-zinc-500">ASK vs MAO:</span>
                  <span className={Number(form.askingPrice) <= mao || mao === 0? 'text-emerald-400' : 'text-red-400'}>
                    {Number(form.askingPrice) <= mao || mao === 0? 'PASS' : `FAIL -$${(Number(form.askingPrice) - mao).toLocaleString()}`}
                  </span>
                </div>
              </div>

              {analysis?.flags?.length > 0 && (
                <div className="mt-6 border-t border-red-900/50 pt-4">
                  <div className="text-xs text-red-400 font-mono mb-2">RED FLAGS</div>
                  {analysis.flags.map((flag: string, i: number) => (
                    <div key={i} className="text-xs text-red-400 mb-1">• {flag}</div>
                  ))}
                </div>
              )}

              <button type="button" onClick={runAnalyzer}
                className="w-full mt-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 py-2 text-xs font-mono">
                RUN ANALYZER
              </button>

              <button type="submit"
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-black py-3 text-sm font-bold">
                POST TO DEAL ROOM
              </button>

              {errors.length > 0 && (
                <div className="mt-4 text-xs text-red-400">{errors[0]}</div>
              )}
            </div>
          </div>

        </form>
      </div>
    </div>
  )
}
