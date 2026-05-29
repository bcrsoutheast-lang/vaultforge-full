'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewDealPage() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    price: '',
    asking_price: '',
    arv: '',
    repair_cost: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    property_type: 'Single Family',
    deal_type: 'Wholesale',
    notes: ''
  })
  const [dealPics, setDealPics] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  const clean = (val: string) => Number(val.replace(/[^0-9.]/g, '')) || null
  const cleanInt = (val: string) => parseInt(val.replace(/[^0-9]/g, '')) || null

  const wholesaleFee = () => {
    const purchase = clean(form.price) || 0
    const asking = clean(form.asking_price) || 0
    return asking - purchase
  }

  const flipProfit = () => {
    const purchase = clean(form.price) || 0
    const arv = clean(form.arv) || 0
    const repairs = clean(form.repair_cost) || 0
    const holding = arv * 0.08
    return arv - purchase - repairs - holding
  }

  const mao70 = () => {
    const arv = clean(form.arv) || 0
    const repairs = clean(form.repair_cost) || 0
    return (arv * 0.70) - repairs
  }

  const handlePics = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 10)
      setDealPics(files)
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      let imageUrls: string[] = []
      if (dealPics.length > 0) {
        for (const pic of dealPics) {
          const fileName = `${user.id}/${Date.now()}-${pic.name}`
          const { error: uploadError } = await supabase.storage.from('deal-pics').upload(fileName, pic)
          if (uploadError) throw uploadError
          const { data: { publicUrl } } = supabase.storage.from('deal-pics').getPublicUrl(fileName)
          imageUrls.push(publicUrl)
        }
      }

      const payload = {
        user_id: user.id,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        price: clean(form.price),
        asking_price: clean(form.asking_price),
        arv: clean(form.arv),
        repair_cost: clean(form.repair_cost),
        bedrooms: cleanInt(form.bedrooms),
        bathrooms: cleanInt(form.bathrooms),
        sqft: cleanInt(form.sqft),
        property_type: form.property_type,
        deal_type: form.deal_type,
        notes: form.notes,
        image_urls: imageUrls,
        status: 'saved'
      }

      const { error } = await supabase.from('deals').insert(payload)
      if (error) throw error
      
      router.push('/vault/opportunities')
    } catch (err: any) {
      alert('SAVE FAILED: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-yellow-500">ADD NEW DEAL</h1>
        <button onClick={() => router.push('/vault/opportunities')} className="text-zinc-400 text-sm">
          ← Deal Room
        </button>
      </div>
      
      <form onSubmit={save} className="space-y-4 max-w-2xl">
        <div className="grid grid-cols-1 gap-3">
          <input required placeholder="Address" value={form.address} 
            onChange={e=>setForm({...form,address:e.target.value})} 
            className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
          <div className="grid grid-cols-3 gap-2">
            <input required placeholder="City" value={form.city} 
              onChange={e=>setForm({...form,city:e.target.value})} 
              className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
            <input required placeholder="State" value={form.state} 
              onChange={e=>setForm({...form,state:e.target.value})} 
              className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
            <input required placeholder="Zip" value={form.zip} 
              onChange={e=>setForm({...form,zip:e.target.value})} 
              className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Purchase Price</label>
            <input placeholder="100,000" value={form.price} 
              onChange={e=>setForm({...form,price:e.target.value})} 
              className="w-full bg-zinc-900 p-3 rounded border border-zinc-700"/>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Asking Price</label>
            <input placeholder="130,000" value={form.asking_price} 
              onChange={e=>setForm({...form,asking_price:e.target.value})} 
              className="w-full bg-zinc-900 p-3 rounded border border-zinc-700"/>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">ARV</label>
            <input placeholder="200,000" value={form.arv} 
              onChange={e=>setForm({...form,arv:e.target.value})} 
              className="w-full bg-zinc-900 p-3 rounded border border-zinc-700"/>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Repair Cost</label>
            <input placeholder="25,000" value={form.repair_cost} 
              onChange={e=>setForm({...form,repair_cost:e.target.value})} 
              className="w-full bg-zinc-900 p-3 rounded border border-zinc-700"/>
          </div>
        </div>

        {(clean(form.arv) || clean(form.asking_price)) && (
          <div className="bg-zinc-900 p-4 rounded border border-zinc-800 space-y-2">
            <p className="text-sm text-yellow-500 font-bold">LIVE ANALYZER</p>
            {clean(form.asking_price) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Wholesale Fee:</span>
                <span className="text-green-500 font-bold">${wholesaleFee().toLocaleString()}</span>
              </div>
            )}
            {clean(form.arv) > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Flip Profit:</span>
                  <span className="text-green-500 font-bold">${flipProfit().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">70% MAO:</span>
                  <span className="text-green-500 font-bold">${mao70().toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <input placeholder="Beds" value={form.bedrooms} 
            onChange={e=>setForm({...form,bedrooms:e.target.value})} 
            className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
          <input placeholder="Baths" value={form.bathrooms} 
            onChange={e=>setForm({...form,bathrooms:e.target.value})} 
            className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
          <input placeholder="Sqft" value={form.sqft} 
            onChange={e=>setForm({...form,sqft:e.target.value})} 
            className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select value={form.property_type} onChange={e=>setForm({...form,property_type:e.target.value})} 
            className="bg-zinc-900 p-3 rounded border border-zinc-700">
            <option>Single Family</option>
            <option>Multi-Family</option>
            <option>Condo</option>
            <option>Townhouse</option>
            <option>Land</option>
            <option>Commercial</option>
          </select>
          <select value={form.deal_type} onChange={e=>setForm({...form,deal_type:e.target.value})} 
            className="bg-zinc-900 p-3 rounded border border-zinc-700">
            <option>Wholesale</option>
            <option>Flip</option>
            <option>Buy & Hold</option>
            <option>Subject-To</option>
            <option>Seller Finance</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1">Property Pics - up to 10</label>
          <input type="file" accept="image/*" multiple onChange={handlePics} 
            className="w-full bg-zinc-900 p-3 rounded border border-zinc-700 text-sm"/>
          {dealPics.length > 0 && (
            <p className="text-xs text-green-500 mt-1">{dealPics.length} pics selected</p>
          )}
        </div>

        <textarea placeholder="Notes" value={form.notes} 
          onChange={e=>setForm({...form,notes:e.target.value})} 
          className="w-full bg-zinc-900 p-3 rounded border border-zinc-700 h-24"/>

        <button type="submit" disabled={loading} className="w-full bg-yellow-500 text-black font-bold p-4 rounded mt-6 disabled:opacity-50">
          {loading? 'SAVING...' : 'SAVE TO DEAL OPPORTUNITIES'}
        </button>
      </form>
    </div>
  )
}
