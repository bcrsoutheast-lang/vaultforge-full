"use client";
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function SavedDeals() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [deals, setDeals] = useState<any[]>([])
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [showMessageModal, setShowMessageModal] = useState<any>(null)
  const [messageBody, setMessageBody] = useState('')
  const [viewArchived, setViewArchived] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else {
        setUser(data.user)
        fetchDeals(data.user.id, false)
        fetchUnreadCount(data.user.id)
      }
    })
  }, [])

  const fetchDeals = async (userId: string, archived: boolean) => {
    const { data } = await supabase
  .from('deals')
  .select('*')
  .eq('user_id', userId)
  .eq('archived', archived)
  .order('created_at', { ascending: false })
    if (data) setDeals(data)
  }

  const fetchUnreadCount = async (userId: string) => {
    const { count } = await supabase
  .from('messages')
  .select('*', { count: 'exact', head: true })
  .eq('receiver_id', userId)
  .eq('read', false)
    setUnreadMessages(count || 0)
  }

  const toggleArchiveView = () => {
    const newView =!viewArchived
    setViewArchived(newView)
    if (user) fetchDeals(user.id, newView)
  }

  const markDealViewed = async (dealId: number) => {
    await supabase.from('deals').update({ viewed: true }).eq('id', dealId)
    router.push(`/deals/${dealId}`)
  }

  const sendMessage = async () => {
    if (!messageBody ||!showMessageModal ||!user) return

    await supabase.from('messages').insert({
      sender_id: user.id,
      sender_name: user.user_metadata?.full_name || user.email,
      receiver_id: showMessageModal.user_id || user.id,
      receiver_name: showMessageModal.user_email || 'Owner',
      deal_id: showMessageModal.id,
      subject: `Re: ${showMessageModal.title || showMessageModal.address}`,
      body: messageBody,
      read: false
    })

    setMessageBody('')
    setShowMessageModal(null)
  }

  if (!user) return null

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#E5E5E5', padding: '24px' }}>
      <style jsx>{`
        @keyframes pulse-gold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
          50% { box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
        }
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7); }
          50% { box-shadow: 0 0 0 10px rgba(255, 107, 107, 0); }
        }
    .pulse-new { animation: pulse-gold 2s infinite; }
    .pulse-msg { animation: pulse-red 2s infinite; }
      `}</style>

      <header style={{ borderBottom: '1px solid #FFD700', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Image src="/IMG_4751.png" alt="VaultForge" width={40} height={40} style={{ objectFit: 'contain' }} />
          <div>
            <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>
              {viewArchived? 'DEAL ARCHIVE' : 'SAVED DEALS'}
            </div>
            <div style={{ color: '#666', fontSize: '11px', letterSpacing: '2px' }}>
              {viewArchived? 'ARCHIVED VAULT' : 'VAULT INVENTORY. CLASSIFIED.'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={toggleArchiveView}
            style={{
              border: '1px solid #666',
              background: 'transparent',
              color: '#E5E5E5',
              padding: '10px 20px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}>
            {viewArchived? 'VIEW ACTIVE' : 'VIEW ARCHIVE'}
          </button>
          <button
            onClick={() => router.push('/messages')}
            className={unreadMessages > 0? 'pulse-msg' : ''}
            style={{
              position: 'relative',
              border: '1px solid #FF6B6B',
              background: 'transparent',
              color: '#FF6B6B',
              padding: '10px 20px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}>
            MESSAGES {unreadMessages > 0 && `(${unreadMessages})`}
          </button>
          <button onClick={() => router.push('/deals/new')} style={{ border: '1px solid #FFD700', background: '#FFD700', color: '#000', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>+ ADD DEAL</button>
          <button onClick={() => router.push('/dashboard')} style={{ border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>← COMMAND CENTER</button>
        </div>
      </header>

      {deals.length === 0? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
          {viewArchived? 'NO ARCHIVED DEALS.' : 'NO DEALS IN VAULT. ADD ONE.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {deals.map(d => (
            <div
              key={d.id}
              className={!d.viewed &&!viewArchived? 'pulse-new' : ''}
              style={{
                border: `1px solid ${!d.viewed &&!viewArchived? '#FFD700' : '#333'}`,
                background: '#111',
                transition: 'border 0.2s',
                opacity: d.archived? 0.6 : 1
              }}>
              <div style={{ position: 'relative', width: '100%', height: '200px', background: '#000' }}>
                {d.photos?.[0]? (
                  <img src={d.photos[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '48px' }}>🏠</div>
                )}
                <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#000', border: '1px solid #FFD700', color: '#FFD700', padding: '4px 12px', fontSize: '10px', fontWeight: '700', letterSpacing: '1px' }}>
                  {d.deal_type?.toUpperCase() || 'RESIDENTIAL'}
                </div>
                {d.analysis?.deal_score && (
                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#FFD700', color: '#000', padding: '4px 12px', fontSize: '14px', fontWeight: '900' }}>
                    {d.analysis.deal_score}
                  </div>
                )}
                {!d.viewed &&!viewArchived && (
                  <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: '#FFD700', color: '#000', padding: '4px 12px', fontSize: '10px', fontWeight: '900', letterSpacing: '1px' }}>
                    NEW
                  </div>
                )}
                {d.archived && (
                  <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: '#666', color: '#000', padding: '4px 12px', fontSize: '10px', fontWeight: '900', letterSpacing: '1px' }}>
                    ARCHIVED
                  </div>
                )}
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ color: '#FFD700', fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                  {d.asking_price? `$${Number(d.asking_price).toLocaleString()}` : 'TBD'}
                </div>
                <div style={{ color: '#E5E5E5', fontSize: '14px', marginBottom: '12px' }}>
                  {d.city}{d.state? `, ${d.state}` : ''}
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#888', marginBottom: '12px', borderTop: '1px solid #222', paddingTop: '12px' }}>
                  <span><b style={{ color: '#E5E5E5' }}>{d.bedrooms || '—'}</b> BD</span>
                  <span><b style={{ color: '#E5E5E5' }}>{d.bathrooms || '—'}</b> BA</span>
                  <span><b style={{ color: '#E5E5E5' }}>{d.sqft? `${Number(d.sqft).toLocaleString()}` : '—'}</b> SQFT</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => markDealViewed(d.id)}
                    style={{ flex: 1, border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '8px', fontSize: '10px', cursor: 'pointer', fontWeight: '700' }}>
                    VIEW
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMessageModal(d); }}
                    style={{ flex: 1, border: '1px solid #666', background: 'transparent', color: '#E5E5E5', padding: '8px', fontSize: '10px', cursor: 'pointer', fontWeight: '700' }}>
                    MESSAGE OWNER
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showMessageModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#111', border: '1px solid #FFD700', padding: '24px', width: '90%', maxWidth: '500px' }}>
            <div style={{ color: '#FFD700', fontSize: '16px', fontWeight: '900', marginBottom: '16px', letterSpacing: '2px' }}>
              MESSAGE OWNER
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>TO: {showMessageModal.user_email || 'Owner'}</div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>RE: {showMessageModal.title || showMessageModal.address}</div>
            <textarea
              value={messageBody}
              onChange={e => setMessageBody(e.target.value)}
              placeholder="Your message..."
              rows={6}
              style={{ width: '100%', background: '#000', border: '1px solid #333', color: '#E5E5E5', padding: '12px', fontSize: '14px', marginBottom: '16px', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={sendMessage} style={{ flex: 1, border: '1px solid #FFD700', background: '#FFD700', color: '#000', padding: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>SEND</button>
              <button onClick={() => setShowMessageModal(null)} style={{ flex: 1, border: '1px solid #666', background: 'transparent', color: '#E5E5E5', padding: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
