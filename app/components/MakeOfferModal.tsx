'use client'

import { useState } from 'react'
import { submitOffer } from '@/app/actions/offers'

type Deal = {
  id: number
  address: string
  asking_price: number
  arv: number
  city: string
  state: string
}

export default function MakeOfferModal({ deal, onClose }: { deal: Deal, onClose: () => void }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showOwnerFinance, setShowOwnerFinance] = useState(false)
  
  const repairEst = 25000
  const mao = deal.arv * 0.7 - repairEst
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    formData.append('deal_id', String(deal.id))
    formData.append('deal_address', `${deal.address}, ${deal.city}, ${deal.state}`)
    
    const res = await submitOffer(formData)
    
    if (res.error) {
      setError(res.error)
      setSaving(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        onClose()
        window.location.href = '/deal-opportunities'
      }, 2000)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', 
    padding: '12px', 
    marginBottom: '10px', 
    background: '#000',
    border: '1px solid #333', 
    borderRadius: '8px', 
    color: '#fff', 
    fontSize: '16px',
    boxSizing: 'border-box'
  }

  if (success) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
        <div style={{ background: '#111', padding: 32, borderRadius: 16, textAlign: 'center', border: '2px solid #22c55e' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#22c55e' }}>Offer Sent!</div>
          <div style={{ color: '#999', marginTop: 8 }}>Redirecting to deals...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
      <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: 16, maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: 20, borderBottom: '1px solid #222' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 12, color: '#999' }}>MAKE OFFER ON</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFD700' }}>{deal.address}</div>
              <div style={{ fontSize: 14, color: '#00bfff' }}>Asking: ${deal.asking_price.toLocaleString()}</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#999', fontSize: 24, cursor: 'pointer', padding: 0 }}>×</button>
          </div>
          
          <div style={{ background: '#111', padding: 12, borderRadius: 8, marginTop: 12, border: '1px solid #22c55e' }}>
            <div style={{ fontSize: 11, color: '#999', letterSpacing: '1px' }}>AI HINT</div>
            <div style={{ fontSize: 13, color: '#ccc', marginTop: 4 }}>
              Max Allowable Offer: ${mao.toLocaleString()}. Offers near MAO close fastest. 
              <span style={{ color: '#eab308' }}> 3 buyers viewed this today.</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          <input name="name" placeholder="Full Name *" required style={inputStyle} />
          <input name="phone" placeholder="Phone *" type="tel" required style={inputStyle} />
          <input name="email" placeholder="Email *" type="email" required style={inputStyle} />
          
          <select name="buyer_type" required style={inputStyle} defaultValue="">
            <option value="" disabled>Buyer Type *</option>
            <option value="Cash Buyer">Cash Buyer</option>
            <option value="Owner Finance Buyer">Owner Finance Buyer</option>
            <option value="Landlord">Landlord</option>
            <option value="Wholesaler">Wholesaler</option>
            <option value="Agent">Agent</option>
          </select>

          <select name="property_type" required style={inputStyle} defaultValue="">
            <option value="" disabled>Property Type *</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Land">Land</option>
            <option value="Multi-Family">Multi-Family</option>
          </select>
          
          <input 
            name="offer_price" 
            placeholder={`Offer Price * / Monthly Payment if Owner Finance`} 
            type="text" 
            required 
            style={inputStyle} 
          />

          <label style={{ fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', marginBottom: 10, cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              name="owner_finance" 
              style={{ marginRight: 8 }} 
              onChange={(e) => setShowOwnerFinance(e.target.checked)}
            />
            Request Owner Financing
          </label>

          {showOwnerFinance && (
            <div style={{ background: '#111', padding: 12, borderRadius: 8, marginBottom: 10, border: '1px solid #333' }}>
              <input 
                name="down_payment" 
                placeholder="Down Payment (e.g. $20k or 10%)" 
                style={inputStyle} 
              />
              <textarea 
                name="owner_finance_terms" 
                placeholder="Proposed Terms: Interest rate, length, balloon, etc" 
                rows={3}
                style={{...inputStyle, height: 'auto', resize: 'vertical', marginBottom: 0}} 
              />
            </div>
          )}
          
          <input name="close_date" placeholder="Desired Close Date * (e.g. 30 days)" required style={inputStyle} />
          
          <select name="contingencies" style={inputStyle} defaultValue="None - Cash">
            <option>None - Cash</option>
            <option>Inspection Only</option>
            <option>Financing</option>
            <option>Appraisal</option>
            <option>Subject To</option>
          </select>
          
          <textarea 
            name="message" 
            placeholder="Message to owner (optional)" 
            rows={3}
            style={{...inputStyle, height: 'auto', resize: 'vertical'}} 
          />
          
          <label style={{ fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', marginBottom: 12, cursor: 'pointer' }}>
            <input type="checkbox" name="has_pof" style={{ marginRight: 8 }} />
            I have Proof of Funds ready
          </label>
          
          {error && <div style={{ color: '#ef4444', marginBottom: 10, fontSize: 14, textAlign: 'center' }}>{error}</div>}
          
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button 
              type="button"
              onClick={onClose}
              style={{ 
                flex: 1, padding: 16, background: '#222', 
                color: '#999', fontWeight: 700, borderRadius: 12, 
                border: '1px solid #333', fontSize: 16, cursor: 'pointer'
              }}
            >
              CANCEL
            </button>
            
            <button 
              type="submit"
              disabled={saving}
              style={{ 
                flex: 2, padding: 16, background: saving ? '#555' : '#FFD700', 
                color: '#000', fontWeight: 900, borderRadius: 12, border: 'none',
                fontSize: 16, cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'SENDING...' : 'SEND OFFER'}
            </button>
          </div>
          
          <div style={{ fontSize: 11, color: '#666', textAlign: 'center', marginTop: 12 }}>
            Your info is sent directly to the property owner
          </div>
        </form>
      </div>
    </div>
  )
}
