'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type PainForm = {
  address: string
  phone: string
  motivation: string[]
  timeline: string
  drop_dead_price: string
  arv: string
  mortgage_balance: string
  occupancy: string
  condition: string
  pain_level: string
  notes: string
}

export default function PainIntake() {
  const [form, setForm] = useState<PainForm>({
    address: '',
    phone: '',
    motivation: [],
    timeline: '',
    drop_dead_price: '',
    arv: '',
    mortgage_balance: '',
    occupancy: '',
    condition: '',
    pain_level: '',
    notes: ''
  })
  
  const [score, setScore] = useState<number | null>(null)
  const [priority, setPriority] = useState<string>('')
  const supabase = createClientComponentClient()

  const handleCheckbox = (value: string) => {
    setForm(prev => ({
      ...prev,
      motivation: prev.motivation.includes(value) 
        ? prev.motivation.filter(v => v !== value)
        : [...prev.motivation, value]
    }))
  }

  // 6SIGMA PAIN ANALYZER - DMAIC scoring
  const analyzePain = () => {
    let total = 0
    
    // DEFINE: Motivation weight
    const highPain = ['foreclosure', 'bankruptcy', 'divorce', 'behind_taxes']
    const medPain = ['inherited', 'landlord', 'relocation', 'job_loss']
    total += form.motivation.filter(m => highPain.includes(m)).length * 25
    total += form.motivation.filter(m => medPain.includes(m)).length * 15
    
    // MEASURE: Timeline urgency
    if (form.timeline === '7 days') total += 30
    else if (form.timeline === '14 days') total += 20
    else if (form.timeline === '30 days') total += 10
    
    // ANALYZE: Price delta %
    const ddp = parseFloat(form.drop_dead_price) || 0
    const arv = parseFloat(form.arv) || 0
    if (ddp && arv) {
      const discount = ((arv - ddp) / arv) * 100
      if (discount >= 40) total += 25
      else if (discount >= 30) total += 15
      else if (discount >= 20) total += 10
    }
    
    // IMPROVE: Condition factor
    if (form.condition === 'needs_full_rehab') total += 10
    if (form.occupancy === 'vacant') total += 10
    if (form.occupancy === 'tenant_not_paying') total += 15
    
    // CONTROL: Set priority
    setScore(total)
    if (total >= 80) setPriority('CRITICAL - Call Now')
    else if (total >= 60) setPriority('HOT - Same Day')
    else if (total >= 40) setPriority('WARM - 48hrs')
    else setPriority('COLD - Nurture')
    
    return total
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const painScore = analyzePain()
    
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('pain_intake').insert({
      ...form,
      motivation: form.motivation.join(','),
      user_id: user?.id,
      pain_score: painScore,
      priority,
      created_at: new Date().toISOString()
    })
    
    alert(`Saved. Pain Score: ${painScore} | Priority: ${priority}`)
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-red-500">6SIGMA PAIN INTAKE</h1>
        <p className="text-zinc-500 mb-8 text-xs uppercase">Define → Measure → Analyze → Improve → Control</p>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-6">
          
          <div className="mb-6">
            <label className="block text-xs uppercase text-zinc-500 mb-2">Property Address *</label>
            <input 
              value={form.address} 
              onChange={e => setForm({...form, address: e.target.value})}
              className="w-full p-3 bg-zinc-800 border border-zinc-700 text-white" 
              required 
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs uppercase text-zinc-500 mb-2">Seller Phone *</label>
            <input 
              value={form.phone} 
              onChange={e => setForm({...form, phone: e.target.value})}
              className="w-full p-3 bg-zinc-800 border border-zinc-700" 
              required 
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs uppercase text-red-500 mb-3">MOTIVATION FACTORS [DEFINE]</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['foreclosure', 'Foreclosure'],
                ['bankruptcy', 'Bankruptcy'],
                ['divorce', 'Divorce'],
                ['behind_taxes', 'Behind on Taxes'],
                ['inherited', 'Inherited'],
                ['landlord', 'Tired Landlord'],
                ['relocation', 'Job Relocation'],
                ['job_loss', 'Job Loss']
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 p-2 bg-zinc-800 border border-zinc-700 hover:border-red-500/50 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.motivation.includes(key)}
                    onChange={() => handleCheckbox(key)}
                    className="accent-red-500"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs uppercase text-zinc-500 mb-2">Timeline [MEASURE]</label>
              <select 
                value={form.timeline} 
                onChange={e => setForm({...form, timeline: e.target.value})}
                className="w-full p-3 bg-zinc-800 border border-zinc-700"
                required
              >
                <option value="">Select urgency</option>
                <option value="7 days">7 Days - Critical</option>
                <option value="14 days">14 Days - Hot</option>
                <option value="30 days">30 Days - Warm</option>
                <option value="60+ days">60+ Days - Cold</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase text-zinc-500 mb-2">Occupancy</label>
              <select 
                value={form.occupancy} 
                onChange={e => setForm({...form, occupancy: e.target.value})}
                className="w-full p-3 bg-zinc-800 border border-zinc-700"
              >
                <option value="">Select status</option>
                <option value="owner">Owner Occupied</option>
                <option value="tenant_paying">Tenant - Paying</option>
                <option value="tenant_not_paying">Tenant - Not Paying</option>
                <option value="vacant">Vacant</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs uppercase text-zinc-500 mb-2">Drop Dead Price [ANALYZE]</label>
              <input 
                type="number"
                value={form.drop_dead_price} 
                onChange={e => setForm({...form, drop_dead_price: e.target.value})}
                className="w-full p-3 bg-zinc-800 border border-zinc-700" 
                placeholder="Lowest"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-zinc-500 mb-2">ARV</label>
              <input 
                type="number"
                value={form.arv} 
                onChange={e => setForm({...form, arv: e.target.value})}
                className="w-full p-3 bg-zinc-800 border border-zinc-700" 
                placeholder="After Repair"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-zinc-500 mb-2">Mortgage Balance</label>
              <input 
                type="number"
                value={form.mortgage_balance} 
                onChange={e => setForm({...form, mortgage_balance: e.target.value})}
                className="w-full p-3 bg-zinc-800 border border-zinc-700" 
                placeholder="Owed"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs uppercase text-zinc-500 mb-2">Property Condition [IMPROVE]</label>
            <select 
              value={form.condition} 
              onChange={e => setForm({...form, condition: e.target.value})}
              className="w-full p-3 bg-zinc-800 border border-zinc-700"
            >
              <option value="">Select condition</option>
              <option value="turnkey">Turnkey</option>
              <option value="light_rehab">Light Rehab Needed</option>
              <option value="needs_full_rehab">Full Rehab Needed</option>
              <option value="tear_down">Tear Down</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-xs uppercase text-zinc-500 mb-2">Notes / Pain Point</label>
            <textarea 
              value={form.notes} 
              onChange={e => setForm({...form, notes: e.target.value})}
              className="w-full p-3 bg-zinc-800 border border-zinc-700" 
              rows={3}
              placeholder="Seller's exact words on why they must sell..."
            />
          </div>

          {score !== null && (
            <div className={`mb-6 p-4 border-2 ${
              score >= 80 ? 'border-red-500 bg-red-950/30' :
              score >= 60 ? 'border-amber-500 bg-amber-950/30' :
              score >= 40 ? 'border-yellow-500 bg-yellow-950/30' :
              'border-zinc-700 bg-zinc-800'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase text-zinc-400">6SIGMA ANALYSIS [CONTROL]</span>
                <span className="text-2xl font-bold">{score}</span>
              </div>
              <div className={`text-lg font-bold mt-1 ${
                score >= 80 ? 'text-red-500' :
                score >= 60 ? 'text-amber-500' :
                score >= 40 ? 'text-yellow-500' : 'text-zinc-400'
              }`}>{priority}</div>
            </div>
          )}

          <div className="flex gap-2">
            <button 
              type="button"
              onClick={analyzePain}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs uppercase"
            >
              Analyze Pain
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 border border-red-500 text-white uppercase text-sm font-bold"
            >
              Save to Deal Room
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
