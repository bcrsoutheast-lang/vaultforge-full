// @ts-nocheck
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function NewDealRoomPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    address: '',
    arv: '',
    repairs: '',
    asking_price: '',
    description: ''
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const createDeal = async () => {
    setLoading(true)
    
    const { data: deal, error } = await supabase
      .from('deals')
      .insert({
        address: form.address,
        arv: parseInt(form.arv),
        repairs: parseInt(form.repairs),
        asking_price: parseInt(form.asking_price),
        description: form.description,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      alert('Error creating deal: ' + error.message)
      setLoading(false)
      return
    }

    router.push(`/deal-room/${deal.id}`)
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-black border border-zinc-800 rounded-lg p-8 space-y-6">
          <div className="text-xs text-amber-500 tracking-widest">VAULTFORGE DEAL ROOM</div>
          <div className="text-2xl font-bold">CREATE NEW DEAL</div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-zinc-500">ADDRESS</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm({...form, address: e.target.value})}
                placeholder="123 Main St, Atlanta GA"
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-3 mt-1 focus:border-amber-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-500">ARV</label>
                <input
                  type="number"
                  value={form.arv}
                  onChange={e => setForm({...form, arv: e.target.value})}
                  placeholder="450000"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-3 mt-1 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">REPAIRS</label>
                <input
                  type="number"
                  value={form.repairs}
                  onChange={e => setForm({...form, repairs: e.target.value})}
                  placeholder="45000"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-3 mt-1 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500">ASKING PRICE</label>
              <input
                type="number"
                value={form.asking_price}
                onChange={e => setForm({...form, asking_price: e.target.value})}
                placeholder="300000"
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-3 mt-1 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-zinc-500">DESCRIPTION</label>
              <textarea
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="3BR/2BA brick ranch. Needs roof + HVAC..."
                rows={4}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-3 mt-1 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <button
            onClick={createDeal}
            disabled={loading || !form.address || !form.arv}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-800 disabled:text-zinc-600 py-4 rounded-lg font-bold text-lg"
          >
            {loading? 'CREATING...' : 'CREATE DEAL'}
          </button>
        </div>
      </div>
    </div>
  )
}
