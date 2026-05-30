import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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

  if (!member || !['active_founder','active_member','admin'].includes(member.status)) {
    redirect('/profile')
  }

  // RLS ensures these only return YOUR deals/pain, not others
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

  return (
    <div className="min-h-screen bg-vault-black text-white">
      <nav className="border-b border-vault-border bg-vault-bg px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-vault-gold" />
          <span className="font-bold tracking-wider">VAULTFORGE</span>
        </div>
        <div className="flex gap-6 text-sm font-semibold">
          <Link href="/members" className="text-vault-gold border-b-2 border-vault-gold pb-1">Dashboard</Link>
          <Link href="/deals/new" className="text-vault-muted hover:text-white">Post Deal</Link>
          <Link href="/pain/new" className="text-vault-muted hover:text-white">Post Request</Link>
          <Link href="/profile" className="text-vault-muted hover:text-white">Profile</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="border border-vault-gold bg-vault-bg p-6">
          <h2 className="text-vault-gold font-bold text-xl mb-2">VAULT SECURED</h2>
          <p className="text-vault-muted">Welcome, {member.full_name}</p>
          <p className="text-sm">
            Role: <span className="text-vault-gold">{member.role?.toUpperCase()}</span> | 
            Status: <span className="text-vault-gold">{member.status === 'active_founder' ? ` FOUNDER #${member.founder_number}` : member.status === 'admin' ? ' ADMIN' : ' MEMBER'}</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-vault-border bg-vault-bg">
            <div className="border-b border-vault-gold p-4">
              <h3 className="font-bold text-vault-gold">YOUR DEALS</h3>
            </div>
            <div className="p-4 space-y-3">
              {deals?.length ? deals.map(d => (
                <div key={d.id} className="border border-vault-border p-3">
                  <p className="font-bold">{d.title}</p>
                  <p className="text-vault-muted text-sm">{d.city}, {d.state}</p>
                  <p className="text-vault-gold">${d.fee_amount?.toLocaleString()} Fee</p>
                </div>
              )) : <p className="text-vault-muted text-sm">No deals posted yet</p>}
              <Link href="/deals/new" className="block w-full bg-vault-gold hover:bg-vault-gold-hover text-black font-bold py-2 mt-4 text-center">
                POST DEAL
              </Link>
            </div>
          </div>

          <div className="border border-vault-border bg-vault-bg">
            <div className="border-b border-vault-red p-4">
              <h3 className="font-bold text-vault-red">YOUR REQUESTS</h3>
            </div>
            <div className="p-4 space-y-3">
              {pains?.length ? pains.map(p => (
                <div key={p.id} className="border border-vault-border p-3">
                  <p className="font-bold">🚨 {p.title}</p>
                  <p className="text-vault-muted text-sm">{p.city}, {p.state}</p>
                </div>
              )) : <p className="text-vault-muted text-sm">No requests posted yet</p>}
              <Link href="/pain/new" className="block w-full bg-vault-red hover:bg-red-700 text-white font-bold py-2 mt-4 text-center">
                POST REQUEST
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
