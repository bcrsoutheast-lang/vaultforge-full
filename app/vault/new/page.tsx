'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewDealPage() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    deal_type: 'Wholesale',
    address: '',
    city: '',
    state: 'GA',
    arv: '',
    asking_price: '',
  })

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      setLoading(false)
    }
    checkAuth()
  }, [])

  // Fixed: handles null/empty string safely
  const clean = (val: string) => {
    if (!val) return 0
    const num = parseFloat(val.replace(/[^0-9.]/g, ''))
    return isNaN(num) ? 0 : num
  }

  const wholesaleFee = () => {
    const arv = clean(form.arv)
    const asking = clean(form.asking_price)
    if (arv === 0 || asking === 0) return 0
    return Math.max(0, arv * 0.7 - asking) // 70% rule minus asking
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSaving(true)

    const { error } = await supabase
      .from('vault_deals')
      .insert({
        user_id: userId,
        title: form.title,
        description: form.description,
        deal_type: form.deal_type,
        address: form.address,
        city: form.city,
        state: form.state,
        arv: clean(form.arv) || null,
        asking_price: clean(form.asking_price) || null,
        status: 'active'
      })

    if (error) {
      alert('Error creating deal: ' + error.message)
    } else {
      router.push('/vault')
    }
    setSaving(false)
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-4">Loading...</div>

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-yellow-500">POST NEW DEAL</h1>
          <button onClick={() => router.back()} className="text-zinc-400 text-sm">
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({...form, title: e.target.value})}
            placeholder="Deal Title - 123 Main St Wholesale"
            className="w-full bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <textarea
            value={form.description}
            onChange={(e) => setForm({...form, description: e.target.value})}
            placeholder="Deal Description"
            rows={4}
            className="w-full bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="grid grid-cols-2 gap-4">
            <select
              value={form.deal_type}
              onChange={(e) => setForm({...form, deal_type: e.target.value})}
              className="bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Wholesale</option>
              <option>Fix & Flip</option>
              <option>Buy & Hold</option>
              <option>Probate</option>
              <option>Tax Lien</option>
            </select>
            <input
              type="text"
              value={form.state}
              onChange={(e) => setForm({...form, state: e.target.value})}
              placeholder="State"
              maxLength={2}
              className="bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({...form, address: e.target.value})}
            placeholder="Street Address"
            className="w-full bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm({...form, city: e.target.value})}
            placeholder="City"
            className="w-full bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={form.arv}
              onChange={(e) => setForm({...form, arv: e.target.value})}
              placeholder="ARV - After Repair Value"
              className="bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={form.asking_price}
              onChange={(e) => setForm({...form, asking_price: e.target.value})}
              placeholder="Asking Price"
              className="bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fixed line 168 - added null check */}
          {clean(form.asking_price) > 0 && clean(form.arv) > 0 && (
            <div className="bg-zinc-900 p-4 rounded border border-zinc-800 space-y-2">
              <p className="text-sm text-yellow-500 font-bold">LIVE ANALYZER</p>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Wholesale Fee:</span>
                <span className="text-green-500 font-bold">${wholesaleFee().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">70% Rule Max:</span>
                <span className="text-zinc-300">${(clean(form.arv) * 0.7).toLocaleString()}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded hover:bg-blue-500 disabled:bg-zinc-700"
          >
            {saving ? 'Posting...' : 'Post Deal to Vault'}
          </button>
        </form>
      </div>
    </div>
  )
}
