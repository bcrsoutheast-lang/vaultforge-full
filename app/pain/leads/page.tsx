"use client";
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function PainLeads() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [leads, setLeads] = useState<any[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || !data.user.email) router.push('/login')
      else {
        setUser(data.user)
        fetchLeads(data.user.email)
      }
    })
  }, [])

  const fetchLeads = async (email: string) => {
    const { data } = await supabase
     .from('pain_intake')
     .select('*')
     .eq('user_email', email)
     .order('pain_score', { ascending: false })
    if (data) setLeads(data)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#FF6B6B'
    if (score >= 60) return '#FFD700'
    return '#666'
  }

  if (!user) return null

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

      {leads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>NO PAIN LEADS. START INTAKE.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {leads.map(l => (
            <div key={l.id} onClick={() => router.push(`/pain/${l.id}`)} style={{ border: '1px solid #333', background: '#111', cursor: 'pointer', transition: 'border 0.2s' }} onMouseEnter={e => e.currentTarget.style.border = '1px solid #FFD700'} onMouseLeave={e => e.currentTarget.style.border = '1px solid #333'}>
              <div style={{ position: 'relative', width: '100%', height: '200px', background: '#000' }}>
                {l.photos?.[0] ? (
                  <img src={l.photos[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '48px' }}>⚡</div>
                )}
                <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#000', border: '1px solid #FFD700', color: '#FFD700', padding: '4px 12px', fontSize: '10px', fontWeight: '700', letterSpacing: '1px' }}>
                  {l.problem_class?.toUpperCase() || 'PAIN'}
                </div>
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: getScoreColor(l.pain_score || 0), color: '#000', padding: '4px 12px', fontSize: '14px', fontWeight: '900' }}>
                  {l.pain_score || '—'}
                </div>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ color: '#FFD700', fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                  {l.asking_price ? `$${Number(l.asking_price).toLocaleString()}` : 'ASK TBD'}
                </div>
                <div style={{ color: '#E5E5E5', fontSize: '14px', marginBottom: '12px' }}>
                  {l.city}{l.state ? `, ${l.state}` : ''} {l.address && `| ${l.address}`}
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px', borderTop: '1px solid #222', paddingTop: '12px' }}>
                  <b style={{ color: '#E5E5E5' }}>ROOT:</b> {l.root_cause || l.why1 || 'Unknown'}
                </div>
                {l.ai_analysis?.strategy && (
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    STRATEGY: <span style={{ color: '#FFD700' }}>{l.ai_analysis.strategy}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
