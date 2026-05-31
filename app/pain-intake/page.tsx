'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function PainIntake() {
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    zipcode: '',
    property_type: 'RESIDENTIAL',
    problem_type: '',
    asking_price: '',
    description: '',
    contact_name: '',
    contact_phone: '',
    contact_email: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase
      .from('pain_deals')
      .insert([{
        ...form,
        asking_price: Number(form.asking_price) || null,
        status: 'intake'
      }])
    
    setLoading(false)
    if (error) {
      alert('Error submitting: ' + error.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/'), 2000)
    }
  }

  if (success) {
    return (
      <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#4ade80', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>SUBMITTED TO VAULTFORGE INTELLIGENCE</h1>
          <p style={{ color: '#a1a1aa' }}>Routing to qualified members in {form.state}...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '16px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '40px' }}>
        <h1 style={{ color: '#facc15', fontSize: '30px', fontWeight: 'bold', marginBottom: '8px' }}>PAIN DEAL INTAKE</h1>
        <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '32px' }}>Submit properties that need solutions. VaultForge routes to members who can solve it.</p>
        
        <form onSubmit={handleSubmit} style={{ backgroundColor: '#18181b', padding: '24px', borderRadius: '8px', border: '1px solid #27272a' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <input 
              placeholder="Property Address" 
              required
              value={form.address}
              onChange={(e) => setForm({...form, address: e.target.value})}
              style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
              <input 
                placeholder="City" 
                required
                value={form.city}
                onChange={(e) => setForm({...form, city: e.target.value})}
                style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
              />
              <input 
                placeholder="State" 
                required
                maxLength={2}
                value={form.state}
                onChange={(e) => setForm({...form, state: e.target.value.toUpperCase()})}
                style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
              />
              <input 
                placeholder="Zip" 
                value={form.zipcode}
                onChange={(e) => setForm({...form, zipcode: e.target.value})}
                style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
              />
            </div>

            <select 
              value={form.property_type}
              onChange={(e) => setForm({...form, property_type: e.target.value})}
              style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
            >
              <option>RESIDENTIAL</option>
              <option>COMMERCIAL</option>
              <option>LAND</option>
            </select>

            <input 
              placeholder="Problem Type - ex: Fire damage, Title issue, Foreclosure" 
              required
              value={form.problem_type}
              onChange={(e) => setForm({...form, problem_type: e.target.value})}
              style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
            />

            <input 
              placeholder="Asking Price" 
              type="number"
              value={form.asking_price}
              onChange={(e) => setForm({...form, asking_price: e.target.value})}
              style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
            />

            <textarea 
              placeholder="Describe the pain. What needs to be solved?" 
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff', resize: 'vertical' }}
            />

            <div style={{ borderTop: '1px solid #27272a', paddingTop: '16px', marginTop: '8px' }}>
              <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '12px' }}>CONTACT FOR SOLUTION</p>
              <div style={{ display: 'grid', gap: '12px' }}>
                <input 
                  placeholder="Your Name" 
                  required
                  value={form.contact_name}
                  onChange={(e) => setForm({...form, contact_name: e.target.value})}
                  style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
                />
                <input 
                  placeholder="Phone" 
                  required
                  value={form.contact_phone}
                  onChange={(e) => setForm({...form, contact_phone: e.target.value})}
                  style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
                />
                <input 
                  placeholder="Email" 
                  type="email"
                  required
                  value={form.contact_email}
                  onChange={(e) => setForm({...form, contact_email: e.target.value})}
                  style={{ padding: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              style={{ 
                width: '100%', 
                backgroundColor: loading ? '#3f3f46' : '#facc15', 
                color: '#000', 
                fontWeight: 'bold', 
                padding: '16px', 
                borderRadius: '6px', 
                border: 'none', 
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px'
              }}
            >
              {loading ? 'ROUTING...' : 'SUBMIT TO VAULTFORGE INTELLIGENCE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
