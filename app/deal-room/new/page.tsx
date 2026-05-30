// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function NewDealPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [loading, setLoading] = useState(false)
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
  })

  const label = "block text-sm font-medium text-zinc-400 mb-1.5"
  const input = "w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors"
  const select = input

  const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('You must be logged in to post a deal')
        setLoading(false)
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
        })

      if (error) throw error
      router.push('/deal-room')
    } catch (err) {
      alert(err.message || 'Error posting deal')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Post New Deal</h1>
          <button onClick={() => router.back()} className="text-zinc-400 hover:text-white transition-colors">Cancel</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-5 text-red-500">Property Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={label}>Property Address *</label>
                <input required type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={input} placeholder="123 Main St" />
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
                  <label className={label}>Zip Code</label>
                  <input type="text" value={form.zip} onChange={e => setForm({...form, zip: e.target.value})} className={input} placeholder="30303" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-5 text-red-500">Deal Financials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={label}>ARV - After Repair Value</label>
                <input type="number" value={form.arv} onChange={e => setForm({...form, arv: e.target.value})} className={input} placeholder="250000" />
              </div>
              <div>
                <label className={label}>Purchase Price</label>
                <input type="number" value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} className={input} placeholder="150000" />
              </div>
              <div>
                <label className={label}>Est. Rehab Cost</label>
                <input type="number" value={form.rehab_cost} onChange={e => setForm({...form, rehab_cost: e.target.value})} className={input} placeholder="30000" />
              </div>
              <div>
                <label className={label}>Est. Profit</label>
                <input type="number" value={form.profit} onChange={e => setForm({...form, profit: e.target.value})} className={input} placeholder="70000" />
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-5 text-red-500">Seller Intel</h2>
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
              <div className="md:col-span-2">
                <label className={label}>Deal Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={input} rows={4} placeholder="Seller needs to close in 2 weeks. Roof replaced 2021. AC is out. Motivated due to job transfer..." />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-semibold text-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-4 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Posting Deal...' : 'Post Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
