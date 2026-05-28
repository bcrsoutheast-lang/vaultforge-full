'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function SavedDeals() {
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
      .eq('status', 'saved')
      .order('created_at', { ascending: false })
    setDeals(data || [])
  }

  const moveToArchive = async (id: number) => {
    await supabase.from('deals').update({ status: 'archived', closed_at: new Date().toISOString() }).eq('id', id)
    if (user?.email) fetchDeals(user.email)
  }

  const moveToTrash = async (id: number) => {
    await supabase.from('deals').update({ status: 'deleted', deleted_at: new Date().toISOString() }).eq('id', id)
    if (user?.email) fetchDeals(user.email)
  }

  if (!user) return null

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#E5E5E5', padding: '24px' }}>
      <header style={{ borderBottom: '1px solid #FFD700', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>SAVED DEALS</div>
          <div style={{ color: '#666', fontSize: '11px', letterSpacing: '2px' }}>WATCHLIST. ACTIVE DILIGENCE.</div>
        </div>
        <button onClick={() => router.push('/dashboard')} style={{ border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>← COMMAND CENTER</button>
      </header>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
            <th style={{ padding: '12px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>TITLE</th>
            <th style={{ padding: '12px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>CITY</th>
            <th style={{ padding: '12px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>TYPE</th>
            <th style={{ padding: '12px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>CREATED</th>
            <th style={{ padding: '12px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {deals.map(deal => (
            <tr key={deal.id} style={{ borderBottom: '1px solid #222' }}>
              <td style={{ padding: '16px', fontSize: '14px' }}>{deal.title}</td>
              <td style={{ padding: '16px', color: '#888', fontSize: '14px' }}>{deal.city}</td>
              <td style={{ padding: '16px', color: '#888', fontSize: '14px' }}>{deal.property_type}</td>
              <td style={{ padding: '16px', color: '#888', fontSize: '14px' }}>{new Date(deal.created_at).toLocaleDateString()}</td>
              <td style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                <button onClick={() => moveToArchive(deal.id)} style={{ border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '6px 12px', fontSize: '10px', cursor: 'pointer' }}>ARCHIVE</button>
                <button onClick={() => moveToTrash(deal.id)} style={{ border: '1px solid #FF6B6B', background: 'transparent', color: '#FF6B6B', padding: '6px 12px', fontSize: '10px', cursor: 'pointer' }}>DELETE</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {deals.length === 0 && <div style={{ textAlign: 'center', color: '#666', padding: '60px', fontSize: '12px', letterSpacing: '2px' }}>NO SAVED DEALS</div>}
    </div>
  )
}
