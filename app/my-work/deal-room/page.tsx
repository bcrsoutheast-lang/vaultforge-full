'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function PostDeal() {
  const [form, setForm] = useState({
    address:'', city:'', state:'GA', zipcode:'',
    asking_price:'', arv:'', beds:'', baths:'', sqft:'',
    description:''
  })
  const [saving, setSaving] = useState(false)

  // Deal Analyzer math
  const ask = Number(form.asking_price) || 0
  const arv = Number(form.arv) || 0
  const repairEst = 25000 // we can make this an input later
  const mao = arv * 0.7 - repairEst
  const profit = arv - ask - repairEst
  const status = ask <= mao? 'DEAL' : ask <= arv * 0.8? 'MAYBE' : 'PASS'
  const color = status==='DEAL'? '#22c55e' : status==='MAYBE'? '#eab308' : '#ef4444'

  async function submitDeal() {
    setSaving(true)
    const { error } = await supabase.from('deals').insert({
      user_email: 'dm2107137@gmail.com', // replace with auth user later
      address: form.address,
      city: form.city,
      state: form.state,
      zipcode: form.zipcode,
      asking_price: ask,
      arv: arv,
      beds: Number(form.beds),
      baths: Number(form.baths),
      sqft: Number(form.sqft),
      description: form.description,
      title: `${form.beds}bd ${form.baths}ba ${form.city}`
    })
    setSaving(false)
    if(error) alert('Error: ' + error.message)
    else {
      alert('Deal posted!')
      window.location.href = '/deal-opportunities'
    }
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

      {/* Form */}
      {['address','city','zipcode','asking_price','arv','beds','baths','sqft'].map(k => (
        <input key={k} placeholder={k.replace('_',' ')} 
          value={form[k]} 
          onChange={e=>setForm({...form,[k]:e.target.value})}
          style={{width:'100%', padding:12, marginBottom:10, background:'#000', border:'1px solid #333', borderRadius:8, color:'#fff'}}
        />
      ))}
      <textarea placeholder="description / notes" 
        value={form.description}
        onChange={e=>setForm({...form,description:e.target.value})}
        style={{width:'100%', padding:12, marginBottom:10, background:'#000', border:'1px solid #333', borderRadius:8, color:'#fff'}}
      />
      
      <button onClick={submitDeal} disabled={saving} 
        style={{width:'100%', padding:16, background:'#FFD700', color:'#000', fontWeight:900, borderRadius:12, border:'none'}}>
        {saving? 'POSTING...' : 'POST THIS DEAL'}
      </button>
    </div>
  )
}
