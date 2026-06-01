'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
]

const INVESTOR_TYPES = [
  'WHOLESALER',
  'FLIPPER',
  'BUY_AND_HOLD',
  'HARD_MONEY_LENDER',
  'PRIVATE_LENDER',
  'AGENT',
  'INSTITUTIONAL_BUYER',
  'HEDGE_FUND',
  'FAMILY_OFFICE'
]

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>({
    email: '',
    state: '',
    city: '',
    zipcode: '',
    investor_types: [],
    tier: 'STANDARD',
    states_operated: [],
    buy_box_min: '',
    buy_box_max: '',
    preferred_rehab: 'LIGHT',
    bio: '',
    phone: '',
    avatar_url: ''
  })
  const [showStatesModal, setShowStatesModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    getProfile()
  }, [])

  const getProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)

    const { data } = await supabase
     .from('member_profiles')
     .select('*')
     .eq('user_id', user.id)
     .single()

    if (data) {
      setProfile(data)
    } else {
      setProfile({...profile, email: user.email, user_id: user.id })
    }
    setLoading(false)
  }

  const uploadAvatar = async (event: any) => {
    try {
      setUploading(true)
      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
       .from('avatars')
       .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
       .from('avatars')
       .getPublicUrl(filePath)

      setProfile({...profile, avatar_url: data.publicUrl })
    } catch (error) {
      alert('Error uploading avatar!')
    } finally {
      setUploading(false)
    }
  }

  const toggleState = (state: string) => {
    const current = profile.states_operated || []
    if (current.includes(state)) {
      setProfile({...profile, states_operated: current.filter((s: string) => s!== state) })
    } else {
      setProfile({...profile, states_operated: [...current, state] })
    }
  }

  const toggleInvestorType = (type: string) => {
    const current = profile.investor_types || []
    if (current.includes(type)) {
      setProfile({...profile, investor_types: current.filter((t: string) => t!== type) })
    } else {
      setProfile({...profile, investor_types: [...current, type] })
    }
  }

  const handleSave = async () => {
    setSaving(true)

    const { error } = await supabase
     .from('member_profiles')
     .upsert({
       ...profile,
        user_id: user.id,
        email: user.email,
        updated_at: new Date().toISOString()
      })

    setSaving(false)
    if (!error) {
      alert('PROFILE UPDATED // INTEL NETWORK SYNCED')
      router.push('/dashboard')
    } else {
      alert('ERROR: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', color: '#f8f8f8', padding: '16px' }}>
        LOADING PROFILE...
      </div>
    )
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#f8f8f8', fontFamily: 'monospace', padding: '16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{
          fontSize: '14px',
          fontWeight: '700',
          letterSpacing: '0.1em',
          borderBottom: '1px solid #333',
          paddingBottom: '8px',
          marginBottom: '24px'
        }}>
          MEMBER PROFILE // VAULTFORGE INTEL NETWORK
        </div>

        {/* AVATAR UPLOAD */}
        <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #222' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '12px', letterSpacing: '0.1em' }}>
            PROFILE PHOTO
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {profile.avatar_url? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                style={{ width: '80px', height: '80px', border: '1px solid #333', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '80px',
                height: '80px',
                border: '1px solid #333',
                background: '#111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: '#666'
              }}>
                NO PHOTO
              </div>
            )}
            <div>
              <input
                type="file"
                id="avatar"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="avatar"
                style={{
                  background: '#f8f8f8',
                  color: '#000',
                  border: 'none',
                  padding: '8px 16px',
                  fontSize: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-block'
                }}
              >
                {uploading? 'UPLOADING...' : 'UPLOAD PHOTO'}
              </label>
              <div style={{ fontSize: '9px', color: '#666', marginTop: '4px' }}>
                PNG, JPG up to 5MB
              </div>
            </div>
          </div>
        </div>

        {/* BASIC INFO */}
        <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #222' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '12px', letterSpacing: '0.1em' }}>
            BASIC INFO
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input
              placeholder="EMAIL"
              value={profile.email}
              disabled
              style={{ background: '#111', border: '1px solid #333', color: '#666', padding: '12px', fontSize: '11px' }}
            />
            <input
              placeholder="PHONE"
              value={profile.phone || ''}
              onChange={(e) => setProfile({...profile, phone: e.target.value })}
              style={{ background: '#111', border: '1px solid #333', color: '#f8f8f8', padding: '12px', fontSize: '11px' }}
            />
            <input
              placeholder="CITY"
              value={profile.city || ''}
              onChange={(e) => setProfile({...profile, city: e.target.value })}
              style={{ background: '#111', border: '1px solid #333', color: '#f8f8f8', padding: '12px', fontSize: '11px' }}
            />
            <input
              placeholder="STATE"
              value={profile.state || ''}
              onChange={(e) => setProfile({...profile, state: e.target.value.toUpperCase() })}
              maxLength={2}
              style={{ background: '#111', border: '1px solid #333', color: '#f8f8f8', padding: '12px', fontSize: '11px' }}
            />
            <input
              placeholder="ZIPCODE"
              value={profile.zipcode || ''}
              onChange={(e) => setProfile({...profile, zipcode: e.target.value })}
              style={{ background: '#111', border: '1px solid #333', color: '#f8f8f8', padding: '12px', fontSize: '11px' }}
            />
            <div style={{
              background: '#111',
              border: '1px solid #facc15',
              color: '#facc15',
              padding: '12px',
              fontSize: '11px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {profile.tier || 'STANDARD'} TIER
            </div>
          </div>
        </div>

        {/* INVESTOR TYPE */}
        <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #222' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '12px', letterSpacing: '0.1em' }}>
            INVESTOR TYPE // SELECT ALL THAT APPLY
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {INVESTOR_TYPES.map(type => (
              <button
                key={type}
                onClick={() => toggleInvestorType(type)}
                style={{
                  background: profile.investor_types?.includes(type)? '#f8f8f8' : '#111',
                  color: profile.investor_types?.includes(type)? '#000' : '#f8f8f8',
                  border: '1px solid #333',
                  padding: '10px',
                  fontSize: '9px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* BUY BOX */}
        <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #222' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '12px', letterSpacing: '0.1em' }}>
            BUY BOX // PRICE RANGE
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input
              placeholder="MIN PRICE"
              type="number"
              value={profile.buy_box_min || ''}
              onChange={(e) => setProfile({...profile, buy_box_min: e.target.value })}
              style={{ background: '#111', border: '1px solid #333', color: '#f8f8f8', padding: '12px', fontSize: '11px' }}
            />
            <input
              placeholder="MAX PRICE"
              type="number"
              value={profile.buy_box_max || ''}
              onChange={(e) => setProfile({...profile, buy_box_max: e.target.value })}
              style={{ background: '#111', border: '1px solid #333', color: '#f8f8f8', padding: '12px', fontSize: '11px' }}
            />
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>PREFERRED REHAB LEVEL</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {['LIGHT', 'MEDIUM', 'HEAVY', 'FULL'].map(level => (
                <button
                  key={level}
                  onClick={() => setProfile({...profile, preferred_rehab: level })}
                  style={{
                    background: profile.preferred_rehab === level? '#4ade80' : '#111',
                    color: profile.preferred_rehab === level? '#000' : '#f8f8f8',
                    border: '1px solid #333',
                    padding: '10px',
                    fontSize: '9px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* STATES OPERATED */}
        <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #222' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '12px', letterSpacing: '0.1em' }}>
            STATES OPERATED // {profile.states_operated?.length || 0} SELECTED
          </div>
          <button
            onClick={() => setShowStatesModal(true)}
            style={{
              width: '100%',
              background: '#111',
              border: '1px solid #333',
              color: '#f8f8f8',
              padding: '12px',
              fontSize: '11px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            {profile.states_operated?.length > 0
             ? profile.states_operated.join(', ')
              : 'CLICK TO SELECT STATES'}
          </button>
        </div>

        {/* BIO */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', marginBottom: '12px', letterSpacing: '0.1em' }}>
            BIO // INVESTMENT CRITERIA
          </div>
          <textarea
            placeholder="Describe your investment criteria, preferred deals, closing timeline..."
            value={profile.bio || ''}
            onChange={(e) => setProfile({...profile, bio: e.target.value })}
            rows={4}
            style={{
              width: '100%',
              background: '#111',
              border: '1px solid #333',
              color: '#f8f8f8',
              padding: '12px',
              fontSize: '11px',
              fontFamily: 'monospace',
              resize: 'vertical'
            }}
          />
        </div>

        {/* SAVE BUTTON */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
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
          {saving? 'SAVING...' : 'SAVE PROFILE // SYNC TO NETWORK'}
        </button>

        {/* STATES MODAL */}
        {showStatesModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: '#111',
              border: '1px solid #333',
              padding: '24px',
              maxWidth: '600px',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px' }}>
                SELECT STATES OPERATED
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {US_STATES.map(state => (
                  <button
                    key={state}
                    onClick={() => toggleState(state)}
                    style={{
                      background: profile.states_operated?.includes(state)? '#4ade80' : '#000',
                      color: profile.states_operated?.includes(state)? '#000' : '#f8f8f8',
                      border: '1px solid #333',
                      padding: '12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {state}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowStatesModal(false)}
                style={{
                  width: '100%',
                  background: '#f8f8f8',
                  color: '#000',
                  border: 'none',
                  padding: '12px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                DONE // {profile.states_operated?.length || 0} SELECTED
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
