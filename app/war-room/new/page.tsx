'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { getAuctionTerms } from '@/lib/auction-terms'

export default function NewWarRoomPage() {
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: 'TX',
    arv: '',
    repairs: '',
    reserve_price: '',
    broker_company: '',
    broker_license: '',
    agent_name: '',
    agent_license: '',
    brokerage_address: '',
    title_company: '',
    seller_disclosure_url: ''
  })
  const [uploading, setUploading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const uploadDisclosure = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fileName = `disclosure-${Date.now()}.pdf`
    const { data, error } = await supabase.storage
    .from('deal-photos')
    .upload(fileName, file)
    
    if (data) {
      const { data: { publicUrl } } = supabase.storage.from('deal-photos').getPublicUrl(fileName)
      setForm({ ...form, seller_disclosure_url: publicUrl })
    }
    setUploading(false)
  }

  const canLaunch = form.broker_license && form.seller_disclosure_url && form.title_company

  const handleSubmit = async () => {
    if (!canLaunch) {
      alert('TX Law: Broker License, Title Company, and T-64 Disclosure required to launch')
      return
    }
    
    const { data } = await supabase.from('deals').insert(form).select().single()
    router.push(`/war-room/${data.id}`)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create War Room - {form.state}</h1>
      
      <div className="space-y-4">
        <select 
          value={form.state} 
          onChange={e => setForm({...form, state: e.target.value})}
          className="w-full bg-zinc-900 border border-zinc-700 rounded p-3"
        >
          <option value="TX">Texas</option>
          <option value="GA">Georgia</option>
          <option value="FL">Florida</option>
          <option value="CA">California</option>
        </select>

        <input placeholder="Property Address" className="w-full bg-zinc-900 border border-zinc-700 rounded p-3"
          value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
        
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="City" className="bg-zinc-900 border border-zinc-700 rounded p-3"
            value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
          <input placeholder="ARV" type="number" className="bg-zinc-900 border border-zinc-700 rounded p-3"
            value={form.arv} onChange={e => setForm({...form, arv: e.target.value})} />
        </div>

        <div className="border-t border-amber-600 pt-4 mt-6">
          <div className="text-amber-500 font-bold mb-3">BROKER INFO - REQUIRED BY {form.state} LAW</div>
          <input placeholder="Broker Company *" required className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 mb-2"
            value={form.broker_company} onChange={e => setForm({...form, broker_company: e.target.value})} />
          <input placeholder="Broker License # * (TREC # for TX)" required className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 mb-2"
            value={form.broker_license} onChange={e => setForm({...form, broker_license: e.target.value})} />
          <input placeholder="Agent Name" className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 mb-2"
            value={form.agent_name} onChange={e => setForm({...form, agent_name: e.target.value})} />
          <input placeholder="Agent License #" className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 mb-2"
            value={form.agent_license} onChange={e => setForm({...form, agent_license: e.target.value})} />
          <input placeholder="Brokerage Address" className="w-full bg-zinc-900 border border-zinc-700 rounded p-3"
            value={form.brokerage_address} onChange={e => setForm({...form, brokerage_address: e.target.value})} />
        </div>

        <div className="border-t border-amber-600 pt-4 mt-6">
          <div className="text-amber-500 font-bold mb-3">TITLE COMPANY - REQUIRED</div>
          <input placeholder="Title Company Name *" required className="w-full bg-zinc-900 border border-zinc-700 rounded p-3"
            value={form.title_company} onChange={e => setForm({...form, title_company: e.target.value})} />
        </div>

        <div className="border-t border-amber-600 pt-4 mt-6">
          <div className="text-amber-500 font-bold mb-3">SELLER DISCLOSURE - REQUIRED BY LAW</div>
          <input type="file" accept=".pdf" onChange={uploadDisclosure} className="w-full mb-2" />
          {uploading && <div className="text-zinc-500">Uploading...</div>}
          {form.seller_disclosure_url && <div className="text-green-400 text-sm">✓ T-64 Uploaded</div>}
          {!form.seller_disclosure_url && <div className="text-red-500 text-sm">TX Prop Code §5.008: Disclosure required before auction start</div>}
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded p-4 text-xs whitespace-pre-wrap">
          {getAuctionTerms(form.state, form)}
        </div>

        <button 
          onClick={handleSubmit}
          disabled={!canLaunch}
          className="w-full bg-amber-600 disabled:bg-zinc-800 disabled:text-zinc-600 py-4 rounded font-bold"
        >
          {canLaunch? 'CREATE WAR ROOM' : 'MISSING REQUIRED FIELDS'}
        </button>
      </div>
    </div>
  )
}
