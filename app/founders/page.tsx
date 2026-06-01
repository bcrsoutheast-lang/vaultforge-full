'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const FOUNDING_SEATS = {
  lenders: { total: 50, filled: 42, access: 1500, monthly: 299, desc: 'Fund DQI 90+ in 48hrs. SMS alerts. First money wins.', icon: '🏦' },
  buyers: { total: 200, filled: 167, access: 750, monthly: 199, desc: 'Vault Score priority. See pain deals before MLS.', icon: '🏠' },
  wholesalers: { total: 100, filled: 73, access: 500, monthly: 99, desc: 'List deals. BPS scores motivation for you.', icon: '📋' },
  contractors: { total: 75, filled: 59, access: 1000, monthly: 249, desc: 'Bid DQI deals with scope attached. No chasing.', icon: '🔨' },
  title: { total: 25, filled: 11, access: 2500, monthly: 499, desc: 'Lien Stack Decoder feeds you clean closings.', icon: '⚖️' },
  agents: { total: 100, filled: 73, access: 500, monthly: 149, desc: 'Get BPS 80+ sellers before they list MLS.', icon: '🔑' },
  appraisers: { total: 30, filled: 8, access: 1000, monthly: 199, desc: 'ACI feeds comps. Your ARV becomes data.', icon: '📊' },
  inspectors: { total: 50, filled: 22, access: 500, monthly: 149, desc: 'Deal DNA flags CODE_VIOLATION. You get routed.', icon: '🔍' },
  pml: { total: 40, filled: 31, access: 2000, monthly: 399, desc: 'Fund gaps. See BPS + Vault Score. No flakes.', icon: '💰' },
  architects: { total: 15, filled: 6, access: 1500, monthly: 299, desc: 'Value-add deals need plans. Get routed first.', icon: '📐' },
}

