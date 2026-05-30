import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function CommandCenter() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6)

  const { data: painDeals } = await supabase
    .from('pain_deals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">VAULTFORGE</h1>
          <form action="/auth/signout" method="post">
            <button className="text-sm text-zinc-400 hover:text-white">Sign Out</button>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          <Link href="/post-deal" className="bg-emerald-600 hover:bg-emerald-500 p-6 rounded-lg border border-emerald-500/20 transition">
            <div className="text-2xl font-bold mb-1">POST NEW DEAL</div>
            <div className="text-sm text-emerald-100">Submit off-market opportunity</div>
          </Link>
          
          <Link href="/directory/join" className="bg-blue-600 hover:bg-blue-500 p-6 rounded-lg border border-blue-500/20 transition">
            <div className="text-2xl font-bold mb-1">JOIN DIRECTORY</div>
            <div className="text-sm text-blue-100">Add your operator profile</div>
          </Link>
          
          <Link href="/directory" className="bg-zinc-800 hover:bg-zinc-700 p-6 rounded-lg border border-zinc-700 transition">
            <div className="text-2xl font-bold mb-1">MEMBER DIRECTORY</div>
            <div className="text-sm text-zinc-400">Browse verified operators</div>
          </Link>

          <Link href="/login" className="bg-zinc-800 hover:bg-zinc-700 p-6 rounded-lg border border-zinc-700 transition">
            <div className="text-2xl font-bold mb-1">ADMIN</div>
            <div className="text-sm text-zinc-400">Platform controls</div>
          </Link>
        </div>

        {/* Deal Room */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">DEAL ROOM</h2>
            <span className="text-sm text-zinc-500">{deals?.length || 0} LIVE</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deals?.map((deal) => (
              <div key={deal.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-emerald-500/50 transition">
                <div className="text-xs text-emerald-500 font-bold mb-2">{deal.asset_type?.toUpperCase()}</div>
                <div className="text-lg font-bold mb-2">{deal.location}</div>
                <div className="text-2xl font-bold text-emerald-400 mb-3">${deal.asking_price?.toLocaleString()}</div>
                <div className="text-sm text-zinc-400 line-clamp-2">{deal.notes}</div>
              </div>
            ))}
            {(!deals || deals.length === 0) && (
              <div className="col-span-full text-center py-12 text-zinc-600">No active deals. Post the first one.</div>
            )}
          </div>
        </div>

        {/* Pain Room */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">PAIN ROOM</h2>
            <span className="text-sm text-zinc-500">{painDeals?.length || 0} ACTIVE</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {painDeals?.map((pain) => (
              <div key={pain.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-red-500/50 transition">
                <div className="text-xs text-red-500 font-bold mb-2">{pain.situation?.toUpperCase()}</div>
                <div className="text-lg font-bold mb-2">{pain.location}</div>
                <div className="text-2xl font-bold text-red-400 mb-3">${pain.payoff_amount?.toLocaleString()}</div>
                <div className="text-sm text-zinc-400 line-clamp-2">{pain.notes}</div>
              </div>
            ))}
            {(!painDeals || painDeals.length === 0) && (
              <div className="col-span-full text-center py-12 text-zinc-600">No active pain deals.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
