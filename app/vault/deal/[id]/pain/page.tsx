'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function PainIntakePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  const dealId = params.id as string
  const [deal, setDeal] = useState<any>(null)
  const [form, setForm] = useState({
    motivation_level: 5,
    reason_for_selling: '',
    timeline: 'ASAP',
    behind_on_payments: false,
    facing_foreclosure: false,
    property_condition: 'Needs Work',
    repairs_needed: '',
    mortgage_balance: '',
    monthly_payment: '',
    wants_price: '',
    pain_notes: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchDeal = async () => {
      const { data } = await supabase.from('deals').select('*').eq('id', dealId).single()
      setDeal(data)
    }
    fetchDeal()
  }, [dealId])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const clean = (val: string) => Number(val.replace(/[^0-9.]/g, '')) || null

      const { error } = await supabase.from('deal_pain_intake').upsert({
        deal_id: dealId,
        user_id: user.id,
        motivation_level: form.motivation_level,
        reason_for_selling: form.reason_for_selling,
        timeline: form.timeline,
        behind_on_payments: form.behind_on_payments,
        facing_foreclosure: form.facing_foreclosure,
        property_condition: form.property_condition,
        repairs_needed: form.repairs_needed,
        mortgage_balance: clean(form.mortgage_balance),
        monthly_payment: clean(form.monthly_payment),
        wants_price: clean(form.wants_price),
        pain_notes: form.pain_notes
      })
      
      if (error) throw error
      router.push(`/vault/saved`)
    } catch (err: any) {
      alert('SAVE FAILED: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!deal) return <div className="min-h-screen bg-black text-white p-4">Loading...</div>

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <h1 className="text-2xl font-bold text-yellow-500 mb-2">PAIN INTAKE</h1>
      <p className="text-zinc-400 mb-6">{deal.address}, {deal.city}</p>
      
      <form onSubmit={save} className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Motivation Level: {form.motivation_level}/10</label>
          <input type="range" min="1" max="10" value={form.motivation_level} 
            onChange={e=>setForm({...form,motivation_level:Number(e.target.value)})} 
            className="w-full accent-yellow-500"/>
        </div>

        <textarea required placeholder="Why are they selling?" value={form.reason_for_selling} 
          onChange={e=>setForm({...form,reason_for_selling:e.target.value})} 
          className="w-full bg-zinc-900 p-3 rounded border border-zinc-700 h-20"/>

        <select value={form.timeline} onChange={e=>setForm({...form,timeline:e.target.value})} 
          className="w-full bg-zinc-900 p-3 rounded border border-zinc-700">
          <option>ASAP</option>
          <option>30 Days</option>
          <option>60 Days</option>
          <option>90+ Days</option>
        </select>

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.behind_on_payments} 
              onChange={e=>setForm({...form,behind_on_payments:e.target.checked})}
              className="accent-yellow-500"/>
            <span>Behind on Payments</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.facing_foreclosure} 
              onChange={e=>setForm({...form,facing_foreclosure:e.target.checked})}
              className="accent-yellow-500"/>
            <span>Facing Foreclosure</span>
          </label>
        </div>

        <select value={form.property_condition} onChange={e=>setForm({...form,property_condition:e.target.value})} 
          className="w-full bg-zinc-900 p-3 rounded border border-zinc-700">
          <option>Good Condition</option>
          <option>Needs Work</option>
          <option>Total Rehab</option>
        </select>

        <textarea placeholder="What repairs are needed?" value={form.repairs_needed} 
          onChange={e=>setForm({...form,repairs_needed:e.target.value})} 
          className="w-full bg-zinc-900 p-3 rounded border border-zinc-700 h-20"/>

        <div className="grid grid-cols-3 gap-2">
          <input placeholder="Mortgage Balance" value={form.mortgage_balance} 
            onChange={e=>setForm({...form,mortgage_balance:e.target.value})} 
            className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
          <input placeholder="Monthly Payment" value={form.monthly_payment} 
            onChange={e=>setForm({...form,monthly_payment:e.target.value})} 
            className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
          <input placeholder="Seller Wants" value={form.wants_price} 
            onChange={e=>setForm({...form,wants_price:e.target.value})} 
            className="bg-zinc-900 p-3 rounded border border-zinc-700"/>
        </div>

        <textarea placeholder="Additional pain notes / leverage points" value={form.pain_notes} 
          onChange={e=>setForm({...form,pain_notes:e.target.value})} 
          className="w-full bg-zinc-900 p-3 rounded border border-zinc-700 h-24"/>

        <button type="submit" disabled={loading} className="w-full bg-yellow-500 text-black font-bold p-4 rounded mt-6 disabled:opacity-50">
          {loading? 'SAVING...' : 'SAVE PAIN INTAKE'}
        </button>
      </form>
    </div>
  )
}
