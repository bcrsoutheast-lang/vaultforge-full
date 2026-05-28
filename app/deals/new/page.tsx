use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Image from 'next/image' // ← add this

type DealType = 'residential' | 'commercial' | 'land'

export default function NewDeal() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [dealType, setDealType] = useState<DealType>('residential')
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [popup, setPopup] = useState<{ type: 'success' | 'error', msg: string } | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const initialForm = {
    title: '', address: '', city: '', state: '', zip: '',
    asking_price: '', arv: '', notes: '',
    beds: '', baths: '', sqft: '', year_built: '', lot_size: '',
    property_type: 'SFR', rehab_estimate: '', target_rent: '',
    exit_strategy: 'Flip',
    asset_class: 'Multifamily', units: '', noi: '', occupancy: '',
    lease_type: 'NNN', cap_rate: '',
    acres: '', zoning: '', utilities: '', topography: '',
    road_frontage: '', perc_test: 'Unknown',
    seller_motivation: '5', lead_source: '', comps_link: ''
  }

  const [form, setForm] = useState<any>(initialForm)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || !data.user.email) router.push('/login')
      else setUser(data.user)
    })
  }, [])

  const showPopup = (type: 'success' | 'error', msg: string) => {
    setPopup({ type, msg })
    setTimeout(() => setPopup(null), 3000)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (photos.length + files.length > 10) {
      showPopup('error', 'MAX 10 PHOTOS')
      return
    }
    setPhotos([...photos, ...files])
    const newPreviews = files.map(f => URL.createObjectURL(f))
    setPhotoPreviews([...photoPreviews, ...newPreviews])
  }

  const removePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx))
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== idx))
  }

  const runAIAnalysis = async () => {
    setAnalyzing(true)
    const analysis = {
      score: Math.floor(Math.random() * 40) + 60,
      mao: form.arv && form.rehab_estimate ? 
        Math.round((Number(form.arv) * 0.7) - Number(form.rehab_estimate)) : null,
      cap_rate: form.noi && form.asking_price ? 
        ((Number(form.noi) / Number(form.asking_price)) * 100).toFixed(2) : null,
      risk: Number(form.seller_motivation) < 5 ? 'High' : 'Medium',
      summary: `${dealType.toUpperCase()} deal in ${form.city || 'TBD'}. ${form.exit_strategy} strategy. Seller motivation: ${form.seller_motivation}/10.`
    }
    setTimeout(() => {
      setAiAnalysis(analysis)
      setAnalyzing(false)
    }, 1500)
  }

  const uploadPhotos = async () => {
    const urls: string[] = []
    for (const photo of photos) {
      const fileName = `${user.id}/${Date.now()}-${photo.name}`
      const { data, error } = await supabase.storage
        .from('deal-photos')
        .upload(fileName, photo)
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage
          .from('deal-photos')
          .getPublicUrl(fileName)
        urls.push(publicUrl)
      }
    }
    return urls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) return
    setLoading(true)

    try {
      await runAIAnalysis()
      const photoUrls = await uploadPhotos()

      const payload = {
        ...form,
        user_email: user.email,
        deal_type: dealType,
        status: 'saved',
        photos: photoUrls,
        ai_analysis: aiAnalysis,
        ai_score: aiAnalysis?.score || null,
        asking_price: form.asking_price ? Number(form.asking_price) : null,
        arv: form.arv ? Number(form.arv) : null,
        beds: form.beds ? Number(form.beds) : null,
        baths: form.baths ? Number(form.baths) : null,
        sqft: form.sqft ? Number(form.sqft) : null,
        year_built: form.year_built ? Number(form.year_built) : null,
        rehab_estimate: form.rehab_estimate ? Number(form.rehab_estimate) : null,
        target_rent: form.target_rent ? Number(form.target_rent) : null,
        units: form.units ? Number(form.units) : null,
        noi: form.noi ? Number(form.noi) : null,
        occupancy: form.occupancy ? Number(form.occupancy) : null,
        cap_rate: form.cap_rate ? Number(form.cap_rate) : null,
        acres: form.acres ? Number(form.acres) : null,
        road_frontage: form.road_frontage ? Number(form.road_frontage) : null,
        seller_motivation: Number(form.seller_motivation)
      }

      const { error } = await supabase.from('deals').insert(payload)
      if (error) throw error

      showPopup('success', 'DEAL SAVED TO VAULT')
      setForm(initialForm)
      setPhotos([])
      setPhotoPreviews([])
      setAiAnalysis(null)
      setDealType('residential')
      setTimeout(() => router.push('/deals/saved'), 1500)
    } catch (err: any) {
      showPopup('error', err.message || 'SAVE FAILED')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (confirm('CANCEL? All unsaved data will be lost.')) {
      setForm(initialForm)
      setPhotos([])
      setPhotoPreviews([])
      setAiAnalysis(null)
      router.push('/deals/saved')
    }
  }

  const updateField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  if (!user) return null

  const inputStyle = { width: '100%', background: '#111', border: '1px solid #333', color: '#E5E5E5', padding: '12px', fontSize: '14px', outline: 'none' }
  const labelStyle = { color: '#FFD700', fontSize: '10px', letterSpacing: '2px', marginBottom: '6px', display: 'block' }
  const btnStyle = (active: boolean) => ({ flex: 1, border: `1px solid ${active ? '#FFD700' : '#333'}`, background: active ? '#FFD700' : 'transparent', color: active ? '#000' : '#888', padding: '12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px' })

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#E5E5E5', padding: '24px' }}>
      {popup && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: popup.type === 'success' ? '#FFD700' : '#FF6B6B', color: '#000', padding: '16px 24px', fontSize: '12px', fontWeight: '900', letterSpacing: '2px', zIndex: 1000 }}>
          {popup.msg}
        </div>
      )}

      <header style={{ borderBottom: '1px solid #FFD700', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Image src="/vaultforge-logo.png" alt="VaultForge" width={40} height={40} style={{ objectFit: 'contain' }} />
          <div>
            <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>NEW DEAL</div>
            <div style={{ color: '#666', fontSize: '11px', letterSpacing: '2px' }}>ADD TO PRIVATE VAULT. AI ANALYZER ACTIVE.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => router.push('/dashboard')} style={{ border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>← COMMAND CENTER</button>
          <button onClick={handleCancel} style={{ border: '1px solid #FF6B6B', background: 'transparent', color: '#FF6B6B', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>CANCEL</button>
        </div>
      </header>

      <form onSubmit={handleSubmit} style={{ maxWidth: '900px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button type="button" onClick={() => setDealType('residential')} style={btnStyle(dealType === 'residential')}>RESIDENTIAL</button>
          <button type="button" onClick={() => setDealType('commercial')} style={btnStyle(dealType === 'commercial')}>COMMERCIAL</button>
          <button type="button" onClick={() => setDealType('land')} style={btnStyle(dealType === 'land')}>LAND</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div><label style={labelStyle}>DEAL NAME</label><input required style={inputStyle} value={form.title} onChange={e => updateField('title', e.target.value)} /></div>
          <div><label style={labelStyle}>ASKING PRICE</label><input type="number" style={inputStyle} value={form.asking_price} onChange={e => updateField('asking_price', e.target.value)} /></div>
          <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>STREET ADDRESS</label><input style={inputStyle} value={form.address} onChange={e => updateField('address', e.target.value)} /></div>
          <div><label style={labelStyle}>CITY</label><input style={inputStyle} value={form.city} onChange={e => updateField('city', e.target.value)} /></div>
          <div><label style={labelStyle}>STATE</label><input style={inputStyle} value={form.state} onChange={e => updateField('state', e.target.value)} /></div>
          <div><label style={labelStyle}>ZIP</label><input style={inputStyle} value={form.zip} onChange={e => updateField('zip', e.target.value)} /></div>
          <div><label style={labelStyle}>ARV</label><input type="number" style={inputStyle} value={form.arv} onChange={e => updateField('arv', e.target.value)} /></div>
        </div>

        {dealType === 'residential' && (
          <div style={{ borderTop: '1px solid #222', paddingTop: '24px', marginBottom: '24px' }}>
            <div style={{ color: '#FFD700', fontSize: '12px', letterSpacing: '2px', marginBottom: '16px' }}>RESIDENTIAL DETAILS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
              <div><label style={labelStyle}>BEDS</label><input type="number" style={inputStyle} value={form.beds} onChange={e => updateField('beds', e.target.value)} /></div>
              <div><label style={labelStyle}>BATHS</label><input type="number" style={inputStyle} value={form.baths} onChange={e => updateField('baths', e.target.value)} /></div>
              <div><label style={labelStyle}>SQFT</label><input type="number" style={inputStyle} value={form.sqft} onChange={e => updateField('sqft', e.target.value)} /></div>
              <div><label style={labelStyle}>YEAR BUILT</label><input type="number" style={inputStyle} value={form.year_built} onChange={e => updateField('year_built', e.target.value)} /></div>
              <div><label style={labelStyle}>TYPE</label><select style={inputStyle} value={form.property_type} onChange={e => updateField('property_type', e.target.value)}><option>SFR</option><option>Multi</option><option>Condo</option><option>Townhome</option></select></div>
              <div><label style={labelStyle}>REHAB EST</label><input type="number" style={inputStyle} value={form.rehab_estimate} onChange={e => updateField('rehab_estimate', e.target.value)} /></div>
              <div><label style={labelStyle}>TARGET RENT</label><input type="number" style={inputStyle} value={form.target_rent} onChange={e => updateField('target_rent', e.target.value)} /></div>
              <div><label style={labelStyle}>EXIT STRATEGY</label><select style={inputStyle} value={form.exit_strategy} onChange={e => updateField('exit_strategy', e.target.value)}><option>Flip</option><option>BRRRR</option><option>Wholesale</option><option>Hold</option></select></div>
            </div>
          </div>
        )}

        {dealType === 'commercial' && (
          <div style={{ borderTop: '1px solid #222', paddingTop: '24px', marginBottom: '24px' }}>
            <div style={{ color: '#FFD700', fontSize: '12px', letterSpacing: '2px', marginBottom: '16px' }}>COMMERCIAL DETAILS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div><label style={labelStyle}>ASSET CLASS</label><select style={inputStyle} value={form.asset_class} onChange={e => updateField('asset_class', e.target.value)}><option>Multifamily</option><option>Office</option><option>Retail</option><option>Industrial</option></select></div>
              <div><label style={labelStyle}>UNITS</label><input type="number" style={inputStyle} value={form.units} onChange={e => updateField('units', e.target.value)} /></div>
              <div><label style={labelStyle}>NOI ANNUAL</label><input type="number" style={inputStyle} value={form.noi} onChange={e => updateField('noi', e.target.value)} /></div>
              <div><label style={labelStyle}>OCCUPANCY %</label><input type="number" style={inputStyle} value={form.occupancy} onChange={e => updateField('occupancy', e.target.value)} /></div>
              <div><label style={labelStyle}>CAP RATE %</label><input type="number" style={inputStyle} value={form.cap_rate} onChange={e => updateField('cap_rate', e.target.value)} /></div>
              <div><label style={labelStyle}>LEASE TYPE</label><select style={inputStyle} value={form.lease_type} onChange={e => updateField('lease_type', e.target.value)}><option>NNN</option><option>Gross</option><option>Modified</option></select></div>
            </div>
          </div>
        )}

        {dealType === 'land' && (
          <div style={{ borderTop: '1px solid #222', paddingTop: '24px', marginBottom: '24px' }}>
            <div style={{ color: '#FFD700', fontSize: '12px', letterSpacing: '2px', marginBottom: '16px' }}>LAND DETAILS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div><label style={labelStyle}>ACRES</label><input type="number" step="0.01" style={inputStyle} value={form.acres} onChange={e => updateField('acres', e.target.value)} /></div>
              <div><label style={labelStyle}>ZONING</label><input style={inputStyle} value={form.zoning} onChange={e => updateField('zoning', e.target.value)} /></div>
              <div><label style={labelStyle}>ROAD FRONTAGE FT</label><input type="number" style={inputStyle} value={form.road_frontage} onChange={e => updateField('road_frontage', e.target.value)} /></div>
              <div><label style={labelStyle}>UTILITIES</label><input placeholder="Water, Sewer, Electric" style={inputStyle} value={form.utilities} onChange={e => updateField('utilities', e.target.value)} /></div>
              <div><label style={labelStyle}>TOPOGRAPHY</label><input placeholder="Flat, Sloped, Wooded" style={inputStyle} value={form.topography} onChange={e => updateField('topography', e.target.value)} /></div>
              <div><label style={labelStyle}>PERC TEST</label><select style={inputStyle} value={form.perc_test} onChange={e => updateField('perc_test', e.target.value)}><option>Unknown</option><option>Passed</option><option>Failed</option><option>Not Required</option></select></div>
            </div>
          </div>
        )}

        <div style={{ borderTop: '1px solid #222', paddingTop: '24px', marginBottom: '24px' }}>
          <div style={{ color: '#FFD700', fontSize: '12px', letterSpacing: '2px', marginBottom: '16px' }}>PHOTOS - UP TO 10</div>
          <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} id="photo-upload" />
          <label htmlFor="photo-upload" style={{ display: 'inline-block', border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '12px 24px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', marginBottom: '16px' }}>+ UPLOAD PHOTOS</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
            {photoPreviews.map((url, idx) => (
              <div key={idx} style={{ position: 'relative', aspectRatio: '1' }}>
                <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', border: '1px solid #333' }} />
                <button type="button" onClick={() => removePhoto(idx)} style={{ position: 'absolute', top: '4px', right: '4px', background: '#FF6B6B', color: '#000', border: 'none', width: '20px', height: '20px', fontSize: '14px', cursor: 'pointer', fontWeight: '900' }}>×</button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid #222', paddingTop: '24px', marginBottom: '24px' }}>
          <div style={{ color: '#FFD700', fontSize: '12px', letterSpacing: '2px', marginBottom: '16px' }}>INVESTOR INTEL</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div><label style={labelStyle}>SELLER MOTIVATION 1-10</label><input type="number" min="1" max="10" style={inputStyle} value={form.seller_motivation} onChange={e => updateField('seller_motivation', e.target.value)} /></div>
            <div><label style={labelStyle}>LEAD SOURCE</label><input placeholder="MLS, Direct, Wholesaler" style={inputStyle} value={form.lead_source} onChange={e => updateField('lead_source', e.target.value)} /></div>
            <div><label style={labelStyle}>COMPS LINK</label><input placeholder="https://" style={inputStyle} value={form.comps_link} onChange={e => updateField('comps_link', e.target.value)} /></div>
          </div>
          <div style={{ marginTop: '16px' }}><label style={labelStyle}>PRIVATE NOTES</label><textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={form.notes} onChange={e => updateField('notes', e.target.value)} /></div>
        </div>

        {aiAnalysis && (
          <div style={{ border: '1px solid #FFD700', padding: '16px', marginBottom: '24px', background: '#111' }}>
            <div style={{ color: '#FFD700', fontSize: '12px', letterSpacing: '2px', marginBottom: '12px' }}>AI DEAL ANALYSIS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '12px' }}>
              <div><span style={{ color: '#666' }}>SCORE:</span> <span style={{ color: '#FFD700', fontWeight: '900' }}>{aiAnalysis.score}/100</span></div>
              <div><span style={{ color: '#666' }}>MAO:</span> <span style={{ color: '#E5E5E5' }}>${aiAnalysis.mao?.toLocaleString() || 'N/A'}</span></div>
              <div><span style={{ color: '#666' }}>CAP RATE:</span> <span style={{ color: '#E5E5E5' }}>{aiAnalysis.cap_rate || 'N/A'}%</span></div>
            </div>
            <div style={{ marginTop: '12px', color: '#888', fontSize: '11px' }}>{aiAnalysis.summary}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" disabled={loading || analyzing} style={{ flex: 1, border: '1px solid #FFD700', background: loading || analyzing ? '#333' : '#FFD700', color: loading || analyzing ? '#666' : '#000', padding: '16px', fontSize: '14px', fontWeight: '900', cursor: loading || analyzing ? 'not-allowed' : 'pointer', letterSpacing: '2px' }}>
            {analyzing ? 'AI ANALYZING...' : loading ? 'SAVING TO VAULT...' : 'SAVE + ANALYZE DEAL'}
          </button>
        </div>
      </form>
    </div>
  )
}
