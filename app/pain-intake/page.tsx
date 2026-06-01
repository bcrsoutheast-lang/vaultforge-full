'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function PainIntake() {
  const [form, setForm] = useState({
    address: '',
    zipcode: '',
    beds: '',
    baths: '',
    sqft: '',
    asking_price: '',
    arv: '',
    rehab_level: 'LIGHT',
    urgency: 'FLEXIBLE',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const submitPain = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('deals').insert({
      ...form,
      beds: Number(form.beds),
      baths: Number(form.baths),
      sqft: Number(form.sqft),
      asking_price: Number(form.asking_price),
      arv: Number(form.arv),
      user_id: user?.id,
      intel_status: 'PENDING_DQI',
      created_at: new Date().toISOString()
    })

    if (!error) {
      alert('DEAL SUBMITTED // DQI ENGINE SCANNING')
      router.push('/deals')
    } else {
      alert('ERROR: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <div className="bg-black text-white min-h-screen p-8 font-mono">
      <h1 className="text-2xl font-bold mb-8">PAIN INTAKE // SELLER MOTIVATION SCAN</h1>
      <div className="max-w-2xl space-y-4">
        <input 
          placeholder="PROPERTY ADDRESS" 
          value={form.address} 
          onChange={e => setForm({...form, address: e.target.value})}
          className="w-full bg-zinc-900 border border-zinc-700 p-3"
        />
        <div className="grid grid-cols-3 gap-4">
          <input placeholder="ZIP" value={form.zipcode} onChange={e => setForm({...form, zipcode: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3" />
          <input placeholder="BEDS" value={form.beds} onChange={e => setForm({...form, beds: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3" />
          <input placeholder="BATHS" value={form.baths} onChange={e => setForm({...form, baths: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <input placeholder="SQFT" value={form.sqft} onChange={e => setForm({...form, sqft: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3" />
          <input placeholder="ASKING PRICE" value={form.asking_price} onChange={e => setForm({...form, asking_price: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3" />
          <input placeholder="ARV" value={form.arv} onChange={e => setForm({...form, arv: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <select value={form.rehab_level} onChange={e => setForm({...form, rehab_level: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3">
            <option>LIGHT</option>
            <option>MEDIUM</option>
            <option>HEAVY</option>
            <option>GUT</option>
          </select>
          <select value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3">
            <option>FLEXIBLE</option>
            <option>30_DAYS</option>
            <option>14_DAYS</option>
            <option>IMMEDIATE</option>
          </select>
        </div>
        <input placeholder="SELLER NAME" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 p-3" />
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="SELLER PHONE" value={form.contact_phone} onChange={e => setForm({...form, contact_phone: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3" />
          <input placeholder="SELLER EMAIL" value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3" />
        </div>
        <textarea placeholder="PAIN NOTES // FORECLOSURE? DIVORCE? VACANT?" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={4} className="w-full bg-zinc-900 border border-zinc-700 p-3" />
        <button onClick={submitPain} disabled={loading} className="w-full bg-white text-black py-4 font-bold">
          {loading ? 'SCANNING...' : 'SUBMIT FOR BPS SCAN'}
        </button>
      </div>
    </div>
  )
}
