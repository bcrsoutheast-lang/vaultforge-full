import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

// Server Actions
async function approveMember(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const role = formData.get('role') as string
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  )
  
  const { data: founderCount } = await supabase.rpc('get_founders_count')
  const isFounders = (founderCount || 0) < 100
  const founderNumber = isFounders ? (founderCount || 0) + 1 : null
  
  await supabase
    .from('vault_members')
    .update({ 
      status: isFounders ? 'active_founder' : 'active_member',
      founder_number: founderNumber,
      role: role
    })
    .eq('id', id)
  
  revalidatePath('/admin')
}

async function denyMember(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  )
  
  await supabase.from('vault_members').update({ status: 'rejected' }).eq('id', id)
  revalidatePath('/admin')
}

async function deleteMember(formData: FormData) {
  'use server'
  const id = formData.get('id') as string
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  )
  
  await supabase.from('vault_members').delete().eq('id', id)
  revalidatePath('/admin')
}

export default async function AdminPage() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // HARD GATE — Admin only. Members get kicked to /members
  const { data: me } = await supabase
    .from('vault_members')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  if (me?.role !== 'admin') {
    redirect('/members')
  }

  const { data: pending } = await supabase
    .from('vault_members')
    .select('*')
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: true })

  const { data: active } = await supabase
    .from('vault_members')
    .select('*')
    .in('status', ['active_founder','active_member','admin'])
    .order('created_at', { ascending: false })

  const { data: founderCount } = await supabase.rpc('get_founders_count')

  return (
    <div className="min-h-screen bg-vault-black text-white">
      <div className="border-b border-vault-gold bg-vault-bg p-4">
        <h1 className="text-2xl font-bold text-vault-gold">VAULTFORGE ADMIN</h1>
        <p className="text-vault-muted text-sm">Founders: {founderCount || 0}/100</p>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-8">
        
        {/* PENDING APPROVALS */}
        <div className="border border-vault-border bg-vault-bg">
          <div className="border-b border-vault-gold p-4">
            <h2 className="font-bold text-vault-gold">PENDING APPROVAL — {pending?.length || 0}</h2>
          </div>
          <div className="p-4">
            {!pending?.length && <p className="text-vault-muted">No pending members</p>}
            {pending?.map(m => (
              <div key={m.id} className="border border-vault-border p-4 mb-4">
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-vault-muted text-xs">NAME</p>
                    <p className="font-bold">{m.full_name}</p>
                  </div>
                  <div>
                    <p className="text-vault-muted text-xs">EMAIL</p>
                    <p className="text-sm">{m.email}</p>
                  </div>
                  <div>
                    <p className="text-vault-muted text-xs">PHONE</p>
                    <p className="text-sm">{m.phone}</p>
                  </div>
                  <div>
                    <p className="text-vault-muted text-xs">REQUESTED ROLE</p>
                    <p className="text-vault-gold font-bold">{m.role?.toUpperCase()}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-vault-muted text-xs">STATES</p>
                  <p className="text-sm">{m.states?.join(', ')}</p>
                </div>
                <div className="mb-4">
                  <p className="text-vault-muted text-xs">BUY BOX / BIO</p>
                  <p className="text-sm">{m.buy_box}</p>
                </div>
                
                <div className="flex gap-2">
                  <form action={approveMember}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="role" value={m.role} />
                    <button className="bg-vault-gold hover:bg-vault-gold-hover text-black font-bold py-2 px-6">
                      APPROVE
                    </button>
                  </form>
                  <form action={denyMember}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="bg-vault-border hover:bg-[#27272A] text-white font-bold py-2 px-6 border border-vault-red">
                      DENY
                    </button>
                  </form>
                  <a 
                    href={`mailto:${m.email}?subject=VaultForge Membership`}
                    className="bg-vault-border hover:bg-[#27272A] text-white font-bold py-2 px-6 border border-vault-muted inline-block"
                  >
                    MESSAGE
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ACTIVE MEMBERS */}
        <div className="border border-vault-border bg-vault-bg">
          <div className="border-b border-vault-border p-4">
            <h2 className="font-bold">ACTIVE MEMBERS — {active?.length || 0}</h2>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-vault-muted text-left">
                <tr>
                  <th className="pb-2 pr-4">NAME</th>
                  <th className="pb-2 pr-4">ROLE</th>
                  <th className="pb-2 pr-4">STATUS</th>
                  <th className="pb-2 pr-4">FOUNDER #</th>
                  <th className="pb-2">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {active?.map(m => (
                  <tr key={m.id} className="border-t border-vault-border">
                    <td className="py-3 pr-4">{m.full_name}</td>
                    <td className="py-3 pr-4 text-vault-gold">{m.role?.toUpperCase()}</td>
                    <td className="py-3 pr-4">
                      {m.role === 'admin' ? 'ADMIN' : m.status === 'active_founder' ? 'FOUNDER' : 'MEMBER'}
                    </td>
                    <td className="py-3 pr-4">{m.founder_number || '—'}</td>
                    <td className="py-3">
                      {m.role !== 'admin' && (
                        <form action={deleteMember} className="inline">
                          <input type="hidden" name="id" value={m.id} />
                          <button className="text-vault-red hover:underline text-xs">
                            DELETE
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
