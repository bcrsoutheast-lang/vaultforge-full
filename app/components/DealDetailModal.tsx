'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Deal = {
  id: number
  title: string | null
  address: string
  city: string
  state: string
  zipcode: string | null
  asking_price: number
  arv: number
  beds: number | null
  baths: number | null
  sqft: number | null
  description: string | null
  photo_url: string | null
  user_email: string
  status: string
  created_at: string
  owner_phone?: string | null
  owner_name?: string | null
  repairs?: number | null
  property_type?: string | null
}

type CurrentUser = {
  email: string
  name?: string | null
  avatar?: string | null
}

export default function DealDetailModal({ 
  deal, 
  currentUser,
  isSaved,
  onClose,
  onSave
}: { 
  deal: Deal | null
  currentUser?: CurrentUser | null
  isSaved?: boolean
  onClose: () => void
  onSave?: () => void
}) {
  const [showMakeOffer, setShowMakeOffer] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [message, setMessage] = useState('')
  const [offerAmount, setOfferAmount] = useState('')
  const [offerNotes, setOfferNotes] = useState('')
  const [closingDate, setClosingDate] = useState('')

  if (!deal) return null

  const repairs = deal.repairs ?? 0
  const profit = deal.arv - deal.asking_price - repairs
  const mao = deal.arv * 0.7 - repairs

  async function sendMessage() {
    if (!message.trim() || !deal) return
    const res = await fetch('/api/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deal_id: deal.id,
        recipient_email: deal.user_email,
        message: message,
        current_user_email: currentUser?.email,
        current_user_name: currentUser?.name,
        current_user_avatar: currentUser?.avatar,
        deal_snapshot: {
          image_url: deal.photo_url,
          title: `${deal.city}, ${deal.state}`,
          price: deal.asking_price,
          beds: deal.beds,
          baths: deal.baths,
          sqft: deal.sqft
        }
      })
    })
    if (res.ok) {
      alert('Message sent!')
      setShowMessage(false)
      setMessage('')
    } else {
      alert('Failed to send message')
    }
  }

  async function submitOffer() {
    if (!offerAmount || !deal) return
    const res = await fetch('/api/make-offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deal_id: deal.id,
        offer_amount: Number(offerAmount),
        notes: offerNotes,
        closing_date: closingDate,
        buyer_email: currentUser?.email,
        buyer_name: currentUser?.name
      })
    })
    if (res.ok) {
      alert('Offer submitted!')
      setShowMakeOffer(false)
      setOfferAmount('')
      setOfferNotes('')
      setClosingDate('')
    } else {
      alert('Failed to submit offer. Connect /api/make-offer route.')
    }
  }

  async function handleArchive() {
    if (!deal) return
    await supabase.from('deals').update({ status: 'archived' }).eq('id', deal.id)
    alert('Deal archived')
    onClose()
    window.location.reload()
  }

  async function handleDelete() {
    if (!deal) return
    if (!confirm('Delete this deal permanently?')) return
    await supabase.from('deals').delete().eq('id', deal.id)
    alert('Deal deleted')
    onClose()
    window.location.reload()
  }

  return (
    <>
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.9)', 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'center', 
        zIndex: 50, 
        padding: '16px', 
        overflowY: 'auto' 
      }}>
        <div style={{ 
          backgroundColor: '#09090b', 
          borderRadius: '8px', 
          width: '100%', 
          maxWidth: '672px', 
          border: '1px solid #27272a', 
          margin: '32px 0' 
        }}>
          
          <div style={{ position: 'relative' }}>
            <img 
              src={deal.photo_url || 'https://via.placeholder.com/800x400?text=No+Image'} 
              alt={deal.address}
              style={{ width: '100%', height: '320px', objectFit: 'cover', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
            />
            <button 
              onClick={onClose}
              style={{ 
                position: 'absolute', 
                top: '16px', 
                right: '16px', 
                backgroundColor: 'rgba(0,0,0,0.6)', 
                color: '#fff', 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#facc15', marginBottom: '4px' }}>
              {deal.city}, {deal.state} {deal.zipcode}
            </h2>
            <p style={{ color: '#a1a1aa', marginBottom: '16px', fontSize: '14px' }}>
              {deal.beds} Beds • {deal.baths} Baths • {deal.sqft?.toLocaleString()} Sqft
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#18181b', padding: '12px', borderRadius: '4px', border: '1px solid #27272a' }}>
                <div style={{ fontSize: '12px', color: '#71717a' }}>ASKING</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#60a5fa' }}>
                  ${deal.asking_price?.toLocaleString()}
                </div>
              </div>
              <div style={{ backgroundColor: '#18181b', padding: '12px', borderRadius: '4px', border: '1px solid #27272a' }}>
                <div style={{ fontSize: '12px', color: '#71717a' }}>ARV</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4ade80' }}>
                  ${deal.arv?.toLocaleString()}
                </div>
              </div>
              <div style={{ backgroundColor: '#18181b', padding: '12px', borderRadius: '4px', border: '1px solid #27272a' }}>
                <div style={{ fontSize: '12px', color: '#71717a' }}>REPAIRS</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#facc15' }}>
                  {repairs > 0 ? `$${repairs.toLocaleString()}` : 'TBD'}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#18181b', border: '1px solid #7f1d1d', borderRadius: '4px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: '#71717a' }}>SMART AI ANALYZER</div>
                <div style={{ 
                  fontSize: '12px', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  backgroundColor: profit > 0? '#14532d' : '#7f1d1d',
                  color: profit > 0? '#4ade80' : '#f87171'
                }}>
                  {profit > 0? 'BUY' : 'PASS'}
                </div>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px', color: profit > 0? '#4ade80' : '#f87171' }}>
                Est. Profit: ${profit?.toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#a1a1aa' }}>
                {profit > 0 
                 ? `Good deal. Potential profit of $${profit.toLocaleString()}.` 
                  : `Overpriced. You'd lose $${Math.abs(profit).toLocaleString()}. Walk away.`}
              </div>
              <div style={{ fontSize: '14px', color: '#71717a', marginTop: '4px' }}>
                Max Allowable Offer: ${mao?.toLocaleString()}
              </div>
            </div>

            <div style={{ backgroundColor: '#18181b', padding: '16px', borderRadius: '4px', marginBottom: '16px', border: '1px solid #27272a' }}>
              <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '8px' }}>PROPERTY DETAILS</div>
              <div style={{ fontSize: '14px', color: '#d4d4d8', marginBottom: '8px' }}>{deal.description || 'No description provided'}</div>
              <div style={{ fontSize: '14px', color: '#a1a1aa' }}>
                Location: {deal.address || deal.city}, {deal.state} {deal.zipcode}
              </div>
              {deal.property_type && (
                <div style={{ fontSize: '14px', color: '#a1a1aa' }}>Type: {deal.property_type}</div>
              )}
            </div>

            <div style={{ backgroundColor: '#18181b', padding: '16px', borderRadius: '4px', marginBottom: '16px', border: '1px solid #27272a' }}>
              <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '8px' }}>OWNER CONTACT</div>
              <div style={{ fontSize: '14px', color: '#d4d4d8' }}>{deal.user_email}</div>
              {deal.owner_phone && (
                <div style={{ fontSize: '14px', color: '#d4d4d8' }}>{deal.owner_phone}</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <button 
                onClick={() => setShowMakeOffer(true)}
                style={{ 
                  flex: 1, 
                  backgroundColor: '#facc15', 
                  color: '#000', 
                  fontWeight: 'bold', 
                  padding: '12px', 
                  borderRadius: '4px', 
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                MAKE OFFER
              </button>
              <button 
                onClick={onClose}
                style={{ 
                  flex: 1, 
                  backgroundColor: '#3f3f46', 
                  padding: '12px', 
                  borderRadius: '4px', 
                  border: 'none',
                  fontSize: '14px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                EXIT
              </button>
            </div>

            <button 
              onClick={() => setShowMessage(true)}
              style={{ 
                width: '100%', 
                backgroundColor: '#facc15', 
                color: '#000', 
                fontWeight: 'bold', 
                padding: '12px', 
                borderRadius: '4px', 
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                marginBottom: '8px'
              }}
            >
              MESSAGE OWNER
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={onSave}
                style={{ 
                  flex: 1, 
                  backgroundColor: isSaved ? '#14532d' : '#27272a', 
                  padding: '8px', 
                  borderRadius: '4px', 
                  border: 'none',
                  fontSize: '14px',
                  color: isSaved ? '#4ade80' : '#fff',
                  cursor: 'pointer'
                }}
              >
                {isSaved? 'SAVED' : 'SAVE'}
              </button>
              <button 
                onClick={handleArchive}
                style={{ 
                  flex: 1, 
                  backgroundColor: '#27272a', 
                  padding: '8px', 
                  borderRadius: '4px', 
                  border: 'none',
                  fontSize: '14px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                ARCHIVE
              </button>
              <button 
                onClick={handleDelete}
                style={{ 
                  flex: 1, 
                  backgroundColor: 'rgba(127, 29, 29, 0.5)', 
                  color: '#f87171', 
                  padding: '8px', 
                  borderRadius: '4px', 
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                DELETE
              </button>
            </div>

            <div style={{ fontSize: '12px', color: '#52525b', marginTop: '16px', textAlign: 'center' }}>
              Posted by: {deal.user_email} • {new Date(deal.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {showMakeOffer && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.9)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 60, 
          padding: '16px' 
        }}>
          <div style={{ backgroundColor: '#09090b', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '600px', border: '1px solid #27272a', position: 'relative' }}>
            <button 
              onClick={() => setShowMakeOffer(false)}
              style={{ 
                position: 'absolute', 
                top: '16px', 
                right: '16px', 
                backgroundColor: 'rgba(0,0,0,0.6)', 
                color: '#fff', 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
            
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#facc15' }}>Make Offer</h3>
            
            <div style={{ backgroundColor: '#18181b', padding: '12px', borderRadius: '4px', marginBottom: '16px', border: '1px solid #27272a' }}>
              <div style={{ fontSize: '12px', color: '#71717a' }}>ASKING: ${deal.asking_price?.toLocaleString()} | MAO: ${mao?.toLocaleString()}</div>
            </div>

            <label style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '4px', display: 'block' }}>OFFER AMOUNT</label>
            <input 
              type="number"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              placeholder={`Suggested: $${mao?.toLocaleString()}`}
              style={{ 
                width: '100%', 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a', 
                borderRadius: '4px', 
                padding: '16px', 
                color: '#fff', 
                marginBottom: '12px',
                fontSize: '18px'
              }}
            />
            
            <label style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '4px', display: 'block' }}>CLOSING DATE</label>
            <input 
              type="date"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              style={{ 
                width: '100%', 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a', 
                borderRadius: '4px', 
                padding: '16px', 
                color: '#fff', 
                marginBottom: '12px',
                fontSize: '16px'
              }}
            />
            
            <label style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '4px', display: 'block' }}>TERMS / NOTES</label>
            <textarea 
              value={offerNotes}
              onChange={(e) => setOfferNotes(e.target.value)}
              placeholder="Cash buyer, as-is, 7 day close, etc."
              style={{ 
                width: '100%', 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a', 
                borderRadius: '4px', 
                padding: '16px', 
                color: '#fff', 
                minHeight: '120px',
                marginBottom: '16px',
                fontFamily: 'inherit',
                fontSize: '16px'
              }}
            />
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={submitOffer}
                style={{ flex: 1, backgroundColor: '#facc15', color: '#000', fontWeight: 'bold', padding: '16px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '16px' }}
              >
                SUBMIT OFFER
              </button>
              <button 
                onClick={() => setShowMakeOffer(false)}
                style={{ flex: 1, backgroundColor: '#3f3f46', padding: '16px', borderRadius: '4px', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {showMessage && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.9)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 60, 
          padding: '16px' 
        }}>
          <div style={{ backgroundColor: '#09090b', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '600px', border: '1px solid #27272a', position: 'relative' }}>
            <button 
              onClick={() => { setShowMessage(false); setMessage('') }}
              style={{ 
                position: 'absolute', 
                top: '16px', 
                right: '16px', 
                backgroundColor: 'rgba(0,0,0,0.6)', 
                color: '#fff', 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>

            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#facc15' }}>Message Owner</h3>
            
            <div style={{ backgroundColor: '#18181b', padding: '16px', borderRadius: '4px', marginBottom: '16px', border: '1px solid #27272a', display: 'flex', gap: '12px' }}>
              <img src={deal.photo_url || 'https://via.placeholder.com/100'} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
              <div>
                <div style={{ fontWeight: 'bold', color: '#facc15', fontSize: '18px' }}>{deal.city}, {deal.state}</div>
                <div style={{ fontSize: '16px', color: '#a1a1aa' }}>${deal.asking_price?.toLocaleString()}</div>
                <div style={{ fontSize: '14px', color: '#71717a' }}>{deal.beds}bd • {deal.baths}ba • {deal.sqft?.toLocaleString()}sqft</div>
              </div>
            </div>

            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message... Is this still available? What's the motivation?"
              style={{ 
                width: '100%', 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a', 
                borderRadius: '4px', 
                padding: '16px', 
                color: '#fff', 
                minHeight: '200px',
                marginBottom: '16px',
                fontFamily: 'inherit',
                fontSize: '16px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={sendMessage}
                style={{ flex: 1, backgroundColor: '#facc15', color: '#000', fontWeight: 'bold', padding: '16px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '16px' }}
              >
                SEND
              </button>
              <button 
                onClick={() => { setShowMessage(false); setMessage('') }}
                style={{ flex: 1, backgroundColor: '#3f3f46', padding: '16px', borderRadius: '4px', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
