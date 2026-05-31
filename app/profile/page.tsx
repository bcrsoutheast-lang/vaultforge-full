'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

export default function Profile() {
  const [states, setStates] = useState<string[]>([])
  const [propertyTypes, setPropertyTypes] = useState<string[]>(['RESIDENTIAL'])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    
    const { data } = await supabase
      .from('member_profiles')
      .select('target_states, property_types')
      .eq('id', user.id)
      .single()
    
    if (data) {
      setStates(data.target_states || [])
      setPropertyTypes(data.property_types || ['RESIDENTIAL'])
    }
    setLoading(false)
  }

  const toggleState = (state: string) => {
    setStates(prev => 
      prev.includes(state) 
        ? prev.filter(s => s !== state)
        : [...prev, state]
    )
  }

  const togglePropertyType = (type: string) => {
    setPropertyTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('member_profiles')
      .upsert({
        id: user?.id,
        target_states: states,
        property_types: propertyTypes,
        updated_at: new Date().toISOString()
      })
    
    setSaving(false)
    if (error) alert('Error: ' + error.message)
    else alert('Profile saved. VaultForge Intelligence will route matching deals to you.')
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading profile...
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>
        <h1 style={{ color: '#facc15', fontSize: '30px', fontWeight: 'bold', marginBottom: '8px' }}>MEMBER ROUTING PROFILE</h1>
        <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '32px' }}>Set your target markets. VaultForge Intelligence sends you deals that match.</p>
        
        <div style={{ backgroundColor: '#18181b', padding: '24px', borderRadius: '8px', border: '1px solid #27272a', marginBottom: '24px' }}>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>PROPERTY TYPES</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {['RESIDENTIAL', 'COMMERCIAL', 'LAND'].map(type => (
              <button
                key={type}
                onClick={() => togglePropertyType(type)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #3f3f46',
                  backgroundColor: propertyTypes.includes(type) ? '#facc15' : '#27272a',
                  color: propertyTypes.includes(type) ? '#000' : '#fff',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div style={{ backgroundColor: '#18181b', padding: '24px', borderRadius: '8px', border: '1px solid #27272a', marginBottom: '24px' }}>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>TARGET STATES</h2>
          <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '16px' }}>Selected: {states.length} states</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '8px' }}>
            {US_STATES.map(state => (
              <button
                key={state}
                onClick={() => toggleState(state)}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #3f3f46',
                  backgroundColor: states.includes(state) ? '#facc15' : '#27272a',
                  color: states.includes(state) ? '#000' : '#fff',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {state}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          style={{ 
            width: '100%', 
            backgroundColor: saving ? '#3f3f46' : '#facc15', 
            color: '#000', 
            fontWeight: 'bold', 
            padding: '16px', 
            borderRadius: '6px', 
            border: 'none', 
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'SAVING...' : 'SAVE ROUTING PROFILE'}
        </button>
      </div>
    </div>
  )
}
