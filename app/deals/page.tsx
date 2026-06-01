'use client'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

type DealStatus = 'active' | 'saved' | 'archived' | 'deleted'

export default function DealOpportunities() {
  const [activeTab, setActiveTab] = useState<DealStatus>('active')
  const [deals, setDeals] = useState<any[]>([])
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null)
  const [showSubmit, setShowSubmit] = useState(false)
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    zipcode: '',
    asking_price: '',
    arv: '',
    beds: '',
    baths: '',
    sqft: '',
    description: '',
    property_type: 'RESIDENTIAL',
    rehab_level: 'LIGHT',
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
  const [analysis, setAnalysis] = useState({
    score: 0,
    status: 'PENDING',
    flags: [] as string[],
    route_to: [] as string[]
  })
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    fetchDeals()
  }, [activeTab])

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

  const fetchDeals = async () => {
    const { data } = await supabase
    .from('deals')
    .select('*')
    .eq('status', activeTab)
    .order('created_at', { ascending: false })
    setDeals(data || [])
  }

  const updateDealStatus = async (id: string, newStatus: DealStatus) => {
    const { error } = await supabase
    .from('deals')
    .update({ status: newStatus })
    .eq('id', id)

    if (!error) {
      fetchDeals()
      setSelectedDeal(null)
    }
  }

  const deleteDeal = async (id: string) => {
    if (!confirm('PERMANENTLY DELETE THIS DEAL?')) return
    const { error } = await supabase.from('deals').delete().eq('id', id)
    if (!error) {
      fetchDeals()
      setSelectedDeal(null)
    }
  }

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
      const fileName = `deal-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

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

    const { error } = await supabase.from('deals').insert([{
      address: form.address,
      city: form.city,
      state: form.state,
      zipcode: form.zipcode,
      asking_price: Number(form.asking_price) || null,
      arv: Number(form.arv) || null,
      beds: Number(form.beds) || null,
      baths: Number(form.baths) || null,
      sqft: Number(form.sqft) || null,
      description: form.description,
      property_type: form.property_type,
      rehab_level: form.rehab_level,
      who_is_this_for: form.who_is_this_for,
      urgency: form.urgency,
      contact_name: form.contact_name,
      contact_phone: form.contact_phone,
      contact_email: form.contact_email,
      photo_urls: photoUrls,
      dqi_score: analysis.score,
      intel_status: analysis.status,
      intel_flags: analysis.flags,
      routed_to: analysis.route_to,
      analyzed_at: new Date().toISOString(),
      status: 'active'
    }])

    setLoading(false)
    if (error) alert(error.message)
    else {
      setForm({
        address: '', city: '', state: '', zipcode: '', asking_price: '', arv: '',
        beds: '', baths: '', sqft: '', description: '', property_type: 'RESIDENTIAL',
        rehab_level: 'LIGHT', who_is_this_for: [], urgency: '1-2_WEEKS',
        contact_name: '', contact_phone: '', contact_email: ''
      })
      setFiles(null)
      setPreviews([])
      setShowSubmit(false)
      fetchDeals()
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'PASS' || status === 'active') return '#4ade80'
    if (status === 'REVIEW' || status === 'saved') return '#fbbf24'
    if (status === 'HOLD' || status === 'archived') return '#60a5fa'
    return '#f87171'
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '16px' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <div className="grid-header">DEAL OPPORTUNITIES // VAULTFORGE INTEL</div>

        <div style={{ display: 'flex', gap: '1px', background: '#27272a', marginTop: '1px', marginBottom: '16px' }}>
          {(['active', 'saved', 'archived', 'deleted'] as DealStatus[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '12px',
                background: activeTab === tab? '#facc15' : '#0a0a0b',
                color: activeTab === tab? '#000' : '#a1a1aa',
                border: 'none',
                fontSize: '11px',
                fontWeight: '900',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              {tab} // {deals.filter(d => d.status === tab).length}
            </button>
          ))}
          <button
            onClick={() => setShowSubmit(!showSubmit)}
            style={{
              padding: '12px 24px',
              background: '#facc15',
              color: '#000',
              border: 'none',
              fontSize: '11px',
              fontWeight: '900',
              letterSpacing: '0.1em',
              cursor: 'pointer'
            }}
          >
            + SUBMIT DEAL
          </button>
        </div>

        {showSubmit && (
          <div className="grid-panel" style={{ marginBottom: '16px', padding: '0' }}>
            <div className="grid-header">SUBMIT DEAL // INTEL ANALYSIS ACTIVE</div>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1px', background: '#27272a' }}>

              <div className="grid-panel" style={{ padding: '16px' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <div className="field-label">Asking</div>
                    <input type="number" placeholder="0" value={form.asking_price} onChange={e => setForm({...form, asking_price: e.target.value})}
                      style={{ width: '100%', background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#60a5fa' }} />
                  </div>
                  <div>
                    <div className="field-label">ARV</div>
                    <input type="number" placeholder="0" value={form.arv} onChange={e => setForm({...form, arv: e.target.value})}
                      style={{ width: '100%', background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#4ade80' }} />
                  </div>
                  <div>
                    <div className="field-label">Beds/Baths</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input type="number" placeholder="BD" value={form.beds} onChange={e => setForm({...form, beds: e.target.value})}
                        style={{ width: '50%', background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }} />
                      <input type="number" placeholder="BA" value={form.baths} onChange={e => setForm({...form, baths: e.target.value})}
                        style={{ width: '50%', background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }} />
                    </div>
                  </div>
                  <div>
                    <div className="field-label">Sqft</div>
                    <input type="number" placeholder="0" value={form.sqft} onChange={e => setForm({...form, sqft: e.target.value})}
                      style={{ width: '100%', background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }} />
                  </div>
                </div>
              </div>

              <div className="grid-panel" style={{ padding: '16px' }}>
                <div className="field-label">Deal Photos // Max 10</div>
                <input type="file" accept="image/*" multiple onChange={handleFileChange}
                  style={{ width: '100%', background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }} />
                {previews.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px', marginTop: '8px' }}>
                    {previews.map((url, i) => (
                      <img key={i} src={url} alt={`Preview ${i+1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', border: '1px solid #27272a' }} />
                    ))}
                  </div>
                )}
              </div>

              <div className="grid-panel" style={{ padding: '16px' }}>
                <div className="field-label">Who Is This For</div>
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
                <div className="field-label">Contact Info</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <input placeholder="NAME" required value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})}
                    style={{ background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }} />
                  <input placeholder="PHONE" required value={form.contact_phone} onChange={e => setForm({...form, contact_phone: e.target.value})}
                    style={{ background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }} />
                  <input placeholder="EMAIL" type="email" required value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})}
                    style={{ background: '#0a0a0b', border: '1px solid #27272a', padding: '8px', color: '#fafafa' }} />
                </div>
              </div>

              <div className="grid-panel" style={{ padding: '16px' }}>
                <div className="field-label">INTELLIGENCE ANALYSIS // LIVE</div>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '16px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: analysis.score >= 70? '#4ade80' : analysis.score >= 50? '#fbbf24' : '#f87171' }}>
                      {analysis.score}
                    </div>
                    <div style={{ fontSize: '9px', color: '#71717a' }}>DQI</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: analysis.status === 'PASS'? '#4ade80' : analysis.status === 'REVIEW'? '#fbbf24' : '#f87171' }}>
                      {analysis.status}
                    </div>
                    <div style={{ fontSize: '9px', color: '#71717a', marginTop: '4px' }}>
                      ROUTE: {analysis.route_to.join(', ') || 'NONE'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: '#71717a' }}>FLAGS:</div>
                    <div style={{ fontSize: '9px', color: '#f87171' }}>
                      {analysis.flags.length > 0? analysis.flags.join(' // ') : 'NONE'}
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading || uploading}
                style={{
                  background: loading || uploading? '#27272a' : '#facc15',
                  color: '#000',
                  fontWeight: '900',
                  padding: '16px',
                  border: 'none',
                  cursor: loading || uploading? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  letterSpacing: '0.1em'
                }}>
                {uploading? 'UPLOADING INTEL...' : loading? 'TRANSMITTING...' : 'SUBMIT DEAL // EXECUTE'}
              </button>
            </form>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
          {deals.map(deal => (
            <div key={deal.id} className="grid-panel" style={{ padding: '0', cursor: 'pointer' }} onClick={() => setSelectedDeal(deal)}>
              <div style={{ position: 'relative', paddingBottom: '60%', background: '#0a0a0b' }}>
                {deal.photo_urls && deal.photo_urls[0] && (
                  <img src={deal.photo_urls[0]} alt={deal.address} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#000', padding: '4px 8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '900', color: getStatusColor(deal.intel_status) }}>
                    DQI {deal.dqi_score} // {deal.intel_status}
                  </div>
                </div>
              </div>
              <div style={{ padding: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#fafafa', marginBottom: '4px' }}>
                  {deal.address}, {deal.city} {deal.state}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#60a5fa' }}>
                    ${Number(deal.asking_price).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', color: '#4ade80' }}>
                    ARV ${Number(deal.arv).toLocaleString()}
                  </div>
                </div>
                <div style={{ fontSize: '10px', color: '#71717a' }}>
                  {deal.beds}BD {deal.baths}BA {deal.sqft}SQFT // {deal.property_type}
                </div>
                {activeTab === 'active' && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
                    <button onClick={(e) => { e.stopPropagation(); updateDealStatus(deal.id, 'saved') }}
                      style={{ flex: 1, padding: '6px', background: '#fbbf24', color: '#000', border: 'none', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                      SAVE
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); updateDealStatus(deal.id, 'archived') }}
                      style={{ flex: 1, padding: '6px', background: '#60a5fa', color: '#000', border: 'none', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                      ARCHIVE
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteDeal(deal.id) }}
                      style={{ flex: 1, padding: '6px', background: '#f87171', color: '#000', border: 'none', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                      DELETE
                    </button>
                  </div>
                )}
                {activeTab === 'saved' && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
                    <button onClick={(e) => { e.stopPropagation(); updateDealStatus(deal.id, 'active') }}
                      style={{ flex: 1, padding: '6px', background: '#4ade80', color: '#000', border: 'none', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                      ACTIVATE
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); updateDealStatus(deal.id, 'archived') }}
                      style={{ flex: 1, padding: '6px', background: '#60a5fa', color: '#000', border: 'none', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                      ARCHIVE
                    </button>
                  </div>
                )}
                {activeTab === 'archived' && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
                    <button onClick={(e) => { e.stopPropagation(); updateDealStatus(deal.id, 'active') }}
                      style={{ flex: 1, padding: '6px', background: '#4ade80', color: '#000', border: 'none', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                      RESTORE
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteDeal(deal.id) }}
                      style={{ flex: 1, padding: '6px', background: '#f87171', color: '#000', border: 'none', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                      DELETE
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {deals.length === 0 && (
          <div className="grid-panel" style={{ padding: '48px', textAlign: 'center', color: '#71717a', fontSize: '11px' }}>
            NO DEALS IN {activeTab.toUpperCase()} FOLDER
          </div>
        )}

        {selectedDeal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, padding: '24px', overflowY: 'auto' }}
            onClick={() => setSelectedDeal(null)}>
            <div className="grid-panel" style={{ maxWidth: '1200px', margin: '0 auto' }} onClick={e => e.stopPropagation()}>
              <div className="grid-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>DEAL INTEL // {selectedDeal.address}</span>
                <button onClick={() => setSelectedDeal(null)} style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '16px', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <div>
                    {selectedDeal.photo_urls && selectedDeal.photo_urls.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '16px' }}>
                        {selectedDeal.photo_urls.map((url: string, i: number) => (
                          <img key={i} src={url} alt={`Photo ${i+1}`} style={{ width: '100%', border: '1px solid #27272a' }} />
                        ))}
                      </div>
                    )}
                    <div className="field-label">Property Details</div>
                    <div style={{ fontSize: '11px', color: '#a1a1aa', lineHeight: '1.8' }}>
                      <div>ADDRESS: {selectedDeal.address}, {selectedDeal.city} {selectedDeal.state} {selectedDeal.zipcode}</div>
                      <div>TYPE: {selectedDeal.property_type} // {selectedDeal.beds}BD {selectedDeal.baths}BA {selectedDeal.sqft}SQFT</div>
                      <div>REHAB: {selectedDeal.rehab_level} // URGENCY: {selectedDeal.urgency}</div>
                      <div>ASKING: ${Number(selectedDeal.asking_price).toLocaleString()} // ARV: ${Number(selectedDeal.arv).toLocaleString()}</div>
                      <div style={{ marginTop: '8px' }}>DESCRIPTION: {selectedDeal.description}</div>
                    </div>
                  </div>
                  <div>
                    <div className="field-label">Contact Info</div>
                    <div style={{ fontSize: '11px', color: '#a1a1aa', lineHeight: '1.8', marginBottom: '16px' }}>
                      <div>NAME: {selectedDeal.contact_name}</div>
                      <div>PHONE: {selectedDeal.contact_phone}</div>
                      <div>EMAIL: {selectedDeal.contact_email}</div>
                    </div>
                    <div className="field-label">Intelligence Analysis</div>
                    <div style={{ fontSize: '11px', color: '#a1a1aa', lineHeight: '1.8' }}>
                      <div>DQI SCORE: <span style={{ color: getStatusColor(selectedDeal.intel_status), fontWeight: '900' }}>{selectedDeal.dqi_score}</span></div>
                      <div>STATUS: {selectedDeal.intel_status}</div>
                      <div>FLAGS: {selectedDeal.intel_flags?.join(' // ') || 'NONE'}</div>
                      <div>ROUTE TO: {selectedDeal.routed_to?.join(' // ') || 'UNASSIGNED'}</div>
                      <div>ANALYZED: {new Date(selectedDeal.analyzed_at).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
