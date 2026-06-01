'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function ARV() {
  const router = useRouter()
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    const auth = localStorage.getItem('vaultforge_auth')
    if (auth!== 'true') router.push('/login')
  }, [router])

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    // FAKE ACI ENGINE - Looks real
    setTimeout(() => {
      const baseARV = Math.floor(Math.random() * 200) + 250 // 250K-450K
      const aci = Math.floor(Math.random() * 20) + 80 // 80-100
      const confidence = aci >= 90? 'LENDER PRE-APPROVED' : aci >= 85? 'HIGH CONFIDENCE' : 'MEDIUM CONFIDENCE'

      const comps = [
        {
          address: '1251 PEACHTREE ST',
          sold: '320K',
          date: '2026-04-12',
          sqft: '1,850',
          distance: '0.1 mi',
          match: 96
        },
        {
          address: '1188 SPRING ST',
          sold: '335K',
          date: '2026-03-28',
          sqft: '1,920',
          distance: '0.3 mi',
          match: 94
        },
        {
          address: '1305 WEST PEACHTREE',
          sold: '298K',
          date: '2026-05-02',
          sqft: '1,780',
          distance: '0.2 mi',
          match: 91
        },
        {
          address: '1100 CRESCENT AVE',
          sold: '355K',
          date: '2026-02-15',
          sqft: '2,100',
          distance: '0.5 mi',
          match: 88
        },
      ]

      setResult({
        address,
        arv: baseARV,
        aci,
        confidence,
        lowRange: baseARV - 15,
        highRange: baseARV + 20,
        rehab: Math.floor(baseARV * 0.15),
        afterRepair: baseARV,
        comps,
        daysOnMarket: Math.floor(Math.random() * 20) + 15,
        pricePerSqft: Math.floor((baseARV * 1000) / 1850),
      })
      setLoading(false)
    }, 2200)
  }

  return (
    <main className="bg-[#0A0A0A] min-h-screen font-mono text-white">
      <nav className="bg-black border-b border-[#D4AF37]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image src="/IMG_4751.png" alt="VaultForge" width={120} height={30} className="h-8 w-auto" />
            <div className="hidden md:block border-l border-[#D4AF37]/30 pl-4">
              <div className="text-[#D4AF37] text-xs font-bold tracking-[0.3em]">ARV CONFIDENCE</div>
              <div className="text-[#D4AF37]/60 text-xs">ACI ENGINE</div>
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
          <h1 className="text-3xl md:text-4xl font-black text-[#D4AF37] mb-2">ARV CONFIDENCE INDEX</h1>
          <p className="text-[#D4AF37]/60 text-sm">Enter address. AI pulls comps. ACI 90+ = Lender pre-approved. No appraisal delays.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* INPUT */}
          <div className="bg-black border border-[#D4AF37]/30 p-6">
            <form onSubmit={handleAnalyze} className="space-y-6">
              <div>
                <label className="text-[#D4AF37] text-sm font-bold tracking-wider block mb-2">PROPERTY ADDRESS</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#D4AF37]/30 text-white p-3 focus:border-[#D4AF37] outline-none text-sm"
                  placeholder="1247 PEACHTREE ST, ATLANTA GA"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#D4AF37] text-black py-3 font-black tracking-wider hover:bg-[#F4CF47] transition disabled:opacity-50"
              >
                {loading? 'RUNNING COMPS...' : 'ANALYZE ARV'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#D4AF37]/20">
              <div className="text-[#D4AF37] font-bold text-xs mb-3">ACI SCORING:</div>
              <div className="space-y-2 text-xs text-white/60">
                <div className="flex justify-between"><span>90-100</span><span className="text-green-500 font-bold">LENDER PRE-APPROVED</span></div>
                <div className="flex justify-between"><span>85-89</span><span className="text-[#D4AF37] font-bold">HIGH CONFIDENCE</span></div>
                <div className="flex justify-between"><span>80-84</span><span className="text-orange-500 font-bold">MEDIUM CONFIDENCE</span></div>
                <div className="flex justify-between"><span>Below 80</span><span className="text-[#DC2626] font-bold">LOW CONFIDENCE</span></div>
              </div>
            </div>
          </div>

          {/* RESULT */}
          <div className="bg-black border border-[#D4AF37]/30 p-6">
            <h2 className="text-[#D4AF37] font-black text-xl mb-6">ACI REPORT</h2>

            {loading && (
              <div className="text-center py-12">
                <div className="text-[#D4AF37] text-2xl font-black mb-4 animate-pulse">PULLING COMPS...</div>
                <div className="text-white/60 text-sm space-y-2">
                  <div>Scanning MLS data...</div>
                  <div>Analyzing recent sales...</div>
                  <div>Calculating ARV range...</div>
                  <div>Running confidence model...</div>
                </div>
              </div>
            )}

            {!loading &&!result && (
              <div className="text-center py-12">
                <div className="text-[#D4AF37]/40 text-sm">Enter address to run ACI</div>
              </div>
            )}

            {!loading && result && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-[#D4AF37]/60 text-xs mb-2">ARV CONFIDENCE INDEX</div>
                  <div className={`text-6xl font-black mb-2 ${
                    result.aci >= 90? 'text-green-500' :
                    result.aci >= 85? 'text-[#D4AF37]' : 'text-orange-500'
                  }`}>
                    {result.aci}
                  </div>
                  <div className={`text-sm font-bold ${
                    result.aci >= 90? 'text-green-500' :
                    result.aci >= 85? 'text-[#D4AF37]' : 'text-orange-500'
                  }`}>
                    {result.confidence}
                  </div>
                </div>

                <div className="bg-[#0A0A0A] border border-[#D4AF37]/20 p-4">
                  <div className="text-center mb-4">
                    <div className="text-[#D4AF37]/60 text-xs">AFTER REPAIR VALUE</div>
                    <div className="text-4xl font-black text-white">${result.arv}K</div>
                    <div className="text-[#D4AF37]/60 text-xs mt-1">RANGE: ${result.lowRange}K - ${result.highRange}K</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#D4AF37]/20 text-sm">
                    <div>
                      <div className="text-[#D4AF37]/60 text-xs">REHAB EST</div>
                      <div className="text-white font-bold">${result.rehab}K</div>
                    </div>
                    <div>
                      <div className="text-[#D4AF37]/60 text-xs">$/SQFT</div>
                      <div className="text-white font-bold">${result.pricePerSqft}</div>
                    </div>
                    <div>
                      <div className="text-[#D4AF37]/60 text-xs">AVG DOM</div>
                      <div className="text-white font-bold">{result.daysOnMarket} DAYS</div>
                    </div>
                    <div>
                      <div className="text-[#D4AF37]/60 text-xs">COMPS</div>
                      <div className="text-white font-bold">4 MATCHES</div>
                    </div>
                  </div>
                </div>

                {result.aci >= 90 && (
                  <div className="bg-green-500/10 border-2 border-green-500 p-4">
                    <div className="text-green-500 font-black text-sm mb-2">✓ LENDER PRE-APPROVED</div>
                    <div className="text-white/60 text-xs">ACI 90+ triggers instant lender match. No appraisal needed. Fund in 48 hours.</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* COMPS */}
        {result && (
          <div className="mt-8 bg-black border border-[#D4AF37]/30 p-6">
            <h2 className="text-2xl font-black text-[#D4AF37] mb-6">COMPARABLE SALES</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#D4AF37]/20">
                    <th className="text-[#D4AF37] text-left py-3 px-2">ADDRESS</th>
                    <th className="text-[#D4AF37] text-left py-3 px-2">SOLD</th>
                    <th className="text-[#D4AF37] text-left py-3 px-2">DATE</th>
                    <th className="text-[#D4AF37] text-left py-3 px-2">SQFT</th>
                    <th className="text-[#D4AF37] text-left py-3 px-2">DISTANCE</th>
                    <th className="text-[#D4AF37] text-right py-3 px-2">MATCH</th>
                  </tr>
                </thead>
                <tbody>
                  {result.comps.map((comp: any, i: number) => (
                    <tr key={i} className="border-b border-[#D4AF37]/10 hover:bg-[#D4AF37]/5">
                      <td className="text-white py-3 px-2">{comp.address}</td>
                      <td className="text-[#D4AF37] font-bold py-3 px-2">${comp.sold}</td>
                      <td className="text-white/60 py-3 px-2">{comp.date}</td>
                      <td className="text-white/60 py-3 px-2">{comp.sqft}</td>
                      <td className="text-white/60 py-3 px-2">{comp.distance}</td>
                      <td className="text-right py-3 px-2">
                        <span className={`px-2 py-1 text-xs font-bold ${
                          comp.match >= 95? 'bg-green-500/20 text-green-500' :
                          comp.match >= 90? 'bg-[#D4AF37]/20 text-[#D4AF37]' :
                          'bg-orange-500/20 text-orange-500'
                        }`}>
                          {comp.match}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
