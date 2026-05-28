'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function DealArchive() {
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
      .eq('status', 'archived')
      .order('closed_at', { ascending: false })
    setDeals(data || [])
  }

  const restoreDeal = async (id: number) => {
    await supabase.from('deals').update({ status: 'saved', closed_at: null }).eq('id', id)
    if (user?.email) fetchDeals(user.email)
  }

  if (!user) return null

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#E5E5E5', padding: '24px' }}>
      <header style={{ borderBottom: '1px solid #FFD700', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>DEAL ARCHIVE</div>
          <div style={{ color: '#666', fontSize: '11px', letterSpacing: '2px' }}>CLOSED & COMPLETED TRANSACTIONS. READ-ONLY VAULT.</div>
        </div>
        <button onClick={() => router.push('/dashboard')} style={{ border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#FFD700'; e.currentTarget.style.color = '#000' }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FFD700' }}>← COMMAND CENTER</button>
      </header>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
            <th style={{ padding: '12px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>TITLE</th>
            <th style={{ padding: '12px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>CITY</th>
            <th style={{ padding: '12px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>TYPE</th>
            <th style={{ padding: '12px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>CLOSED</th>
            <th style={{ padding: '12px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>COMMISSION</th>
            <th style={{ padding: '12px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {deals.map(deal => (
            <tr key={deal.id} style={{ borderBottom: '1px solid #222' }}>
              <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600' }}>{deal.title}</td>
              <td style={{ padding: '16px', color: '#888', fontSize: '14px' }}>{deal.city}</td>
              <td style={{ padding: '16px', color: '#888', fontSize: '14px' }}>{deal.property_type}</td>
              <td style={{ padding: '16px', color: '#888', fontSize: '14px' }}>{deal.closed_at ? new Date(deal.closed_at).toLocaleDateString() : '-'}</td>
              <td style={{ padding: '16px', color: '#FFD700', fontSize: '14px', fontWeight: '700' }}>${deal.commission_earned?.toLocaleString() || '0'}</td>
              <td style={{ padding: '16px' }}>
                <button onClick={() => restoreDeal(deal.id)} style={{ border: '1px solid #444', background: 'transparent', color: '#888', padding: '6px 12px', fontSize: '10px', cursor: 'pointer', letterSpacing: '1px' }} onMouseEnter={(e) => { e.currentTarget.style.border = '1px solid #FFD700'; e.currentTarget.style.color = '#FFD700' }} onMouseLeave={(e) => { e.currentTarget.style.border = '1px solid #444'; e.currentTarget.style.color = '#888' }}>RESTORE</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {deals.length === 0 && <div style={{ textAlign: 'center', color: '#666', padding: '60px', fontSize: '12px', letterSpacing: '2px' }}>NO ARCHIVED DEALS</div>}
    </div>
  )
}
