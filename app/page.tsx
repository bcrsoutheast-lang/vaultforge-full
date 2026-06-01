import Image from 'next/image'

export default function Home() {
  return (
    <main className="bg-[#0A0A0A] min-h-screen font-mono">
      {/* NAV */}
      <nav className="bg-black border-b border-[#D4AF37]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Image
            src="/IMG_4751.png"
            alt="VaultForge"
            width={300}
            height={300}
            priority
            className="h-12 w-auto"
          />
          <a href="/login">
            <button className="border border-[#D4AF37] text-[#D4AF37] px-4 md:px-6 py-2 font-black tracking-wider text-xs md:text-sm hover:bg-[#D4AF37]/10 transition">
              MEMBER LOGIN
            </button>
          </a>
        </div>
      </nav>

      {/* HERO */}
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className="text-[#D4AF37] text-xs tracking-[0.5em] mb-4">VETERAN OWNED // NDA PROTECTED</div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-[#D4AF37] mb-6 leading-tight">
          VAULTFORGE<br/>MEMBERS VAULT
        </h1>
        <p className="text-[#D4AF37]/80 text-base md:text-lg mb-8 max-w-2xl mx-auto">
          Full address. Full docs. Full numbers. Lender SMS in 8 seconds. 48hr shot clock.
        </p>
        <a href="/login">
          <button className="bg-[#D4AF37] text-black px-8 md:px-12 py-4 font-black tracking-wider text-base md:text-lg hover:bg-[#F4CF47] transition">
            START 3-DAY TRIAL
          </button>
        </a>
        <div className="text-[#D4AF37]/60 text-xs mt-4">$750 access + $299/mo after trial</div>
      </div>

      {/* TOOLS PREVIEW */}
      <div className="bg-black py-16 md:py-24 border-y border-[#D4AF37]/20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-black text-[#D4AF37] text-center mb-4">MEMBER TOOLS</h2>
          <p className="text-[#D4AF37]/60 text-center mb-12 text-sm md:text-base">What you get inside the vault</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                title: 'PAIN ROOM',
                desc: 'Submit leads. BPS scores bankruptcy probability. 10% fee if it closes.',
              },
              {
                title: 'LENDER SMS',
                desc: 'DQI 90+ triggers SMS to matched lenders. First reply wins. 8 second delivery.',
              },
              {
                title: 'VAULT SCORE',
                desc: 'Your reputation score. 847/1000 = Green light. Lenders see this before they fund.',
              },
              {
                title: 'ARV CONFIDENCE',
                desc: 'ACI 90+ = Lender pre-approved. No appraisal delays. Instant comps.',
              },
              {
                title: 'DEAL ROOMS',
                desc: 'Private rooms. Docs, chat, e-sign. 48hr shot clock. Buyer + Lender + GC + Title.',
              },
              {
                title: 'TITLE DECODER',
                desc: 'Lien stack analyzer. Cloud detector. Curative path. Instant report.',
              },
            ].map((tool, i) => (
              <div key={i} className="border border-[#D4AF37]/30 p-6 hover:border-[#D4AF37] hover:shadow-[0_0_20px_rgba(212,175,55,0.2)] transition">
                <h3 className="text-[#D4AF37] font-black text-lg md:text-xl mb-3">{tool.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-black text-[#D4AF37] text-center mb-12">VAULT METRICS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-black text-[#D4AF37]">492</div>
              <div className="text-[#D4AF37]/60 text-xs md:text-sm tracking-wider mt-2">DEALS ROUTED TODAY</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-[#D4AF37]">193</div>
              <div className="text-[#D4AF37]/60 text-xs md:text-sm tracking-wider mt-2">BPS 80+ IN FEED</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-[#D4AF37]">87</div>
              <div className="text-[#D4AF37]/60 text-xs md:text-sm tracking-wider mt-2">DQI 90+ MATCHED</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-black text-[#D4AF37]">6.3s</div>
              <div className="text-[#D4AF37]/60 text-xs md:text-sm tracking-wider mt-2">AVG SMS REPLY</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#D4AF37] py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-black mb-6">STOP CHASING LISTS</h2>
          <p className="text-black/80 text-base md:text-lg mb-8">
            Get full addresses. Full docs. Lenders texting you in 8 seconds. 48 hours to close or it dies.
          </p>
          <a href="/login">
            <button className="bg-black text-[#D4AF37] px-8 md:px-12 py-4 font-black tracking-wider text-base md:text-lg hover:bg-[#1A1A1A] transition">
              ENTER VAULT // 3-DAY TRIAL
            </button>
          </a>
          <div className="text-black/60 text-xs mt-4">685 founding members max. 47 spots left.</div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-black border-t border-[#D4AF37]/20 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Image
            src="/IMG_4751.png"
            alt="VaultForge"
            width={200}
            height={200}
            className="mx-auto w-32 h-auto mb-4 opacity-50"
          />
          <div className="text-[#D4AF37]/40 text-xs tracking-[0.3em]">
            © 2026 VAULTFORGE // VETERAN OWNED // NDA PROTECTED
          </div>
        </div>
      </footer>
    </main>
  )
}
