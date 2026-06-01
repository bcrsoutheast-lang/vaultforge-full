'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function NewDealPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    const deal = {
      address: formData.get('address'),
      asking_price: Number(formData.get('asking_price')),
      arv: Number(formData.get('arv')),
      // BPS FIELDS - TIER 1 MANUAL ENTRY
      pre_foreclosure_date: formData.get('pre_foreclosure_date') || null,
      auction_date: formData.get('auction_date') || null,
      probate_case: formData.get('probate_case') || null,
      divorce_date: formData.get('divorce_date') || null,
      vacant_days: Number(formData.get('vacant_days')) || 0,
      code_violations: Number(formData.get('code_violations')) || 0,
      lien_amount: Number(formData.get('lien_amount')) || 0,
      back_taxes: Number(formData.get('back_taxes')) || 0,
    }

    const { error } = await supabase.from('deals').insert(deal)
    
    if (error) {
      alert('Error: ' + error.message)
      setLoading(false)
    } else {
      router.push('/deals')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">List New Deal</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Basic Info</h2>
          <input name="address" placeholder="123 Main St, Atlanta GA" required className="w-full p-2 border rounded" />
          <input name="asking_price" type="number" placeholder="Asking Price" required className="w-full p-2 border rounded" />
          <input name="arv" type="number" placeholder="ARV" required className="w-full p-2 border rounded" />
        </div>

        <div className="space-y-4 border-t pt-6">
          <h2 className="text-lg font-semibold">Seller Motivation // BPS Scan</h2>
          <p className="text-sm text-gray-600">Check all that apply. This triggers Deal DNA + DQI bonuses.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col">
              <span className="text-sm font-medium">Pre-Foreclosure Date</span>
              <input name="pre_foreclosure_date" type="date" className="p-2 border rounded" />
            </label>
            
            <label className="flex flex-col">
              <span className="text-sm font-medium">Auction Date</span>
              <input name="auction_date" type="date" className="p-2 border rounded" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium">Probate Case #</span>
              <input name="probate_case" placeholder="2026-PR-12345" className="p-2 border rounded" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium">Divorce Filed Date</span>
              <input name="divorce_date" type="date" className="p-2 border rounded" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium">Days Vacant</span>
              <input name="vacant_days" type="number" placeholder="180" className="p-2 border rounded" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium">Code Violations</span>
              <input name="code_violations" type="number" placeholder="2" className="p-2 border rounded" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium">Lien Amount $</span>
              <input name="lien_amount" type="number" placeholder="25000" className="p-2 border rounded" />
            </label>

            <label className="flex flex-col">
              <span className="text-sm font-medium">Back Taxes $</span>
              <input name="back_taxes" type="number" placeholder="8400" className="p-2 border rounded" />
            </label>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded font-semibold disabled:opacity-50"
        >
          {loading ? 'Calculating BPS...' : 'List Deal + Run BPS Scan'}
        </button>
      </form>
    </div>
  )
}
