'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const PROPERTY_TYPES = ['Single Family', 'Multi-Family', 'Land', 'Commercial', 'Mobile Home']
const DEAL_TYPES = ['Wholesale', 'Fix & Flip', 'Buy & Hold', 'Assignable', 'Novation']

export default function NewDealPage() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  const [form, setForm] = useState({
    address: '', city: '', state: 'GA', zip: '',
    price: '', bedrooms: '', bathrooms: '', sqft: '',
    property_type: 'Single Family', deal_type: 'Wholesale',
    arv: '', repair_cost: '', asking_price: '', notes: ''
  })
  const [analyzerPic, setAnalyzerPic] = useState<File | null>(null)
  const [dealPics, setDealPics] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  const uploadFile = async (file: File, userId: string) => {
    const fileName = `${userId}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('deal-pics').upload(fileName, file)
    if (error) throw error
    const { data } = supabase.storage.from('deal-pics').getPublicUrl(fileName)
    return data.publicUrl
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      let analyzerUrl = ''
      if (analyzerPic) analyzerUrl = await uploadFile(analyzerPic, user.id)

      const imageUrls: string[] = []
      for (const pic of dealPics.slice(0, 10)) {
        const url = await uploadFile(pic, user.id)
        imageUrls.push(url)
      }

      const clean = (val: string) => Number(val.replace(/[^0-9.]/g, '')) || null

      const { error } = await supabase.from('deals').insert({
        user_id: user.id,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        price: clean(form.price),
        bedrooms: clean(form.bedrooms),
        bathrooms: clean(form.bathrooms),
        sqft: clean(form.sqft),
        property_type: form.property_type,
        deal_type: form.deal_type,
        arv: clean(form.arv),
        repair_cost: clean(form.repair_cost),
        asking_price: clean(form.asking_price),
        notes: form.notes,
        analyzer_pic_url: analyzerUrl,
        image_urls: imageUrls
      })
      
      if (error) throw error
      router.push('/vault/saved')
    } catch (err: any) {
      alert('SAVE FAILED: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <h1 className="text-2xl font-bold text-yellow-500 mb-6">ADD DEAL</h1>
      <form onSubmit={save} className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-2 gap-2">
          <input required placeholder="Address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="col-span-2 bg-zinc-900 p-3 rounded border border-zinc-700"/>
          <input required placeholder="City" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
          <select value={form.state} onChange={e=>setForm({...form,state:e.target.value})} className="bg-zinc-900 p-3 rounded border border-zinc-700">
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input placeholder="ZIP" value={form.zip} onChange={e=>setForm({...form,zip:e.target.value})} className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
          <input required placeholder="Purchase Price" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <input placeholder="Beds" value={form.bedrooms} onChange={e=>setForm({...form,bedrooms:e.target.value})} className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
          <input placeholder="Baths" value={form.bathrooms} onChange={e=>setForm({...form,bathrooms:e.target.value})} className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
          <input placeholder="Sqft" value={form.sqft} onChange={e=>setForm({...form,sqft:e.target.value})} className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select value={form.property_type} onChange={e=>setForm({...form,property_type:e.target.value})} className="bg-zinc-900 p-3 rounded border border-zinc-700">
            {PROPERTY_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={form.deal_type} onChange={e=>setForm({...form,deal_type:e.target.value})} className="bg-zinc-900 p-3 rounded border border-zinc-700">
            {DEAL_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <input placeholder="ARV" value={form.arv} onChange={e=>setForm({...form,arv:e.target.value})} className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
          <input placeholder="Repair Cost" value={form.repair_cost} onChange={e=>setForm({...form,repair_cost:e.target.value})} className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
          <input placeholder="Asking Price" value={form.asking_price} onChange={e=>setForm({...form,asking_price:e.target.value})} className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
        </div>

        <textarea placeholder="Notes / Deal Breakdown" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="w-full bg-zinc-900 p-3 rounded border border-zinc-700 h-24"/>

        <div>
          <label className="block text-sm text-zinc-400 mb-2">Analyzer Screenshot</label>
          <input type="file" accept="image/*" onChange={e=>setAnalyzerPic(e.target.files?.[0] || null)} className="w-full text-sm file:bg-yellow-500 file:text-black file:font-bold file:px-4 file:py-2 file:rounded file:border-0"/>
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-2">Property Pics - up to 10</label>
          <input type="file" accept="image/*" multiple onChange={e=>setDealPics(Array.from(e.target.files || []))} className="w-full text-sm file:bg-zinc-700 file:text-white file:px-4 file:py-2 file:rounded file:border-0"/>
          <p className="text-xs text-zinc-500 mt-1">{dealPics.length} selected</p>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-yellow-500 text-black font-bold p-4 rounded mt-6 disabled:opacity-50">
          {loading? 'SAVING...' : 'SAVE DEAL'}
        </button>
      </form>
    </div>
  )
}
