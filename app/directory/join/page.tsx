'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const SPECIALTIES = ['Hard Money', 'DSCR Loans', 'Sub-To', 'Novation', 'Probate', 'Liens', 'Foreclosure', 'Tax Deeds', 'Contract Financing', 'Title Issues', 'Wholesaling', 'Fix & Flip']

export default function JoinDirectory() {
  const supabase = createClient()
  const [states, setStates] = useState<string[]>(['GA'])
  const [specs, setSpecs] = useState<string[]>([])

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => history.back()} className="text-zinc-400 hover:text-white mb-6">← Back</button>
        <h1 className="text-3xl font-bold mb-2">JOIN DIRECTORY</h1>
        <p className="text-zinc-400 mb-8">Control which deals you see and who gets matched with you</p>
        
        <div className="space-y-6 bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <div>
            <label className="text-sm font-medium text-zinc-300">Full Name *</label>
            <input className="w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 focus:border-blue-500 outline-none transition" placeholder="Deeve Moneyy" />
          </div>
          
          <div>
            <label className="text-sm font-medium text-zinc-300">States You Actively Invest In *</label>
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 mt-3">
              {STATES.map(s => (
                <button 
                  key={s}
                  onClick={() => setStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                  className={`py-2 text-xs font-medium rounded border transition ${
                    states.includes(s) 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-300">Specialties</label>
            <div className="flex flex-wrap gap-2 mt-3">
              {SPECIALTIES.map(s => (
                <button 
                  key={s}
                  onClick={() => setSpecs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${
                    specs.includes(s) 
                      ? 'bg-purple-600 border-purple-500 text-white' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-semibold transition">
            Save to Directory
          </button>
        </div>
      </div>
    </div>
  )
}
