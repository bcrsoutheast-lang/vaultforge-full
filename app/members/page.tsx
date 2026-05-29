import { createServerClient } from '@supabase/ssr'
import { cookies, redirect } from 'next/navigation'

export default async function MembersPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('vault_members')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!member || !['active_founder','active_member'].includes(member.status)) {
    redirect('/profile') // Force to profile/payment if not paid
  }

  const { data: deals } = await supabase
    .from('vault_deals')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: pains } = await supabase
    .from('vault_pain_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  const { count: onlineCount } = await supabase
    .from('vault_members')
    .select('*', { count: 'exact', head: true })
    .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString())

  return (
    <div className="min-h-screen bg-black text-white">
      {/* NAV */}
      <nav className="border-b border-[#1F1F1F] bg-[#0A0A0A] px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#D4AF37]" /> {/* Eagle icon */}
          <span className="font-bold">VAULTFORGE</span>
        </div>
        <div className="flex gap-6 text-sm">
          <Link href="/members" className="text-[#D4AF37] border-b-2 border-[#D4AF37]">Members</Link>
          <Link href="/deals" className="text-[#71717A] hover:text-white">Deals</Link>
          <Link href="/pain" className="text-[#71717A] hover:text-white">Pain Board</Link>
          <Link href="/profile" className="text-[#71717A] hover:text-white">Profile</Link>
        </div>
      </nav>

      {/* TICKER */}
      <div className="bg-[#D4AF37] text-black py-2 px-4 text-sm font-bold">
        LIVE VAULT: {onlineCount || 0} MEMBERS ONLINE • {deals?.length || 0} NEW DEALS TODAY • {pains?.length || 0} ACTIVE PAIN POSTS
      </div>

      {/* DASHBOARD */}
      <div className="max-w-7xl mx-auto p-4 grid md:grid-cols-3 gap-6">
        {/* DEALS */}
        <div className="border border-[#1F1F1F] bg-[#0A0A0A]">
          <div className="border-b border-[#D4AF37] p-4">
            <h3 className="font-bold text-[#D4AF37]">VAULT DEALS</h3>
          </div>
          <div className="p-4 space-y-4">
            {deals?.length ? deals.map(d => (
              <div key={d.id} className="border border-[#1F1F1F] p-3">
                <p className="font-bold">{d.title}</p>
                <p className="text-[#71717A] text-sm">{d.city}, {d.state}</p>
                <p className="text-[#D4AF37]">${d.fee_amount?.toLocaleString()} Fee</p>
                <button className="w-full bg-[#1F1F1F] hover:bg-[#27272A] mt-2 py-2 text-sm border border-[#D4AF37]">
                  DM SELLER
                </button>
              </div>
            )) : <p className="text-[#71717A] text-sm">VAULT QUIET — AWAITING FIRST DEAL</p>}
          </div>
        </div>

        {/* PAIN BOARD */}
        <div className="border border-[#1F1F1F] bg-[#0A0A0A]">
          <div className="border-b border-[#DC2626] p-4">
            <h3 className="font-bold text-[#DC2626]">PAIN BOARD</h3>
          </div>
          <div className="p-4 space-y-4">
            {pains?.length ? pains.map(p => (
              <div key={p.id} className="border border-[#1F1F1F] p-3">
                <p className="font-bold">🚨 {p.title}</p>
                <p className="text-[#71717A] text-sm">{p.city}, {p.state}</p>
                <button className="w-full bg-[#1F1F1F] hover:bg-[#27272A] mt-2 py-2 text-sm border border-[#DC2626]">
                  CONTACT POSTER
                </button>
              </div>
            )) : <p className="text-[#71717A] text-sm">NO ACTIVE REQUESTS</p>}
          </div>
        </div>

        {/* INTEL FEED */}
        <div className="border border-[#1F1F1F] bg-[#0A0A0A]">
          <div className="border-b border-[#1F1F1F] p-4">
            <h3 className="font-bold">INTEL FEED</h3>
          </div>
          <div className="p-4 text-sm text-[#71717A]">
            <p>Activity log renders here from vault_activity_log</p>
          </div>
        </div>
      </div>
    </div>
  )
}
