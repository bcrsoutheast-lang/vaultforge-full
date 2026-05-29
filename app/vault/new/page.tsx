'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const PROPERTY_TYPES = ['RESIDENTIAL','MULTI-FAMILY','COMMERCIAL','LAND','MOBILE HOME','INDUSTRIAL']
const EXITS = ['WHOLESALE','FLIP','BUY & HOLD','NOVATION','SUBJECT-TO','SELLER FINANCE']

export default function NewDealPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [loading, setLoading] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: 'GA',
    price: '',
    arv: '',
    bedrooms: '3',
    bathrooms: '2',
    sqft: '',
    property_type: 'RESIDENTIAL',
    exit_strategy: 'WHOLESALE',
    owner_contact: '',
    notes: ''
  })

  const handleChange = (e: any) => {
    setForm({...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let imageUrl = null
    if (image) {
      const fileName = `${user.id}/${Date.now()}-${image.name}`
      const { data: upload } = await supabase.storage.from('deal-photos').upload(fileName, image)
      if (upload) {
        const { data } = supabase.storage.from('deal-photos').getPublicUrl(fileName)
        imageUrl = data.publicUrl
      }
    }

    const price = Number(form.price) || 0
    const arv = Number(form.arv) || 0
    const score = arv > price? Math.min(98, Math.round(70 + ((arv - price) / price) * 100)) : 75

    const { error } = await supabase.from('deals').insert({
      user_id: user.id,
      address: form.address,
      city: form.city,
      state: form.state,
      price,
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      sqft: Number(form.sqft) || 0,
      property_type: form.property_type,
      exit_strategy: form.exit_strategy,
      owner_contact: form.owner_contact,
      notes: form.notes,
      card_image_url: imageUrl,
      photos: imageUrl? [imageUrl] : [],
      ai_analysis: {
        score,
        estimated_arv: arv,
        summary: `${form.property_type} deal in ${form.city}, ${form.state}`
      }
    })

    setLoading(false)
    if (!error) router.push('/vault/saved')
    else alert('Error saving: ' + error.message)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-yellow-500/20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-yellow-500 tracking-wider">ADD NEW DEAL</h1>
          <button onClick={() => router.push('/vault/saved')} className="text-xs text-zinc-500 hover:text-white">← BACK TO VAULT</button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Address */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs text-zinc-500 uppercase">Street Address</label>
            <input name="address" value={form.address} onChange={handleChange} required className="w-full mt-1 bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm focus:border-yellow-500 outline-none" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase">City</label>
            <input name="city" value={form.city} onChange={handleChange} required className="w-full mt-1 bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm focus:border-yellow-500 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase">State</label>
            <select name="state" value={form.state} onChange={handleChange} className="w-full mt-1 bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm focus:border-yellow-500 outline-none">
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase">Price ($)</label>
            <input name="price" type="number" value={form.price} onChange={handleChange} required className="w-full mt-1 bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm focus:border-yellow-500 outline-none" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase">ARV ($)</label>
            <input name="arv" type="number" value={form.arv} onChange={handleChange} className="w-full mt-1 bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm focus:border-yellow-500 outline-none" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase">Sq Ft</label>
            <input name="sqft" type="number" value={form.sqft} onChange={handleChange} className="w-full mt-1 bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm focus:border-yellow-500 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase">Beds</label>
            <select name="bedrooms" value={form.bedrooms} onChange={handleChange} className="w-full mt-1 bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm">
              {[1,2,3,4,5,6,7,8].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase">Baths</label>
            <select name="bathrooms" value={form.bathrooms} onChange={handleChange} className="w-full mt-1 bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm">
              {[1,1.5,2,2.5,3,3.5,4,5].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-zinc-500 uppercase">Property Type</label>
            <select name="property_type" value={form.property_type} onChange={handleChange} className="w-full mt-1 bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm">
              {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-zinc-500 uppercase">Exit Strategy</label>
            <select name="exit_strategy" value={form.exit_strategy} onChange={handleChange} className="w-full mt-1 bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm">
              {EXITS.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-500 uppercase">Owner Phone</label>
          <input name="owner_contact" value={form.owner_contact} onChange={handleChange} placeholder="404-555-1212" className="w-full mt-1 bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm focus:border-yellow-500 outline-none" />
        </div>

        <div>
          <label className="text-xs text-zinc-500 uppercase">Property Photo</label>
          <input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} className="w-full mt-1 bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm file:bg-yellow-500 file:text-black file:border-0 file:px-4 file:py-1 file:mr-3 file:text-xs file:font-bold" />
        </div>

        <div>
          <label className="text-xs text-zinc-500 uppercase">Notes / Intel</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className="w-full mt-1 bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm focus:border-yellow-500 outline-none" />
        </div>

        <button disabled={loading} type="submit" className="w-full bg-yellow-500 text-black font-bold py-3 hover:bg-yellow-400 disabled:opacity-50">
          {loading? 'SAVING TO VAULT...' : 'SAVE DEAL'}
        </button>
      </form>
    </div>
  )
}
