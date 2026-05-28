'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function RecycleBin() {
  const router = useRouter()
  const [deals, setDeals] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || !data.user.email) {
        router.push('/login')
      } else {
        setUser(data.user)
        fetchDeals(data.user.email)
      }
    })
  }, [])

  const fetchDeals = async (email: string) => {
    const { data } = await supabase
      .from('deals')
      .select('*')
      .eq('user_email', email)
      .eq('status', 'deleted')
      .order('deleted_at', { ascending: false })
    setDeals(data || [])
  }

  const restoreDeal = async (id: number) => {
    await supabase.from('deals').update({ status: 'saved', deleted_at: null }).eq('id', id)
    if (user?.email) fetchDeals(user.email)
  }

  const deleteForever = async (id: number, title: string) => {
    if (!confirm(`DELETE FOREVER: "${title}"?\n\nThis cannot be undone. All data will be permanently erased.`)) return
    await supabase.from('deals').delete().eq('id', id)
    if (user?.email) fetchDeals(user.email)
  }

  const emptyTrash = async () => {
    if (!confirm(`EMPTY RECYCLE BIN?\n\nThis will permanently delete ${deals.length} deals. Cannot be undone.`)) return
    if (!user?.email) return
    await supabase.from('deals').delete().eq('user_email', user.email).eq('status', 'deleted')
    fetchDeals(user.email)
  }

  const getDaysRemaining = (deleted_at: string) => {
    const deleted = new Date(deleted_at)
    const now = new Date()
    const diff = 30 - Math.floor((now.getTime() - deleted.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  if (!user) return null

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#E5E5E5', padding: '24px' }}>
      <header style={{ borderBottom: '1px solid #FF6B6B', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#FF6B6B', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>RECYCLE BIN</div>
          <div style={{ color: '#666', fontSize: '11px', letterSpacing: '2px' }}>DELETED DEALS. 30-DAY RECOVERY. DELETE FOREVER.</div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {deals.length > 0 && (
            <button onClick={emptyTrash} style={{ border: '1px solid #FF6B6B', background: 'transparent', color: '#FF6B6B', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#FF6B6B'; e.currentTarget.style.color = '#000' }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FF6B6B' }}>EMPTY TRASH</button>
          )}
          <button onClick={() => router.push('/dashboard')} style={{ border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#FFD700'; e.currentTarget.style.color = '#000' }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FFD700' }}>← COMMAND CENTER</button>
        </div>
      </header>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
            <th style={{ padding: '12px', color: '#FF6B6B', fontSize: '10px', letterSpacing: '2px' }}>TITLE</th>
            <th style={{ padding: '12px', color: '#FF6B6B', fontSize: '10px', letterSpacing: '2px' }}>CITY</th>
            <th style={{ padding: '12px', color: '#FF6B6B', fontSize: '10px', letterSpacing: '2px' }}>DELETED</th>
            <th style={{ padding: '12px', color: '#FF6B6B', fontSize: '10px', letterSpacing: '2px' }}>DAYS LEFT</th>
            <th style={{ padding: '12px', color: '#FF6B6B', fontSize: '10px', letterSpacing: '2px' }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {deals.map(deal => {
            const daysLeft = getDaysRemaining(deal.deleted_at)
            return (
              <tr key={deal.id} style={{ borderBottom: '1px solid #222', opacity: daysLeft === 0 ? 0.5 : 1 }}>
                <td style={{ padding: '16px', fontSize: '14px' }}>{deal.title}</td>
                <td style={{ padding: '16px', color: '#888', fontSize: '14px' }}>{deal.city}</td>
                <td style={{ padding: '16px', color: '#888', fontSize: '14px' }}>{new Date(deal.deleted_at).toLocaleDateString()}</td>
                <td style={{ padding: '16px', color: daysLeft <= 3 ? '#FF6B6B' : '#888', fontSize: '14px', fontWeight: daysLeft <= 3 ? '700' : '400' }}>{daysLeft} DAYS</td>
                <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => restoreDeal(deal.id)} style={{ border: '1px solid #444', background: 'transparent', color: '#888', padding: '6px 12px', fontSize: '10px', cursor: 'pointer', letterSpacing: '1px' }} onMouseEnter={(e) => { e.currentTarget.style.border = '1px solid #FFD700'; e.currentTarget.style.color = '#FFD700' }} onMouseLeave={(e) => { e.currentTarget.style.border = '1px solid #444'; e.currentTarget.style.color = '#888' }}>RESTORE</button>
                  <button onClick={() => deleteForever(deal.id, deal.title)} style={{ border: '1px solid #FF6B6B', background: 'transparent', color: '#FF6B6B', padding: '6px 12px', fontSize: '10px', cursor: 'pointer', letterSpacing: '1px' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#FF6B6B'; e.currentTarget.style.color = '#000' }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FF6B6B' }}>DELETE FOREVER</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {deals.length === 0 && <div style={{ textAlign: 'center', color: '#666', padding: '60px', fontSize: '12px', letterSpacing: '2px' }}>RECYCLE BIN EMPTY</div>}
    </div>
  )
}
