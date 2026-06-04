'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  'https://YOUR-PROJECT.supabase.co', // <-- REPLACE
  'YOUR-ANON-KEY' // <-- REPLACE
)

export default function Dashboard() {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const showComingSoon = (feature: string) => {
    setMessage(`${feature} COMING SOON`)
    setTimeout(() => setMessage(''), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-mono">
      {message && <div className="fixed top-4 right-4 bg-yellow-600 text-black px-4 py-2 text-sm z-50 font-bold">{message}</div>}
      
      {/* TOP NAV */}
      <div className="border-b-2 border-yellow-500 bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="text-yellow-500 text-xl font-bold">ALPHA VEST COMMAND CENTER</div>
            
            <div className="flex gap-2">
              <button onClick={() => router.push('/pain-room')} 
                className="bg-[#0D0D0D] border border-yellow-500 px-3 py-1 text-xs hover:bg-yellow-500 hover:text-black">
                PAIN ROOM
              </button>
              <button onClick={() => router.push('/deal-room')} 
                className="bg-[#0D0D0D] border border-yellow-500 px-3 py-1 text-xs hover:bg-yellow-500 hover:text-black">
                DEAL ROOM
              </button>
              <button onClick={() => showComingSoon('BUYER VAULT')} 
                className="bg-[#0D0D0D] border border-gray-700 px-3 py-1 text-xs hover:border-yellow-500">
                BUYER VAULT
              </button>
              <button onClick={() => showComingSoon('MEMBERS NETWORK')} 
                className="bg-[#0D0D0D] border border-gray-700 px-3 py-1 text-xs hover:border-yellow-500">
                NETWORK
              </button>
              <button onClick={() => showComingSoon('PROFILE')} 
                className="bg-[#0D0D0D] border border-gray-700 px-3 py-1 text-xs hover:border-yellow-500">
                PROFILE
              </button>
              <button onClick={handleLogout} 
                className="bg-red-600 px-3 py-1 text-xs hover:bg-red-700">
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto p-4">
        
        {/* STATS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="border-2 border-yellow-500 bg-[#1A1A1A] p-4">
            <div className="text-yellow-500 text-xs">NEW LEADS</div>
            <div className="text-4xl font-bold">12</div>
            <div className="text-xs text-green-500">+3 TODAY</div>
          </div>
          <div className="border-2 border-yellow-500 bg-[#1A1A1A] p-4">
            <div className="text-yellow-500 text-xs">ACTIVE DEALS</div>
            <div className="text-4xl font-bold">8</div>
            <div className="text-xs text-green-500">AVG: $31K</div>
          </div>
          <div className="border-2 border-yellow-500 bg-[#1A1A1A] p-4">
            <div className="text-yellow-500 text-xs">UNDER CONTRACT</div>
            <div className="text-4xl font-bold">3</div>
            <div className="text-xs text-yellow-500">PENDING</div>
          </div>
          <div className="border-2 border-yellow-500 bg-[#1A1A1A] p-4">
            <div className="text-yellow-500 text-xs">CLOSED YTD</div>
            <div className="text-4xl font-bold">27</div>
            <div className="text-xs text-green-500">$412K PROFIT</div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <button onClick={() => setShowForm(true)} 
            className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-4 px-4 rounded border-2 border-yellow-400">
            + NEW LEAD
          </button>
          <button onClick={() => router.push('/command')} 
            className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold py-4 px-4 rounded border-2 border-yellow-400">
            + NEW DEAL
          </button>
          <button onClick={() => showComingSoon('CALENDAR')} 
            className="bg-[#1A1A1A] border-2 border-gray-700 py-4 px-4 rounded hover:border-yellow-500">
            CALENDAR
          </button>
          <button onClick={() => showComingSoon('COMPS')} 
            className="bg-[#1A1A1A] border-2 border-gray-700 py-4 px-4 rounded hover:border-yellow-500">
            COMPS
          </button>
        </div>

        {/* QUICK LINKS */}
        <div className="border-2 border-gray-800 bg-[#1A1A1A] p-4">
          <div className="text-yellow-500 text-sm font-bold mb-3">QUICK ACCESS</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            <button onClick={() => router.push('/pain-room')} className="border border-gray-700 p-2 hover:border-yellow-500 text-left">
              → VIEW ALL LEADS
            </button>
            <button onClick={() => router.push('/deal-room')} className="border border-gray-700 p-2 hover:border-yellow-500 text-left">
              → VIEW ALL DEALS
            </button>
            <button onClick={() => showComingSoon('DOCS')} className="border border-gray-700 p-2 hover:border-yellow-500 text-left">
              → CONTRACTS & DOCS
            </button>
            <button onClick={() => showComingSoon('SETTINGS')} className="border border-gray-700 p-2 hover:border-yellow-500 text-left">
              → SETTINGS
            </button>
          </div>
        </div>

      </div>

      {/* PAIN FORM MODAL - SIMPLIFIED FOR NOW */}
      {showForm && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0D0D0D] border-2 border-yellow-500 max-w-md w-full p-6">
            <div className="text-yellow-500 font-bold mb-4">NEW LEAD FORM</div>
            <div className="text-xs mb-4">Full form with Supabase save coming next. This is just the shell.</div>
            <button onClick={() => setShowForm(false)} className="w-full bg-gray-700 py-2">CLOSE</button>
          </div>
        </div>
      )}
    </div>
  )
}
