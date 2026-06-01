'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function Home() {
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const closeModal = () => setActiveModal(null)

  const stateSeats = [
    { state: 'GA', left: 12 }, { state: 'FL', left: 8 }, { state: 'TX', left: 15 },
    { state: 'NC', left: 18 }, { state: 'SC', left: 22 }, { state: 'TN', left: 19 },
    { state: 'CA', left: 7 }, { state: 'NY', left: 9 }, { state: 'IL', left: 11 },
  ]

  const totalSeatsLeft = 193

  const highMotivationDeals = [
    { city: 'FULTON, GA', arv: '340K', ask: '240K', bps: 88, dqi: 91, flags: ['DIVORCE', 'TAX_LIEN'], img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80' },
    { city: 'DADE, FL', arv: '485K', ask: '335K', bps: 85, dqi: 89, flags: ['VACANT', 'CODE'], img: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80' },
    { city: 'HARRIS, TX', arv: '295K', ask: '210K', bps: 82, dqi: 93, flags: ['PROBATE', 'HEIRS'], img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80' },
  ]

  const roles = [
    'LENDERS', 'BUYERS', 'WHOLESALERS', 'CONTRACTORS', 'TITLE', 
    'AGENTS', 'APPRAISERS', 'INSPECTORS', 'PRIVATE MONEY', 'ARCHITECTS'
  ]

  return (
    <main className="bg-[#0A0A0A] min-h-screen font-mono text-white">
      <style jsx global>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
       .animate-scroll { animation: scroll 25s linear infinite; }
      `}</style>

      {/* TICKER */}
      <div className="bg-gradient-to-r from-[#B8941F] via-[#D4AF37] to-[#B8941F] text-black py-2 overflow-hidden">
        <div className="animate-scroll whitespace-nowrap text-xs md:text-sm font-black tracking-wider">
          ◆ 492 ACTIVE DEALS ROUTED TODAY ◆ BPS 80+ = SELLER MUST SELL ◆ {totalSeatsLeft} FOUNDING SEATS LEFT ◆ 3-DAY TRIAL THEN $299/MO ◆ DQI 90+ = INSTITUTIONAL GRADE ◆
        </div>
      </div>

      {/* NAV */}
      <nav className="bg-black border-b border-[#D4AF37]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-[#D4AF37] text-sm font-bold tracking-[0.3em]">VAULTFORGE</div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/login">
              <button className="border border-[#D4AF37] text-[#D4AF37] px-4 py-1.5 font-black tracking-wider text-xs hover:bg-[#D4AF37]/10 transition">
                MEMBER LOGIN
              </button>
            </a>
            <button className="bg-[#D4AF37] text-black px-4 py-1.5 font-black tracking-wider text-xs hover:bg-[#F4CF47] transition">
              REQUEST INVITE
            </button>
          </div>
        </div>
      </nav>

      {/* HERO - LOGO FRONT AND CENTER */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Image 
            src="/IMG_4751.png" 
            alt="VaultForge" 
            width={600} 
            height={600} 
            priority 
            className="mx-auto w-64 md:w-96 h-auto mb-8"
          />
          <div className="text-[#D4AF37] text-xs md:text-sm tracking-[0.6em] mb-8">VETERAN OWNED. PRIVATE DEAL INTELLIGENCE NETWORK.</div>
          
          <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter mb-6">
            PUBLIC<br/>GETS<br/><span className="text-[#DC2626]">LEFTOVERS.</span><br/>YOU<br/>GET<br/><span className="text-[#D4AF37]">OWNERSHIP.</span>
          </h1>
          
          <div className="h-1 w-24 bg-[#D4AF37] mx-auto mb-6"></div>
          
          <p className="text-[#D4AF37]/80 text-sm md:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            BPS 80+ = SELLER MUST SELL. DQI 90+ = INSTITUTIONAL MONEY MOVES IN 8 SECONDS.<br/>
            PUBLIC MLS GETS SCRAPS. MEMBERS OWN THE DATA.
          </p>
          
          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-4 max-w-xl mx-auto mb-8">
            <p className="text-[#D4AF37] font-black text-lg">3-DAY FREE ACCESS</p>
            <p className="text-white/70 text-sm">Full trial. Card required. $750 access fee + $299/mo after Day 3 if you stay.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button className="bg-[#D4AF37] text-black px-8 py-3 font-black tracking-wider text-base hover:bg-[#F4CF47] transition">
              START 3-DAY TRIAL
            </button>
            <a href="/login">
              <button className="border-2 border-[#D4AF37] text-[#D4AF37] px-8 py-3 font-black tracking-wider text-base hover:bg-[#D4AF37]/10 transition w-full md:w-auto">
                MEMBER LOGIN
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* STATE BY STATE FOUNDER COUNT */}
      <section className="py-16 px-4 bg-black border-y border-[#D4AF37]/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-[#D4AF37] text-center mb-12">FOUNDING SEATS BY STATE</h2>
          <div className="grid grid-cols-3 md:grid-cols-9 gap-3">
            {stateSeats.map((s, i) => (
              <div key={i} className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-4 text-center">
                <div className="text-[#D4AF37] font-black text-2xl">{s.left}</div>
                <div className="text-[#D4AF37]/60 text-xs tracking-wider">{s.state}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <div className="text-4xl font-black text-[#D4AF37]">{totalSeatsLeft} TOTAL SEATS LEFT</div>
            <div className="text-[#D4AF37]/60 text-sm mt-2">AFTER 685, WAITLIST ONLY. ACCESS DOUBLES.</div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-2 md:grid-cols-4 border-b border-[#D4AF37]/20">
        {[
          { num: '492', label: 'DEALS IN NETWORK' },
          { num: '193', label: 'HIGH MOTIVATION' },
          { num: '87', label: 'DQI 90+' },
          { num: '685', label: 'FOUNDING SEATS' },
        ].map((stat, i) => (
          <div key={i} className="text-center py-10 border-r border-[#D4AF37]/20 last:border-r-0">
            <div className="text-4xl md:text-5xl font-black text-[#D4AF37]">{stat.num}</div>
            <div className="text-[#D4AF37]/60 text-xs tracking-wider mt-2">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* LIVE INTEL */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[#D4AF37] mb-3">LIVE INTEL // UPDATED 23 SECONDS AGO</h2>
            <p className="text-[#D4AF37]/60 text-sm">City + State only. Member access required for details.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {highMotivationDeals.map((deal, i) => (
              <div key={i} onClick={() => setActiveModal(`deal-${i}`)} className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-5 cursor-pointer hover:border-[#D4AF37] transition">
                <div className="flex justify-between mb-3">
                  <div className="text-[#D4AF37] font-bold">{deal.city}</div>
                  <div className="text-[#D4AF37]/60 text-sm">ARV ${deal.arv}</div>
                </div>
                <div className="flex gap-3 mb-3">
                  <button onClick={(e) => { e.stopPropagation(); setActiveModal('bps'); }} className="bg-[#DC2626] text-white px-2 py-1 text-xs font-bold">BPS {deal.bps}</button>
                  <button onClick={(e) => { e.stopPropagation(); setActiveModal('dqi'); }} className="bg-[#D4AF37] text-black px-2 py-1 text-xs font-bold">DQI {deal.dqi}</button>
                </div>
                <div className="flex gap-1 mb-3 flex-wrap">
                  {deal.flags.map((flag, j) => (
                    <span key={j} className="border border-[#D4AF37]/40 text-[#D4AF37]/80 px-1.5 py-0.5 text-">{flag}</span>
                  ))}
                </div>
                <div className="h-24 bg-gray-900 overflow-hidden border border-[#2A2A2A]">
                  <img src={deal.img} alt="" className="w-full h-full object-cover blur-sm opacity-50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES - ALL $750 ACCESS / $299 MO */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-[#D4AF37] text-center mb-4">685 SEATS. 10 ROLES.</h2>
          <p className="text-[#D4AF37]/80 text-center mb-12 text-sm">$750 ACCESS FEE + $299/MONTH FOR ALL FOUNDING MEMBERS</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {roles.map((role, i) => (
              <div key={i} onClick={() => setActiveModal(`role-${i}`)} className="bg-black border border-[#D4AF37]/30 p-6 cursor-pointer hover:border-[#D4AF37] transition text-center">
                <div className="text-[#D4AF37] font-black text-base mb-2">{role}</div>
                <div className="text-[#DC2626] text-2xl font-black mb-1">{Math.floor(Math.random() * 20) + 5}</div>
                <div className="text-[#D4AF37]/60 text-xs">SEATS LEFT</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMING SOON */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-[#D4AF37] text-center mb-4">LOCKED IN.</h2>
          <h2 className="text-3xl md:text-4xl font-black text-[#D4AF37] text-center mb-12">DEPLOYING TO MEMBERS FIRST.</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'ARV CONFIDENCE INDEX', desc: 'ACI 90+ = Lender pre-approved. Live now for members.' },
              { name: 'LENDER SMS ALERTS', desc: 'DQI 90+ hits. SMS fires in 8 sec. First reply wins. Live now.' },
              { name: 'VAULT SCORE', desc: 'Borrower reputation 0-1000. Updates per deal. Live now.' },
              { name: 'DEAL ROOMS', desc: 'Private room per deal. Docs, chat, e-sign. 48hr clock. Live now.' },
            ].map((item, i) => (
              <div key={i} className="bg-[#0A0A] border border-[#D4AF37]/30 p-6">
                <h3 className="text-[#D4AF37] font-black text-base mb-3">{item.name}</h3>
                <p className="text-white/60 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black border-t border-[#D4AF37]/20 py-10 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Image src="/IMG_4751.png" alt="VaultForge" width={120} height={40} className="mx-auto mb-4 opacity-50" />
          <div className="text-[#D4AF37]/40 text-xs tracking-wider">© 2026 VAULTFORGE // VETERAN OWNED // MEMBERS ONLY // NDA PROTECTED</div>
        </div>
      </footer>

      {/* MODALS */}
      {activeModal && (
        <div onClick={closeModal} className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div onClick={(e) => e.stopPropagation()} className="bg-[#0A0A0A] border-2 border-[#D4AF37] p-6 md:p-8 max-w-2xl w-full my-8">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl md:text-2xl font-black text-[#D4AF37]">
                {activeModal === 'bps' && 'BANKRUPTCY PROBABILITY SCORE'}
                {activeModal === 'dqi' && 'DEAL QUALITY INDEX'}
                {activeModal?.startsWith('deal-') && 'DEAL INTEL'}
                {activeModal?.startsWith('role-') && `${roles[parseInt(activeModal.split('-')[1])]} - FOUNDING SEAT`}
              </h3>
              <button onClick={closeModal} className="text-[#D4AF37] text-3xl hover:text-[#F4CF47]">×</button>
            </div>
            <div className="text-white/80 space-y-4 text-sm md:text-base leading-relaxed">
              {activeModal === 'bps' && <p>BPS measures seller distress 0-100. Court filings, tax liens, code violations. BPS 80+ = Seller MUST sell in 90 days or lose asset. This is not MLS. This is pre-market.</p>}
              {activeModal === 'dqi' && <p>DQI measures fundability 0-100. ARV accuracy, rehab scope, lien stack, market. DQI 90+ = Institutional money moves in 8 seconds via SMS. No appraisal delays.</p>}
              {activeModal?.startsWith('deal-') && <div><p className="text-[#D4AF37] mb-4 font-bold">CITY, STATE ONLY. FULL ADDRESS FOR MEMBERS.</p><p>High BPS + High DQI = Priority routing. Click START 3-DAY TRIAL to see comps, rehab scope, title report.</p></div>}
              {activeModal?.startsWith('role-') && (
                <div>
                  <p className="text-[#DC2626] font-bold text-xl mb-2">FOUNDING SEATS LIMITED</p>
                  <p className="text-[#D4AF37] mb-4 text-lg">Access: $750 | Monthly: $299</p>
                  <div className="border-t border-[#D4AF37]/20 pt-4">
                    <p className="text-[#D4AF37] font-bold mb-3">3-DAY FREE TRIAL INCLUDED</p>
                    <p className="text-white/60 text-sm">Card required. $750 access + $299/mo auto-charges Day 4 if you stay. Cancel anytime before Day 3 = $0.</p>
                  </div>
                </div>
              )}
            </div>
            <a href="/login">
              <button onClick={closeModal} className="mt-8 bg-[#D4AF37] text-black px-8 py-3 font-black tracking-wider w-full hover:bg-[#F4CF47] transition">
                START 3-DAY TRIAL
              </button>
            </a>
          </div>
        </div>
      )}
    </main>
  )
}
