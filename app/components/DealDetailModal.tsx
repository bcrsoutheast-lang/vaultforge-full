'use client'

import { useState } from 'react'

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

  if (!deal) return null

  const profit = deal.arv - deal.asking_price - (deal.repairs || 0)
  const mao = deal.arv * 0.7 - (deal.repairs || 0)

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
                  ${(deal.repairs || 0)?.toLocaleString()}
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
                  backgroundColor: '#27272a', 
                  padding: '8px', 
                  borderRadius: '4px', 
                  border: 'none',
                  fontSize: '14px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                {isSaved? 'SAVED' : 'SAVE'}
              </button>
              <button style={{ 
                flex: 1, 
                backgroundColor: '#27272a', 
                padding: '8px', 
                borderRadius: '4px', 
                border: 'none',
                fontSize: '14px',
                color: '#fff',
                cursor: 'pointer'
              }}>ARCHIVE</button>
              <button style={{ 
                flex: 1, 
                backgroundColor: 'rgba(127, 29, 29, 0.5)', 
                color: '#f87171', 
                padding: '8px', 
                borderRadius: '4px', 
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer'
              }}>DELETE</button>
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
          <div style={{ backgroundColor: '#09090b', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '448px', border: '1px solid #27272a' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#facc15' }}>Make Offer</h3>
            <p style={{ color: '#a1a1aa', marginBottom: '16px' }}>Coming soon - connect to escrow flow</p>
            <button 
              onClick={() => setShowMakeOffer(false)}
              style={{ width: '100%', backgroundColor: '#3f3f46', padding: '12px', borderRadius: '4px', border: 'none', color: '#fff', cursor: 'pointer' }}
            >
              CLOSE
            </button>
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
          <div style={{ backgroundColor: '#09090b', padding: '24px', borderRadius: '8px', width: '100%', maxWidth: '448px', border: '1px solid #27272a' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#facc15' }}>Message Owner</h3>
            
            <div style={{ backgroundColor: '#18181b', padding: '12px', borderRadius: '4px', marginBottom: '16px', border: '1px solid #27272a', display: 'flex', gap: '12px' }}>
              <img src={deal.photo_url || 'https://via.placeholder.com/80'} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
              <div>
                <div style={{ fontWeight: 'bold', color: '#facc15' }}>{deal.city}, {deal.state}</div>
                <div style={{ fontSize: '14px', color: '#a1a1aa' }}>${deal.asking_price?.toLocaleString()}</div>
                <div style={{ fontSize: '12px', color: '#71717a' }}>{deal.beds}bd • {deal.baths}ba • {deal.sqft?.toLocaleString()}sqft</div>
              </div>
            </div>

            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message..."
              style={{ 
                width: '100%', 
                backgroundColor: '#18181b', 
                border: '1px solid #27272a', 
                borderRadius: '4px', 
                padding: '12px', 
                color: '#fff', 
                minHeight: '100px',
                marginBottom: '12px',
                fontFamily: 'inherit'
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={sendMessage}
                style={{ flex: 1, backgroundColor: '#facc15', color: '#000', fontWeight: 'bold', padding: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
              >
                SEND
              </button>
              <button 
                onClick={() => { setShowMessage(false); setMessage('') }}
                style={{ flex: 1, backgroundColor: '#3f3f46', padding: '12px', borderRadius: '4px', border: 'none', color: '#fff', cursor: 'pointer' }}
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
