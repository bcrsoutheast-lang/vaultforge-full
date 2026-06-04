'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function HomePage() {
  const [timeLeft, setTimeLeft] = useState({days: 27, hours: 5, mins: 36, secs: 50})
  const [selectedState, setSelectedState] = useState('GA')

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.secs > 0) return {...prev, secs: prev.secs - 1}
        if (prev.mins > 0) return {...prev, mins: prev.mins - 1, secs: 59}
        if (prev.hours > 0) return {...prev, hours: prev.hours - 1, mins: 59, secs: 59}
        if (prev.days > 0) return {...prev, days: prev.days - 1, hours: 23, mins: 59, secs: 59}
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const seatData: Record<string, any> = {
    GA: {wholesalers: '18/20 - 2 LEFT', buyers: '30/30 - WAITLIST', lenders: '7/10 - 3 LEFT', realtors: '12/15 - 3 LEFT', contractors: '8/10 - 2 LEFT', title: '4/5 - 1 LEFT'},
    FL: {wholesalers: '20/20 - WAITLIST', buyers: '30/30 - WAITLIST', lenders: '10/10 - WAITLIST', realtors: '15/15 - WAITLIST', contractors: '10/10 - WAITLIST', title: '5/5 - WAITLIST'},
    TX: {wholesalers: '16/20 - 4 LEFT', buyers: '28/30 - 2 LEFT', lenders: '6/10 - 4 LEFT', realtors: '11/15 - 4 LEFT', contractors: '7/10 - 3 LEFT', title: '3/5 - 2 LEFT'},
    NC: {wholesalers: '14/20 - 6 LEFT', buyers: '25/30 - 5 LEFT', lenders: '5/10 - 5 LEFT', realtors: '9/15 - 6 LEFT', contractors: '6/10 - 4 LEFT', title: '2/5 - 3 LEFT'},
    SC: {wholesalers: '11/20 - 9 LEFT', buyers: '22/30 - 8 LEFT', lenders: '4/10 - 6 LEFT', realtors: '7/15 - 8 LEFT', contractors: '5/10 - 5 LEFT', title: '2/5 - 3 LEFT'},
    TN: {wholesalers: '9/20 - 11 LEFT', buyers: '19/30 - 11 LEFT', lenders: '3/10 - 7 LEFT', realtors: '6/15 - 9 LEFT', contractors: '4/10 - 6 LEFT', title: '1/5 - 4 LEFT'},
    AL: {wholesalers: '7/20 - 13 LEFT', buyers: '16/30 - 14 LEFT', lenders: '2/10 - 8 LEFT', realtors: '5/15 - 10 LEFT', contractors: '3/10 - 7 LEFT', title: '1/5 - 4 LEFT'},
  }

  return (
    <main className="bg-[#0D0D0D] text-white min-h-screen">
      {/* TICKER */}
      <div className="bg-black border-b border-[#D4AF37] py-2 overflow-hidden whitespace-nowrap">
        <div className="animate-[scroll_30s_linear_infinite] inline-block text-[#D4AF37] text-xs font-semibold px-4">
          VAULTFORGE LIVE: Atlanta SFH Closed $22K Spread • 173 Founder Seats Left • GA Wholesalers: 2 LEFT • Day 91 = $499/mo Auto-Renews • Tampa Duplex Funded in 2HR • TX Lenders: 4 LEFT • FL Cash Buyers: WAITLIST • Join Before June 30 • 
        </div>
      </div>

      {/* NAV */}
      <nav className="flex justify-between items-center px-[5%] py-4 border-b border-[#222] bg-[#0D0D0D]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Image src="/IMG_4751.png" alt="VaultForge" width={50} height={50} priority />
          <div className="text-[#D4AF37] font-bold text-lg tracking-wider">VAULTFORGE OS</div>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="px-5 py-2.5 border border-[#444] rounded-md font-semibold hover:border-[#D4AF37] hover:text-[#D4AF37] transition">Members Login</Link>
          <Link href="/admin" className="px-5 py-2.5 border border-[#444] rounded-md font-semibold hover:border-[#D4AF37] hover:text-[#D4AF37] transition">Admin Portal</Link>
          <Link href="#claim" className="px-5 py-2.5 bg-[#D4AF37] text-[#0D0D0D] rounded-md font-semibold hover:bg-[#F4C430] hover:-translate-y-0.5 transition">Claim Seat</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center px-[5%] py-20 bg-[radial-gradient(circle_at_50%_0%,#1a1a1a_0%,#0D0D0D_60%)]">
        <Image src="/IMG_4751.png" alt="VaultForge" width={240} height={240} className="mx-auto mb-8 drop-shadow-[0_0_40px_rgba(212,175,55,0.3)]" priority />
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">90-DAY BUILDER ACCESS</h1>
        <div className="text-6xl md:text-8xl text-[#D4AF37] font-black my-5">$299</div>
        <p className="text-[#999] text-lg max-w-2xl mx-auto mb-6 leading-relaxed">
          Lock $499/mo forever after 90 days. Control your market before Standard pricing jumps to $1,500 setup + $999/mo on July 1.
        </p>
        <p className="text-[#D4AF37] font-bold mt-5">FORTIFY YOUR PORTFOLIO</p>
        <p className="text-[#666] text-sm">VETERAN PRIDE. DISCIPLINE. STRATEGY. RESULTS.</p>
        
        <div className="flex justify-center gap-5 my-10">
          {Object.entries(timeLeft).map(([label, val]) => (
            <div key={label} className="bg-[#1a1a1a] border border-[#333] p-5 rounded-lg min-w-[80px]">
              <div className="text-4xl font-black text-[#D4AF37]">{val.toString().padStart(2, '0')}</div>
              <div className="text-xs text-[#666] uppercase mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 justify-center mt-10">
          <Link href="#claim" className="px-10 py-4 bg-[#D4AF37] text-[#0D0D0D] rounded-md font-semibold text-lg hover:bg-[#F4C430] hover:-translate-y-0.5 transition">CLAIM FOUNDER SEAT</Link>
          <Link href="/login" className="px-10 py-4 border border-[#444] rounded-md font-semibold text-lg hover:border-[#D4AF37] hover:text-[#D4AF37] transition">MEMBER LOGIN</Link>
        </div>
      </section>

      {/* DEAL TICKER */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5 mx-[5%] my-10 overflow-hidden">
        <div className="flex gap-5 animate-[scrollDeals_40s_linear_infinite]">
          {[
            {addr: "🔥 123 Main St Atlanta, GA", stats: "VS: 820 | PS: 94 | 3 Buyers Alerted | $22K Spread | CLOSING"},
            {addr: "⚡ Tampa Duplex FL", stats: "VS: 760 | FUNDED IN 2HR | $15K Profit | Lender: VS 840"},
            {addr: "🚨 Jacksonville Probate", stats: "PS: 91 | MOTIVATED SELLER | AI ROUTING TO TOP 3 BUYERS NOW"},
            {addr: "💎 Charlotte SFH NC", stats: "VS: 880 | ALPHA DEAL | 3 Cash Offers | $31K Spread"},
          ].map((deal, i) => (
            <div key={i} className="min-w-[350px] bg-[#0D0D0D] border border-[#D4AF37] rounded-lg p-4 text-sm">
              <div className="text-[#D4AF37] font-bold mb-2">{deal.addr}</div>
              <div className="text-[#999]">{deal.stats}</div>
            </div>
          ))}
        </div>
      </div>

      {/* VAULTFORGE INTELLIGENCE */}
      <section className="px-[5%] py-20 max-w-[1400px] mx-auto">
        <h2 className="text-4xl font-black text-center mb-4">VAULTFORGE INTELLIGENCE™</h2>
        <p className="text-center text-[#999] mb-16 text-lg">We don't list deals. We route them like the NYSE.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {title: "SEAT LICENSES", desc: "Bloomberg has 325K seats. We cap GA Wholesalers at 20. Scarcity = deal flow. Your seat has value."},
            {title: "AI ROUTING", desc: "Post deal → AI scores it → Routes to 3 buyers in 30 sec. No 50 tire-kickers. Just closers with 800+ VaultScore."},
            {title: "PRICE LOCK", desc: "Founders: $299 for 90 days. Then $499/mo forever. Cancel = lose lock forever + seat released in 30 days."}
          ].map((item, i) => (
            <div key={i} className="bg-[#1a1a1a] border border-[#333] rounded-lg p-8 text-center hover:border-[#D4AF37] hover:-translate-y-1 transition">
              <h4 className="text-[#D4AF37] text-lg font-bold mb-3">{item.title}</h4>
              <p className="text-[#999] text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8-STEP OS */}
      <section className="px-[5%] py-20 max-w-[1400px] mx-auto">
        <h2 className="text-4xl font-black text-center mb-4">FROM CONTRACT TO CLOSE IN 14 DAYS</h2>
        <p className="text-center text-[#999] mb-16 text-lg">The complete VaultForge OS. Every tool to run a deal start to finish.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            {num: 1, title: "AI PRE-UNDERWRITE", desc: "Upload address. 60-sec comps, ARV, liens, title clouds. TRUE ARV vs Zestimate."},
            {num: 2, title: "PAIN SCORE 0-100", desc: "Seller motivation. DOM, price drops, divorce, probate, liens. 90+ = Call Now."},
            {num: 3, title: "VAULTSCORE 300-850", desc: "Deal scored on spread, equity, risk. 800+ = Alpha. Gets first alerts."},
            {num: 4, title: "3-BUYER ROUTING", desc: "Algorithm matches top 3 VaultScore buyers. No spam. No tire-kickers."},
            {num: 5, title: "DOC VAULT", desc: "Assignment, EMD, JV, funding docs auto-filled. Docusign ready in 1 click."},
            {num: 6, title: "LENDER MATCH", desc: "VaultScore 800+ lenders auto-notified. 2hr pre-approval. Wire same day."},
            {num: 7, title: "DEAL ROOM", desc: "Live chat. AI: 'Buyer ghost risk 73% - follow up now'. Closes save deals."},
            {num: 8, title: "TITLE + CLOSE", desc: "Integrated title, wire, deed. Close = VaultScore +5. Reputation = money."},
          ].map((step) => (
            <div key={step.num} className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5 text-center">
              <div className="w-10 h-10 bg-[#D4AF37] text-[#0D0D0D] rounded-full flex items-center justify-center mx-auto mb-3 font-black">{step.num}</div>
              <h4 className="text-[#D4AF37] text-sm font-bold mb-2">{step.title}</h4>
              <p className="text-[#999] text-xs leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMPS */}
      <section className="px-[5%] py-20 max-w-[1400px] mx-auto">
        <h2 className="text-4xl font-black text-center mb-4">COMPS THAT DON'T LIE</h2>
        <p className="text-center text-[#999] mb-16 text-lg">How VaultForge calculates TRUE ARV vs Zillow's Zestimate</p>
        <div className="bg-[#1a1a1a] border border-[#D4AF37] rounded-xl p-10">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {title: "✓ 90-DAY SALES DATA", desc: "Sold, pending, expired, withdrawn. Not just closed."},
              {title: "✓ AI ADJUSTMENTS", desc: "Sqft, beds, baths, lot, condition, age, updates."},
              {title: "✓ LIEN SEARCH", desc: "Tax, HOA, mechanic, federal. Know before you contract."},
              {title: "✓ ARV CONFIDENCE", desc: '"ARV CONFIDENCE: 94%" badge. Shows why 123 Main = $285K not $320K.'},
            ].map((item, i) => (
              <div key={i}>
                <h4 className="text-[#D4AF37] mb-3 font-bold">{item.title}</h4>
                <p className="text-[#999] text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SCORES */}
      <section className="px-[5%] py-20 max-w-[1400px] mx-auto">
        <h2 className="text-4xl font-black text-center mb-4">VAULTSCORE™ + PAIN SCORE™</h2>
        <p className="text-center text-[#999] mb-16 text-lg">The two numbers that close deals</p>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0D0D0D] border border-[#D4AF37] rounded-xl p-8">
            <h3 className="text-[#D4AF37] mb-5 text-xl font-bold">PAIN SCORE</h3>
            <div className="text-5xl font-black text-[#D4AF37]">94/100</div>
            <div className="w-full h-2 bg-[#333] rounded my-4"><div className="h-full bg-gradient-to-r from-[#FF3B30] via-[#FFA500] to-[#D4AF37] rounded w-[94%]"></div></div>
            <div className="text-[#999] text-sm">HIGHLY MOTIVATED</div>
            <p className="text-[#999] text-xs mt-4">187 DOM • 3 Price Drops • Probate Filing • Tax Lien</p>
            <p className="text-[#D4AF37] text-xs mt-2">→ CALL NOW</p>
          </div>
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0D0D0D] border border-[#D4AF37] rounded-xl p-8">
            <h3 className="text-[#D4AF37] mb-5 text-xl font-bold">VAULTSCORE</h3>
            <div className="text-5xl font-black text-[#D4AF37]">820/850</div>
            <div className="w-full h-2 bg-[#333] rounded my-4"><div className="h-full bg-gradient-to-r from-[#FF3B30] via-[#FFA500] to-[#D4AF37] rounded w-[96%]"></div></div>
            <div className="text-[#999] text-sm">ALPHA DEAL</div>
            <p className="text-[#999] text-xs mt-4">28% Spread • $22K Profit • A+ Comps • Low Risk</p>
            <p className="text-[#D4AF37] text-xs mt-2">→ ALERTS TOP 3 BUYERS</p>
          </div>
        </div>
      </section>

      {/* 7 CARDS */}
      <section className="px-[5%] py-20 max-w-[1400px] mx-auto">
        <h2 className="text-4xl font-black text-center mb-4">THE VAULTFORGE STACK</h2>
        <p className="text-center text-[#999] mb-16 text-lg">7 tools. One operating system.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            {icon: "📊", title: "VAULTSCORE™", desc: "Your closer reputation. 300-850. Closes +5. Ghost -20. 800+ = first look."},
            {icon: "🤖", title: "AI PRE-UNDERWRITE", desc: "60-second comps, ARV, liens, title. No $200 title searches."},
            {icon: "🎯", title: "3-BUYER ROUTING", desc: "Your deal doesn't get 50 views. 3 real buyers only. VaultScore matched."},
            {icon: "📁", title: "DOC VAULT", desc: "Contracts, EMD, insurance, funding in one place. Auto-filled. Docusign."},
            {icon: "💬", title: "DEAL ROOM", desc: "Live closing chat. AI: 'Deal will stall in 48hrs' before it happens."},
            {icon: "💺", title: "SEAT LICENSES", desc: "You own GA Wholesaler #3 of 20. Price locks at $499/mo forever."},
            {icon: "🌐", title: "VAULTFORGE NETWORK", desc: "Cold start? We text 47 off-platform buyers your deal. Zero ghost town."},
          ].map((card, i) => (
            <div key={i} className="bg-[#1a1a1a] border border-[#333] rounded-lg p-8 text-center hover:border-[#D4AF37] hover:-translate-y-1 transition">
              <div className="text-4xl mb-3">{card.icon}</div>
              <h4 className="text-[#D4AF37] mb-2 font-bold">{card.title}</h4>
              <p className="text-[#999] text-xs leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SEAT CAPS - ALL 7 STATES */}
      <section className="px-[5%] py-20 max-w-[1400px] mx-auto">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-10">
          <h2 className="text-4xl font-black text-center mb-4">LIVE SEAT CAPS</h2>
          <p className="text-center text-[#999] mb-10 text-lg">Limited seats per state. When full, waitlist only.</p>
          <select 
            value={selectedState} 
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full p-4 bg-[#0D0D0D] border border-[#D4AF37] text-white rounded-lg text-base mb-8"
          >
            <option value="GA">Georgia (GA)</option>
            <option value="FL">Florida (FL)</option>
            <option value="TX">Texas (TX)</option>
            <option value="NC">North Carolina (NC)</option>
            <option value="SC">South Carolina (SC)</option>
            <option value="TN">Tennessee (TN)</option>
            <option value="AL">Alabama (AL)</option>
          </select>
          {Object.entries(seatData[selectedState]).map(([role, count]) => (
            <div key={role} className="flex justify-between py-4 border-b border-[#222]">
              <span className="text-white font-semibold uppercase">{role.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className={`font-bold ${count.includes('LEFT')? 'text-[#FF3B30] animate-pulse' : count.includes('WAITLIST')? 'text-[#8B734B]' : 'text-white'}`}>{count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="px-[5%] py-20 max-w-[1400px] mx-auto" id="claim">
        <h2 className="text-4xl font-black text-center mb-4">FOUNDER PRICING</h2>
        <p className="text-center text-[#999] mb-16 text-lg">Lock your price before June 30. Cancel = lose lock forever.</p>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-[#1a1a1a] border-2 border-[#D4AF37] rounded-xl p-10 relative scale-105">
            <div className="absolute -top-3 right-5 bg-[#D4AF37] text-[#0D0D0D] px-3 py-1 rounded text-xs font-bold">FOUNDERS</div>
            <h3 className="text-2xl mb-4">90-Day Builder Access</h3>
            <div className="text-6xl font-black text-[#D4AF37] my-5">$299</div>
            <p className="text-[#999] mb-5">For 90 days, then $499/mo locked forever</p>
            <ul className="space-y-3 my-8">
              {["$0 Setup Fee Waived", "VaultScore + Pain Score", "AI Pre-Underwrite Unlimited", "3-Buyer Routing", "Doc Vault + Deal Room", "VaultForge Network Backstop", "Price Lock Forever"].map((item, i) => (
                <li key={i} className="py-3 border-b border-[#222] text-[#999] before:content-['✓_'] before:text-[#D4AF37] before:font-black">{item}</li>
              ))}
            </ul>
            <Link href="#claim" className="block w-full text-center py-4 bg-[#D4AF37] text-[#0D0D0D] rounded-md font-semibold mt-5 hover:bg-[#F4C430] transition">CLAIM FOUNDER SEAT</Link>
          </div>
          <div className="bg-[#1a1a1a] border-2 border-[#333] rounded-xl p-10">
            <h3 className="text-2xl mb-4">Standard</h3>
            <div className="text-6xl font-black text-[#D4AF37] my-5">$999<span className="text-xl text-[#666]">/mo</span></div>
            <p className="text-[#999] mb-5">After June 30 + $1,500 Setup Fee</p>
            <ul className="space-y-3 my-8">
              {["$1,500 Setup Fee Required", "VaultScore + Pain Score", "AI Pre-Underwrite Unlimited", "3-Buyer Routing", "Doc Vault + Deal Room", "No Price Lock", "No Network Backstop"].map((item, i) => (
                <li key={i} className="py-3 border-b border-[#222] text-[#999] before:content-['✓_'] before:text-[#D4AF37] before:font-black">{item}</li>
              ))}
            </ul>
            <Link href="#" className="block w-full text-center py-4 border border-[#444] rounded-md font-semibold mt-5 hover:border-[#D4AF37] hover:text-[#D4AF37] transition">JOIN WAITLIST</Link>
          </div>
        </div>
      </section>

      {/* WHAT WE ARE */}
      <section className="px-[5%] py-20 max-w-[1400px] mx-auto">
        <h2 className="text-4xl font-black text-center mb-4">WHAT IS VAULTFORGE?</h2>
        <p className="text-center text-[#999] max-w-3xl mx-auto my-5 leading-loose text-lg">
          The Bloomberg Terminal for Off-Market Real Estate. Seat licenses, not subscriptions. 
          We route capital, not clicks. Built by veterans. Driven by data. 
          You don't list deals. You route them to 3 qualified buyers in 30 seconds.
        </p>
      </section>

      {/* WHAT WE ARE NOT */}
      <section className="px-[5%] py-20 max-w-[1400px] mx-auto">
        <div className="bg-[#1a1a1a] border border-[#FF3B30] rounded-xl p-10">
          <h3 className="text-[#FF3B30] mb-5 text-2xl font-bold">WHAT WE ARE NOT</h3>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              "Not a broker. We don't represent buyers or sellers.",
              "Not a lender. We don't fund deals. Lenders do.",
              "Not Zillow. No public listings. No 50K views.",
              "Not equity. 'Founders' = pricing tier only.",
              "Not guaranteed deals. Seat = access. VaultScore = earnings.",
              "Not financial advice. Seat license software only."
            ].map((item, i) => (
              <div key={i} className="p-4 bg-[#0D0D0D] rounded-lg before:content-['✗_'] before:text-[#FF3B30] before:font-black text-sm">{item}</div>
            ))}
          </div>
        </div>
      </section>

      {/* GUARANTEE */}
      <section className="px-[5%] py-20 max-w-[1400px] mx-auto">
        <h2 className="text-4xl font-black text-center mb-10">FOUNDER GUARANTEE</h2>
        <div className="bg-[#1a1a1a] border border-[#D4AF37] rounded-xl p-10 text-center">
          <p className="text-lg leading-loose text-[#999]">
            <strong className="text-[#D4AF37]">Cancel Days 1-3:</strong> Full Refund. No questions.<br/><br/>
            <strong className="text-[#D4AF37]">Zero Views in 90 Days:</strong> $100 credit. We failed you.<br/><br/>
            <strong className="text-[#D4AF37]">Cold Start Backstop:</strong> VaultForge Network texts 47 off-platform buyers your first deal. Zero ghost town.<br/><br/>
            <strong className="text-[#FF3B30]">Day 91:</strong> $499/mo auto-renews. Cancel = lose price lock forever + seat released in 30 days.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black py-16 px-[5%] border-t border-[#222] text-center">
        <div className="flex justify-center gap-8 mb-8 flex-wrap">
          {["Members Login", "Admin Portal", "Terms", "Disclaimers", "Cancel Policy", "Privacy"].map((link, i) => (
            <Link key={i} href={`/${link.toLowerCase().replace(' ', '-')}`} className="text-[#999] text-sm hover:text-[#D4AF37] transition">{link}</Link>
          ))}
        </div>
        <p className="text-[#666] text-xs">© 2026 VaultForge OS. Seat License Software. Not a Broker. Not a Lender.</p>
        <p className="text-[#444] text-xs mt-2">VETERAN PRIDE. DISCIPLINE. STRATEGY. RESULTS. BUILT ON HONOR. DRIVEN BY PURPOSE.</p>
      </footer>

      <style jsx global>{`
        @keyframes scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes scrollDeals {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </main>
  )
}
