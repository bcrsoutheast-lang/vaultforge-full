"use client";
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function NewPain() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    why1: '',
    why2: '',
    why3: '',
    why4: '',
    root_cause: '',
    asking_price: '',
    photos: [] as string[]
  })
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setUser(data.user)
    })
  }, [])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files ||!user) return
    const files = Array.from(e.target.files)
    const urls: string[] = []

    for (const file of files) {
      const fileName = `${user.id}/${Date.now()}_${file.name}`
      const { data, error } = await supabase.storage
      .from('deal-photos')
      .upload(fileName, file)
      if (!error && data) {
        const { data: urlData } = supabase.storage
        .from('deal-photos')
        .getPublicUrl(data.path)
        urls.push(urlData.publicUrl)
      }
    }
    setForm(prev => ({...prev, photos: [...prev.photos,...urls] }))
  }

  const runAiSolver = async () => {
    if (!form.why1) {
      alert('At least WHY 1 required')
      return
    }
    setAnalyzing(true)
    
    // Simple 6Sigma scoring logic
    const painScore = Math.min(100, 
      (form.why1? 20 : 0) +
      (form.why2? 20 : 0) +
      (form.why3? 20 : 0) +
      (form.why4? 20 : 0) +
      (form.root_cause? 20 : 0)
    )

    const strategy = painScore >= 80? 'CASH OFFER - CLOSE FAST' : 
                     painScore >= 60? 'SUBJECT TO - HELP SELLER' : 
                     'NURTURE - FOLLOW UP'

    setAiAnalysis({
      pain_score: painScore,
      strategy,
      problem_class: 'MOTIVATED',
      confidence: 0.85
    })
    setAnalyzing(false)
  }

  const handleSave = async () => {
    if (!user ||!form.address) {
      alert('Address required')
      return
    }
    setSaving(true)

    const { error } = await supabase.from('pain_intake').insert({
      user_id: user.id,
      user_email: user.email,
      viewed: false,
      address: form.address,
      city: form.city,
      state: form.state,
      why1: form.why1,
      why2: form.why2,
      why3: form.why3,
      why4: form.why4,
      root_cause: form.root_cause,
      asking_price: form.asking_price? Number(form.asking_price) : null,
      photos: form.photos,
      pain_score: aiAnalysis?.pain_score || 0,
      ai_analysis: aiAnalysis,
      problem_class: aiAnalysis?.problem_class || 'UNKNOWN'
    })

    setSaving(false)
    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      alert('PAIN INTAKE SAVED')
      router.push('/pain/leads')
    }
  }

  if (!user) return null

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#E5E5E5', padding: '24px' }}>
      <header style={{ borderBottom: '1px solid #FFD700', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Image src="/IMG_4751.png" alt="VaultForge" width={40} height={40} style={{ objectFit: 'contain' }} />
          <div>
            <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>PAIN INTAKE</div>
            <div style={{ color: '#666', fontSize: '11px', letterSpacing: '2px' }}>6SIGMA AI SOLVER</div>
          </div>
        </div>
        <button onClick={() => router.push('/pain/leads')} style={{ border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>← PAIN LEADS</button>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <input placeholder="PROPERTY ADDRESS*" value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={{...inputStyle, marginBottom: '16px'}} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <input placeholder="CITY" value={form.city} onChange={e => setForm({...form, city: e.target.value})} style={inputStyle} />
          <input placeholder="STATE" value={form.state} onChange={e => setForm({...form, state: e.target.value})} style={inputStyle} />
          <input type="number" placeholder="ASKING PRICE" value={form.asking_price} onChange={e => setForm({...form, asking_price: e.target.value})} style={inputStyle} />
        </div>

        <div style={{ color: '#FFD700', fontSize: '14px', fontWeight: '700', letterSpacing: '1px', marginBottom: '12px' }}>5 WHYS - ROOT CAUSE ANALYSIS</div>
        
        <input placeholder="WHY 1: Why do they need to sell?" value={form.why1} onChange={e => setForm({...form, why1: e.target.value})} style={{...inputStyle, marginBottom: '12px'}} />
        <input placeholder="WHY 2: Why is that a problem?" value={form.why2} onChange={e => setForm({...form, why2: e.target.value})} style={{...inputStyle, marginBottom: '12px'}} />
        <input placeholder="WHY 3: Why hasn't it been solved?" value={form.why3} onChange={e => setForm({...form, why3: e.target.value})} style={{...inputStyle, marginBottom: '12px'}} />
        <input placeholder="WHY 4: Why is it urgent now?" value={form.why4} onChange={e => setForm({...form, why4: e.target.value})} style={{...inputStyle, marginBottom: '12px'}} />
        <input placeholder="ROOT CAUSE: The real reason" value={form.root_cause} onChange={e => setForm({...form, root_cause: e.target.value})} style={{...inputStyle, marginBottom: '16px'}} />

        <button onClick={runAiSolver} disabled={analyzing} style={{ width: '100%', border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '12px', fontSize: '12px', fontWeight: '700', cursor: analyzing? 'not-allowed' : 'pointer', marginBottom: '24px', letterSpacing: '2px' }}>
          {analyzing? 'ANALYZING...' : 'RUN AI SOLVER'}
        </button>

        {aiAnalysis && (
          <div style={{ border: '1px solid #FFD700', background: '#111', padding: '16px', marginBottom: '24px' }}>
            <div style={{ color: '#FFD700', fontSize: '16px', fontWeight: '900', marginBottom: '12px' }}>AI ANALYSIS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '12px' }}>
              <div>PAIN SCORE: <b style={{ color: '#FFD700', fontSize: '18px' }}>{aiAnalysis.pain_score}</b></div>
              <div>STRATEGY: <b style={{ color: '#FFD700' }}>{aiAnalysis.strategy}</b></div>
              <div>CLASS: <b style={{ color: '#FFD700' }}>{aiAnalysis.problem_class}</b></div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <label style={{ color: '#FFD700', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>PHOTOS</label>
          <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} style={{ color: '#E5E5E5', fontSize: '12px' }} />
          {form.photos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '12px' }}>
              {form.photos.map((url, i) => (
                <img key={i} src={url} style={{ width: '100%', height: '80px', objectFit: 'cover', border: '1px solid #333' }} />
              ))}
            </div>
          )}
        </div>

        <button onClick={handleSave} disabled={saving} style={{ width: '100%', border: '1px solid #FFD700', background: '#FFD700', color: '#000', padding: '16px', fontSize: '14px', fontWeight: '900', cursor: saving? 'not-allowed' : 'pointer', letterSpacing: '2px' }}>
          {saving? 'SAVING...' : 'SAVE PAIN INTAKE'}
        </button>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  background: '#111',
  border: '1px solid #333',
  color: '#E5E5E5',
  padding: '12px',
  fontSize: '14px',
  outline: 'none'
}
