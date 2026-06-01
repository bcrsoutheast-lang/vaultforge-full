'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Members() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  useEffect(() => {
    const auth = localStorage.getItem('vaultforge_auth')
    const userEmail = localStorage.getItem('vaultforge_email')
    if (auth!== 'true') {
      router.push('/login')
    } else {
      setEmail(userEmail || 'founder@vaultforge.com')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('vaultforge_auth')
    localStorage.removeItem('vaultforge_email')
    router.push('/')
  }

  const memberDeals = [
    {
      id: 1,
      city: 'FULTON, GA',
      address: '1247 PEACHTREE ST',
      arv: '340K',
      ask: '240K',
      bps: 88,
      dqi: 91,
      aci: 94,
      status: 'SMS SENT // LENDER RESPONDED',
      spread: '100K'
    },
    {
      id: 2,
      city: 'DADE, FL',
      address: '8921 BISCAYNE BLVD',
      arv: '485K',
      ask: '335K',
      bps: 85,
      dqi: 89,
      aci: 91,
      status: 'DEAL ROOM OPEN // 4 ONLINE',
      spread: '150K'
    },
    {
      id: 3,
      city: 'HARRIS, TX',
      address: '5502 WESTHEIMER RD',
      arv: '295K',
      ask: '210K',
      bps: 82,
      dqi: 93,
      aci: 88,
      status: 'LENDER MATCHED // DOCS PENDING',
      spread: '85K'
    },
    {
      id: 4,
      city: 'COOK, IL',
      address: '1845 N LINCOLN AVE',
      arv: '410K',
      ask: '365K',
      bps: 64,
      dqi: 78,
      aci: 82,
      status: 'AGED LISTING // REVIEW',
      spread: '45K'
    },
    {
      id: 5,
      city: 'MARICOPA, AZ',
      address: '3210 E CAMELBACK RD',
      arv: '375K',
      ask: '320K',
      bps: 58,
      dqi: 81,
      aci: 79,
      status: 'PRICE DROP // 7 DAYS',
      spread: '55K'
    },
    {
      id: 6,
      city: 'CLARK, NV',
      address: '7712 S LAS VEGAS BLVD',
      arv: '525K',
      ask: '475K',
      bps: 61,
      dqi: 75,
      aci: 77,
      status: 'DOM 120 // MOTIVATED',
      spread: '50K'
    },
  ]

  const stats = [
    { label: 'DEALS ROUTED TODAY', value: '492' },
    { label: 'BPS 80+ IN FEED', value: '193' },
    { label: 'DQI 90+ MATCHED', value: '87' },
    { label: 'YOUR ACTIVE DEALS', value: '12' },
  ]

  const tools = [
    { name: 'PAIN ROOM', desc: 'Submit leads. BPS scores in real-time. 10% fee if it closes.', status: 'ACTIVE', link: '/members/submit' },
    { name: 'LENDER SMS', desc: 'DQI 90+ alerts. 8 sec response. You get first look.', status: 'ACTIVE', link: '/members/alerts' },
    { name: 'VAULT SCORE', desc: 'Your reputation: 847/1000. Green light status.', status: 'GREEN', link: '/members/profile' },
    { name: 'ARV CONFIDENCE', desc: 'ACI 90+ = Lender pre-approved. No appraisal delays.', status: 'LIVE', link: '#' },
    { name: 'DEAL ROOMS', desc: 'Private rooms. Docs, chat, e-sign. 48hr shot clock.', status: 'LIVE', link: '#' },
    { name: 'TITLE DECODER', desc: 'Lien stack analyzer. Cloud detector. Instant report.', status: 'BETA', link: '#' },
  ]

  return (
    <main className="bg-[#0A0A0A] min-h-screen font-mono text-white">
      {/* NAV */}
      <nav className="bg-black border-b border-[#D4AF37]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image src="/IMG_4751.png" alt="VaultForge" width={120} height={30} className="h-8 w-auto" />
            <div className="hidden md:block border-l border-[#D4AF37]/30 pl-4">
              <div className="text-[#D4AF37] text-xs font-bold tracking-[0.3em]">MEMBERS VAULT</div>
              <div className="text-[#D4AF37]/60 text-xs tracking-[0.4em]">FOUNDING MEMBER</div>
            </div>
          <div className="flex items-center gap-4">
            <span className="text-[#D4AF37]/60 text-xs hidden md:block">{email}</span>
            <button onClick={handleLogout} className="border border-[#D4AF37] text-[#D4AF37] px-4 py-1.5 font-black tracking-wider text-xs hover:bg-[#D4AF37]/10">
              LOGOUT
            </button>
          </div>
        </div>
      </nav>

      {/* DASHBOARD */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-[#D4AF37] mb-2">WELCOME BACK, FOUNDER</h1>
          <p className="text-[#D4AF37]/60 text-sm">3-DAY TRIAL ACTIVE // DAY 1 OF 3 // $750 ACCESS PENDING</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-black border border-[#D4AF37]/30 p-6 text-center hover:border-[#D4AF37] transition">
              <div className="text-3xl md:text-4xl font-black text-[#D4AF37]">{stat.value}</div>
              <div className="text-[#D4AF37]/60 text-xs tracking-wider mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* LIVE DEALS - FULL ADDRESS VISIBLE */}
        <div className="bg-black border-2 border-[#D4AF37] p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-black text-[#D4AF37]">YOUR DEAL FEED // LIVE</h2>
            <div className="bg-[#DC2626] text-white px-3 py-1 text-xs font-black animate-pulse">6 NEW</div>
          </div>
          <div className="space-y-4">
            {memberDeals.map((deal) => (
              <div key={deal.id} className="bg-[#0A0A0A] border border-[#D4AF37]/20 p-5 hover:border-[#D4AF37]/50 transition">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                  <div>
                    <div className="text-[#D4AF37] font-bold text-lg md:text-xl">{deal.address}</div>
                    <div className="text-[#D4AF37]/60 text-sm">{deal.city}</div>
                  </div>
                  <div className="text-[#D4AF37] font-black text-sm mt-2 md:mt-0 bg-[#D4AF37]/10 px-3 py-1 border border-[#D4AF37]/30">
                    {deal.status}
                  </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                  <div>
                    <div className="text-[#D4AF37]/60 text-xs">ARV</div>
                    <div className="text-white font-black text-lg">${deal.arv}</div>
                  </div>
                  <div>
                    <div className="text-[#D4AF37]/60 text-xs">ASK</div>
                    <div className="text-white font-black text-lg">${deal.ask}</div>
                  </div>
                  <div>
                    <div className="text-[#D4AF37]/60 text-xs">SPREAD</div>
                    <div className="text-[#D4AF37] font-black text-lg">{deal.spread}</div>
                  </div>
                  <div>
                    <div className="text-[#D4AF37]/60 text-xs">BPS</div>
                    <div className="text-[#DC2626] font-black text-lg">{deal.bps}</div>
                  </div>
                  <div>
                    <div className="text-[#D4AF37]/60 text-xs">DQI</div>
                    <div className="text-[#D4AF37] font-black text-lg">{deal.dqi}</div>
                  </div>
                  <div>
                    <div className="text-[#D4AF37]/60 text-xs">ACI</div>
                    <div className="text-white font-black text-lg">{deal.aci}</div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-2">
                  <a href={`/members/deal/${deal.id}`} className="flex-1">
                    <button className="w-full bg-[#D4AF37] text-black px-4 py-3 text-sm font-black hover:bg-[#F4CF47] transition">
                      ENTER DEAL ROOM
                    </button>
                  </a>
                  <button className="flex-1 border-2 border-[#D4AF37] text-[#D4AF37] px-4 py-3 text-sm font-black hover:bg-[#D4AF37]/10 transition">
                    VIEW FULL DOCS
                  </button>
                  <button className="md:w-auto border border-[#D4AF37]/30 text-[#D4AF37]/60 px-4 py-3 text-sm font-black hover:border-[#D4AF37]/60">
                    PASS
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOOLS GRID */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-[#D4AF37] mb-6">MEMBER TOOLS</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, i) => (
              <a key={i} href={tool.link} className="block">
                <div className="bg-black border border-[#D4AF37]/30 p-6 hover:border-[#D4AF37] hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition cursor-pointer h-full">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-[#D4AF37] font-black text-lg">{tool.name}</h3>
                    <span className={`px-2 py-1 text-xs font-bold ${
                      tool.status === 'ACTIVE'? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
                      tool.status === 'GREEN'? 'bg-green-500/20 text-green-500' :
                      tool.status === 'LIVE'? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>{tool.status}</span>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">{tool.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* TRIAL WARNING */}
        <div className="bg-[#DC2626]/10 border-2 border-[#DC2626] p-6 text-center">
          <h3 className="text-[#DC2626] font-black text-xl mb-2">3-DAY TRIAL ENDS IN 71:42:18</h3>
          <p className="text-white/80 text-sm mb-4">Your card will be charged $750 access fee + $299/month on Day 4. Cancel anytime before Day 3 to avoid charges.</p>
          <button className="bg-[#DC2626] text-white px-8 py-3 font-black hover:bg-[#B91C1C] transition">
            MANAGE BILLING
          </button>
        </div>
      </div>
    </main>
  )
}
