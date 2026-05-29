"use client";
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'

export default function DealDetail() {
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<any>(null)
  const [deal, setDeal] = useState<any>(null)
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
        fetchDeal(params.id as string, data.user.id)
      }
    })
  }, [params.id])

  const fetchDeal = async (id: string, userId: string) => {
    const { data } = await supabase
  .from('deals')
  .select('*')
  .eq('id', id)
  .eq('user_id', userId)
  .single()

    if (data) {
      setDeal(data)
      setNotes(data.notes || '')
      if (!data.viewed) {
        await supabase.from('deals').update({ viewed: true }).eq('id', id)
      }
    } else {
      router.push('/deals/saved')
    }
  }

  const handleSave = async () => {
    if (!deal ||!user) return
    setSaving(true)

    const { error } = await supabase
  .from('deals')
  .update({ notes, updated_at: new Date().toISOString() })
  .eq('id', deal.id)
  .eq('user_id', user.id)

    setSaving(false)
    if (error) alert(`Error: ${error.message}`)
    else alert('DEAL UPDATED')
  }

  const handleArchive = async () => {
    if (!deal ||!user) return
    if (!confirm('Archive this deal?')) return

    const { error } = await supabase
  .from('deals')
  .update({ archived: true, status: 'archived' })
  .eq('id', deal.id)
  .eq('user_id', user.id)

    if (error) alert(`Error: ${error.message}`)
    else {
      alert('ARCHIVED')
      router.push('/deals/saved')
    }
  }

  const handleDelete = async () => {
    if (!deal ||!user) return
    if (!confirm('PERMANENTLY DELETE this deal? Cannot undo.')) return

    const { error } = await supabase
  .from('deals')
  .delete()
  .eq('id', deal.id)
  .eq('user_id', user.id)

    if (error) alert(`Error: ${error.message}`)
    else {
      alert('DELETED')
      router.push('/deals/saved')
    }
  }

  if (!user ||!deal) return <div style={{ background: '#000', minHeight: '100vh' }} />

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#E5E5E5', padding: '24px' }}>
      <header style={{ borderBottom: '1px solid #FFD700', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Image src="/IMG_4751.png" alt="VaultForge" width={40} height={40} style={{ objectFit: 'contain' }} />
          <div>
            <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>DEAL INTEL</div>
            <div style={{ color: '#666', fontSize: '11px', letterSpacing: '2px' }}>{deal.archived? 'ARCHIVED' : 'ACTIVE'}</div>
          </div>
        </div>
        <button onClick={() => router.push('/deals/saved')} style={{ border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>← SAVED DEALS</button>
      </header>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div>
            {deal.photos?.[0]? (
              <img src={deal.photos[0]} style={{ width: '100%', height: '300px', objectFit: 'cover', border: '1px solid #333' }} />
            ) : (
              <div style={{ width: '100%', height: '300px', background: '#111', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', color: '#333' }}>🏠</div>
            )}
          </div>
          <div>
            <div style={{ color: '#FFD700', fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>
              {deal.asking_price? `$${Number(deal.asking_price).toLocaleString()}` : 'TBD'}
            </div>
            <div style={{ fontSize: '18px', marginBottom: '16px' }}>
              {deal.address}{deal.city && `, ${deal.city}`}{deal.state && `, ${deal.state}`}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '12px', color: '#888', marginBottom: '16px' }}>
              <div><b style={{ color: '#E5E5E5' }}>{deal.bedrooms || '—'}</b> BD</div>
              <div><b style={{ color: '#E5E5E5' }}>{deal.bathrooms || '—'}</b> BA</div>
              <div><b style={{ color: '#E5E5E5' }}>{deal.sqft? `${Number(deal.sqft).toLocaleString()}` : '—'}</b> SQFT</div>
            </div>
            {deal.analysis?.deal_score && (
              <div style={{ border: '1px solid #FFD700', background: '#111', padding: '12px', fontSize: '12px' }}>
                <b style={{ color: '#FFD700' }}>DEAL SCORE:</b> {deal.analysis.deal_score} | MAO: ${Number(deal.analysis.mao).toLocaleString()}
              </div>
            )}
          </div>
        </div>

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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <button onClick={handleSave} disabled={saving} style={{ border: '1px solid #FFD700', background: '#FFD700', color: '#000', padding: '14px', fontSize: '12px', fontWeight: '900', cursor: saving? 'not-allowed' : 'pointer' }}>
            {saving? 'SAVING...' : 'SAVE'}
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
