'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function NewDeal() {
  const [form, setForm] = useState<any>({
    property_type: 'residential', need_buyer: false, image_urls: [],
    beds: '', baths: '', sqft: '', acres: '',
    purchase_price: '', asking_price: '', arv: '', repair_cost: ''
  })
  const [pics, setPics] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [feedback, setFeedback] = useState('')
  const [user, setUser] = useState<any>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({data}) => {
      if (!data.user) router.push('/login')
      setUser(data.user)
    })
  }, [])

  // LIVE ANALYZER MATH
  useEffect(() => {
    const pp = Number(form.purchase_price) || 0
    const ap = Number(form.asking_price) || 0
    const arv = Number(form.arv) || 0
    const repairs = Number(form.repair_cost) || 0
    
    const wholesale_fee = ap - pp
    const mao_70 = (arv * 0.7) - repairs
    const flip_profit = arv - pp - repairs - (arv * 0.08) // 8% closing/holding
    const equity = arv > 0 ? ((arv - pp) / arv * 100).toFixed(1) : 0

    let msg = ''
    if (pp && arv) {
      if (pp <= mao_70) msg = `STRONG DEAL: ${equity}% EQUITY. MAO: $${mao_70.toLocaleString()}`
      else if (pp <= arv * 0.8) msg = `MARGINAL: ${equity}% EQUITY. MAO: $${mao_70.toLocaleString()}`
      else msg = `OVERPRICED: ${equity}% EQUITY. MAO: $${mao_70.toLocaleString()}`
    }
    
    setForm((f:any) => ({...f, wholesale_fee, flip_profit, mao_70, analyzer_feedback: msg}))
    setFeedback(msg)
  }, [form.purchase_price, form.asking_price, form.arv, form.repair_cost])

  const handlePic = (e: any) => {
    const files = Array.from(e.target.files).slice(0, 10) as File[]
    setPics(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const submit = async () => {
    if (!user) return
    let image_urls: string[] = []
    
    // UPLOAD 10 PICS
    for (const pic of pics) {
      const fileName = `${user.id}/${Date.now()}-${pic.name}`
      const { data, error } = await supabase.storage.from('deal-pics').upload(fileName, pic)
      if (!error) image_urls.push(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/deal-pics/${fileName}`)
    }

    const { error } = await supabase.from('deals').insert([{
      ...form, user_id: user.id, image_urls, status: 'opportunity'
    }])
    
    if (!error) router.push('/vault/opportunity')
    else alert('Error: ' + error.message)
  }

  const input = "bg-zinc-900 border border-amber-900 text-amber-400 px-3 py-2 w-full font-mono text-sm"
  const label = "text-xs text-amber-600 tracking-wider mb-1"

  return (
    <div className="min-h-screen bg-black text-amber-400 font-mono p-4">
      <header className="flex justify-between items-center border-b border-amber-900 pb-4 mb-6">
        <h1 className="text-xl tracking-widest">NEW DEAL INTAKE // VAULTFORGE</h1>
        <Image src="/IMG_4751.png" alt="VaultForge" width={60} height={60} />
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className={label}>PROPERTY TYPE</div>
            <select value={form.property_type} onChange={e => setForm({...form, property_type: e.target.value})} className={input}>
              <option value="residential">RESIDENTIAL</option>
              <option value="commercial">COMMERCIAL</option>
              <option value="land">LAND</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><div className={label}>ADDRESS</div><input className={input} onChange={e => setForm({...form, address: e.target.value})} /></div>
            <div><div className={label}>CITY</div><input className={input} onChange={e => setForm({...form, city: e.target.value})} /></div>
            <div><div className={label}>STATE</div><input className={input} onChange={e => setForm({...form, state: e.target.value})} /></div>
            <div><div className={label}>ZIP</div><input className={input} onChange={e => setForm({...form, zip: e.target.value})} /></div>
          </div>

          {form.property_type === 'residential' && (
            <div className="grid grid-cols-3 gap-4">
              <div><div className={label}>BEDS</div><input type="number" className={input} onChange={e => setForm({...form, beds: e.target.value})} /></div>
              <div><div className={label}>BATHS</div><input type="number" className={input} onChange={e => setForm({...form, baths: e.target.value})} /></div>
              <div><div className={label}>SQFT</div><input type="number" className={input} onChange={e => setForm({...form, sqft: e.target.value})} /></div>
            </div>
          )}

          {form.property_type === 'land' && (
            <div><div className={label}>ACRES</div><input type="number" className={input} onChange={e => setForm({...form, acres: e.target.value})} /></div>
          )}

          {form.property_type === 'commercial' && (
            <div><div className={label}>SQFT</div><input type="number" className={input} onChange={e => setForm({...form, sqft: e.target.value})} /></div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div><div className={label}>PURCHASE PRICE</div><input type="number" className={input} onChange={e => setForm({...form, purchase_price: e.target.value})} /></div>
            <div><div className={label}>ASKING PRICE</div><input type="number" className={input} onChange={e => setForm({...form, asking_price: e.target.value})} /></div>
            <div><div className={label}>ARV</div><input type="number" className={input} onChange={e => setForm({...form, arv: e.target.value})} /></div>
            <div><div className={label}>REPAIR COST</div><input type="number" className={input} onChange={e => setForm({...form, repair_cost: e.target.value})} /></div>
          </div>

          <div>
            <div className={label}>OWNER INFO</div>
            <input placeholder="NAME" className={input + ' mb-2'} onChange={e => setForm({...form, owner_name: e.target.value})} />
            <input placeholder="PHONE" className={input + ' mb-2'} onChange={e => setForm({...form, owner_phone: e.target.value})} />
            <input placeholder="EMAIL" className={input} onChange={e => setForm({...form, owner_email: e.target.value})} />
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" onChange={e => setForm({...form, need_buyer: e.target.checked})} />
            <span className="text-xs">NEED BUYER // ASSIGNMENT</span>
          </label>
        </div>

        <div className="space-y-4">
          <div className="border border-amber-900 p-4 bg-zinc-950">
            <div className="text-xs text-amber-600 mb-2">LIVE ANALYZER FEEDBACK</div>
            <div className="text-lg font-bold">{feedback || 'ENTER PRICE DATA...'}</div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
              <div>WHOLESALE FEE<br/><span className="text-green-500">${Number(form.wholesale_fee || 0).toLocaleString()}</span></div>
              <div>FLIP PROFIT<br/><span className="text-green-500">${Number(form.flip_profit || 0).toLocaleString()}</span></div>
              <div>70% MAO<br/><span className="text-green-500">${Number(form.mao_70 || 0).toLocaleString()}</span></div>
            </div>
          </div>

          <div>
            <div className={label}>PROPERTY PICS // MAX 10</div>
            <input type="file" multiple accept="image/*" onChange={handlePic} className={input} />
            <div className="grid grid-cols-5 gap-2 mt-2">
              {previews.map((p, i) => <img key={i} src={p} className="w-full h-16 object-cover border border-amber-900" />)}
            </div>
          </div>

          <div><div className={label}>NOTES // TERMS</div><textarea className={input} rows={4} onChange={e => setForm({...form, notes: e.target.value})} /></div>

          <button onClick={submit} className="w-full bg-amber-600 text-black py-3 font-bold tracking-wider hover:bg-amber-500">
            SUBMIT TO OPPORTUNITY ROOM
          </button>
        </div>
      </div>
    </div>
  )
}
