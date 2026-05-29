"use client";
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function PainIntake() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<any>(null)
  const [popup, setPopup] = useState<{ type: 'success' | 'error', msg: string } | null>(null)

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const initialForm = {
    address: '', city: '', state: '', seller_name: '', phone: '',
    problem_class: 'Financial', why1: '', why2: '', why3: '', why4: '', root_cause: '',
    loss_per_month: '', time_drain_hrs: '', stress_level: '5',
    tried_realtor: false, tried_fsbo: false, tried_repair: false, failed_why: '',
    sort_keep: '', sort_toss: '', set_organized: '', shine_condition: '3', standardize_systems: '', sustain_capability: false,
    who_can_solve: 'Investor', kaizen_fix: '', kaizen_value: '',
    muda_waiting: false, muda_transport: false, muda_motion: false, muda_defects: '',
    asking_price: '', mortgage_balance: '', timeline: 'ASAP'
  }

  const [form, setForm] = useState<any>(initialForm)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user ||!data.user.email) router.push('/login')
      else setUser(data.user)
    })
  }, [])

  const showPopup = (type: 'success' | 'error', msg: string) => {
    setPopup({ type, msg })
    setTimeout(() => setPopup(null), 3000)
  }

  const runAIProblemSolver = () => {
    // VaultForge AI - 6Sigma Black Belt Logic
    const score = 
      (Number(form.stress_level) * 8) + 
      (form.timeline === 'ASAP' ? 20 : 0) + 
      (form.loss_per_month ? Math.min(Number(form.loss_per_month) / 100, 20) : 0) +
      (form.root_cause ? 15 : 0)
    
    let solver = form.who_can_solve
    let strategy = 'Cash Offer'
    
    if (form.problem_class === 'Financial' && form.mortgage_balance) {
      strategy = Number(form.mortgage_balance) > Number(form.asking_price) * 0.7 ? 'Subto' : 'Cash'
    }
    if (form.problem_class === 'Structural' && form.shine_condition < 3) {
      solver = 'Investor + Contractor'
      strategy = 'Fix & Flip JV'
    }
    if (form.problem_class === 'Legal') {
      solver = 'Attorney + Investor'
      strategy = 'Subject To + Title Cure'
    }
    
    const kaizenROI = form.kaizen_value && form.kaizen_fix ? 
      Math.round((Number(form.kaizen_value) / 5000) * 100) : 0

    setAiSuggestion({
      pain_score: Math.min(Math.round(score), 100),
      root_class: form.problem_class,
      who_solves: solver,
      strategy: strategy,
      kaizen_roi: kaizenROI,
      summary: `${form.problem_class} pain. Root: ${form.root_cause || 'TBD'}. Solve with ${solver} via ${strategy}.`
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) return
    setLoading(true)

    try {
      runAIProblemSolver()
      const payload = {
       ...form,
        user_email: user.email,
        ai_analysis: aiSuggestion,
        pain_score: aiSuggestion?.pain_score || null,
        status: 'new',
        stress_level: Number(form.stress_level),
        shine_condition: Number(form.shine_condition),
        loss_per_month: form.loss_per_month? Number(form.loss_per_month) : null,
        asking_price: form.asking_price? Number(form.asking_price) : null,
        mortgage_balance: form.mortgage_balance? Number(form.mortgage_balance) : null,
      }

      const { error } = await supabase.from('pain_intake').insert(payload)
      if (error) throw error

      showPopup('success', `PAIN ANALYZED. SCORE: ${aiSuggestion?.pain_score}`)
      setForm(initialForm)
      setAiSuggestion(null)
      setTimeout(() => router.push('/pain/leads'), 1500)
    } catch (err: any) {
      showPopup('error', err.message || 'SAVE FAILED')
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: any) => setForm((prev: any) => ({...prev, [field]: value }))
  if (!user) return null

  const inputStyle = { width: '100%', background: '#111', border: '1px solid #333', color: '#E5E5E5', padding: '12px', fontSize: '14px', outline: 'none' }
  const labelStyle = { color: '#FFD700', fontSize: '10px', letterSpacing: '2px', marginBottom: '6px', display: 'block' }

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#E5E5E5', padding: '24px' }}>
      {popup && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: popup.type === 'success'? '#FFD700' : '#FF6B6B', color: '#000', padding: '16px 24px', fontSize: '12px', fontWeight: '900', letterSpacing: '2px', zIndex: 1000 }}>
          {popup.msg}
        </div>
      )}

      <header style={{ borderBottom: '1px solid #FFD700', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Image src="/IMG_4751.png" alt="VaultForge" width={40} height={40} style={{ objectFit: 'contain' }} />
          <div>
            <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>PAIN INTAKE</div>
            <div style={{ color: '#666', fontSize: '11px', letterSpacing: '2px' }}>6SIGMA ROOT CAUSE. KAIZEN SOLVER.</div>
          </div>
        </div>
        <button onClick={() => router.push('/dashboard')} style={{ border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>← COMMAND CENTER</button>
      </header>

      <form onSubmit={handleSubmit} style={{ maxWidth: '900px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>PROPERTY ADDRESS</label><input required style={inputStyle} value={form.address} onChange={e => updateField('address', e.target.value)} /></div>
          <div><label style={labelStyle}>SELLER NAME</label><input style={inputStyle} value={form.seller_name} onChange={e => updateField('seller_name', e.target.value)} /></div>
          <div><label style={labelStyle}>PHONE</label><input style={inputStyle} value={form.phone} onChange={e => updateField('phone', e.target.value)} /></div>
        </div>

        <div style={{ borderTop: '1px solid #222', paddingTop: '24px', marginBottom: '24px' }}>
          <div style={{ color: '#FFD700', fontSize: '12px', letterSpacing: '2px', marginBottom: '16px' }}>PROBLEM CLASSIFICATION</div>
          <select style={inputStyle} value={form.problem_class} onChange={e => updateField('problem_class', e.target.value)}>
            <option>Financial</option><option>Structural</option><option>Legal</option><option>Tenant</option><option>Life Event</option><option>Market</option>
          </select>
        </div>

        <div style={{ borderTop: '1px solid #222', paddingTop: '24px', marginBottom: '24px' }}>
          <div style={{ color: '#FFD700', fontSize: '12px', letterSpacing: '2px', marginBottom: '16px' }}>5 WHYS - ROOT CAUSE ANALYSIS</div>
          <div style={{ display: 'grid', gap: '12px' }}>
            <input placeholder="Why 1: Why do you need to sell?" style={inputStyle} value={form.why1} onChange={e => updateField('why1', e.target.value)} />
            <input placeholder="Why 2: Why is that happening?" style={inputStyle} value={form.why2} onChange={e => updateField('why2', e.target.value)} />
            <input placeholder="Why 3: Why can't you fix it?" style={inputStyle} value={form.why3} onChange={e => updateField('why3', e.target.value)} />
            <input placeholder="Why 4: Why is that blocking you?" style={inputStyle} value={form.why4} onChange={e => updateField('why4', e.target.value)} />
            <input placeholder="ROOT CAUSE: The real reason" style={{...inputStyle, border: '1px solid #FFD700' }} value={form.root_cause} onChange={e => updateField('root_cause', e.target.value)} />
          </div>
        </div>

        <div style={{ borderTop: '1px solid #222', paddingTop: '24px', marginBottom: '24px' }}>
          <div style={{ color: '#FFD700', fontSize: '12px', letterSpacing: '2px', marginBottom: '16px' }}>IMPACT QUANTIFIED</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div><label style={labelStyle}>$ LOSS PER MONTH</label><input type="number" style={inputStyle} value={form.loss_per_month} onChange={e => updateField('loss_per_month', e.target.value)} /></div>
            <div><label style={labelStyle}>TIME DRAIN HRS/WEEK</label><input type="number" style={inputStyle} value={form.time_drain_hrs} onChange={e => updateField('time_drain_hrs', e.target.value)} /></div>
            <div><label style={labelStyle}>STRESS 1-10</label><input type="number" min="1" max="10" style={inputStyle} value={form.stress_level} onChange={e => updateField('stress_level', e.target.value)} /></div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #222', paddingTop: '24px', marginBottom: '24px' }}>
          <div style={{ color: '#FFD700', fontSize: '12px', letterSpacing: '2px', marginBottom: '16px' }}>KAIZEN OPPORTUNITY</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div><label style={labelStyle}>SMALL FIX</label><input placeholder="What $5k fix unlocks value?" style={inputStyle} value={form.kaizen_fix} onChange={e => updateField('kaizen_fix', e.target.value)} /></div>
            <div><label style={labelStyle}>VALUE UNLOCKED $</label><input type="number" style={inputStyle} value={form.kaizen_value} onChange={e => updateField('kaizen_value', e.target.value)} /></div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #222', paddingTop: '24px', marginBottom: '24px' }}>
          <div style={{ color: '#FFD700', fontSize: '12px', letterSpacing: '2px', marginBottom: '16px' }}>WHO CAN SOLVE</div>
          <select style={inputStyle} value={form.who_can_solve} onChange={e => updateField('who_can_solve', e.target.value)}>
            <option>Investor</option><option>Contractor</option><option>Attorney</option><option>Lender</option><option>Realtor</option><option>Property Manager</option><option>Investor + Contractor</option><option>Attorney + Investor</option>
          </select>
        </div>

        {aiSuggestion && (
          <div style={{ border: '1px solid #FFD700', padding: '16px', marginBottom: '24px', background: '#111' }}>
            <div style={{ color: '#FFD700', fontSize: '12px', letterSpacing: '2px', marginBottom: '12px' }}>AI 6SIGMA ANALYSIS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '12px' }}>
              <div><span style={{ color: '#666' }}>PAIN SCORE:</span> <span style={{ color: '#FFD700', fontWeight: '900' }}>{aiSuggestion.pain_score}/100</span></div>
              <div><span style={{ color: '#666' }}>STRATEGY:</span> <span style={{ color: '#E5E5E5' }}>{aiSuggestion.strategy}</span></div>
              <div><span style={{ color: '#666' }}>KAIZEN ROI:</span> <span style={{ color: '#E5E5E5' }}>{aiSuggestion.kaizen_roi}%</span></div>
            </div>
            <div style={{ marginTop: '12px', color: '#888', fontSize: '11px' }}>{aiSuggestion.summary}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" onClick={runAIProblemSolver} style={{ flex: 1, border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '16px', fontSize: '14px', fontWeight: '900', cursor: 'pointer', letterSpacing: '2px' }}>RUN AI SOLVER</button>
          <button type="submit" disabled={loading} style={{ flex: 1, border: '1px solid #FFD700', background: loading? '#333' : '#FFD700', color: loading? '#666' : '#000', padding: '16px', fontSize: '14px', fontWeight: '900', cursor: loading? 'not-allowed' : 'pointer', letterSpacing: '2px' }}>
            {loading? 'ANALYZING...' : 'SAVE PAIN INTAKE'}
          </button>
        </div>
      </form>
    </div>
  )
}
