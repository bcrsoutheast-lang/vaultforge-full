'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function Home() {
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const closeModal = () => setActiveModal(null)

  const highMotivationDeals = [
    { city: 'FULTON, GA', arv: '340K', ask: '240K', bps: 88, dqi: 91, flags: ['DIVORCE', 'TAX_LIEN', 'VACANT'], img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80' },
    { city: 'DADE, FL', arv: '485K', ask: '335K', bps: 85, dqi: 89, flags: ['VACANT', 'CODE', 'HEIRS'], img: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80' },
    { city: 'HARRIS, TX', arv: '295K', ask: '210K', bps: 82, dqi: 93, flags: ['PROBATE', 'ESTATE', 'CLOUD'], img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80' },
  ]

  const standardDeals = [
    { city: 'COOK, IL', arv: '410K', ask: '365K', bps: 64, dqi: 78, flags: ['AGED_LISTING'], img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80' },
    { city: 'MARICOPA, AZ', arv: '375K', ask: '320K', bps: 58, dqi: 81, flags: ['PRICE_DROP'], img: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80' },
    { city: 'CLARK, NV', arv: '525K', ask: '475K', bps: 61, dqi: 75, flags: ['DOM_120'], img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80' },
  ]

  const roles = [
    { name: 'LENDERS', seats: 8, access: '$1,500', monthly: '$299', perks: ['DQI 90+ SMS in 8 sec', 'Vault Score pre-screen', 'Deal Room auto-join', 'Lien stack decoder'] },
    { name: 'BUYERS', seats: 33, access: '$750', monthly: '$199', perks: ['BPS 80+ first look', 'Off-market alerts', 'Title cloud decoder', 'Rehab scope sheets'] },
    { name: 'WHOLESALERS', seats: 27, access: '$500', monthly: '$99', perks: ['Submit to Pain Room', 'BPS scoring', 'Buyer matching', 'JV split calculator'] },
    { name: 'CONTRACTORS', seats: 16, access: '$1,000', monthly: '$249', perks: ['Rehab bids on DQI 80+', 'Scope sheets', 'Pay when funded', 'Material discounts'] },
    { name: 'TITLE', seats: 14, access: '$2,500', monthly: '$499', perks: ['Exclusive closings', 'Lien stack decoder', 'Cloud pre-screen', 'E-closing priority'] },
    { name: 'AGENTS', seats: 27, access: '$500', monthly: '$149', perks: ['Pocket listings', 'Commission on flips', 'MLS bypass', 'Seller leads'] },
    { name: 'APPRAISERS', seats: 22, access: '$1,000', monthly: '$199', perks: ['ACI data access', 'Comp disputes', 'Rush fees', 'Desktop priority'] },
    { name: 'INSPECTORS', seats: 28, access: '$500', monthly: '$149', perks: ['First inspect', 'Photo feeds', 'Report builder', 'Thermal scans'] },
    { name: 'PRIVATE MONEY', seats: 9, access: '$2,000', monthly: '$399', perks: ['Pooled deals', 'DQI 90+ only', 'Double digit returns', 'First lien position'] },
    { name: 'ARCHITECTS', seats: 9, access: '$1,500', monthly: '$299', perks: ['Plans for DQI 85+', 'Zoning hacks', 'Value-add designs', 'Permit expediting'] },
  ]

  const comingSoon = [
    { name: 'ARV CONFIDENCE INDEX', desc: 'ACI scores every deal 0-100. ACI 90+ = Lender pre-approved. ACI 70-89 = Needs review. ACI <70 = Hard money only.' },
    { name: 'LENDER ALERTS SMS', desc: 'DQI 90+ hits. SMS fires in 8 seconds. "685 MAIN ST. DQI 92. ARV 340K. ASK 240K. REPLY YES TO FUND." First reply wins.' },
    { name: 'VAULT SCORE', desc: 'Borrower reputation 0-1000. 800+ = Green light. 600-799 = Review. <600 = Hard money. Calculated from 17 data points.' },
    { name: 'DEAL ROOMS', desc: 'Private room per deal. Lender + Buyer + GC + Title. Docs, chat, e-sign. 48hr shot clock. Public never sees it.' },
  ]

  const memberLoop = [
    { title: 'MEMBERS CREATE SIGNALS', desc: 'Every click, search, offer, pass trains the BPS model. Your behavior teaches it what wins.' },
    { title: 'MEMBERS CREATE ALERTS', desc: 'Set DQI 90+ in Fulton County. When it hits, you get SMS in 8 seconds. First to fund wins.' },
    { title: 'MEMBERS CREATE PROFILES', desc: 'Your buy box trains matching. SFR under 400K, DQI 85+, Fulton. Deals route to you first.' },
    { title: 'MEMBERS CREATE PAIN', desc: 'Submit leads to Pain Room. We BPS score it. If it closes, you get 10% of wholesale fee.' },
  ]

  return (
    <main className="bg-[#0A0A0A] min-h-screen font-mono text-white">
      <style jsx global>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
       .animate-scroll { animation: scroll 25s linear infinite; }
      `}</style>

      {/* TICKER */}
      <div className="bg-gradient-to-r from-[#B8941F] via-[#D4AF37] to-[#B8941F] text-black py-2 overflow-hidden">
        <div className="animate-scroll whitespace-nowrap text-sm font-black tracking-wider">
          ◆ 492 ACTIVE DEALS ROUTED TODAY ◆ BPS 80+ = SELLER MUST SELL ◆ 193 FOUNDING SEATS LEFT ◆ DQI 90+ = INSTITUTIONAL GRADE ◆ 8.2 SEC AVG LENDER RESPONSE ◆ 67 DEALS CLOSED THIS WEEK ◆
        </div>
      </div>

      {/* NAV */}
      <nav className="bg-black border-b border-[#D4AF37]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="VaultForge" width={180} height={50} priority className="h-12 w-auto" />
            <div className="hidden md:block border-l border-[#D4AF37]/30 pl-4">
              <div className="text-[#D4AF37] text-sm font-bold tracking-[0.3em]">VAULTFORGE</div>
              <div className="text-[#D4AF37]/60 text-xs tracking-[0.4em]">PRIVATE INTELLIGENCE</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[#D4AF37]/80 text-sm font-bold hidden md:block">FOUNDERS</span>
            <button className="bg-[#D4AF37] text-black px-6 py-2 font-black tracking-wider hover:bg-[#F4CF47] transition text-sm">
              REQUEST INVITE
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-[#D4AF37] text-sm tracking-[0.6em] mb-8">VETERAN OWNED. PRIVATE DEAL INTELLIGENCE NETWORK.</div>
          <h1 className="text-7xl md:text-[10rem] font-black leading-none tracking-tighter mb-8">
            PUBLIC<br/>GETS<br/><span className="text-[#DC2626]">LEFTOVERS.</span><br/>YOU<br/>GET<br/><span className="text-[#D4AF37]">OWNERSHIP.</span>
          </h1>
          <div className="h-1 w-32 bg-[#D4AF37] mx-auto mb-8"></div>
          <p className="text-[#D4AF37]/80 text-lg max-w-3xl mx-auto mb-12 leading-relaxed">
            BPS 80+ = SELLER MUST SELL. DQI 90+ = INSTITUTIONAL MONEY MOVES IN 8 SECONDS.<br/>
            PUBLIC MLS GETS SCRAPS. MEMBERS OWN THE DATA.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button className="bg-[#D4AF37] text-black px-12 py-4 font-black tracking-wider text-lg hover:bg-[#F4CF47] transition">
              CLAIM FOUNDING SEAT
            </button>
            <button className="border-2 border-[#D4AF37] text-[#D4AF37] px-12 py-4 font-black tracking-wider text-lg hover:bg-[#D4AF37]/10 transition">
              MEMBER LOGIN
            </button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-2 md:grid-cols-4 border-y border-[#D4AF37]/20">
        {[
          { num: '492', label: 'DEALS IN NETWORK' },
          { num: '193', label: 'HIGH MOTIVATION' },
          { num: '87', label: 'DQI 90+' },
          { num: '685', label: 'FOUNDING SEATS' },
        ].map((stat, i) => (
          <div key={i} className="text-center py-12 border-r border-[#D4AF37]/20 last:border-r-0">
            <div className="text-6xl font-black text-[#D4AF37]">{stat.num}</div>
            <div className="text-[#D4AF37]/60 text-sm tracking-wider mt-2">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* LIVE INTEL */}
      <section className="py-24 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-[#D4AF37] mb-4">LIVE INTEL // UPDATED 23 SECONDS AGO</h2>
            <p className="text-[#D4AF37]/60">No addresses shown. City + State only. Member access required for details.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-black text-[#D4AF37] mb-6 border-b border-[#D4AF37]/20 pb-2">HIGH MOTIVATION // BPS 50+</h3>
              <div className="space-y-4">
                {highMotivationDeals.map((deal, i) => (
                  <div key={i} onClick={() => setActiveModal(`deal-hm-${i}`)} className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-6 cursor-pointer hover:border-[#D4AF37] hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition">
                    <div className="flex justify-between mb-4">
                      <div className="text-[#D4AF37] font-bold text-lg">{deal.city}</div>
                      <div className="text-[#D4AF37]/60">ARV ${deal.arv} / ASK ${deal.ask}</div>
                    </div>
                    <div className="flex gap-4 mb-4">
                      <button onClick={(e) => { e.stopPropagation(); setActiveModal('bps'); }} className="bg-[#DC2626] text-white px-3 py-1 text-sm font-bold hover:bg-[#B91C1C]">BPS {deal.bps}</button>
                      <button onClick={(e) => { e.stopPropagation(); setActiveModal('dqi'); }} className="bg-[#D4AF37] text-black px-3 py-1 text-sm font-bold hover:bg-[#F4CF47]">DQI {deal.dqi}</button>
                    </div>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {deal.flags.map((flag, j) => (
                        <span key={j} className="border border-[#D4AF37]/40 text-[#D4AF37]/80 px-2 py-1 text-xs">{flag}</span>
                      ))}
                    </div>
                    <div className="h-32 bg-gray-900 overflow-hidden border border-[#2A2A2A]">
                      <img src={deal.img} alt="" className="w-full h-full object-cover blur-sm opacity-50" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#D4AF37]/60 mb-6 border-b border-[#D4AF37]/20 pb-2">STANDARD // DQI GRADED</h3>
              <div className="space-y-4">
                {standardDeals.map((deal, i) => (
                  <div key={i} onClick={() => setActiveModal(`deal-std-${i}`)} className="bg-[#0A0A0A] border border-[#D4AF37]/20 p-6 cursor-pointer hover:border-[#D4AF37]/40 transition">
                    <div className="flex justify-between mb-4">
                      <div className="text-[#D4AF37]/80 font-bold text-lg">{deal.city}</div>
                      <div className="text-[#D4AF37]/40">ARV ${deal.arv} / ASK ${deal.ask}</div>
                    </div>
                    <div className="flex gap-4 mb-4">
                      <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 text-sm font-bold">BPS {deal.bps}</span>
                      <span className="bg-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 text-sm font-bold">DQI {deal.dqi}</span>
                    </div>
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {deal.flags.map((flag, j) => (
                        <span key={j} className="border border-[#D4AF37]/20 text-[#D4AF37]/60 px-2 py-1 text-xs">{flag}</span>
                      ))}
                    </div>
                    <div className="h-32 bg-gray-900 overflow-hidden border border-[#2A2A2A]">
                      <img src={deal.img} alt="" className="w-full h-full object-cover blur-sm opacity-30" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TWO ROOMS */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-black text-[#D4AF37] text-center mb-16">TWO ROOMS. ZERO LEAKS.</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div onClick={() => setActiveModal('pain')} className="bg-black border border-[#D4AF37]/30 p-12 cursor-pointer hover:border-[#D4AF37] hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] transition">
              <h3 className="text-3xl font-black text-[#D4AF37] mb-4">PAIN ROOM</h3>
              <p className="text-[#D4AF37]/60 mb-4 text-sm tracking-wider">WHERE DEALS ARE BORN</p>
              <p className="text-white/80 leading-relaxed">Court filings hit. Tax liens record. Code violations stack. BPS scores distress 0-100. BPS 80+ = Seller MUST sell. Address hidden. Public never sees this. Members route it.</p>
            </div>
            <div onClick={() => setActiveModal('deal')} className="bg-black border border-[#D4AF37]/30 p-12 cursor-pointer hover:border-[#D4AF37] hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] transition">
              <h3 className="text-3xl font-black text-[#D4AF37] mb-4">DEAL ROOM</h3>
              <p className="text-[#D4AF37]/60 mb-4 text-sm tracking-wider">WHERE DEALS CLOSE</p>
              <p className="text-white/80 leading-relaxed">High BPS + High DQI triggers SMS to matched lender, buyer, GC, title. Private room opens. Docs, chat, e-sign. 48hr shot clock. No brokers. First money wins.</p>
            </div>
          </div>
        </div>
      </section>

      {/* MEMBER LOOP */}
      <section className="py-24 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-black text-[#D4AF37] text-center mb-4">YOU DON'T USE VAULTFORGE.</h2>
          <h2 className="text-5xl font-black text-[#D4AF37] text-center mb-16">YOU TRAIN IT.</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {memberLoop.map((item, i) => (
              <div key={i} onClick={() => setActiveModal(`loop-${i}`)} className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-8 cursor-pointer hover:border-[#D4AF37] transition">
                <h3 className="text-[#D4AF37] font-black text-lg mb-4">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-black text-[#D4AF37] text-center mb-16">685 SEATS. 10 ROLES. ONE PRIVATE NETWORK.</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {roles.map((role, i) => (
              <div key={i} onClick={() => setActiveModal(`role-${i}`)} className="bg-black border border-[#D4AF37]/30 p-6 cursor-pointer hover:border-[#D4AF37] hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition text-center">
                <div className="text-[#D4AF37] font-black text-lg mb-2">{role.name}</div>
                <div className="text-[#DC2626] text-3xl font-black mb-2">{role.seats}</div>
                <div className="text-[#D4AF37]/60 text-xs">SEATS LEFT</div>
                <div className="text-[#D4AF37]/40 text-xs mt-2">{role.access}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <div className="text-4xl font-black text-[#D4AF37]">193 TOTAL SEATS LEFT</div>
            <div className="text-[#D4AF37]/60 mt-2">AFTER 685, WAITLIST ONLY. ACCESS DOUBLES.</div>
          </div>
        </div>
      </section>

      {/* COMING SOON */}
      <section className="py-24 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-black text-[#D4AF37] text-center mb-4">LOCKED IN.</h2>
          <h2 className="text-5xl font-black text-[#D4AF37] text-center mb-16">DEPLOYING TO MEMBERS FIRST.</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {comingSoon.map((item, i) => (
              <div key={i} onClick={() => setActiveModal(`soon-${i}`)} className="bg-[#0A0A0A] border border-[#D4AF37]/30 p-8 cursor-pointer hover:border-[#D4AF37] transition">
                <h3 className="text-[#D4AF37] font-black text-lg mb-4">{item.name}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-6xl font-black text-[#D4AF37] mb-8 leading-tight">THE PUBLIC FIGHTS FOR LISTINGS.<br/>MEMBERS OWN THE INVENTORY.</h2>
          <p className="text-[#D4AF37]/80 text-xl mb-12">One HIGH_MOTIVATION deal pays for 10 years of access.</p>
          <button className="bg-[#D4AF37] text-black px-16 py-6 font-black tracking-wider text-xl hover:bg-[#F4CF47] transition">
            REQUEST PRIVATE INVITE
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black border-t border-[#D4AF37]/20 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Image src="/logo.png" alt="VaultForge" width={120} height={40} className="mx-auto mb-4 opacity-50" />
          <div className="text-[#D4AF37]/40 text-sm tracking-wider">© 2026 VAULTFORGE // VETERAN OWNED // MEMBERS ONLY // NDA PROTECTED</div>
        </div>
      </footer>

      {/* MODALS */}
      {activeModal && (
        <div onClick={closeModal} className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div onClick={(e) => e.stopPropagation()} className="bg-[#0A0A0A] border-2 border-[#D4AF37] p-8 max-w-2xl w-full my-8">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-black text-[#D4AF37]">
                {activeModal === 'bps' && 'BANKRUPTCY PROBABILITY SCORE'}
                {activeModal === 'dqi' && 'DEAL QUALITY INDEX'}
                {activeModal === 'pain' && 'PAIN ROOM'}
                {activeModal === 'deal' && 'DEAL ROOM'}
                {activeModal === 'vs' && 'VAULT SCORE'}
                {activeModal === 'aci' && 'ARV CONFIDENCE INDEX'}
                {activeModal?.startsWith('deal-hm-') && 'HIGH MOTIVATION DEAL'}
                {activeModal?.startsWith('deal-std-') && 'STANDARD DEAL'}
                {activeModal?.startsWith('role-') && roles[parseInt(activeModal.split('-')[1])].name}
                {activeModal?.startsWith('soon-') && comingSoon[parseInt(activeModal.split('-')[1])].name}
                {activeModal?.startsWith('loop-') && memberLoop[parseInt(activeModal.split('-')[1])].title}
              </h3>
              <button onClick={closeModal} className="text-[#D4AF37] text-3xl hover:text-[#F4CF47]">×</button>
            </div>
            <div className="text-white/80 space-y-4 leading-relaxed">
              {activeModal === 'bps' && <div><p className="mb-4">BPS measures seller distress 0-100 using 47 data points:</p><ul className="space-y-2 text-[#D4AF37]/80"><li>◆ Court filings: Divorce, Bankruptcy, Foreclosure</li><li>◆ Tax liens: IRS, State, County</li><li>◆ Code violations: Vacant, Condemned</li><li>◆ Probate: Estate, Heirs, Clouded title</li></ul><p className="mt-4 text-[#DC2626] font-bold">BPS 80+ = Seller MUST sell in 90 days or lose asset.</p></div>}
              {activeModal === 'dqi' && <div><p className="mb-4">DQI measures fundability 0-100 using 31 data points:</p><ul className="space-y-2 text-[#D4AF37]/80"><li>◆ ARV accuracy: Comps within 5%</li><li>◆ Rehab scope: Line-item verified</li><li>◆ Lien stack: Clear or solvable</li><li>◆ Market: Days on market, absorption</li></ul><p className="mt-4 text-[#D4AF37] font-bold">DQI 90+ = Institutional money moves in 8 seconds.</p></div>}
              {activeModal === 'pain' && <p>Court filings, tax liens, code violations hit our crawlers in real-time. BPS scores distress. BPS 80+ routes to Deal Room. Address hidden from public. Only city/state visible. Members get first look before MLS. Public never sees this pipeline.</p>}
              {activeModal === 'deal' && <p>High BPS + High DQI triggers instant SMS to matched lender, buyer, GC, title. Private encrypted room opens. All docs, chat, e-sign in one place. 48hr shot clock starts. No brokers. No bidding wars. First money to fund wins. Public never sees these deals.</p>}
              {activeModal === 'vs' && <p>Vault Score is borrower reputation 0-1000. Calculated from 17 data points: Payment history, deal performance, defaults, communication score. 800+ = Green light auto-fund. 600-799 = Manual review. Below 600 = Hard money only. Updates in real-time per deal.</p>}
              {activeModal === 'aci' && <p>ACI scores ARV confidence 0-100. ACI 90+ = Comps within 5%, lender pre-approved. ACI 70-89 = Needs desk review. ACI below 70 = Hard money or pass. Eliminates appraisal surprises. Built from 12M comp database.</p>}
              {activeModal?.startsWith('deal-') && <div><p className="text-[#D4AF37] mb-4 font-bold">CITY, STATE ONLY. FULL ADDRESS FOR MEMBERS.</p><p>BPS measures seller distress. DQI measures fundability. High scores = priority routing to matched members. Click REQUEST INVITE to see full details, comps, rehab scope, lien report.</p></div>}
              {activeModal?.startsWith('role-') && (
                <div>
                  <p className="text-[#DC2626] font-bold text-xl mb-2">{roles[parseInt(activeModal.split('-')[1])].seats} SEATS LEFT</p>
                  <p className="text-[#D4AF37] mb-4 text-lg">Access: {roles[parseInt(activeModal.split('-')[1])].access} | Monthly: {roles[parseInt(activeModal.split('-')[1])].monthly}</p>
                  <div className="border-t border-[#D4AF37]/20 pt-4">
                    <p className="text-[#D4AF37] font-bold mb-3">INCLUDED TOOLS:</p>
                    <ul className="space-y-2">
                      {roles[parseInt(activeModal.split('-')[1])].perks.map((perk, i) => (
                        <li key={i} className="flex items-start"><span className="text-[#D4AF37] mr-2">◆</span>{perk}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {activeModal?.startsWith('soon-') && <p>{comingSoon[parseInt(activeModal.split('-')[1])].desc}</p>}
              {activeModal?.startsWith('loop-') && <p>{memberLoop[parseInt(activeModal.split('-')[1])].desc}</p>}
            </div>
            <button onClick={closeModal} className="mt-8 bg-[#D4AF37] text-black px-8 py-4 font-black tracking-wider w-full hover:bg-[#F4CF47] transition text-lg">
              REQUEST PRIVATE INVITE
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
