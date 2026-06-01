import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('member_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="bg-black text-white min-h-screen p-8 font-mono">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">VAULTFORGE DASHBOARD</h1>
            <p className="text-xs text-gray-500 tracking-widest">{profile?.tier || 'STANDARD'} // {user.email}</p>
          </div>
          <form action="/auth/signout" method="post">
            <button className="bg-zinc-900 border border-zinc-700 px-6 py-2 text-xs font-bold">
              LOGOUT
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <div className="text-xs text-gray-500 mb-2">ACTIVE DEALS</div>
            <div className="text-3xl font-black">{deals?.length || 0}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <div className="text-xs text-gray-500 mb-2">DQI AVG</div>
            <div className="text-3xl font-black">87</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-6">
            <div className="text-xs text-gray-500 mb-2">NETWORK RANK</div>
            <div className="text-3xl font-black">#142</div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6">
          <h2 className="text-lg font-bold mb-4">RECENT DEALS</h2>
          {deals && deals.length > 0 ? (
            <div className="space-y-3">
              {deals.map((deal: any) => (
                <div key={deal.id} className="bg-black border border-zinc-800 p-4 flex justify-between">
                  <div>
                    <div className="font-bold">{deal.address}</div>
                    <div className="text-xs text-gray-500">{deal.city}, {deal.state} {deal.zipcode}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">DQI {deal.dqi_score}</div>
                    <div className="text-xs text-gray-500">ARV ${deal.arv?.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-600 py-12">NO DEALS YET // SUBMIT VIA PAIN INTAKE</div>
          )}
        </div>
      </div>
    </div>
  )
}
