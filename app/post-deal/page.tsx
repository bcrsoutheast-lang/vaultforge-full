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

  const calculateMAO = () => {
    if (!form.arv ||!form.rehab ||!form.assignmentFee) return 0
    const arv = Number(form.arv)
    const rehab = Number(form.rehab)
    const assign = Number(form.assignmentFee)
    const closing = arv * 0.03 // 3% closing costs
    const contingency = arv * 0.1
    return Math.round((arv * 0.7) - rehab - closing - assign - contingency)
  }

  const runAnalyzer = () => {
    const mao = calculateMAO()
    const asking = Number(form.askingPrice) || 0
    const profit = Number(form.arv) - Number(form.rehab) - asking - Number(form.assignmentFee) - (Number(form.arv) * 0.13)
    const spread = Number(form.arv) - asking
    
    const flags: string[] = []
    if (form.photos.length === 0) flags.push('NO PHOTOS: Deals without photos get ignored')
    if (!form.inspectionDays) flags.push('NO INSPECTION: No safety valve = dead deal')
    if (asking > mao) flags.push(`OVER MAO: $${(asking - mao).toLocaleString()} over. Buyers will pass`)
    if (profit < 20000 && form.propertyType === 'SFR') flags.push('THIN DEAL: <$20k profit. Only for newbies')
    if (!form.comp1Price ||!form.comp2Price ||!form.comp3Price) flags.push('NO COMPS: ARV unverified')

    setAnalysis({ mao, profit: Math.round(profit), spread, flags })
    return flags.length === 0
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 10)
    setForm({...form, photos: files})
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const passed = runAnalyzer()
    if (!passed || form.photos.length === 0) {
      setErrors(['Deal failed analyzer. Fix red flags before posting.'])
      return
    }
    // TODO: Submit to Supabase here
    alert('Deal passed analyzer. Posting to Deal Room...')
    router.push('/')
  }

  const mao = calculateMAO()
  const profit = form.arv? Number(form.arv) - Number(form.rehab) - Number(form.askingPrice) - Number(form.assignmentFee) - (Number(form.arv) * 0.13) : 0

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans">
      <div className="max-w-6xl mx-auto p-6">
        
        <div className="border-b border-zinc-800 pb-4 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">VAULTFORGE // POST DEAL</h1>
          <p className="text-sm text-zinc-500 mt-1">Deal must pass analyzer to enter Deal Room. No exceptions.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: FORM INPUTS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* THE HOOK */}
            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <div className="text-xs text-emerald-500 font-mono mb-4">SECTION 01 // THE HOOK</div>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  className="bg-black border border-zinc-700 px-3 py-2 text-sm focus:border-emerald-500 outline-none" 
                  placeholder="Deal Title: 123 Main St | 3BD/2BA | Atlanta"
                  value={form.title}
                  onChange={e => setForm({...form, title: e.target.value})}
                  required
                />
                <select 
                  className="bg-black border border-zinc-700 px-3 py-2 text-sm"
                  value={form.dealType}
                  onChange={e => setForm({...form, dealType: e.target.value})}
                >
                  <option>Wholesale</option><option>Note Sale</option><option>Subject-To</option>
                  <option>Novation</option><option>Fix & Flip</option><option>Buy & Hold</option>
                </select>
                <select 
                  className="bg-black border border-zinc-700 px-3 py-2 text-sm"
                  value={form.exitStrategy}
                  onChange={e => setForm({...form, exitStrategy: e.target.value})}
                >
                  <option>Flip</option><option>Rental</option><option>Wholesale to End Buyer</option>
                </select>
                <select 
                  className="bg-black border border-zinc-700 px-3 py-2 text-sm"
                  value={form.propertyType}
                  onChange={e => setForm({...form, propertyType: e.target.value})}
                >
                  <option>SFR</option><option>2-4 Unit</option><option>5+ Unit</option><option>Land</option>
                </select>
              </div>
              <div className="mt-4">
                <label className="text-xs text-zinc-500 block mb-2">PHOTOS // UP TO 10 // REQUIRED</label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handlePhotoUpload}
                  className="block w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-mono file:bg-emerald-600 file:text-black hover:file:bg-emerald-500"
                />
                <div className="text-xs text-zinc-600 mt-1">{form.photos.length}/10 uploaded</div>
              </div>
            </div>

            {/* THE NUMBERS */}
            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <div className="text-xs text-emerald-500 font-mono mb-4">SECTION 02 // THE NUMBERS</div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-zinc-500">ASKING PRICE*</label>
                  <input 
                    type="number" 
                    className="w-full bg-black border border-zinc-700 px-3 py-2 text-sm font-mono focus:border-emerald-500 outline-none" 
                    value={form.askingPrice}
                    onChange={e => setForm({...form, askingPrice: Number(e.target.value)})}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">ASSIGNMENT FEE*</label>
                  <input 
                    type="number" 
                    className="w-full bg-black border border-zinc-700 px-3 py-2 text-sm font-mono" 
                    value={form.assignmentFee}
                    onChange={e => setForm({...form, assignmentFee: Number(e.target.value)})}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500">ARV*</label>
                  <input 
                    type="number" 
                    className="w-full bg-black border border-zinc-700 px-3 py-2 text-sm font-mono" 
                    value={form.arv}
                    onChange={e => setForm({...form, arv: Number(e.target.value)})}
                    required
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-xs text-zinc-500">REHAB ESTIMATE*</label>
                  <input 
                    type="number" 
                    className="w-full bg-black border border-zinc-700 px-3 py-2 text-sm font-mono" 
                    value={form.rehab}
                    onChange={e => setForm({...form, rehab: Number(e.target.value)})}
                    required
                  />
                </div>
              </div>
              
              <div className="mt-4 border-t border-zinc-800 pt-4">
                <div className="text-xs text-zinc-500 mb-2">ARV COMPS // REQUIRED</div>
                <div className="space-y-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="grid grid-cols-2 gap-2">
                      <input 
                        className="bg-black border border-zinc-700 px-2 py-1 text-xs" 
                        placeholder={`Comp ${i} Address`}
                        onChange={e => setForm({...form, [`comp${i}Addr`]: e.target.value} as any)}
                      />
                      <input 
                        type="number" 
                        className="bg-black border border-zinc-700 px-2 py-1 text-xs font-mono" 
                        placeholder="Sold Price"
                        onChange={e => setForm({...form, [`comp${i}Price`]: Number(e.target.value)} as any)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CONTACT */}
            <div className="bg-zinc-900 border border-zinc-800 p-6">
              <div className="text-xs text-emerald-500 font-mono mb-4">SECTION 04 // CONTACT</div>
              <div className="grid grid-cols-2 gap-4">
                <input className="bg-black border border-zinc-700 px-3 py-2 text-sm" placeholder="Your Name*" required
                  onChange={e => setForm({...form, sellerName: e.target.value})} />
                <input className="bg-black border border-zinc-700 px-3 py-2 text-sm" placeholder="Phone*" required
                  onChange={e => setForm({...form, sellerPhone: e.target.value})} />
                <input className="bg-black border border-zinc-700 px-3 py-2 text-sm col-span-2" placeholder="Email*" required
                  onChange={e => setForm({...form, sellerEmail: e.target.value})} />
              </div>
            </div>
          </div>

          {/* RIGHT: LIVE ANALYZER */}
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
                  <span className={Number(form.askingPrice) <= mao? 'text-emerald-400' : 'text-red-400'}>
                    {Number(form.askingPrice) <= mao? 'PASS' : `FAIL -$${(Number(form.askingPrice) - mao).toLocaleString()}`}
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

              <button 
                type="button"
                onClick={runAnalyzer}
                className="w-full mt-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 py-2 text-xs font-mono"
              >
                RUN ANALYZER
              </button>

              <button 
                type="submit"
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-black py-3 text-sm font-bold"
              >
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
