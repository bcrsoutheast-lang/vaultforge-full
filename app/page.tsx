import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export const revalidate = 30

// FOUNDING SEATS CONFIG - CHANGE NUMBERS HERE ONLY
const FOUNDING_SEATS = {
  lenders: { total: 50, filled: 42, access: 1500, monthly: 299 },
  buyers: { total: 200, filled: 167, access: 750, monthly: 199 },
  wholesalers: { total: 100, filled: 73, access: 500, monthly: 99 },
  contractors: { total: 75, filled: 59, access: 1000, monthly: 249 },
  title: { total: 25, filled: 11, access: 2500, monthly: 499 },
  agents: { total: 100, filled: 73, access: 500, monthly: 149 },
  appraisers: { total: 30, filled: 8, access: 1000, monthly: 199 },
  inspectors: { total: 50, filled: 22, access: 500, monthly: 149 },
  pml: { total: 40, filled: 31, access: 2000, monthly: 399 },
  architects: { total: 15, filled: 6, access: 1500, monthly: 299 },
}

export default async function HomePage() {
  const supabase = createClient()

  // LIVE DEAL DATA
  const { count: totalDeals } = await supabase.from('deals').select('*', { count: 'exact', head: true })
  const { count: painDeals } = await supabase.from('deals').select('*', { count: 'exact', head: true }).gte('bps_score', 50)
  const { data: recentDeals } = await supabase
    .from('deals')
    .select('id, state, dqi_score, bps_score, arv, asking_price, pain_flags, intel_status')
    .order('created_at', { ascending: false })
    .limit(6)

  // MEMBER MATH
  const totalSeats = Object.values(FOUNDING_SEATS).reduce((sum, r) => sum + r.total, 0)
  const totalFilled = Object.values(FOUNDING_SEATS).reduce((sum, r) => sum + r.filled, 0)
  
  const roles = [
    { name: 'Lenders', desc: 'Fund DQI 90+ in 48hrs. SMS alerts.', icon: '🏦' },
    { name: 'Buyers', desc: 'Vault Score priority. See pain deals first.', icon: '🏠' },
    { name: 'Wholesalers', desc: 'List deals. BPS scores motivation for you.', icon: '📋' },
    { name: 'Contractors', desc: 'Bid DQI deals with scope attached. No chasing.', icon: '🔨' },
    { name: 'Title Attorneys', desc: 'Lien Stack Decoder feeds you clean closings.', icon: '⚖️' },
    { name: 'Agents', desc: 'Get BPS 80+ sellers before they list MLS.', icon: '🔑' },
    { name: 'Appraisers', desc: 'ACI feeds comps. Your ARV becomes data.', icon: '📊' },
    { name: 'Inspectors', desc: 'Deal DNA flags CODE_VIOLATION. You get routed.', icon: '🔍' },
    { name: 'Private Money', desc: 'Fund gaps. See BPS + Vault Score. No flakes.', icon: '💰' },
    { name: 'Architects', desc: 'Value-add deals need plans. Get routed first.', icon: '📐' },
  ]

  return (
    <div className="min-h-screen">
      {/* TICKER */}
      <div className="bg-blue-600 text-white py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap text-sm font-semibold">
          <span className="mx-8">🔥 {painDeals || 0} HIGH MOTIVATION DEALS ROUTED TODAY</span>
          <span className="mx-8">⚡ {totalFilled}/{totalSeats} FOUNDING SEATS FILLED</span>
          <span className="mx-8">💰 BPS FINDS SELLERS 30 DAYS BEFORE MLS</span>
          <span className="mx-8">🏆 DQI 90+ = INSTITUTIONAL GRADE</span>
        </div>
      </div>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="text-7xl font-black tracking-tight text-gray-900">
          VaultForge
        </h1>
        <p className="mt-6 text-2xl font-semibold text-gray-900">
          PRIVATE DEAL INTELLIGENCE NETWORK
        </p>
        <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
          Members only. The deals here never hit public. We detect seller motivation before the market does. 
          BPS 80+ means they HAVE to sell. That intelligence gets routed to members. Public gets leftovers.
        </p>
        <div className="mt-10">
          <Link href="/founders" className="bg-gray-900 text-white px-10 py-4 rounded-md font-bold text-lg hover:bg-gray-800">
            Request Private Access
          </Link>
          <p className="text-sm text-gray-500 mt-3">Application only. {totalSeats - totalFilled} founding seats left.</p>
        </div>
      </section>

      {/* LIVE COUNTERS */}
      <section className="bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-5xl font-black text-gray-900">{totalDeals || 0}</div>
            <div className="text-sm text-gray-500 mt-1">Deals In Network</div>
          </div>
          <div>
            <div className="text-5xl font-black text-orange-600">{painDeals || 0}</div>
            <div className="text-sm text-gray-500 mt-1">High Motivation</div>
          </div>
          <div>
            <div className="text-5xl font-black text-blue-600">{totalFilled}</div>
            <div className="text-sm text-gray-500 mt-1">Active Members</div>
          </div>
          <div>
            <div className="text-5xl font-black text-green-600">{totalSeats - totalFilled}</div>
            <div className="text-sm text-gray-500 mt-1">Seats Left</div>
          </div>
        </div>
      </section>

      {/* LIVE DEALS SPLIT */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-2">LIVE INTEL // UPDATED 23 SECONDS AGO</h2>
        <p className="text-center text-gray-600 mb-12">No addresses shown. State only. Private access required.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-orange-600">⚠</span> HIGH MOTIVATION // BPS 50+
            </h3>
            <div className="space-y-4">
              {recentDeals?.filter(d => d.bps_score >= 50).slice(0,3).map((deal) => (
                <div key={deal.id} className="bg-orange-50 border-2 border-orange-200 rounded-lg p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-lg text-gray-900">{deal.state} Deal</div>
                      <div className="text-sm text-gray-700 mt-1">
                        ARV ${deal.arv?.toLocaleString()} | Ask ${deal.asking_price?.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-orange-700">BPS {deal.bps_score}</div>
                      <div className="text-sm font-black text-blue-700">DQI {deal.dqi_score}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {deal.pain_flags?.slice(0,3).map(flag => (
                      <span key={flag} className="text-xs bg-orange-600 text-white px-2 py-1 rounded font-semibold">
                        {flag.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {!recentDeals?.filter(d => d.bps_score >= 50).length && (
                <div className="text-gray-500 text-center py-8">No pain deals live. Check back.</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <span className="text-blue-600">◆</span> STANDARD // DQI GRADED
            </h3>
            <div className="space-y-4">
              {recentDeals?.filter(d => d.bps_score < 50).slice(0,3).map((deal) => (
                <div key={deal.id} className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-lg text-gray-900">{deal.state} Deal</div>
                      <div className="text-sm text-gray-700 mt-1">
                        ARV ${deal.arv?.toLocaleString()} | Ask ${deal.asking_price?.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-blue-700">DQI {deal.dqi_score}</div>
                      <div className="text-xs text-gray-600">{deal.intel_status}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="text-center mt-12">
          <Link href="/deals" className="text-blue-600 font-bold text-lg hover:text-blue-800">
            View All Member Deals →
          </Link>
        </div>
      </section>

      {/* WHAT WE ARE */}
      <section className="bg-gray-900 text-white py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black mb-8">THIS IS NOT ZILLOW. THIS IS NOT MLS.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left text-lg">
            <div>
              <p className="text-gray-400">Zillow shows you houses.</p>
              <p className="font-bold text-white">We show you why the seller is screwed.</p>
            </div>
            <div>
              <p className="text-gray-400">MLS posts when it’s listed.</p>
              <p className="font-bold text-white">We alert you 30 days before it lists.</p>
            </div>
            <div>
              <p className="text-gray-400">PropStream dumps data.</p>
              <p className="font-bold text-white">We score motivation 0-100.</p>
            </div>
            <div>
              <p className="text-gray-400">Public fights over scraps.</p>
              <p className="font-bold text-white">Members get routed the kill.</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-400 mt-12">If you’re using public data, you’re already late.</p>
        </div>
      </section>

      {/* ECOSYSTEM */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-black text-center mb-4">THE FULL DEAL TEAM. ALREADY IN THE ROOM.</h2>
        <p className="text-center text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
          Getting a contract is 10%. Closing is 90%. When a HIGH_MOTIVATION deal hits, 
          we don’t just show it. We route it to a vetted lender, GC, title attorney, and buyer. All inside.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {roles.map((role) => (
            <div key={role.name} className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">{role.icon}</div>
              <div className="font-bold text-gray-900">{role.name}</div>
              <div className="text-xs text-gray-600 mt-2">{role.desc}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-lg font-semibold text-gray-900 mt-12">
          If you need it to get a deal done, it’s inside. No outside tools. No dead ends.
        </p>
      </section>

      {/* FOUNDING SEATS */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-6xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-black mb-4">685 SEATS. 10 ROLES. ONE PRIVATE NETWORK.</h2>
          <p className="text-xl text-blue-100 mb-12">We cap seats to protect deal flow. Once filled, waitlist only. Price doubles.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-left">
            {Object.entries(FOUNDING_SEATS).map(([key, data]) => (
              <div key={key} className="bg-blue-700 rounded-lg p-4">
                <div className="text-xs uppercase text-blue-200">{key}</div>
                <div className="text-2xl font-black">{data.filled}/{data.total}</div>
                <div className="text-xs text-blue-200">Filled</div>
              </div>
            ))}
          </div>

          <Link href="/founders" className="inline-block mt-12 bg-white text-blue-600 px-10 py-4 rounded-md font-black text-lg hover:bg-gray-100">
            Claim Your Seat
          </Link>
          <p className="text-sm text-blue-200 mt-4">{totalSeats - totalFilled} seats left before price increase.</p>
        </div>
      </section>

      {/* COMING SOON */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-4xl font-black text-center mb-4">LOCKED IN. DEPLOYING TO MEMBERS FIRST.</h2>
        <p className="text-center text-xl text-gray-600 mb-16">We built the engine. These weapons deploy next.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { name: 'ARV Confidence Index', desc: 'We don’t just give ARV. We score if it’s real. ACI 97 = 3 comps within 0.2mi.' },
            { name: 'Lender Alerts SMS', desc: 'DQI 90+ hits your phone in 8 seconds. First money wins.' },
            { name: 'Vault Score', desc: 'Credit score for buyers. Flakes get buried. Closers get priority.' },
            { name: 'Deal Rooms', desc: 'Private room per deal. Lender + GC + Title + Buyer auto-assembled. No chaos.' },
          ].map((f) => (
            <div key={f.name} className="border-2 border-gray-200 rounded-lg p-8">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold">{f.name}</h3>
                <span className="text-xs font-black bg-yellow-100 text-yellow-800 px-3 py-1 rounded">SOON</span>
              </div>
              <p className="text-gray-700 text-lg">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-black text-white">THE PUBLIC FIGHTS FOR LISTINGS.</h2>
          <h2 className="text-4xl font-black text-blue-400 mt-2">MEMBERS GET ROUTED INTELLIGENCE.</h2>
          <p className="text-gray-300 mt-6 text-xl">One HIGH_MOTIVATION deal pays for 10 years of membership.</p>
          <Link href="/founders" className="inline-block mt-10 bg-blue-600 text-white px-10 py-4 rounded-md font-black text-lg hover:bg-blue-700">
            Request Private Access
          </Link>
          <p className="text-sm text-gray-500 mt-4">Application only. We vet members. This isn’t Zillow.</p>
        </div>
      </section>
    </div>
  )
}
