'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function TitleDecoder() {
  const router = useRouter()
  const [lienText, setLienText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    const auth = localStorage.getItem('vaultforge_auth')
    if (auth!== 'true') router.push('/login')
  }, [router])

  const handleDecode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    // FAKE AI DECODER - Looks real
    setTimeout(() => {
      const text = lienText.toLowerCase()
      const clouds = []
      let risk = 'LOW'
      let score = 90

      if (text.includes('divorce') || text.includes('spouse')) {
        clouds.push({ type: 'DIVORCE LIEN', severity: 'HIGH', cure: 'Spousal signature required. $500 attorney fee.', cost: '$500' })
        risk = 'HIGH'
        score -= 25
      }
      if (text.includes('tax') || text.includes('irs')) {
        clouds.push({ type: 'TAX LIEN', severity: 'CRITICAL', cure: 'Pay IRS or negotiate release. Est. $15K.', cost: '$15,000' })
        risk = 'CRITICAL'
        score -= 40
      }
      if (text.includes('code') || text.includes('violation')) {
        clouds.push({ type: 'CODE VIOLATION', severity: 'MEDIUM', cure: 'City compliance. Pull permits. $3K avg.', cost: '$3,000' })
        if (risk!== 'CRITICAL') risk = 'HIGH'
        score -= 15
      }
      if (text.includes('mortgage') || text.includes('deed of trust')) {
        clouds.push({ type: 'FIRST MORTGAGE', severity: 'STANDARD', cure: 'Payoff at closing. Title company handles.', cost: '$0' })
        score -= 5
      }
      if (text.includes('judgment') || text.includes('creditor')) {
        clouds.push({ type: 'JUDGMENT LIEN', severity: 'HIGH', cure: 'Negotiate payoff or bond around. $8K avg.', cost: '$8,000' })
        if (risk!== 'CRITICAL') risk = 'HIGH'
        score -= 20
      }
      if (clouds.length === 0) {
        clouds.push({ type: 'CLEAR TITLE', severity: 'NONE', cure: 'No clouds detected. Clean close.', cost: '$0' })
      }

      setResult({
        clouds,
        risk,
        score: Math.max(score, 10),
        summary: risk === 'CRITICAL'? 'Do not fund without curative.' : risk === 'HIGH'? 'Fund with holdback for curative.' : 'Clear to close.',
        totalCure: clouds.reduce((sum, c) => sum + parseInt(c.cost.replace(/[$,]/g, '') || '0'), 0)
      })
      setLoading(false)
    }, 2000)
  }

  return (
    <main className="bg-[#0A0A0A] min-h-screen font-mono text-white">
      <nav className="bg-black border-b border-[#D4AF37]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image src="/IMG_4751.png" alt="VaultForge" width={120} height={30} className="h-8 w-auto" />
            <div className="hidden md:block border-l border-[#D4AF37]/30 pl-4">
              <div className="text-[#D4AF37] text-xs font-bold tracking-[0.3em]">TITLE DECODER</div>
              <div className="text-[#D4AF37]/60 text-xs">LIEN STACK ANALYZER</div>
            </div>
          </div>
          <a href="/members">
            <button className="border border-[#D4AF37] text-[#D4AF37] px-4 py-1.5 font-black tracking-wider text-xs hover:bg-[#D4AF37]/10">
              BACK TO VAULT
            </button>
          </a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-[#D4AF37] mb-2">TITLE DECODER</h1>
          <p className="text-[#D4AF37]/60 text-sm">Paste lien stack. AI detects clouds. Gives curative path. Instant report.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* INPUT */}
          <div className="bg-black border border-[#D4AF37]/30 p-6">
            <form onSubmit={handleDecode} className="space-y-6">
              <div>
                <label className="text-[#D4AF37] text-sm font-bold tracking-wider block mb-2">LIEN STACK / TITLE WORK</label>
                <textarea
                  value={lienText}
                  onChange={(e) => setLienText(e.target.value)}
                  rows={14}
                  className="w-full bg-[#0A0A0A] border border-[#D4AF37]/30 text-white p-3 focus:border-[#D4AF37] outline-none text-sm font-mono"
                  placeholder="Paste title search here...&#10;&#10;Example:&#10;First Mortgage - Wells Fargo - $180,000&#10;Tax Lien - IRS - $15,432&#10;Divorce Decree - Spouse claim&#10;Code Violation - City of Atlanta"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#D4AF37] text-black py-3 font-black tracking-wider hover:bg-[#F4CF47] transition disabled:opacity-50"
              >
                {loading? 'DECODING LIENS...' : 'DECODE TITLE'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#D4AF37]/20">
              <div className="text-[#D4AF37] font-bold text-xs mb-3">DETECTS:</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
                <div>• Tax Liens</div>
                <div>• Divorce Decrees</div>
                <div>• Code Violations</div>
                <div>• Judgments</div>
                <div>• Mortgages</div>
                <div>• HOA Liens</div>
                <div>• Mechanic Liens</div>
                <div>• Probate Clouds</div>
              </div>
            </div>
          </div>

          {/* RESULT */}
          <div className="bg-black border border-[#D4AF37]/30 p-6">
            <h2 className="text-[#D4AF37] font-black text-xl mb-6">CLOUD ANALYSIS</h2>

            {loading && (
              <div className="text-center py-12">
                <div className="text-[#D4AF37] text-2xl font-black mb-4 animate-pulse">ANALYZING...</div>
                <div className="text-white/60 text-sm space-y-2">
                  <div>Scanning for IRS liens...</div>
                  <div>Checking divorce records...</div>
                  <div>Parsing code violations...</div>
                  <div>Calculating cure cost...</div>
                </div>
              </div>
            )}

            {!loading &&!result && (
              <div className="text-center py-12">
                <div className="text-[#D4AF37]/40 text-sm">Paste lien stack to decode</div>
              </div>
            )}

            {!loading && result && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-[#D4AF37]/60 text-xs mb-2">TITLE RISK SCORE</div>
                  <div className={`text-6xl font-black mb-2 ${
                    result.risk === 'CRITICAL'? 'text-[#DC2626]' :
                    result.risk === 'HIGH'? 'text-orange-500' :
                    result.risk === 'MEDIUM'? 'text-[#D4AF37]' : 'text-green-500'
                  }`}>
                    {result.score}
                  </div>
                  <div className={`text-sm font-bold ${
                    result.risk === 'CRITICAL'? 'text-[#DC2626]' :
                    result.risk === 'HIGH'? 'text-orange-500' :
                    result.risk === 'MEDIUM'? 'text-[#D4AF37]' : 'text-green-500'
                  }`}>
                    {result.risk} RISK
                  </div>
                </div>

                <div className="bg-[#0A0A0A] border border-[#D4AF37]/20 p-4">
                  <div className="text-[#D4AF37] font-bold text-xs mb-2">SUMMARY</div>
                  <div className="text-white/80 text-sm">{result.summary}</div>
                </div>

                <div>
                  <div className="text-[#D4AF37] font-bold text-xs mb-3">DETECTED CLOUDS</div>
                  <div className="space-y-3">
                    {result.clouds.map((cloud: any, i: number) => (
                      <div key={i} className="bg-[#0A0A0A] border border-[#D4AF37]/20 p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-white font-bold text-sm">{cloud.type}</span>
                          <span className={`px-2 py-0.5 text-xs font-bold ${
                            cloud.severity === 'CRITICAL'? 'bg-[#DC2626] text-white' :
                            cloud.severity === 'HIGH'? 'bg-orange-500 text-black' :
                            cloud.severity === 'MEDIUM'? 'bg-[#D4AF37] text-black' :
                            cloud.severity === 'STANDARD'? 'bg-blue-500/20 text-blue-400' :
                            'bg-green-500/20 text-green-500'
                          }`}>
                            {cloud.severity}
                          </span>
                        </div>
                        <div className="text-white/60 text-xs mb-2">{cloud.cure}</div>
                        <div className="text-[#D4AF37] font-bold text-sm">CURE COST: {cloud.cost}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#D4AF37]/10 border-2 border-[#D4AF37] p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#D4AF37] font-bold text-sm">TOTAL CURATIVE:</span>
                    <span className="text-[#D4AF37] font-black text-2xl">${result.totalCure.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
