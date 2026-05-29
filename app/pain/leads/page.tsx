"use client";
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function PainLeads() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [leads, setLeads] = useState<any[]>([])
  const [filter, setFilter] = useState('all')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user ||!data.user.email) router.push('/login')
      else {
        setUser(data.user)
        fetchLeads(data.user.email)
      }
    })
  }, [])

  const fetchLeads = async (email: string) => {
    let query = supabase
     .from('pain_intake')
     .select('*')
     .eq('user_email', email)
     .order('pain_score', { ascending: false })
     .order('created_at', { ascending: false })

    if (filter!== 'all') query = query.eq('status', filter)

    const { data } = await query
    if (data) setLeads(data)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('pain_intake').update({ status }).eq('id', id)
    if (user?.email) fetchLeads(user.email)
  }

  const convertToDeal = async (lead: any) => {
    // Pre-fill deal form with lead data
    const dealPayload = {
      user_email: user.email,
      title: `${lead.address} - ${lead.problem_class} Deal`,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      asking_price: lead.asking_price,
      seller_motivation: lead.stress_level,
      notes: `Pain Score: ${lead.pain_score}. Root: ${lead.root_cause}. Strategy: ${lead.ai_analysis?.strategy}. Kaizen: ${lead.kaizen_fix}`,
      status: 'saved',
      deal_type: 'residential'
    }

    const { error } = await supabase.from('deals').insert(dealPayload)
    if (!error) {
      await updateStatus(lead.id, 'converted')
      router.push('/deals/saved')
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#FF6B6B' // Red hot
    if (score >= 60) return '#FFD700' // Gold warm
    return '#666' // Cold
  }

  useEffect(() => {
    if (user?.email) fetchLeads(user.email)
  }, [filter])

  if (!user) return null

  const btnStyle = (active: boolean) => ({
    flex: 1,
    border: `1px solid ${active? '#FFD700' : '#333'}`,
    background: active? '#FFD700' : 'transparent',
    color: active? '#000' : '#888',
    padding: '12px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '1px'
  })

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#E5E5E5', padding: '24px' }}>
      <header style={{ borderBottom: '1px solid #FFD700', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Image src="/IMG_4751.png" alt="VaultForge" width={40} height={40} style={{ objectFit: 'contain' }} />
          <div>
            <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>PAIN LEADS</div>
            <div style={{ color: '#666', fontSize: '11px', letterSpacing: '2px' }}>RANKED BY PAIN SCORE. HOTTEST FIRST.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => router.push('/pain/new')} style={{ border: '1px solid #FFD700', background: '#FFD700', color: '#000', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ NEW INTAKE</button>
          <button onClick={() => router.push('/dashboard')} style={{ border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>← COMMAND CENTER</button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button onClick={() => setFilter('all')} style={btnStyle(filter === 'all')}>ALL</button>
        <button onClick={() => setFilter('new')} style={btnStyle(filter === 'new')}>NEW</button>
        <button onClick={() => setFilter('hot')} style={btnStyle(filter === 'hot')}>HOT</button>
        <button onClick={() => setFilter('warm')} style={btnStyle(filter === 'warm')}>WARM</button>
        <button onClick={() => setFilter('converted')} style={btnStyle(filter === 'converted')}>CONVERTED</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333' }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>SCORE</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>ADDRESS</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>ROOT CAUSE</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>STRATEGY</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>ASK</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>STATUS</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', color: '#FFD700', fontSize: '10px', letterSpacing: '2px' }}>OPS</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>NO PAIN LEADS. START INTAKE.</td></tr>
            ) : leads.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '12px 8px', color: getScoreColor(l.pain_score || 0), fontWeight: '900', fontSize: '18px' }}>{l.pain_score || '—'}</td>
                <td style={{ padding: '12px 8px' }}>{l.address || '—'}</td>
                <td style={{ padding: '12px 8px', fontSize: '12px', color: '#888' }}>{l.root_cause || l.problem_class}</td>
                <td style={{ padding: '12px 8px', color: '#FFD700' }}>{l.ai_analysis?.strategy || '—'}</td>
                <td style={{ padding: '12px 8px' }}>{l.asking_price? `$${Number(l.asking_price).toLocaleString()}` : '—'}</td>
                <td style={{ padding: '12px 8px', textTransform: 'uppercase', fontSize: '11px' }}>{l.status}</td>
                <td style={{ padding: '12px 8px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => convertToDeal(l)} style={{ border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '6px 12px', fontSize: '10px', cursor: 'pointer' }}>CONVERT</button>
                  <button onClick={() => updateStatus(l.id, 'hot')} style={{ border: '1px solid #FF6B6B', background: 'transparent', color: '#FF6B6B', padding: '6px 12px', fontSize: '10px', cursor: 'pointer' }}>HOT</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
