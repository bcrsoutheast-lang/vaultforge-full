'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function PostDeal() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    deal_type: 'Wholesale',
    street: '',
    city: '',
    state: 'GA',
    zip: '',
    arv: '',
    asking_price: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.from('deals').insert([{
      ...form,
      arv: parseFloat(form.arv) || null,
      asking_price: parseFloat(form.asking_price) || null,
    }])
    
    setLoading(false)
    if (error) return alert(error.message)
    router.push('/')
  }

  const inputClass = "w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
  const labelClass = "text-sm font-medium text-zinc-300 mb-2 block"

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={() => router.back()} className="text-zinc-400 hover:text-white text-sm">
            ← Cancel
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold">VAULTFORGE</h1>
          </div>
          <div className="w-16"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold mb-2">POST NEW DEAL</h2>
        <p className="text-zinc-400 mb-8">Submit to the Deal Room. Verified operators only.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-6">
            <div>
              <label className={labelClass}>Deal Title *</label>
              <input 
                className={inputClass}
                placeholder="123 Main St Wholesale - 3BR/2BA"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
                required
              />
            </div>

            <div>
              <label className={labelClass}>Deal Type *</label>
              <select 
                className={inputClass}
                value={form.deal_type}
                onChange={e => setForm({...form, deal_type: e.target.value})}
              >
                <option>Wholesale</option>
                <option>Fix & Flip</option>
                <option>Buy & Hold</option>
                <option>Novation</option>
                <option>Sub-To</option>
                <option>Hard Money</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Deal Description</label>
              <textarea 
                className={`${inputClass} h-32 resize-none`}
                placeholder="Off-market SFH. Motivated seller. Needs roof + kitchen. ARV $350k..."
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>

            <div className="border-t border-zinc-800 pt-6">
              <p className="text-sm font-medium text-zinc-300 mb-4">Property Address</p>
              <div className="space-y-4">
                <input 
                  className={inputClass}
                  placeholder="Street Address"
                  value={form.street}
                  onChange={e => setForm({...form, street: e.target.value})}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    className={inputClass}
                    placeholder="City"
                    value={form.city}
                    onChange={e => setForm({...form, city: e.target.value})}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      className={inputClass}
                      placeholder="State"
                      maxLength={2}
                      value={form.state}
                      onChange={e => setForm({...form, state: e.target.value.toUpperCase()})}
                      required
                    />
                    <input 
                      className={inputClass}
                      placeholder="ZIP"
                      value={form.zip}
                      onChange={e => setForm({...form, zip: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6">
              <p className="text-sm font-medium text-zinc-300 mb-4">Deal Numbers</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500">ARV - After Repair Value</label>
                  <div className="relative mt-1">
                    <span className="absolute left-4 top-3 text-zinc-500">$</span>
                    <input 
                      className={`${inputClass} pl-8`}
                      placeholder="350,000"
                      type="number"
                      value={form.arv}
                      onChange={e => setForm({...form, arv: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500">Asking Price</label>
                  <div className="relative mt-1">
                    <span className="absolute left-4 top-3 text-zinc-500">$</span>
                    <input 
                      className={`${inputClass} pl-8`}
                      placeholder="275,000"
                      type="number"
                      value={form.asking_price}
                      onChange={e => setForm({...form, asking_price: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 py-4 rounded-lg font-semibold transition shadow-lg shadow-blue-600/20"
          >
            {loading ? 'Posting...' : 'Post Deal to Vault'}
          </button>
        </form>
      </main>
    </div>
  )
}
