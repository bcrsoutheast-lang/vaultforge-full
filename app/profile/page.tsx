'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface ProfileData {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company_name: string
  avatar_url: string
  investor_types: string[]
  strategies: string[]
  capital_range: string
  funding_sources: string[]
  min_purchase: number
  max_purchase: number
  close_timeline: string
  risk_tolerance: string
  states: string[]
  asset_types: string[]
  property_conditions: string[]
  deal_breakers: string[]
  must_haves: string[]
  special_fields: string
  deals_closed_12mo: number
  pof_url: string
  veteran_owned: boolean
  member_type: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Partial<ProfileData>>({
    investor_types: [],
    strategies: [],
    funding_sources: [],
    states: [],
    asset_types: [],
    property_conditions: [],
    deal_breakers: [],
    must_haves: [],
    veteran_owned: false
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const INVESTOR_TYPES = ['CASH BUYER', 'HARD MONEY', 'PRIVATE LENDER', 'WHOLESALER', 'FLIPPER', 'BUY & HOLD', 'DEVELOPER', 'SYNDICATOR', 'FUND', 'INSTITUTIONAL']
  const STRATEGIES = ['FIX & FLIP', 'BRRRR', 'LONG TERM RENTAL', 'SHORT TERM RENTAL', 'LAND BANK', 'NEW CONSTRUCTION', 'VALUE ADD', 'NOTE BUYING']
  const CAPITAL_RANGES = ['$0-50K', '$50-250K', '$250-1M', '$1M-5M', '$5M+']
  const FUNDING_SOURCES = ['CASH', 'LINE OF CREDIT', 'PRIVATE MONEY', 'HARD MONEY', 'BANK', 'IRA/401K', 'JV PARTNER']
  const TIMELINES = ['CLOSE IN 7 DAYS', 'CLOSE IN 30 DAYS', '60+ DAYS OK']
  const RISK_LEVELS = ['TURNKEY ONLY', 'LIGHT REHAB', 'HEAVY REHAB', 'TEARDOWN', 'LEGAL ISSUES OK']
  const STATES = ['GA', 'TN', 'AL', 'NC', 'SC', 'FL', 'TX']
  const ASSET_TYPES = ['RESIDENTIAL', 'COMMERCIAL', 'MULTI-FAMILY', 'LAND', 'MOBILE HOMES', 'NOTES']
  const CONDITIONS = ['RETAIL READY', 'COSMETIC', 'FULL GUT', 'FIRE DAMAGE', 'FOUNDATION ISSUES', 'HOARDER']
  const DEAL_BREAKERS = ['HOA', 'FLOOD ZONE', 'RURAL', 'SEPTIC', 'WELL WATER', 'LIENS']
  const MEMBER_TYPES = ['BUYER', 'SELLER', 'BOTH']

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)

    const { data, error } = await supabase
     .from('profiles')
     .select('*')
     .eq('id', user.id)
     .single()

    if (data) {
      setProfile(data)
    } else {
      setProfile(prev => ({...prev, id: user.id, email: user.email || '' }))
    }
    setLoading(false)
  }

  const toggleArrayItem = (key: keyof ProfileData, value: string) => {
    setProfile(prev => {
      const arr = (prev[key] as string[]) || []
      const newArr = arr.includes(value)? arr.filter(v => v!== value) : [...arr, value]
      return {...prev, [key]: newArr }
    })
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files ||!e.target.files[0]) return
    setUploading(true)
    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
     .from('profiles')
     .upload(filePath, file)

    if (uploadError) {
      alert('Upload failed')
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('profiles').getPublicUrl(filePath)
    setProfile(prev => ({...prev, avatar_url: data.publicUrl }))
    setUploading(false)
  }

  const handlePOFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files ||!e.target.files[0]) return
    setUploading(true)
    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `pof-${user.id}-${Math.random()}.${fileExt}`
    const filePath = `pof/${fileName}`

    const { error: uploadError } = await supabase.storage
     .from('profiles')
     .upload(filePath, file)

    if (uploadError) {
      alert('Upload failed')
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('profiles').getPublicUrl(filePath)
    setProfile(prev => ({...prev, pof_url: data.publicUrl }))
    setUploading(false)
  }

  const saveProfile = async () => {
    setSaving(true)
    const { error } = await supabase
     .from('profiles')
     .upsert({
        id: user.id,
       ...profile,
        updated_at: new Date().toISOString()
      })

    if (error) {
      alert('Save failed: ' + error.message)
    } else {
      alert('Profile saved. AI routing activated.')
      router.push('/dashboard')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#000000',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFD700',
        fontFamily: 'system-ui'
      }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>LOADING OPERATOR DATA...</div>
      </div>
    )
  }

  const ChipGroup = ({ label, options, selected, onToggle }: any) => (
    <div style={{ marginBottom: '32px' }}>
      <div style={{
        fontSize: '12px',
        color: '#888888',
        letterSpacing: '2px',
        marginBottom: '12px',
        fontWeight: 'bold'
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {options.map((opt: string) => {
          const isActive = selected.includes(opt)
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              style={{
                backgroundColor: isActive? '#FFD700' : 'transparent',
                border: `1px solid ${isActive? '#FFD700' : '#333333'}`,
                color: isActive? '#000000' : '#FFD700',
                padding: '8px 16px',
                fontSize: '11px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div style={{
      backgroundColor: '#0A0A0A',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#FFFFFF'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#000000',
        borderBottom: '2px solid #FFD700',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#FFD700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: '900',
            color: '#000000',
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
          }}>
            VF
          </div>
          <div>
            <div style={{
              fontSize: '20px',
              fontWeight: '900',
              letterSpacing: '2px',
              color: '#FFD700'
            }}>
              OPERATOR DATA
            </div>
            <div style={{
              fontSize: '10px',
              color: '#888888',
              letterSpacing: '1px'
            }}>
              AI ROUTING CONFIGURATION
            </div>
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #FFD700',
            color: '#FFD700',
            padding: '8px 20px',
            fontSize: '12px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            cursor: 'pointer'
          }}
        >
          ← COMMAND CENTER
        </button>
      </div>

      {/* Form */}
      <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Section 1: Identity */}
        <div style={{
          backgroundColor: '#111111',
          border: '1px solid #222222',
          borderTop: '2px solid #FFD700',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{
            fontSize: '14px',
            color: '#FFD700',
            letterSpacing: '2px',
            marginBottom: '20px',
            fontWeight: 'bold'
          }}>
            OPERATOR IDENTITY
          </div>

          <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: '#000000',
                border: '2px solid #FFD700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                color: '#FFD700',
                overflow: 'hidden'
              }}>
                {profile.avatar_url? (
                  <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  profile.first_name?.[0] || 'OP'
                )}
              </div>
              <label style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                backgroundColor: '#FFD700',
                color: '#000000',
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '4px 8px',
                cursor: 'pointer'
              }}>
                {uploading? '...' : 'UPLOAD'}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <input
                placeholder="First Name"
                value={profile.first_name || ''}
                onChange={(e) => setProfile(prev => ({...prev, first_name: e.target.value }))}
                style={inputStyle}
              />
              <input
                placeholder="Last Name"
                value={profile.last_name || ''}
                onChange={(e) => setProfile(prev => ({...prev, last_name: e.target.value }))}
                style={inputStyle}
              />
              <input
                placeholder="Email"
                value={profile.email || ''}
                onChange={(e) => setProfile(prev => ({...prev, email: e.target.value }))}
                style={inputStyle}
              />
              <input
                placeholder="Phone"
                value={profile.phone || ''}
                onChange={(e) => setProfile(prev => ({...prev, phone: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>

          <input
            placeholder="Company Name"
            value={profile.company_name || ''}
            onChange={(e) => setProfile(prev => ({...prev, company_name: e.target.value }))}
            style={{...inputStyle, width: '100%' }}
          />
        </div>

        {/* Section 2: Investor Classification */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>INVESTOR CLASSIFICATION</div>
          <ChipGroup label="INVESTOR TYPE" options={INVESTOR_TYPES} selected={profile.investor_types || []} onToggle={(v: string) => toggleArrayItem('investor_types', v)} />
          <ChipGroup label="STRATEGY FOCUS" options={STRATEGIES} selected={profile.strategies || []} onToggle={(v: string) => toggleArrayItem('strategies', v)} />
        </div>

        {/* Section 3: Capital & Capacity */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>CAPITAL & CAPACITY</div>

          <div style={{ marginBottom: '24px' }}>
            <div style={labelStyle}>AVAILABLE CAPITAL</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CAPITAL_RANGES.map(range => (
                <button
                  key={range}
                  onClick={() => setProfile(prev => ({...prev, capital_range: range }))}
                  style={{
                   ...chipStyle,
                    backgroundColor: profile.capital_range === range? '#FFD700' : 'transparent',
                    color: profile.capital_range === range? '#000000' : '#FFD700'
                  }}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <ChipGroup label="FUNDING SOURCES" options={FUNDING_SOURCES} selected={profile.funding_sources || []} onToggle={(v: string) => toggleArrayItem('funding_sources', v)} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <div style={labelStyle}>MIN PURCHASE $</div>
              <input
                type="number"
                placeholder="50000"
                value={profile.min_purchase || ''}
                onChange={(e) => setProfile(prev => ({...prev, min_purchase: Number(e.target.value) }))}
                style={inputStyle}
              />
            </div>
            <div>
              <div style={labelStyle}>MAX PURCHASE $</div>
              <input
                type="number"
                placeholder="500000"
                value={profile.max_purchase || ''}
                onChange={(e) => setProfile(prev => ({...prev, max_purchase: Number(e.target.value) }))}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={labelStyle}>CLOSE TIMELINE</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {TIMELINES.map(t => (
                <button
                  key={t}
                  onClick={() => setProfile(prev => ({...prev, close_timeline: t }))}
                  style={{
                   ...chipStyle,
                    backgroundColor: profile.close_timeline === t? '#FFD700' : 'transparent',
                    color: profile.close_timeline === t? '#000000' : '#FFD700'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={labelStyle}>RISK TOLERANCE</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {RISK_LEVELS.map(r => (
                <button
                  key={r}
                  onClick={() => setProfile(prev => ({...prev, risk_tolerance: r }))}
                  style={{
                   ...chipStyle,
                    backgroundColor: profile.risk_tolerance === r? '#FFD700' : 'transparent',
                    color: profile.risk_tolerance === r? '#000000' : '#FFD700'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Territory & Asset Matrix */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>TERRITORY & ASSET MATRIX</div>
          <ChipGroup label="STATES OPERATED IN" options={STATES} selected={profile.states || []} onToggle={(v: string) => toggleArrayItem('states', v)} />
          <ChipGroup label="BUY BOX ASSET TYPES" options={ASSET_TYPES} selected={profile.asset_types || []} onToggle={(v: string) => toggleArrayItem('asset_types', v)} />
          <ChipGroup label="PROPERTY CONDITIONS ACCEPTED" options={CONDITIONS} selected={profile.property_conditions || []} onToggle={(v: string) => toggleArrayItem('property_conditions', v)} />
        </div>

        {/* Section 5: Deal DNA */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>DEAL DNA - AI ROUTING LOGIC</div>
          <ChipGroup label="DEAL BREAKERS" options={DEAL_BREAKERS} selected={profile.deal_breakers || []} onToggle={(v: string) => toggleArrayItem('deal_breakers', v)} />

          <div style={{ marginBottom: '24px' }}>
            <div style={labelStyle}>MUST HAVES - ADD KEYWORDS</div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {(profile.must_haves || []).map((tag, i) => (
                <div key={i} style={{
                  backgroundColor: '#FFD700',
                  color: '#000000',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {tag}
                  <span
                    onClick={() => setProfile(prev => ({...prev, must_haves: prev.must_haves?.filter((_, idx) => idx!== i) }))}
                    style={{ cursor: 'pointer' }}
                  >
                    ×
                  </span>
                </div>
              ))}
            </div>
            <input
              placeholder="Type and press Enter: BASEMENT, GARAGE, ACREAGE..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  e.preventDefault()
                  setProfile(prev => ({...prev, must_haves: [...(prev.must_haves || []), e.currentTarget.value.toUpperCase()] }))
                  e.currentTarget.value = ''
                }
              }}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={labelStyle}>SPECIAL FIELDS FOR AI ROUTING</div>
            <textarea
              placeholder="Only send me deals with 70% ARV or less, minimum 15K spread, within 45 min of Atlanta, seller finance preferred..."
              value={profile.special_fields || ''}
              onChange={(e) => setProfile(prev => ({...prev, special_fields: e.target.value }))}
              style={{
               ...inputStyle,
                minHeight: '100px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Section 6: Experience & Proof */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>EXPERIENCE & VERIFICATION</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <div style={labelStyle}>DEALS CLOSED LAST 12 MO</div>
              <input
                type="number"
                placeholder="12"
                value={profile.deals_closed_12mo || ''}
                onChange={(e) => setProfile(prev => ({...prev, deals_closed_12mo: Number(e.target.value) }))}
                style={inputStyle}
              />
            </div>
            <div>
              <div style={labelStyle}>MEMBER TYPE</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {MEMBER_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => setProfile(prev => ({...prev, member_type: type }))}
                    style={{
                     ...chipStyle,
                      backgroundColor: profile.member_type === type? '#FFD700' : 'transparent',
                      color: profile.member_type === type? '#000000' : '#FFD700'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={labelStyle}>PROOF OF FUNDS</div>
            <label style={{
             ...chipStyle,
              display: 'inline-block',
              cursor: 'pointer',
              backgroundColor: profile.pof_url? '#00FF88' : 'transparent',
              borderColor: profile.pof_url? '#00FF88' : '#FFD700',
              color: profile.pof_url? '#000000' : '#FFD700'
            }}>
              {uploading? 'UPLOADING...' : profile.pof_url? 'POF UPLOADED ✓' : 'UPLOAD POF'}
              <input type="file" accept=".pdf,.jpg,.png" onChange={handlePOFUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <div
                onClick={() => setProfile(prev => ({...prev, veteran_owned:!prev.veteran_owned }))}
                style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid #FFD700',
                  backgroundColor: profile.veteran_owned? '#FFD700' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000000',
                  fontWeight: '900'
                }}
              >
                {profile.veteran_owned && '✓'}
              </div>
              <div style={{ fontSize: '12px', color: '#FFD700', letterSpacing: '1px', fontWeight: 'bold' }}>
                VETERAN OWNED - VAULTFORGE PRIORITY ROUTING
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'flex-end',
          marginTop: '32px'
        }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #666666',
              color: '#666666',
              padding: '16px 32px',
              fontSize: '14px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              cursor: 'pointer'
            }}
          >
            CANCEL
          </button>
          <button
            onClick={saveProfile}
            disabled={saving}
            style={{
              backgroundColor: saving? '#666666' : '#FFD700',
              border: 'none',
              color: '#000000',
              padding: '16px 48px',
              fontSize: '14px',
              fontWeight: '900',
              letterSpacing: '2px',
              cursor: saving? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)'
            }}
          >
            {saving? 'SAVING...' : 'SAVE PROFILE + ACTIVATE ROUTING'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  backgroundColor: '#000000',
  border: '1px solid #333333',
  color: '#FFFFFF',
  padding: '12px 16px',
  fontSize: '14px',
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box'
}

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#111111',
  border: '1px solid #222222',
  borderTop: '2px solid #FFD700',
  padding: '24px',
  marginBottom: '24px'
}

const sectionTitle: React.CSSProperties = {
  fontSize: '14px',
  color: '#FFD700',
  letterSpacing: '2px',
  marginBottom: '20px',
  fontWeight: 'bold'
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#888888',
  letterSpacing: '1px',
  marginBottom: '8px',
  fontWeight: 'bold',
  textTransform: 'uppercase'
}

const chipStyle: React.CSSProperties = {
  border: '1px solid #FFD700',
  padding: '8px 16px',
  fontSize: '11px',
  fontWeight: 'bold',
  letterSpacing: '1px',
  cursor: 'pointer',
  transition: 'all 0.15s'
}
