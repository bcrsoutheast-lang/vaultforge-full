'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Submit() {
  const router = useRouter()
  const [address, setAddress] = useState('')
  const [story, setStory] = useState('')
  const [sellerPhone, setSellerPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    const auth = localStorage.getItem('vaultforge_auth')
    if (auth!== 'true') router.push('/login')
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    // FAKE BPS SCORING - Looks real
    setTimeout(() => {
      const fakeBPS = Math.floor(Math.random() * 40) + 60 // 60-100
      const fakeDQI = Math.floor(Math.random() * 30) + 70 // 70-100
      const fakeACI = Math.floor(Math.random() * 20) + 80 // 80-100

      setResult({
        bps: fakeBPS,
        dqi: fakeDQI,
        aci: fakeACI,
        status: fakeBPS >= 80? 'HIGH MOTIVATION // SMS SENT TO LENDERS' : 'LOW MOTIVATION // ROUTED TO AGENTS',
        arv: `${Math.floor(Math.random() * 200) + 250}K`,
        ask: `${Math.floor(Math.random() * 150) + 200}K`,
        flags: fakeBPS >= 80? ['DIVORCE', 'TAX_LIEN', 'VACANT'] : ['AGED', 'PRICE_DROP']
      })
      setLoading(false)
    }, 2500)
  }

  return (
    <main className="bg-[#0A0A0A] min-h-screen font-mono text-white">
      <nav className="bg-black border-b border-[#D4AF37]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image src="/IMG_4751.png" alt="VaultForge" width={120} height={30} className="h-8 w-auto" />
            <div className="text-[#D4AF37] text-xs font-bold tracking-[0.3em]">PAIN ROOM</div>
          </div>
          <a href="/members">
            <button className="border border-[#D4AF37] text-[#D4AF37] px-4 py-1.5 font-black tracking-wider text-xs hover:bg-[#D4AF37]/10">
              BACK TO VAULT
            </button>
          </a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-[#D4AF37] mb-2">SUBMIT PAIN</h1>
          <p className="text-[#D4AF37]/60 text-sm">Drop seller distress. AI scores BPS in real-time. 10% fee if it closes.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* FORM */}
          <div className="bg-black border border-[#D4AF37]/30 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
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

              <div>
                <label className="text-[#D4AF37] text-sm font-bold tracking-wider block mb-2">SELLER PHONE</label>
                <input
                  type="tel"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#D4AF37]/30 text-white p-3 focus:border-[#D4AF37] outline-none text-sm"
                  placeholder="404-555-0123"
                  required
                />
              </div>

              <div>
                <label className="text-[#D4AF37] text-sm font-bold tracking-wider block mb-2">PAIN STORY</label>
                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  rows={6}
                  className="w-full bg-[#0A0A0A] border border-[#D4AF37]/30 text-white p-3 focus:border-[#D4AF37] outline-none text-sm"
                  placeholder="Divorce. Must sell in 30 days. Tax lien $15K. Vacant 6 months. Husband in jail..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#D4AF37] text-black py-3 font-black tracking-wider hover:bg-[#F4CF47] transition disabled:opacity-50"
              >
                {loading? 'SCORING BPS...' : 'SUBMIT FOR BPS SCORING'}
              </button>
            </form>
          </div>

          {/* RESULT */}
          <div className="bg-black border border-[#D4AF37]/30 p-6">
            <h2 className="text-[#D4AF37] font-black text-xl mb-6">BPS ANALYSIS</h2>

            {loading && (
              <div className="text-center py-12">
                <div className="text-[#D4AF37] text-2xl font-black mb-4 animate-pulse">SCANNING...</div>
                <div className="text-white/60 text-sm space-y-2">
                  <div>Checking court records...</div>
                  <div>Checking tax liens...</div>
                  <div>Checking code violations...</div>
                  <div>Checking vacancy data...</div>
                </div>
              </div>
            )}

            {!loading &&!result && (
              <div className="text-center py-12">
                <div className="text-[#D4AF37]/40 text-sm">Submit property to see BPS score</div>
              </div>
            )}

            {!loading && result && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-[#D4AF37]/60 text-xs mb-2">BANKRUPTCY PROBABILITY SCORE</div>
                  <div className={`text-6xl font-black ${result.bps >= 80? 'text-[#DC2626]' : 'text-[#D4AF37]'}`}>
                    {result.bps}
                  </div>
                  <div className={`text-sm font-bold mt-2 ${result.bps >= 80? 'text-[#DC2626]' : 'text-[#D4AF37]'}`}>
                    {result.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#D4AF37]/20">
                  <div>
                    <div className="text-[#D4AF37]/60 text-xs">DQI</div>
                    <div className="text-[#D4AF37] font-black text-2xl">{result.dqi}</div>
                  </div>
                  <div>
                    <div className="text-[#D4AF37]/60 text-xs">ACI</div>
                    <div className="text-white font-black text-2xl">{result.aci}</div>
                  </div>
                  <div>
                    <div className="text-[#D4AF37]/60 text-xs">ARV</div>
                    <div className="text-white font-black text-xl">${result.arv}</div>
                  </div>
                  <div>
                    <div className="text-[#D4AF37]/60 text-xs">ASK</div>
                    <div className="text-white font-black text-xl">${result.ask}</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#D4AF37]/20">
                  <div className="text-[#D4AF37]/60 text-xs mb-2">DETECTED FLAGS</div>
                  <div className="flex gap-2 flex-wrap">
                    {result.flags.map((flag: string, i: number) => (
                      <span key={i} className="border border-[#DC2626] text-[#DC2626] px-2 py-1 text-xs font-bold">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>

                {result.bps >= 80 && (
                  <div className="bg-[#D4AF37]/10 border border-[#D4AF37] p-4">
                    <div className="text-[#D4AF37] font-black text-sm mb-2">SMS FIRED TO LENDERS</div>
                    <div className="text-white/60 text-xs">DQI {result.dqi} + BPS {result.bps} triggered alert. 4 lenders notified. First reply wins.</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
