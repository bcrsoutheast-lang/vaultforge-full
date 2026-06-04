'use client'

import { useState } from 'react'
// If you use supabase, uncomment next line and make sure /lib/supabase.ts exists
// import { supabase } from '@/lib/supabase'

type DealFormType = {
  titleClear: boolean
  tenantOccupied: boolean
  taxDelinquent: boolean
  vacantProperty: boolean
  motivatedSeller: boolean
  address: string
  ownerName: string
  ownerPhone: string
  purchasePrice: number
  assignmentFee: number
  arv: number
  notes: string
  // catch-all so f.k doesn't break
  [key: string]: boolean | string | number
}

export default function CommandPage() {
  const [dealForm, setDealForm] = useState<DealFormType>({
    titleClear: false,
    tenantOccupied: false,
    taxDelinquent: false,
    vacantProperty: false,
    motivatedSeller: false,
    address: '',
    ownerName: '',
    ownerPhone: '',
    purchasePrice: 0,
    assignmentFee: 0,
    arv: 0,
    notes: ''
  })

  const checkboxFields = [
    { l: 'TITLE CLEAR', k: 'titleClear' },
    { l: 'TENANT OCCUPIED', k: 'tenantOccupied' },
    { l: 'TAX DELINQUENT', k: 'taxDelinquent' },
    { l: 'VACANT PROPERTY', k: 'vacantProperty' },
    { l: 'MOTIVATED SELLER', k: 'motivatedSeller' }
  ]

  const handleSubmit = async () => {
    console.log('Submitting deal:', dealForm)
    // await supabase.from('deals').insert(dealForm)
    alert('Deal submitted')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Command Center - Deal Form</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Property Address</label>
          <input 
            type="text" 
            value={dealForm.address}
            onChange={e => setDealForm({...dealForm, address: e.target.value})}
            className="w-full border rounded px-3 py-2"
            placeholder="123 Main St, Atlanta GA"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Purchase Price</label>
            <input 
              type="number" 
              value={dealForm.purchasePrice}
              onChange={e => setDealForm({...dealForm, purchasePrice: Number(e.target.value)})}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Assignment Fee</label>
            <input 
              type="number" 
              value={dealForm.assignmentFee}
              onChange={e => setDealForm({...dealForm, assignmentFee: Number(e.target.value)})}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Property Flags</label>
          <div className="space-y-2">
            {checkboxFields.map((f) => (
              <label key={f.k} className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={dealForm[f.k] as boolean}
                  onChange={e => setDealForm({...dealForm, [f.k]: e.target.checked})}
                  className="w-4 h-4"
                />
                <span>{f.l}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Owner Name</label>
          <input 
            type="text" 
            value={dealForm.ownerName}
            onChange={e => setDealForm({...dealForm, ownerName: e.target.value})}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea 
            value={dealForm.notes}
            onChange={e => setDealForm({...dealForm, notes: e.target.value})}
            className="w-full border rounded px-3 py-2 h-24"
            placeholder="Seller motivation, condition notes..."
          />
        </div>

        <button 
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-6 py-3 rounded font-bold hover:bg-blue-700"
        >
          SUBMIT TO NETWORK
        </button>
      </div>
    </div>
  )
}
