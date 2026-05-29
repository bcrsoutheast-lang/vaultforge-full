import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 30 // Live data every 30s

const ROLES = [
  { key: 'seller', label: 'SELLERS', cap: 25 },
  { key: 'buyer', label: 'BUYERS', cap: 25 },
  { key: 'lender', label: 'LENDERS', cap: 15 },
  { key: 'attorney', label: 'ATTORNEYS', cap: 5 },
  { key: 'gc', label: 'GCs', cap: 10 },
  { key: 'wholesaler', label: 'WHOLESALERS', cap: 10 },
  { key: 'realtor', label: 'REALTORS', cap: 5 },
  { key: 'title', label: 'TITLE', cap: 3 },
  { key: 'insurance', label: 'INSURANCE', cap: 2 },
]

const FOUNDERS_CAP = 100
const FOUNDERS_END = new Date('2026-06-10T23:59:59-04:00')

export default async function HomePage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  )

  // REAL COUNTS — NO FAKE NUMBERS
  const { data: foundersCount } = await supabase.rpc('get_founders_count')
  const totalFounders = foundersCount || 0

  const roleCounts = await Promise.all(
    ROLES.map(async (r) => {
      const { data } = await supabase.rpc('get_role_count', { role_name: r.key })
      return { ...r, count: data || 0 }
    })
  )

  const { data: latestDeal } = await supabase
    .from('vault_deals')
    .select('title, city, state, fee_amount, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: latestPain } = await supabase
    .from('vault_pain_posts')
    .select('title, city, state, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const foundersOpen = totalFounders < FOUNDERS_CAP && Date.now() < FOUNDERS_END.getTime()
  const now = new Date()

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* HERO */}
      <section className="flex flex-col items-center justify-center min-h-screen px-4 text-center border-b border-[#1F1F1F]">
        <Image 
          src="/logo.png" 
          alt="VaultForge" 
          width={400} 
          height={400} 
          className="mb-8 w-64 md:w-96" 
          priority
        />
        
        <h1 className="text-sm tracking-[0.3em] text-[#D4AF37] mb-2">INTELLIGENCE NETWORK</h1>
        <h2 className="text-3xl md:text-5xl font-bold mb-4">FORTIFY YOUR PORTFOLIO.</h2>
        <p className="text-[#71717A] mb-8 max-w-xl">Private routing for off-market deals. Verified operators only.</p>

        {/* LIVE COUNTERS */}
        <div className="border border-[#1F1F1F] p-6 mb-6 bg-[#0A0A0A]">
          <p className="text-[#D4AF37] text-xs mb-4">LIVE FROM DATABASE</p>
          <div className="grid grid-cols-3 md:grid-cols-3 gap-4 text-left">
            {roleCounts.map(r => (
              <div key={r.key}>
                <p className="text-[#71717A] text-xs">{r.label}</p>
                <p className="text-xl font-bold">
                  <span className="text-[#D4AF37]">{r.count}</span>/{r.cap}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#1F1F1F] mt-4 pt-4">
            <p className="text-2xl font-black">
              <span className="text-[#D4AF37]">{totalFounders}</span> / {FOUNDERS_CAP} FOUNDERS SECURED
            </p>
            {foundersOpen && <Countdown target={FOUNDERS_END} />}
          </div>
        </div>

        <Link 
          href="/login"
          className="bg-[#D4AF37] hover:bg-[#FBBF24] text-black font-bold py-4 px-12 text-lg transition-all"
        >
          {foundersOpen ? 'REQUEST FOUNDERS ACCESS →' : 'JOIN WAITLIST →'}
        </Link>
        <p className="text-[#71717A] text-xs mt-4">
          {foundersOpen ? '$65 First Month. $85 Second. $299 Thereafter.' : '$99 Setup + $299/mo'}
        </p>
        <p className="text-[#71717A] text-xs mt-1">Database updated: {now.toLocaleTimeString('en-US')}</p>
      </section>

      {/* INTELLIGENCE ROUTING */}
      <section className="max-w-4xl mx-auto py-20 px-4 text-center border-b border-[#1F1F1F]">
        <div className="space-y-12">
          <div>
            <h3 className="text-[#D4AF37] text-2xl font-bold mb-2">DISCIPLINE.</h3>
            <p className="text-[#71717A]">Zillow is public. Facebook is noise. VaultForge routes intelligence to verified operators only.</p>
          </div>
          <div>
            <h3 className="text-[#D4AF37] text-2xl font-bold mb-2">STRATEGY.</h3>
            <p className="text-[#71717A]">Submit Deal → AI Routes by State, Asset Class, Role → Direct DM. Before the market sees it.</p>
          </div>
          <div>
            <h3 className="text-[#D4AF37] text-2xl font-bold mb-2">RESULTS.</h3>
            <p className="text-[#71717A]">The entire closing table. Pre-vetted. On demand.</p>
          </div>
        </div>
      </section>

      {/* LIVE FEED TEASE */}
      <section className="max-w-6xl mx-auto py-20 px-4">
        <h3 className="text-center text-3xl font-bold mb-12">LIVE INTELLIGENCE FEED</h3>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="border border-[#D4AF37] bg-[#0A0A0A] p-6">
            <div className="flex justify-between mb-2">
              <p className="text-[#D4AF37] text-xs">NEW ROUTED TO VAULT</p>
              <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse" />
            </div>
            <div className="w-full h-48 bg-[#1F1F1F] mb-4 blur-sm flex items-center justify-center">
              <p className="text-[#71717A]">MEMBERS ONLY</p>
            </div>
            <h4 className="text-xl font-bold mb-1">
              {latestDeal ? `${latestDeal.title.substring(0,25)}...` : 'Awaiting first deal...'}
            </h4>
            <p className="text-[#71717A] text-sm">
              {latestDeal ? `${latestDeal.city}, ${latestDeal.state}` : '—'}
            </p>
            <Link href="/login" className="block w-full bg-[#1F1F1F] hover:bg-[#27272A] text-center py-3 mt-4 text-sm font-bold border border-[#D4AF37]">
              JOIN TO VIEW DETAILS →
            </Link>
          </div>

          <div className="border border-[#DC2626] bg-[#0A0A0A] p-6">
            <p className="text-[#DC2626] text-xs mb-2">URGENT REQUEST ROUTED</p>
            <div className="w-full h-48 bg-[#1F1F1F] mb-4 flex items-center justify-center">
              <p className="text-6xl">🚨</p>
            </div>
            <h4 className="text-xl font-bold mb-1">
              {latestPain ? `${latestPain.title.substring(0,25)}...` : 'Awaiting first request...'}
            </h4>
            <p className="text-[#71717A] text-sm">
              {latestPain ? `${latestPain.city}, ${latestPain.state}` : '—'}
            </p>
            <Link href="/login" className="block w-full bg-[#1F1F1F] hover:bg-[#27272A] text-center py-3 mt-4 text-sm font-bold border border-[#DC2626]">
              JOIN TO CONTACT POSTER →
            </Link>
          </div>
        </div>
      </section>

      {/* FINAL CLOSE */}
      <section className="py-20 px-4 text-center bg-[#0A0A0A] border-t border-[#1F1F1F]">
        <h3 className="text-3xl font-bold mb-4">BUILT ON HONOR. DRIVEN BY PURPOSE.</h3>
        <p className="text-[#71717A] mb-8 max-w-xl mx-auto">
          Not a broker. Not a guru. Not public.
        </p>
        <Link 
          href="/login"
          className="bg-[#D4AF37] hover:bg-[#FBBF24] text-black font-bold py-4 px-12 text-lg"
        >
          {foundersOpen ? 'REQUEST FOUNDERS ACCESS →' : 'JOIN WAITLIST →'}
        </Link>
      </section>
    </div>
  )
}

// Countdown component — client side
function Countdown({ target }: { target: Date }) {
  return (
    <div className="text-[#FBBF24] font-mono text-sm mt-2">
      FOUNDERS CLOSES: Client-side countdown renders here
    </div>
  )
}
