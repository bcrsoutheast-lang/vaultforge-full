'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PostDeal() {
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('GA')
  const [zipcode, setZipcode] = useState('')
  const [asking_price, setAskingPrice] = useState('')
  const [arv, setArv] = useState('')
  const [repair_cost, setRepairCost] = useState('25000')
  const [beds, setBeds] = useState('')
  const [baths, setBaths] = useState('')
  const [sqft, setSqft] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // Deal Analyzer math
  const ask = Number(asking_price) || 0
  const arvNum = Number(arv) || 0
  const repairEst = Number(repair_cost) || 0
  const mao = arvNum * 0.7 - repairEst
  const profit = arvNum - ask - repairEst
  
  let status = 'FILL FORM'
  let color = '#6b7280'
  let comment = 'Enter Asking Price and ARV to analyze deal'
  
  if (ask > 0 && arvNum > 0) {
    if (ask <= mao) {
      status = 'DEAL'
      color = '#22c55e'
      comment = 'This looks like a deal. Post it.'
    } else if (ask <= arvNum * 0.8) {
      status = 'MAYBE'
      color = '#eab308'
      comment = 'Tight margins. Negotiate harder or add value.'
    } else {
      status = 'PASS'
      color = '#ef4444'
      comment = 'You’ll lose money at this price.'
    }
  }

  async function submitDeal() {
    if (saving) return
    if (!address || !city || !asking_price || !arv) {
      alert('Address, City, Asking Price, and ARV are required')
      return
    }
    
    setSaving(true)
    
    try {
      const { error } = await supabase.from('deals').insert({
        user_email: 'dm2107137@gmail.com',
        address,
        city,
        state,
        zipcode,
        asking_price: ask,
        arv: arvNum,
        beds: Number(beds) || null,
        baths: Number(baths) || null,
        sqft: Number(sqft) || null,
        description,
        title: `${beds || '?'}bd ${baths || '?'}ba ${city}`,
        created_at: new Date().toISOString()
      })
      
      if (error) throw error
      
      alert('Deal posted!')
      window.location.href = '/deal-opportunities'
      
    } catch (err: any) {
      alert('Error posting deal: ' + err.message)
    } finally {
      setSaving(false)
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
    fontSize: '16px'
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#999',
    marginBottom: '4px',
    display: 'block'
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20, color: '#fff', background: '#0a0a0a', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16, fontFamily: 'serif' }}>POST DEAL</h1>
      
      {/* Analyzer Box */}
      <div style={{ background: '#111', padding: 16, borderRadius: 12, marginBottom: 20, border: `2px solid ${color}` }}>
        <div style={{ fontSize: 12, opacity: 0.7, letterSpacing: '1px' }}>DEAL ANALYZER</div>
        <div style={{ fontSize: 28, fontWeight: 900, color, margin: '4px 0' }}>{status}</div>
        <div style={{ fontSize: 14 }}>Max Offer: ${mao.toLocaleString()} | Est. Profit: ${profit.toLocaleString()}</div>
        <div style={{ fontSize: 12, marginTop: 8, opacity: 0.8 }}>{comment}</div>
      </div>

      {/* Form */}
      <label style={labelStyle}>Property Address *</label>
      <input placeholder="123 Main St" value={address} onChange={e => setAddress(e.target.value)} style={inputStyle} />
      
      <label style={labelStyle}>City *</label>
      <input placeholder="Atlanta" value={city} onChange={e => setCity(e.target.value)} style={inputStyle} />
      
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>State</label>
          <input placeholder="GA" value={state} onChange={e => setState(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Zipcode</label>
          <input placeholder="30103" value={zipcode} onChange={e => setZipcode(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <label style={labelStyle}>Asking Price *</label>
      <input placeholder="125000" type="number" value={asking_price} onChange={e => setAskingPrice(e.target.value)} style={inputStyle} />
      
      <label style={labelStyle}>ARV - After Repair Value *</label>
      <input placeholder="205000" type="number" value={arv} onChange={e => setArv(e.target.value)} style={inputStyle} />
      
      <label style={labelStyle}>Est. Repair Cost</label>
      <input placeholder="25000" type="number" value={repair_cost} onChange={e => setRepairCost(e.target.value)} style={inputStyle} />
      
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Beds</label>
          <input placeholder="3" type="number" value={beds} onChange={e => setBeds(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Baths</label>
          <input placeholder="2" type="number" value={baths} onChange={e => setBaths(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Sqft</label>
          <input placeholder="1400" type="number" value={sqft} onChange={e => setSqft(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <label style={labelStyle}>Description / Notes</label>
      <textarea 
        placeholder="3BR/2BA solid rental area, needs roof and kitchen" 
        value={description} 
        onChange={e => setDescription(e.target.value)} 
        style={{ ...inputStyle, height: 80, resize: 'vertical' }} 
      />
      
      <button 
        onClick={submitDeal} 
        disabled={saving} 
        style={{ 
          width: '100%', 
          padding: 16, 
          background: saving ? '#555' : '#FFD700', 
          color: '#000', 
          fontWeight: 900, 
          borderRadius: 12, 
          border: 'none',
          fontSize: 16,
          cursor: saving ? 'not-allowed' : 'pointer'
        }}
      >
        {saving ? 'POSTING...' : 'POST THIS DEAL'}
      </button>
      
      <div style={{ fontSize: 11, color: '#666', textAlign: 'center', marginTop: 16 }}>
        * Required fields. Deal saves to your account only.
      </div>
    </div>
  )
}
