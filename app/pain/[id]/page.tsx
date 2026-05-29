"use client";
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'

export default function PainDetail() {
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<any>(null)
  const [pain, setPain] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else {
        setUser(data.user)
        fetchPain(params.id as string, data.user.id)
      }
    })
  }, [params.id])

  const fetchPain = async (id: string, userId: string) => {
    const { data } = await supabase
    .from('pain_intake')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
    
    if (data) {
      setPain(data)
      setNotes(data.notes || '')
      // Mark viewed when opening
      if (!data.viewed) {
        await supabase.from('pain_intake').update({ viewed: true }).eq('id', id)
      }
    } else {
      router.push('/pain/leads')
    }
  }

  const handleSave = async () => {
    if (!pain ||!user) return
    setSaving(true)
    
    const { error } = await supabase
    .from('pain_intake')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('id', pain.id)
    .eq('user_id', user.id)

    setSaving(false)
    if (error) alert(`Error: ${error.message}`)
    else alert('PAIN UPDATED')
  }

  const handleArchive = async () => {
    if (!pain ||!user) return
    if (!confirm('Archive this pain lead?')) return
    
    const { error } = await supabase
    .from('pain_intake')
    .update({ archived: true, status: 'archived' })
    .eq('id', pain.id)
    .eq('user_id', user.id)

    if (error) alert(`Error: ${error.message}`)
    else {
      alert('ARCHIVED')
      router.push('/pain/leads')
    }
  }

  const handleDelete = async () => {
    if (!pain ||!user) return
    if (!confirm('PERMANENTLY DELETE this pain lead? Cannot undo.')) return
    
    const { error } = await supabase
    .from('pain_intake')
    .delete()
    .eq('id', pain.id)
    .eq('user_id', user.id)

    if (error) alert(`Error: ${error.message}`)
    else {
      alert('DELETED')
      router.push('/pain/leads')
    }
  }

  const handleConvertToDeal = async () => {
    if (!pain ||!user) return
    
    const { data, error } = await supabase.from('deals').insert({
      user_id: user.id,
      user_email: user.email,
      viewed: false,
      title: pain.address || 'Converted Pain',
      address: pain.address,
      city: pain.city,
      state: pain.state,
      asking_price: pain.asking_price,
      notes: `ROOT CAUSE: ${pain.root_cause}\n\nSTRATEGY: ${pain.ai_analysis?.strategy}\n\nWHY 1: ${pain.why1}\nWHY 2: ${pain.why2}\nWHY 3: ${pain.why3}\nWHY 4: ${pain.why4}`,
      photos: pain.photos,
      deal_type: 'residential'
    }).select().single()

    if (error) alert(`Error: ${error.message}`)
    else {
      alert('CONVERTED TO DEAL')
      router.push(`/deals/${data.id}`)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#FF6B6B'
    if (score >= 60) return '#FFD700'
    return '#666'
  }

  if (!user ||!pain) return <div style={{ background: '#000', minHeight: '100vh' }} />

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#E5E5E5', padding: '24px' }}>
      <header style={{ borderBottom: '1px solid #FFD700', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Image src="/IMG_4751.png" alt="VaultForge" width={40} height={40} style={{ objectFit: 'contain' }} />
          <div>
            <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>PAIN INTEL</div>
            <div style={{ color: '#666', fontSize: '11px', letterSpacing: '2px' }}>CLASSIFIED. {pain.archived? 'ARCHIVED' : 'ACTIVE'}</div>
          </div>
        </div>
        <button onClick={() => router.push('/pain/leads')} style={{ border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>← PAIN LEADS</button>
      </header>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Hero Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div>
            {pain.photos?.[0]? (
              <img src={pain.photos[0]} style={{ width: '100%', height: '300px', objectFit: 'cover', border: '1px solid #333' }} />
            ) : (
              <div style={{ width: '100%', height: '300px', background: '#111', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', color: '#333' }}>⚡</div>
            )}
          </div>
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: getScoreColor(pain.pain_score || 0), color: '#000', padding: '8px 16px', fontSize: '24px', fontWeight: '900' }}>
                {pain.pain_score || '—'}
              </div>
              <div style={{ border: '1px solid #FFD700', color: '#FFD700', padding: '8px 16px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center' }}>
                {pain.problem_class || 'UNKNOWN'}
              </div>
            </div>
            <div style={{ color: '#FFD700', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
              {pain.asking_price? `$${Number(pain.asking_price).toLocaleString()}` : 'ASK TBD'}
            </div>
            <div style={{ fontSize: '18px', marginBottom: '16px' }}>
              {pain.address}{pain.city && `, ${pain.city}`}{pain.state && `, ${pain.state}`}
            </div>
            {pain.ai_analysis?.strategy && (
              <div style={{ border: '1px solid #333', background: '#111', padding: '12px', fontSize: '12px' }}>
                <b style={{ color: '#FFD700' }}>AI STRATEGY:</b> {pain.ai_analysis.strategy}
              </div>
            )}
          </div>
        </div>

        {/* 5 Whys */}
        <div style={{ border: '1px solid #333', background: '#111', padding: '16px', marginBottom: '24px' }}>
          <div style={{ color: '#FFD700', fontSize: '14px', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px' }}>5 WHYS ANALYSIS</div>
          <div style={{ display: 'grid', gap: '12px', fontSize: '13px' }}>
            <div><b style={{ color: '#888' }}>WHY 1:</b> {pain.why1 || '—'}</div>
            <div><b style={{ color: '#888' }}>WHY 2:</b> {pain.why2 || '—'}</div>
            <div><b style={{ color: '#888' }}>WHY 3:</b> {pain.why3 || '—'}</div>
            <div><b style={{ color: '#888' }}>WHY 4:</b> {pain.why4 || '—'}</div>
            <div style={{ borderTop: '1px solid #333', paddingTop: '12px', marginTop: '8px' }}>
              <b style={{ color: '#FFD700' }}>ROOT CAUSE:</b> {pain.root_cause || '—'}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ color: '#FFD700', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>NOTES / INTEL</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={6}
            placeholder="Add notes, call logs, seller intel..."
            style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#E5E5E5', padding: '12px', fontSize: '14px', resize: 'vertical' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <button onClick={handleSave} disabled={saving} style={{ border: '1px solid #FFD700', background: '#FFD700', color: '#000', padding: '14px', fontSize: '12px', fontWeight: '900', cursor: saving? 'not-allowed' : 'pointer' }}>
            {saving? 'SAVING...' : 'SAVE'}
          </button>
          <button onClick={handleConvertToDeal} style={{ border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '14px', fontSize: '12px', fontWeight: '900', cursor: 'pointer' }}>
            CONVERT TO DEAL
          </button>
          <button onClick={handleArchive} style={{ border: '1px solid #666', background: 'transparent', color: '#E5E5E5', padding: '14px', fontSize: '12px', fontWeight: '900', cursor: 'pointer' }}>
            ARCHIVE
          </button>
          <button onClick={handleDelete} style={{ border: '1px solid #FF6B6B', background: 'transparent', color: '#FF6B6B', padding: '14px', fontSize: '12px', fontWeight: '900', cursor: 'pointer' }}>
            DELETE + EXIT
          </button>
        </div>
      </div>
    </div>
  )
}
