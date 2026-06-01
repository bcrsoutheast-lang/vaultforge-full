'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Alerts() {
  const router = useRouter()
  const [claimedDeals, setClaimedDeals] = useState<number[]>([])

  useEffect(() => {
    const auth = localStorage.getItem('vaultforge_auth')
    if (auth!== 'true') router.push('/login')

    const claimed = localStorage.getItem('vaultforge_claimed')
    if (claimed) setClaimedDeals(JSON.parse(claimed))
  }, [router])

  const handleClaim = (dealId: number) => {
    const newClaimed = [...claimedDeals, dealId]
    setClaimedDeals(newClaimed)
    localStorage.setItem('vaultforge_claimed', JSON.stringify(newClaimed))
  }

  const alerts = [
    {
      id: 1,
      timestamp: '23 SECONDS AGO',
      address: '1247 PEACHTREE ST',
      city: 'FULTON, GA',
      arv: '340K',
      ask: '240K',
      bps: 88,
      dqi: 91,
      aci: 94,
      smsStatus: 'SENT TO 4 LENDERS',
      replyCount: 2,
      timeLeft: 172650, // 47:57:30
    },
    {
      id: 2,
      timestamp: '8 MINUTES AGO',
      address: '8921 BISCAYNE BLVD',
      city: 'DADE, FL',
      arv: '485K',
      ask: '335K',
      bps: 85,
      dqi: 92,
      aci: 91,
      smsStatus: 'SENT TO 4 LENDERS',
      replyCount: 3,
      timeLeft: 169800, // 47:10:00
    },
    {
      id: 3,
      timestamp: '14 MINUTES AGO',
      address: '5502 WESTHEIMER RD',
      city: 'HARRIS, TX',
      arv: '295K',
      ask: '210K',
      bps: 82,
      dqi: 93,
      aci: 88,
      smsStatus: 'SENT TO 4 LENDERS',
      replyCount: 1,
      timeLeft: 166200, // 46:10:00
    },
    {
      id: 4,
      timestamp: '31 MINUTES AGO',
      address: '9012 WILSHIRE BLVD',
      city: 'LOS ANGELES, CA',
      arv: '650K',
      ask: '480K',
      bps: 91,
      dqi: 95,
      aci: 96,
      smsStatus: 'SENT TO 4 LENDERS',
      replyCount: 4,
      timeLeft: 158400, // 44:00:00
    },
  ]

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}H ${m}M`
  }

  return (
    <main className="bg-[#0A0A0A] min-h-screen font-mono text-white">
      <nav className="bg-black border-b border-[#D4AF37]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image src="/IMG_4751.png" alt="VaultForge" width={120} height={30} className="h-8 w-auto" />
            <div className="hidden md:block border-l border-[#D4AF37]/30 pl-4">
              <div className="text-[#D4AF37] text-xs font-bold tracking-[0.3em]">LENDER SMS ALERTS</div>
              <div className="text-[#D4AF37]/60 text-xs">DQI 90+ ONLY</div>
            </div>
          </div>
          <a href="/members">
            <button className="border border-[#D4AF37] text-[#D4AF37] px-4 py-1.5 font-black tracking-wider text-xs hover:bg-[#D4AF37]/10">
              BACK TO VAULT
            </button>
          </a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-[#D4AF37] mb-2">LIVE LENDER ALERTS</h1>
          <p className="text-[#D4AF37]/60 text-sm">DQI 90+ triggers SMS in 8 seconds. First reply wins exclusive. 48hr shot clock.</p>
        </div>

        <div className="bg-[#DC2626]/10 border-2 border-[#DC2626] p-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-[#DC2626] text-white px-3 py-1 text-xs font-black animate-pulse">LIVE</div>
            <div className="text-white text-sm">
              <span className="font-black">4 ACTIVE ALERTS.</span> 12 lenders online. Avg response time: 6.3 seconds.
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {alerts.map((alert) => {
            const isClaimed = claimedDeals.includes(alert.id)
            return (
              <div key={alert.id} className="bg-black border-2 border-[#D4AF37] p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-[#DC2626] text-white px-2 py-1 text-xs font-black">DQI {alert.dqi}</span>
                      <span className="bg-[#D4AF37] text-black px-2 py-1 text-xs font-black">BPS {alert.bps}</span>
                      <span className="text-[#D4AF37]/60 text-xs">{alert.timestamp}</span>
                    </div>
                    <div className="text-[#D4AF37] font-bold text-xl mb-1">{alert.address}</div>
                    <div className="text-[#D4AF37]/60 text-sm">{alert.city}</div>
                  </div>
                  <div className="mt-4 md:mt-0 text-right">
                    <div className="text-[#DC2626] font-black text-2xl">{formatTime(alert.timeLeft)}</div>
                    <div className="text-[#D4AF37]/60 text-xs">SHOT CLOCK</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 py-4 border-y border-[#D4AF37]/20">
                  <div>
                    <div className="text-[#D4AF37]/60 text-xs">ARV</div>
                    <div className="text-white font-black text-lg">${alert.arv}</div>
                  </div>
                  <div>
                    <div className="text-[#D4AF37]/60 text-xs">ASK</div>
                    <div className="text-white font-black text-lg">${alert.ask}</div>
                  </div>
                  <div>
                    <div className="text-[#D4AF37]/60 text-xs">SPREAD</div>
                    <div className="text-[#D4AF37] font-black text-lg">100K</div>
                  </div>
                  <div>
                    <div className="text-[#D4AF37]/60 text-xs">ACI</div>
                    <div className="text-white font-black text-lg">{alert.aci}</div>
                  </div>
                  <div>
                    <div className="text-[#D4AF37]/60 text-xs">REPLIES</div>
                    <div className="text-[#DC2626] font-black text-lg">{alert.replyCount}/4</div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 items-center">
                  <div className="flex-1 text-sm">
                    <span className="text-[#D4AF37] font-bold">SMS STATUS:</span> <span className="text-white/80">{alert.smsStatus}</span>
                  </div>
                  {isClaimed? (
                    <button disabled className="w-full md:w-auto bg-green-500/20 border-2 border-green-500 text-green-500 px-8 py-3 font-black text-sm">
                      CLAIMED ✓
                    </button>
                  ) : (
                    <button
                      onClick={() => handleClaim(alert.id)}
                      className="w-full md:w-auto bg-[#DC2626] text-white px-8 py-3 font-black text-sm hover:bg-[#B91C1C] transition"
                    >
                      CLAIM DEAL NOW
                    </button>
                  )}
                  <a href={`/members/deal/${alert.id}`}>
                    <button className="w-full md:w-auto border-2 border-[#D4AF37] text-[#D4AF37] px-8 py-3 font-black text-sm hover:bg-[#D4AF37]/10">
                      VIEW DEAL ROOM
                    </button>
                  </a>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 bg-black border border-[#D4AF37]/30 p-6">
          <h3 className="text-[#D4AF37] font-black text-lg mb-4">HOW IT WORKS</h3>
          <div className="space-y-2 text-sm text-white/60">
            <div>1. Deal hits DQI 90+ + BPS 80+ → Triggers SMS to 4 matched lenders</div>
            <div>2. SMS delivered in 8 seconds. First lender to reply wins exclusive</div>
            <div>3. 48 hour shot clock starts. Fund or lose it</div>
            <div>4. You get commission if your lead closes. 10% of spread</div>
          </div>
        </div>
      </div>
    </main>
  )
}
