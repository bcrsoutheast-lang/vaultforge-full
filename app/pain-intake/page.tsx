'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function PainIntake() {
  const [form, setForm] = useState({
    address: '',
    zipcode: '',
    beds: '',
    baths: '',
    sqft: '',
    asking_price: '',
    arv: '',
    rehab_level: 'LIGHT',
    urgency: 'FLEXIBLE',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('pain_deals').insert({
      ...form,
      owner_id: user?.id,
      owner_email: user?.email,
      status: 'active',
      analyzed_at: new Date().toISOString(),
      beds: Number(form.beds),
      baths: Number(form.baths),
      sqft: Number(form.sqft),
      asking_price: Number(form.asking_price),
      arv: Number(form.arv)
    })

    setLoading(false)
    if (!error) router.push('/dashboard')
    else alert('Error: ' + error.message)
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '700', 
          letterSpacing: '0.1em', 
          borderBottom: '1px solid #333',
          paddingBottom: '8px',
          marginBottom: '24px'
        }}>
          PAIN DEAL INTAKE // VAULTFORGE INTEL // PROPRIETARY
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <input
              placeholder="PROPERTY ADDRESS"
              value={form.address}
              onChange={(e) => setForm({...form, address: e.target.value})}
              style={{ background: '#111', border: '1px solid #333', color: '#f8f8f8', padding: '12px', fontSize: '11px' }}
              required
            />
            <input
              placeholder="ZIPCODE"
              value={form.zipcode}
              onChange={(e) => setForm({...form, zipcode: e.target.value})}
              style={{ background: '#111', border: '1px solid #333', color: '#f8f8f8', padding: '12px', fontSize: '11px' }}
              required
            />
            <input
              placeholder="BEDS"
              type="number"
              value={form.beds}
              onChange={(e) => setForm({...form, beds: e.target.value})}
              style={{ background: '#111', border: '1px solid #333', color: '#f8f8f8', padding: '12px', fontSize: '11px' }}
            />
            <input
              placeholder="BATHS"
              type="number"
              value={form.baths}
              onChange={(e) => setForm({...form, baths: e.target.value})}
              style={{ background: '#111', border: '1px solid #333', color: '#f8f8f8', padding: '12px', fontSize: '11px' }}
            />
            <input
              placeholder="SQFT"
              type="number"
              value={form.sqft}
              onChange={(e) => setForm({...form, sqft: e.target.value})}
              style={{ background: '#111', border: '1px solid #333', color: '#f8f8f8', padding: '12px', fontSize: '11px' }}
            />
            <input
              placeholder="ASKING PRICE"
              type="number"
              value={form.asking_price}
              onChange={(e) => setForm({...form, asking_price: e.target.value})}
              style={{ background: '#111', border: '1px solid #333', color: '#f8f8f8', padding: '12px', fontSize: '11px' }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{
              marginTop: '24px',
              width: '100%',
              background: '#f8f8f8',
              color: '#000',
              border: 'none',
              padding: '16px',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '0.1em',
              cursor: 'pointer'
            }}
          >
            {loading ? 'PROCESSING...' : 'SUBMIT TO VAULTFORGE INTEL'}
          </button>
        </form>
      </div>
    </div>
  )
}
