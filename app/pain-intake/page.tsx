'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

export default function PainIntake() {
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    zipcode: '',
    property_type: 'RESIDENTIAL',
    rehab_level: 'MEDIUM',
    problem_type: '',
    asking_price: '',
    arv: '',
    description: '',
    who_is_this_for: [] as string[],
    urgency: '1-2_WEEKS',
    contact_name: '',
    contact_phone: '',
    contact_email: ''
  })
  const [files, setFiles] = useState<FileList | null>(null)
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [analysis, setAnalysis] = useState({
    score: 0,
    status: 'PENDING',
    flags: [] as string[],
    route_to: [] as string[]
  })
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const asking = Number(form.asking_price) || 0
    const arv = Number(form.arv) || 0
    const spread = arv - asking
    const spreadPct = arv > 0? (spread / arv) * 100 : 0

    let score = 50
    const flags: string[] = []
    const route_to: string[] = []

    if (spreadPct > 30) { score += 20; flags.push('HIGH_MARGIN') }
    else if (spreadPct < 10 && arv > 0) { score -= 20; flags.push('MARGIN_COMPRESSION') }

    if (form.rehab_level === 'FULL' && spread < 50000) { score -= 15; flags.push('CAPITAL_MISMATCH') }
    if (form.rehab_level === 'LIGHT' && spread > 100000) { score += 10; flags.push('EQUITY_OPPORTUNITY') }

    if (files && files.length >= 3) { score += 15 }
    else if (form.rehab_level!== 'LIGHT' && (!files || files.length === 0)) { score -= 20; flags.push('NO_VISUAL_EVIDENCE') }

    if (form.urgency === 'ASAP' && form.rehab_level === 'TEARDOWN') { flags.push('EXECUTION_RISK') }

    if (form.who_is_this_for.includes('FLIPPER')) route_to.push('FLIP_OPERATORS')
    if (form.who_is_this_for.includes('BUY_HOLD')) route_to.push('RENTAL_PORTFOLIOS')
    if (form.rehab_level === 'TEARDOWN') route_to.push('BUILDERS')
    if (form.who_is_this_for.includes('WHOLESALER')) route_to.push('WHOLESALE_NETWORK')

    let status = 'PENDING'
    if (score >= 90) status = 'PASS'
    else if (score >= 70) status = 'REVIEW'
    else if (score >= 50) status = 'HOLD'
    else status = 'REJECT'

    setAnalysis({ score, status, flags, route_to })
  }, [form, files])

  const toggleTarget = (val: string) => {
    setForm(prev => ({
     ...prev,
      who_is_this_for: prev.who_is_this_for.includes(val)
       ? prev.who_is_this_for.filter(v => v!== val)
        : [...prev.who_is_this_for, val]
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    if (selectedFiles.length > 10) {
      alert('MAX 10 PHOTOS')
      e.target.value = ''
      return
    }

    setFiles(selectedFiles)
    const urls = Array.from(selectedFiles).map(file => URL.createObjectURL(file))
    setPreviews(urls)
  }

  const uploadPhotos = async (): Promise<string[]> => {
    if (!files || files.length === 0) return []
    setUploading(true)

    const urls: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error } = await supabase.storage
       .from('pain-deal-photos')
       .upload(fileName, file)

      if (error) {
        console.error('Upload error:', error)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
       .from('pain-deal-photos')
       .getPublicUrl(fileName)

      urls.push(publicUrl)
    }
    setUploading(false)
    return urls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const photoUrls = await uploadPhotos()

    const { error } = await supabase.from('pain_deals').insert([{
     ...form,
      asking_price: Number(form.asking_price) || null,
      arv: Number(form.arv) || null,
      photo_urls: photoUrls,
      dqi_score: analysis.score,
      intel_status: analysis.status,
      intel_flags: analysis.flags,
      routed_to: analysis.route_to,
      analyzed_at: new Date().toISOString(),
      status: analysis.status === 'REJECT'? 'REJECTED' : 'INTAKE'
    }])

    setLoading(false)
    if (error) alert(error.message)
    else {
      setSuccess(true)
      setTimeout(() => router.push('/deals'), 1500)
    }
  }

  if (success) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="grid-panel" style={{ padding: '24px 32px', textAlign: 'center' }}>
          <div style={{ color: '#4ade80', fontSize: '12px', marginBottom: '8px' }}>TRANSMISSION COMPLETE</div>
          <div style={{ color: '#a1a1aa', fontSize: '11px' }}>ROUTING TO QUALIFIED OPERATORS IN {form.state}</div>
          <div style={{ color: '#71717a', fontSize: '10px', marginTop: '8px' }}>DQI: {analysis.score} // STATUS: {analysis.status}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="grid-header">PAIN DEAL INTAKE // VAULTFORGE INTEL // PHOTO MODULE ACTIVE</div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#27272a', marginTop: '1px' }}>

          <div className="grid-panel" style={{ padding: '16px', gridColumn: '1 / -1' }}>
            <div className="field-label">Asset Location</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '8px' }}>
              <input placeholder="STREET ADDRESS" required value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                style={{ background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }} />
              <input placeholder="CITY" required value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                style={{ background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }} />
              <select value={form.state} onChange={e => setForm({...form, state: e.target.value})}
                style={{ background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }}>
                <option value="">STATE</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input placeholder="ZIP" value={form.zipcode} onChange={e => setForm({...form, zipcode: e.target.value})}
                style={{ background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }} />
            </div>
          </div>

          <div className="grid-panel" style={{ padding: '16px' }}>
            <div className="field-label">Property Type</div>
            <select value={form.property_type} onChange={e => setForm({...form, property_type: e.target.value})}
              style={{ width: '100%', background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }}>
              <option>RESIDENTIAL</option>
              <option>COMMERCIAL</option>
              <option>LAND</option>
              <option>MULTI-FAMILY</option>
            </select>
          </div>

          <div className="grid-panel" style={{ padding: '16px' }}>
            <div className="field-label">Rehab Level</div>
            <select value={form.rehab_level} onChange={e => setForm({...form, rehab_level: e.target.value})}
              style={{ width: '100%', background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }}>
              <option value="LIGHT">LIGHT // COSMETIC</option>
              <option value="MEDIUM">MEDIUM // SYSTEMS</option>
              <option value="FULL">FULL // GUT</option>
              <option value="TEARDOWN">TEARDOWN // FIRE</option>
            </select>
          </div>

          <div className="grid-panel" style={{ padding: '16px', gridColumn: '1 / -1' }}>
            <div className="field-label">Intel Photos // Max 10 // JPG PNG</div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              style={{ width: '100%', background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }}
            />
            {previews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px', marginTop: '12px' }}>
                {previews.map((url, i) => (
                  <div key={i} style={{ position: 'relative', paddingBottom: '100%', background: '#0a0a0b', border: '1px solid #27272a' }}>
                    <img src={url} alt={`Preview ${i+1}`} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '2px', right: '2px', background: '#000', color: '#facc15', fontSize: '9px', padding: '2px 4px' }}>
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {files && <div style={{ color: '#71717a', fontSize: '10px', marginTop: '8px' }}>{files.length}/10 FILES QUEUED</div>}
          </div>

          <div className="grid-panel" style={{ padding: '16px', gridColumn: '1 / -1' }}>
            <div className="field-label">Who Is This Deal For // Multi-Select</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['FLIPPER', 'BUY_HOLD', 'BRRR', 'BUILDER', 'WHOLESALER', 'CASH_BUYER'].map(t => (
                <button key={t} type="button" onClick={() => toggleTarget(t)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #3f3f46',
                    background: form.who_is_this_for.includes(t)? '#facc15' : '#0a0a0b',
                    color: form.who_is_this_for.includes(t)? '#000' : '#a1a1aa',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid-panel" style={{ padding: '16px' }}>
            <div className="field-label">Asking Price</div>
            <input type="number" placeholder="0" value={form.asking_price} onChange={e => setForm({...form, asking_price: e.target.value})}
              style={{ width: '100%', background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#60a5fa' }} />
          </div>

          <div className="grid-panel" style={{ padding: '16px' }}>
            <div className="field-label">ARV</div>
            <input type="number" placeholder="0" value={form.arv} onChange={e => setForm({...form, arv: e.target.value})}
              style={{ width: '100%', background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#4ade80' }} />
          </div>

          <div className="grid-panel" style={{ padding: '16px' }}>
            <div className="field-label">Urgency</div>
            <select value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})}
              style={{ width: '100%', background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }}>
              <option value="ASAP">ASAP // THIS WEEK</option>
              <option value="1-2_WEEKS">1-2 WEEKS</option>
              <option value="1-2_MONTHS">1-2 MONTHS</option>
            </select>
          </div>

          <div className="grid-panel" style={{ padding: '16px' }}>
            <div className="field-label">Problem Type</div>
            <input placeholder="FIRE, TITLE, FORECLOSURE" required value={form.problem_type} onChange={e => setForm({...form, problem_type: e.target.value})}
              style={{ width: '100%', background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }} />
          </div>

          <div className="grid-panel" style={{ padding: '16px', gridColumn: '1 / -1' }}>
            <div className="field-label">Situation Brief</div>
            <textarea placeholder="DESCRIBE THE PAIN. WHAT NEEDS TO BE SOLVED." required rows={3} value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              style={{ width: '100%', background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa', resize: 'vertical' }} />
          </div>

          <div className="grid-panel" style={{ padding: '16px', gridColumn: '1 / -1' }}>
            <div className="field-label">VAULTFORGE INTELLIGENCE ANALYSIS // LIVE</div>
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: '16px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: '900', color: analysis.score >= 70? '#4ade80' : analysis.score >= 50? '#fbbf24' : '#f87171' }}>
                  {analysis.score}
                </div>
                <div style={{ fontSize: '10px', color: '#71717a' }}>DQI SCORE</div>
              </div>
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '900',
                  color: analysis.status === 'PASS'? '#4ade80' : analysis.status === 'REVIEW'? '#fbbf24' : '#f87171'
                }}>
                  {analysis.status}
                </div>
                <div style={{ fontSize: '10px', color: '#71717a', marginTop: '4px' }}>
                  ROUTE TO: {analysis.route_to.join(', ') || 'UNASSIGNED'}
                </div>
              <div>
                <div style={{ fontSize: '10px', color: '#71717a' }}>FLAGS:</div>
                <div style={{ fontSize: '10px', color: '#f87171' }}>
                  {analysis.flags.length > 0? analysis.flags.join(' // ') : 'NONE'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid-panel" style={{ padding: '16px', gridColumn: '1 / -1' }}>
            <div className="field-label">Contact Node</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <input placeholder="NAME" required value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})}
                style={{ background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }} />
              <input placeholder="PHONE" required value={form.contact_phone} onChange={e => setForm({...form, contact_phone: e.target.value})}
                style={{ background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }} />
              <input placeholder="EMAIL" type="email" required value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})}
                style={{ background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }} />
            </div>
          </div>

          <button type="submit" disabled={loading || uploading}
            style={{
              gridColumn: '1 / -1',
              background: loading || uploading? '#27272a' : '#facc15',
              color: '#000',
              fontWeight: '900',
              padding: '16px',
              border: 'none',
              cursor: loading || uploading? 'not-allowed' : 'pointer',
              fontSize: '12px',
              letterSpacing: '0.1em'
            }}>
            {uploading? 'UPLOADING INTEL...' : loading? 'TRANSMITTING...' : 'EXECUTE TRANSMISSION // ROUTE TO INTEL'}
          </button>
        </form>
      </div>
    </div>
  )
}
