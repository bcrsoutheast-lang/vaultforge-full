'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Profile() {
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

  const vaultScore = 847
  const scoreColor = vaultScore >= 800? 'text-green-500' : vaultScore >= 700? 'text-[#D4AF37]' : 'text-[#DC2626]'
  const scoreBg = vaultScore >= 800? 'bg-green-500/10 border-green-500' : vaultScore >= 700? 'bg-[#D4AF37]/10 border-[#D4AF37]' : 'bg-[#DC2626]/10 border-[#DC2626]'
  const scoreStatus = vaultScore >= 800? 'GREEN LIGHT // PREFERRED' : vaultScore >= 700? 'YELLOW // STANDARD' : 'RED // REVIEW'

  const badges = [
    { name: 'FOUNDING MEMBER', desc: 'Joined in first 685', active: true },
    { name: 'DEAL CLOSER', desc: '3 deals funded', active: true },
    { name: 'LENDER TRUSTED', desc: '12 loans repaid on time', active: true },
    { name: 'PAIN HUNTER', desc: '47 leads submitted', active: true },
    { name: 'SMS SNIPER', desc: 'Claimed 8 alerts first', active: true },
    { name: 'VAULT LEGEND', desc: '100+ deals', active: false },
  ]

  const history = [
    { date: '2026-05-28', action: 'FUNDED', deal: '1247 PEACHTREE ST', amount: '$240K', impact: '+15' },
    { date: '2026-05-22', action: 'CLAIMED', deal: '8921 BISCAYNE BLVD', amount: '$335K', impact: '+12' },
    { date: '2026-05-15', action: 'SUBMITTED', deal: '5502 WESTHEIMER RD', amount: 'LEAD', impact: '+8' },
    { date: '2026-05-10', action: 'REPAID', deal: '1845 N LINCOLN AVE', amount: '$365K', impact: '+25' },
    { date: '2026-05-03', action: 'FUNDED', deal: '3210 E CAMELBACK RD', amount: '$320K', impact: '+15' },
    { date: '2026-04-28', action: 'PASSED', deal: '7712 S LAS VEGAS BLVD', amount: '$475K', impact: '0' },
  ]

  const stats = [
    { label: 'DEALS FUNDED', value: '12' },
    { label: 'TOTAL VOLUME', value: '$3.2M' },
    { label: 'AVG BPS', value: '86' },
    { label: 'AVG DQI', value: '91' },
    { label: 'RESPONSE TIME', value: '4.2 SEC' },
    { label: 'REPUTATION', value: '98%' },
  ]

  return (
    <main className="bg-[#0A0A0A] min-h-screen font-mono text-white">
      <nav className="bg-black border-b border-[#D4AF37]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image src="/IMG_4751.png" alt="VaultForge" width={120} height={30} className="h-8 w-auto" />
            <div className="hidden md:block border-l border-[#D4AF37]/30 pl-4">
              <div className="text-[#D4AF37] text-xs font-bold tracking-[0.3em]">VAULT SCORE</div>
              <div className="text-[#D4AF37]/60 text-xs">MEMBER PROFILE</div>
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
          <h1 className="text-3xl md:text-4xl font-black text-[#D4AF37] mb-2">MEMBER PROFILE</h1>
          <p className="text-[#D4AF37]/60 text-sm">{email}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* VAULT SCORE */}
          <div className={`md:col-span-1 border-2 ${scoreBg} p-8 text-center`}>
            <div className="text-[#D4AF37]/60 text-xs mb-4 tracking-[0.3em]">VAULT SCORE</div>
            <div className={`text-7xl font-black ${scoreColor} mb-4`}>{vaultScore}</div>
            <div className={`text-sm font-bold ${scoreColor} mb-6`}>{scoreStatus}</div>
            <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full ${vaultScore >= 800? 'bg-green-500' : vaultScore >= 700? 'bg-[#D4AF37]' : 'bg-[#DC2626]'}`}
                style={{ width: `${(vaultScore / 1000) * 100}%` }}
              ></div>
            </div>
            <div className="text-[#D4AF37]/40 text-xs mt-3">0 ———————————————— 1000</div>
          </div>

          {/* STATS */}
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-black border border-[#D4AF37]/30 p-6 text-center hover:border-[#D4AF37] transition">
                <div className="text-2xl md:text-3xl font-black text-[#D4AF37]">{stat.value}</div>
                <div className="text-[#D4AF37]/60 text-xs tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* BADGES */}
        <div className="bg-black border border-[#D4AF37]/30 p-6 mb-8">
          <h2 className="text-2xl font-black text-[#D4AF37] mb-6">ACHIEVEMENT BADGES</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {badges.map((badge, i) => (
              <div
                key={i}
                className={`border p-4 ${
                  badge.active
                 ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                  : 'border-[#D4AF37]/20 bg-black opacity-40'
                }`}
              >
                <div className={`font-black text-sm mb-1 ${badge.active? 'text-[#D4AF37]' : 'text-[#D4AF37]/40'}`}>
                  {badge.active? '✓ ' : '🔒 '}{badge.name}
                </div>
                <div className="text-white/60 text-xs">{badge.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* HISTORY */}
        <div className="bg-black border border-[#D4AF37]/30 p-6">
          <h2 className="text-2xl font-black text-[#D4AF37] mb-6">DEAL HISTORY</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#D4AF37]/20">
                  <th className="text-[#D4AF37] text-left py-3 px-2">DATE</th>
                  <th className="text-[#D4AF37] text-left py-3 px-2">ACTION</th>
                  <th className="text-[#D4AF37] text-left py-3 px-2">DEAL</th>
                  <th className="text-[#D4AF37] text-left py-3 px-2">AMOUNT</th>
                  <th className="text-[#D4AF37] text-right py-3 px-2">SCORE</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, i) => (
                  <tr key={i} className="border-b border-[#D4AF37]/10 hover:bg-[#D4AF37]/5">
                    <td className="text-white/60 py-3 px-2">{item.date}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 text-xs font-bold ${
                        item.action === 'FUNDED'? 'bg-green-500/20 text-green-500' :
                        item.action === 'CLAIMED'? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
                        item.action === 'REPAID'? 'bg-blue-500/20 text-blue-400' :
                        item.action === 'SUBMITTED'? 'bg-purple-500/20 text-purple-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {item.action}
                      </span>
                    </td>
                    <td className="text-white py-3 px-2">{item.deal}</td>
                    <td className="text-[#D4AF37] font-bold py-3 px-2">{item.amount}</td>
                    <td className={`font-bold text-right py-3 px-2 ${item.impact.startsWith('+')? 'text-green-500' : 'text-white/40'}`}>
                      {item.impact}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
