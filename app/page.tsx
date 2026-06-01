'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* NAV */}
      <nav className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-xl font-black tracking-wider">VAULTFORGE</div>
          <div className="flex gap-6 text-xs">
            <Link href="/founders" className="text-gray-400 hover:text-white">FOUNDERS</Link>
            <Link href="/login" className="bg-white text-black px-6 py-2 font-bold hover:bg-gray-200">
              ENTER NETWORK
            </Link>
          </div>
        </div>
      </nav>

      {/* TICKER */}
      <div className="bg-blue-600 py-2 overflow-hidden">
        <div 
          className="whitespace-nowrap text-xs font-bold"
          style={{
            display: 'inline-block',
            animation: 'marquee 20s linear infinite'
          }}
        >
          <span className="mx-8">🔥 492 ACTIVE DEALS ROUTED TODAY</span>
          <span className="mx-8">⚡ BPS 80+ = SELLER MUST SELL</span>
          <span className="mx-8">🏦 193 FOUNDING SEATS LEFT</span>
          <span className="mx-8">📊 DQI 90+ = INSTITUTIONAL GRADE</span>
          <span className="mx-8">🔥 492 ACTIVE DEALS ROUTED TODAY</span>
        </div>
      </div>

      {/* HERO */}
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="text-xs text-gray-500 tracking-[0.4em] mb-6">PRIVATE DEAL INTELLIGENCE NETWORK</div>
        
        <h1 className="text-6xl md:text-8xl font-black leading-none mb-8">
          PUBLIC GETS<br/>
          <span className="text-red-600">LEFTOVERS.</span><br/>
          YOU GET<br/>
          <span className="text-blue-600">INTEL.</span>
        </h1>

        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          We detect seller motivation before the market does. BPS 80+ means they HAVE to sell. 
          DQI 90+ means institutions are bidding. That intelligence gets routed to members. 
          Public MLS gets scraps.
        </p>

        <div className="flex gap-4 justify-center mb-20">
          <Link href="/founders" className="bg-white text-black px-12 py-4 font-black text-sm tracking-widest hover:bg-gray-200">
            CLAIM FOUNDING SEAT
          </Link>
          <Link href="/login" className="bg-zinc-900 border border-zinc-700 px-12 py-4 font-bold text-sm tracking-widest hover:bg-zinc-800">
            MEMBER LOGIN
          </Link>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <div className="text-3xl font-black text-blue-500 mb-2">492</div>
            <div className="text-xs text-gray-500 tracking-widest">DEALS IN NETWORK</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <div className="text-3xl font-black text-green-500 mb-2">193</div>
            <div className="text-xs text-gray-500 tracking-widest">HIGH MOTIVATION</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <div className="text-3xl font-black text-orange-500 mb-2">87</div>
            <div className="text-xs text-gray-500 tracking-widest">DQI 90+</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <div className="text-3xl font-black text-red-500 mb-2">685</div>
            <div className="text-xs text-gray-500 tracking-widest">FOUNDING SEATS</div>
          </div>
        </div>
      </div>

      {/* PROOF */}
      <div className="border-t border-zinc-800 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-black text-center mb-12">HOW VAULTFORGE WORKS</h2>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="text-2xl font-black text-blue-600">01</div>
              <div>
                <div className="font-bold mb-2">PAIN INTAKE SCANS MOTIVATION</div>
                <div className="text-sm text-gray-400">BPS engine scores seller pain. Divorce, foreclosure, vacant, inherited. 80+ = distressed.</div>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-2xl font-black text-blue-600">02</div>
              <div>
                <div className="font-bold mb-2">DQI GRADES DEAL QUALITY</div>
                <div className="text-sm text-gray-400">Deal Quality Index scores ARV, comps, rehab, liens. 90+ = institutional money moves.</div>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="text-2xl font-black text-blue-600">03</div>
              <div>
                <div className="font-bold mb-2">ROUTED TO MEMBERS IN 48HRS</div>
                <div className="text-sm text-gray-400">High BPS + High DQI = SMS alert to lenders/buyers. First money wins. No tire kickers.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-zinc-900 border-t border-zinc-800 py-20 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-black mb-6">193 SEATS LEFT.<br/>THEN PRICE DOUBLES.</h2>
          <p className="text-gray-400 mb-8">We cap membership to protect deal flow. Once 685 founding seats fill, waitlist only.</p>
          <Link href="/founders" className="inline-block bg-white text-black px-12 py-4 font-black text-sm tracking-widest hover:bg-gray-200">
            VIEW FOUNDING ROLES
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 px-6 py-8">
        <div className="max-w-7xl mx-auto flex justify-between text-xs text-gray-600">
          <div>© 2026 VAULTFORGE // PRIVATE NETWORK</div>
          <div>MEMBERS ONLY // VETTED ACCESS</div>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%) }
          100% { transform: translateX(-50%) }
        }
      `}</style>
    </div>
  )
}
