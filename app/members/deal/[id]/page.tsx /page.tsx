'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function DealRoom({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState(172800) // 48 hours
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState([
    { user: 'VAULTFORGE AI', text: 'Deal Room opened. DQI 91 + BPS 88 triggered SMS. Lender + Buyer + GC + Title auto-joined.', time: '2 min ago' },
    { user: 'LENDER', text: 'DQI 91 confirmed. I can fund $240K at 12% interest only. Docs look clean.', time: '1 min ago' },
    { user: 'TITLE', text: 'Cloud search complete. Divorce lien solvable. No other clouds.', time: '45 sec ago' },
  ])

  useEffect(() => {
    const auth = localStorage.getItem('vaultforge_auth')
    if (auth!== 'true') router.push('/login')
  }, [router])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev > 0? prev - 1 : 0)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const sendMessage = () => {
    if (!message) return
    setChat([...chat, { user: 'YOU', text: message, time: 'now' }])
    setMessage('')
    setTimeout(() => {
      setChat(prev => [...prev, { user: 'GC', text: 'Rehab scope uploaded. $65K budget. 45 days.', time: 'now' }])
    }, 1500)
  }

  const deals = [
    { id: '1', address: '1247 PEACHTREE ST', city: 'FULTON, GA', arv: '340K', ask: '240K', bps: 88, dqi: 91, aci: 94 },
    { id: '2', address: '8921 BISCAYNE BLVD', city: 'DADE, FL', arv: '485K', ask: '335K', bps: 85, dqi: 89, aci: 91 },
    { id: '3', address: '5502 WESTHEIMER RD', city: 'HARRIS, TX', arv: '295K', ask: '210K', bps: 82, dqi: 93, aci: 88 },
  ]

  const deal = deals.find(d => d.id === params.id) || deals[0]

  return (
    <main className="bg-[#0A0A0A] min-h-screen font-mono text-white">
      <nav className="bg-black border-b border-[#D4AF37]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image src="/IMG_4751.png" alt="VaultForge" width={120} height={30} className="h-8 w-auto" />
            <div className="text-[#D4AF37] text-xs font-bold tracking-[0.3em]">DEAL ROOM // {deal.id}</div>
          </div>
          <div className="bg-[#DC2626] text-white px-4 py-1.5 font-black text-sm">
            SHOT CLOCK: {formatTime(timeLeft)}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-8 grid md:grid-cols-3 gap-6">
        {/* LEFT: DEAL DATA */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-black border border-[#D4AF37]/30 p-6">
            <h2 className="text-[#D4AF37] font-black text-xl mb-4">PROPERTY</h2>
            <div className="space-y-3 text-sm">
              <div><span className="text-[#D4AF37]/60">ADDRESS:</span><br/><span className="text-white font-bold">{deal.address}</span></div>
              <div><span className="text-[#D4AF37]/60">CITY:</span><br/><span className="text-white font-bold">{deal.city}</span></div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div><div className="text-[#D4AF37]/60 text-xs">ARV</div><div className="text-white font-bold">${deal.arv}</div></div>
                <div><div className="text-[#D4AF37]/60 text-xs">ASK</div><div className="text-white font-bold">${deal.ask}</div></div>
                <div><div className="text-[#D4AF37]/60 text-xs">SPREAD</div><div className="text-[#D4AF37] font-bold">100K</div></div>
              </div>
            </div>
          </div>

          <div className="bg-black border border-[#D4AF37]/30 p-6">
            <h2 className="text-[#D4AF37] font-black text-xl mb-4">SCORES</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-[#D4AF37]/60 text-sm">BPS</span><span className="bg-[#DC2626] text-white px-3 py-1 font-bold">{deal.bps}</span></div>
              <div className="flex justify-between items-center"><span className="text-[#D4AF37]/60 text-sm">DQI</span><span className="bg-[#D4AF37] text-black px-3 py-1 font-bold">{deal.dqi}</span></div>
              <div className="flex justify-between items-center"><span className="text-[#D4AF37]/60 text-sm">ACI</span><span className="bg-white text-black px-3 py-1 font-bold">{deal.aci}</span></div>
            </div>
          </div>

          <div className="bg-black border border-[#D4AF37]/30 p-6">
            <h2 className="text-[#D4AF37] font-black text-xl mb-4">DOCS</h2>
            <div className="space-y-2 text-sm">
              <div className="text-[#D4AF37]/60 hover:text-[#D4AF37] cursor-pointer">📄 Purchase Agreement.pdf</div>
              <div className="text-[#D4AF37]/60 hover:text-[#D4AF37] cursor-pointer">📄 Title Search.pdf</div>
              <div className="text-[#D4AF37]/60 hover:text-[#D4AF37] cursor-pointer">📄 Rehab Scope.xlsx</div>
              <div className="text-[#D4AF37]/60 hover:text-[#D4AF37] cursor-pointer">📄 Comps.pdf</div>
            </div>
            <button className="w-full mt-4 border border-[#D4AF37] text-[#D4AF37] py-2 text-xs font-black hover:bg-[#D4AF37]/10">UPLOAD DOC</button>
          </div>
        </div>

        {/* RIGHT: CHAT + ACTIONS */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-black border border-[#D4AF37]/30 p-6">
            <h2 className="text-[#D4AF37] font-black text-xl mb-4">DEAL CHAT // 4 MEMBERS ONLINE</h2>
            <div className="h-80 overflow-y-auto mb-4 space-y-3 bg-[#0A0A0A] p-4 border border-[#D4AF37]/20">
              {chat.map((msg, i) => (
                <div key={i} className="text-sm">
                  <span className="text-[#D4AF37] font-bold">{msg.user}:</span> <span className="text-white/80">{msg.text}</span>
                  <span className="text-[#D4AF37]/40 text-xs ml-2">{msg.time}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type message..."
                className="flex-1 bg-[#0A0A0A] border border-[#D4AF37]/30 text-white p-3 text-sm outline-none focus:border-[#D4AF37]"
              />
              <button onClick={sendMessage} className="bg-[#D4AF37] text-black px-6 font-black text-sm hover:bg-[#F4CF47]">SEND</button>
            </div>
          </div>

          <div className="bg-[#DC2626]/10 border-2 border-[#DC2626] p-6">
            <h2 className="text-[#DC2626] font-black text-xl mb-4">SHOT CLOCK ACTIVE</h2>
            <p className="text-white/80 text-sm mb-4">First lender to fund wins exclusive. 48 hours from SMS. No extensions.</p>
            <div className="text-5xl font-black text-[#DC2626] mb-4">{formatTime(timeLeft)}</div>
            <button className="w-full bg-[#DC2626] text-white py-4 font-black text-lg hover:bg-[#B91C1C]">
              FUND DEAL NOW // ${deal.ask}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