export default function FoundersPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '' })
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  const totalSeats = Object.values(FOUNDING_SEATS).reduce((sum, r) => sum + r.total, 0)
  const totalFilled = Object.values(FOUNDING_SEATS).reduce((sum, r) => sum + r.filled, 0)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleApply = (role: string) => {
    setSelectedRole(role)
    setShowModal(true)
  }

  const submitApplication = async () => {
    if (!form.name || !form.email) {
      alert('NAME + EMAIL REQUIRED')
      return
    }
    setLoading(true)
    
    const { error } = await supabase.from('founder_applications').insert({
      role: selectedRole,
      name: form.name,
      email: form.email,
      phone: form.phone,
      company: form.company,
      user_id: user?.id,
      status: 'PENDING',
      created_at: new Date().toISOString()
    })

    if (!error) {
      alert(`APPLICATION RECEIVED // ${selectedRole?.toUpperCase()} SEAT HELD 24HRS`)
      setShowModal(false)
      setForm({ name: '', email: '', phone: '', company: '' })
      setSelectedRole(null)
    } else {
      alert('ERROR: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* HERO */}
      <div className="bg-gradient-to-b from-zinc-900 to-black border-b border-zinc-800 py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="text-xs text-gray-500 tracking-[0.3em] mb-4">VAULTFORGE FOUNDING MEMBERS</div>
          <h1 className="text-5xl md:text-7xl font-black mb-6">685 SEATS.<br/>10 ROLES.<br/>ONE PRIVATE NETWORK.</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            We cap seats to protect deal flow. Once filled, waitlist only. Price doubles.
          </p>
          <div className="inline-block bg-blue-600 px-8 py-4">
            <div className="text-4xl font-black">{totalFilled}/{totalSeats}</div>
            <div className="text-xs tracking-widest">SEATS FILLED</div>
          </div>
          <div className="text-sm text-gray-500 mt-4">{totalSeats - totalFilled} seats left before price increase</div>
        </div>
      </div>

      {/* ROLES GRID */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(FOUNDING_SEATS).map(([key, data]) => {
            const isFull = data.filled >= data.total
            const percentFilled = (data.filled / data.total) * 100
            
            return (
              <div key={key} className="bg-zinc-900 border-2 border-zinc-800 p-8 relative">
                {isFull && (
                  <div className="absolute top-0 right-0 bg-red-600 text-black text-xs font-black px-3 py-1">
                    WAITLIST
                  </div>
                )}
                
                <div className="text-5xl mb-4">{data.icon}</div>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold uppercase">{key}</h2>
                  <div className="text-right">
                    <div className="text-sm font-black">{data.filled}/{data.total}</div>
                    <div className="text-xs text-gray-500">FILLED</div>
                  </div>
                </div>
                
                <p className="text-gray-400 text-sm mb-6 h-16">{data.desc}</p>
                
                <div className="border-t border-zinc-800 pt-6 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500 text-sm">Access Fee</span>
                    <span className="font-black text-lg">${data.access.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Monthly</span>
                    <span className="font-black text-lg">${data.monthly}/mo</span>
                  </div>
                </div>

                <div className="w-full bg-zinc-800 h-2 mb-6">
                  <div 
                    className={`h-2 ${percentFilled > 80 ? 'bg-red-600' : percentFilled > 50 ? 'bg-yellow-600' : 'bg-green-600'}`}
                    style={{ width: `${percentFilled}%` }}
                  />
                </div>
                
                <button 
                  onClick={() => handleApply(key)}
                  disabled={isFull}
                  className={`w-full py-4 font-bold text-sm tracking-widest ${
                    isFull 
                      ? 'bg-zinc-800 text-gray-600 cursor-not-allowed' 
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {isFull ? 'JOIN WAITLIST' : 'CLAIM SEAT'}
                </button>
              </div>
            )
          })}
        </div>

        {/* WHY ACCESS FEES */}
        <div className="mt-20 bg-zinc-900 border border-zinc-800 p-12 text-center">
          <h3 className="text-3xl font-black mb-4">WHY ACCESS FEES?</h3>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            Filters browsers. Funds the network. Proves you’re serious. 
            One DQI 90+ deal pays your access fee 10x. 
            We don’t want 1,000 members. We want 685 killers.
          </p>
        </div>
      </div>

      {/* APPLICATION MODAL */}
      {showModal && selectedRole && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-6">
          <div className="bg-zinc-900 border-2 border-zinc-700 p-8 max-w-lg w-full">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-xs text-gray-500 tracking-widest mb-2">FOUNDING MEMBER APPLICATION</div>
                <h3 className="text-3xl font-bold uppercase">{selectedRole}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-2xl text-gray-500 hover:text-white">×</button>
            </div>

            <div className="bg-black border border-zinc-800 p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400 text-sm">Access Fee</span>
                <span className="font-black">${FOUNDING_SEATS[selectedRole as keyof typeof FOUNDING_SEATS].access.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-sm">Monthly</span>
                <span className="font-black">${FOUNDING_SEATS[selectedRole as keyof typeof FOUNDING_SEATS].monthly}/mo</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <input 
                placeholder="FULL NAME *" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full bg-black border border-zinc-700 p-3 text-sm"
              />
              <input 
                placeholder="EMAIL *" 
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="w-full bg-black border border-zinc-700 p-3 text-sm"
              />
              <input 
                placeholder="PHONE" 
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full bg-black border border-zinc-700 p-3 text-sm"
              />
              <input 
                placeholder="COMPANY" 
                value={form.company}
                onChange={e => setForm({...form, company: e.target.value})}
                className="w-full bg-black border border-zinc-700 p-3 text-sm"
              />
            </div>

            <div className="text-xs text-gray-500 mb-6">
              * Submit application to hold seat for 24hrs. We review within 4 hours. 
              If approved, Stripe link sent for access fee + first month.
            </div>

            <button 
              onClick={submitApplication}
              disabled={loading}
              className="w-full bg-white text-black py-4 font-black text-sm tracking-widest hover:bg-gray-200 disabled:bg-gray-600"
            >
              {loading ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
