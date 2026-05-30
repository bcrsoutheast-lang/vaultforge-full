'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function PainIntake() {
  const [form, setForm] = useState({
    address: '',
    phone: '',
    motivation: '',
    timeline: '',
    drop_dead_price: '',
    arv: '',
    mortgage_balance: '',
    occupancy: '',
    condition: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const calculatePainScore = () => {
    let score = 0
    const motivationMap: any = {
      'divorce': 25,
      'foreclosure': 30,
      'job_loss': 20,
      'relocating': 15,
      'tired_landlord': 15,
      'inheritance': 10,
      'downsizing': 10,
      'other': 5
    }
    const timelineMap: any = {
      'asap': 25,
      '30_days': 20,
      '60_days': 15,
      '90_days': 10,
      'flexible': 5
    }
    const conditionMap: any = {
      'fire_damage': 15,
      'major_repairs': 12,
      'outdated': 8,
      'light_repairs': 5,
      'move_in_ready': 0
    }

    score += motivationMap[form.motivation] || 0
    score += timelineMap[form.timeline] || 0
    score += conditionMap[form.condition] || 0

    const arv = parseInt(form.arv) || 0
    const ddp = parseInt(form.drop_dead_price) || 0
    if (arv && ddp && ddp < arv * 0.7) score += 15
    else if (arv && ddp && ddp < arv * 0.8) score += 10
    else if (arv && ddp && ddp < arv * 0.9) score += 5

    return Math.min(score, 100)
  }

  const getPriority = (score: number) => {
    if (score >= 80) return 'CRITICAL'
    if (score >= 60) return 'HOT'
    if (score >= 40) return 'WARM'
    return 'COLD'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const pain_score = calculatePainScore()
    const priority = getPriority(pain_score)

    const { error } = await supabase.from('pain_intake').insert({
      user_id: user.id,
      ...form,
      pain_score,
      priority
    })

    setLoading(false)
    if (!error) router.push('/pain-room')
  }

  const inputClass = "w-full p-3 bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 outline-none"

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Pain Intake</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            placeholder="Property Address" 
            value={form.address}
            onChange={e => setForm({...form, address: e.target.value})}
            className={inputClass}
            required
          />
          
          <input 
            placeholder="Phone Number" 
            value={form.phone}
            onChange={e => setForm({...form, phone: e.target.value})}
            className={inputClass}
            required
          />

          <select 
            value={form.motivation}
            onChange={e => setForm({...form, motivation: e.target.value})}
            className={inputClass}
            required
          >
            <option value="">Seller Motivation</option>
            <option value="foreclosure">Foreclosure</option>
            <option value="divorce">Divorce</option>
            <option value="job_loss">Job Loss</option>
            <option value="relocating">Relocating</option>
            <option value="tired_landlord">Tired Landlord</option>
            <option value="inheritance">Inheritance</option>
            <option value="downsizing">Downsizing</option>
            <option value="other">Other</option>
          </select>

          <select 
            value={form.timeline}
            onChange={e => setForm({...form, timeline: e.target.value})}
            className={inputClass}
            required
          >
            <option value="">Timeline to Close</option>
            <option value="asap">ASAP</option>
            <option value="30_days">30 Days</option>
            <option value="60_days">60 Days</option>
            <option value="90_days">90 Days</option>
            <option value="flexible">Flexible</option>
          </select>

          <input 
            placeholder="Drop Dead Price" 
            type="number"
            value={form.drop_dead_price}
            onChange={e => setForm({...form, drop_dead_price: e.target.value})}
            className={inputClass}
            required
          />

          <input 
            placeholder="ARV" 
            type="number"
            value={form.arv}
            onChange={e => setForm({...form, arv: e.target.value})}
            className={inputClass}
            required
          />

          <input 
            placeholder="Mortgage Balance" 
            type="number"
            value={form.mortgage_balance}
            onChange={e => setForm({...form, mortgage_balance: e.target.value})}
            className={inputClass}
          />

          <select 
            value={form.occupancy}
            onChange={e => setForm({...form, occupancy: e.target.value})}
            className={inputClass}
          >
            <option value="">Occupancy</option>
            <option value="owner_occupied">Owner Occupied</option>
            <option value="tenant_occupied">Tenant Occupied</option>
            <option value="vacant">Vacant</option>
          </select>

          <select 
            value={form.condition}
            onChange={e => setForm({...form, condition: e.target.value})}
            className={inputClass}
            required
          >
            <option value="">Property Condition</option>
            <option value="fire_damage">Fire Damage</option>
            <option value="major_repairs">Major Repairs Needed</option>
            <option value="outdated">Outdated</option>
            <option value="light_repairs">Light Repairs</option>
            <option value="move_in_ready">Move In Ready</option>
          </select>

          <textarea 
            placeholder="Notes" 
            value={form.notes}
            onChange={e => setForm({...form, notes: e.target.value})}
            className={inputClass}
            rows={3}
          />

          <div className="pt-4">
            <div className="text-sm text-zinc-500 mb-2">Calculated Pain Score: <span className="text-red-500 font-bold">{calculatePainScore()}</span></div>
            <div className="text-sm text-zinc-500 mb-4">Priority: <span className="text-red-500 font-bold">{getPriority(calculatePainScore())}</span></div>
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 border border-red-500 text-white uppercase font-bold disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
