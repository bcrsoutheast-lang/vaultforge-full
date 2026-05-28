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
  const [beds, setBeds] = useState('')
  const [baths, setBaths] = useState('')
  const [sqft, setSqft] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // Deal Analyzer math
  const ask = Number(asking_price) || 0
  const arvNum = Number(arv) || 0
  const repairEst = 25000
  const mao = arvNum * 0.7 - repairEst
  const profit = arvNum - ask - repairEst
  const status = ask <= mao? 'DEAL' : ask <= arvNum * 0.8? 'MAYBE' : 'PASS'
  const color = status==='DEAL'? '#22c55e' : status==='MAYBE'? '#eab308' : '#ef4444'

  async function submitDeal() {
    setSaving(true)
    const { error } = await supabase.from('deals').insert({
      user_email: 'dm2107137@gmail.com',
      address,
      city,
      state,
      zipcode,
      asking_price: ask,
      arv: arvNum,
      beds: Number(beds),
      baths: Number(baths),
      sqft: Number(sqft),
      description,
      title: `${beds}bd ${baths}ba ${city}`
    })
    setSaving(false)
    if(error) alert('Error: ' + error.message)
    else {
      alert('Deal posted!')
      window.location.href = '/deal-opportunities'
    }
  }

  const inputStyle = {
    width:'100%', padding:12, marginBottom:10, background:'#000', 
    border:'1px solid #333', borderRadius:8, color:'#fff'
  }

  return (
    <div style={{maxWidth:600, margin:'0 auto', padding:20, color:'#fff'}}>
      <h1 style={{fontSize:24, fontWeight:900, marginBottom:16}}>POST DEAL</h1>
      
      {/* Analyzer Box */}
      <div style={{background:'#111', padding:16, borderRadius:12, marginBottom:20, border:`2px solid ${color}`}}>
        <div style={{fontSize:12, opacity:.7}}>DEAL ANALYZER</div>
        <div style={{fontSize:28, fontWeight:900, color}}>{status}</div>
        <div>Max Offer: ${mao.toLocaleString()} | Est. Profit: ${profit.toLocaleString()}</div>
        <div style={{fontSize:12, marginTop:8, opacity:.8}}>
          {status==='DEAL' && 'This looks like a deal. Post it.'}
          {status==='MAYBE' && 'Tight margins. Negotiate harder or add value.'}
          {status==='PASS' && 'You’ll lose money at this price.'}
        </div>
      </div>

      {/* Form - No more TS errors */}
      <input placeholder="Address" value={address} onChange={e=>setAddress(e.target.value)} style={inputStyle}/>
      <input placeholder="City" value={city} onChange={e=>setCity(e.target.value)} style={inputStyle}/>
      <input placeholder="State" value={state} onChange={e=>setState(e.target.value)} style={inputStyle}/>
      <input placeholder="Zipcode" value={zipcode} onChange={e=>setZipcode(e.target.value)} style={inputStyle}/>
      <input placeholder="Asking Price" value={asking_price} onChange={e=>setAskingPrice(e.target.value)} style={inputStyle}/>
      <input placeholder="ARV" value={arv} onChange={e=>setArv(e.target.value)} style={inputStyle}/>
      <input placeholder="Beds" value={beds} onChange={e=>setBeds(e.target.value)} style={inputStyle}/>
      <input placeholder="Baths" value={baths} onChange={e=>setBaths(e.target.value)} style={inputStyle}/>
      <input placeholder="Sqft" value={sqft} onChange={e=>setSqft(e.target.value)} style={inputStyle}/>
      <textarea placeholder="Description / Notes" value={description} onChange={e=>setDescription(e.target.value)} style={inputStyle}/>
      
      <button onClick={submitDeal} disabled={saving} 
        style={{width:'100%', padding:16, background:'#FFD700', color:'#000', fontWeight:900, borderRadius:12, border:'none'}}>
        {saving? 'POSTING...' : 'POST THIS DEAL'}
      </button>
    </div>
  )
}
