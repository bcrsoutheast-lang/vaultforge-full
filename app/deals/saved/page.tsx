"use client";
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function SavedDeals() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [deals, setDeals] = useState<any[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || !data.user.email) router.push('/login')
      else {
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
    if (data) setDeals(data)
  }

  const archiveDeal = async (id: string) => {
    await supabase.from('deals').update({ status: 'archived' }).eq('id', id)
    if (user?.email) fetchDeals(user.email)
  }

  const deleteDeal = async (id: string) => {
    await supabase.from('deals').update({ status: 'deleted', deleted_at: new Date().toISOString() }).eq('id', id)
    if (user?.email) fetchDeals(user.email)
  }

  if (!user) return null

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#E5E5E5', padding: '24px' }}>
      <header style={{ borderBottom: '1px solid #FFD700', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Image src="/vaultforge-logo.png" alt="VaultForge" width={40} height={40} style={{ objectFit: 'contain' }} />
          <div>
            <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>SAVED DEALS</div>
            <div style={{ color: '#666', fontSize: '11px', letterSpacing: '2px' }}>ACTIVE INTEL. OPERATIONAL.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => router.push('/deals/new')} style={{ border: '1px solid #FFD700', background: '#FFD700', color: '#000', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ ADD DEAL</button>
          <button onClick={() => router.push('/dashboard')} style={{ border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>← COMMAND CENTER</button>
        </div>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333' }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>DEAL</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>TYPE</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>CITY</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>ASK</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>AI SCORE</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>OPS</th>
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>NO SAVED DEALS</td></tr>
            ) : deals.map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '12px 8px' }}>{d.title}</td>
                <td style={{ padding: '12px 8px', textTransform: 'uppercase' }}>{d.deal_type || 'RESIDENTIAL'}</td>
                <td style={{ padding: '12px 8px' }}>{d.city || '—'}</td>
                <td style={{ padding: '12px 8px' }}>{d.asking_price ? `$${Number(d.asking_price).toLocaleString()}` : '—'}</td>
                <td style={{ padding: '12px 8px', color: d.ai_score ? '#FFD700' : '#666' }}>{d.ai_score || '—'}</td>
                <td style={{ padding: '12px 8px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => archiveDeal(d.id)} style={{ border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '6px 12px', fontSize: '10px', cursor: 'pointer' }}>ARCHIVE</button>
                  <button onClick={() => deleteDeal(d.id)} style={{ border: '1px solid #FF6B6B', background: 'transparent', color: '#FF6B6B', padding: '6px 12px', fontSize: '10px', cursor: 'pointer' }}>DELETE</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
