"use client";
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function NewDeal() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    deal_type: 'residential',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    asking_price: '',
    notes: '',
    photos: [] as string[]
  })

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

  const handleSave = async () => {
    if (!user ||!form.address) {
      alert('Address required')
      return
    }
    setSaving(true)

    const { error } = await supabase.from('deals').insert({
      user_id: user.id,
      user_email: user.email,
      viewed: false,
      title: form.title || form.address,
      address: form.address,
      city: form.city,
      state: form.state,
      zipcode: form.zipcode,
      deal_type: form.deal_type,
      bedrooms: form.bedrooms? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms? Number(form.bathrooms) : null,
      sqft: form.sqft? Number(form.sqft) : null,
      asking_price: form.asking_price? Number(form.asking_price) : null,
      notes: form.notes,
      photos: form.photos
    })

    setSaving(false)
    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      alert('DEAL SAVED TO VAULT')
      router.push('/deals/saved')
    }
  }

  if (!user) return null

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#E5E5E5', padding: '24px' }}>
      <header style={{ borderBottom: '1px solid #FFD700', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Image src="/IMG_4751.png" alt="VaultForge" width={40} height={40} style={{ objectFit: 'contain' }} />
          <div>
            <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>NEW DEAL</div>
            <div style={{ color: '#666', fontSize: '11px', letterSpacing: '2px' }}>VAULT ENTRY PROTOCOL</div>
          </div>
        </div>
        <button onClick={() => router.push('/deals/saved')} style={{ border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>← SAVED DEALS</button>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <input placeholder="TITLE / NICKNAME" value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={inputStyle} />
          <select value={form.deal_type} onChange={e => setForm({...form, deal_type: e.target.value})} style={inputStyle}>
            <option value="residential">RESIDENTIAL</option>
            <option value="commercial">COMMERCIAL</option>
            <option value="land">LAND</option>
            <option value="multi-family">MULTI-FAMILY</option>
          </select>
        </div>

        <input placeholder="STREET ADDRESS*" value={form.address} onChange={e => setForm({...form, address: e.target.value})} style={{...inputStyle, marginBottom: '16px'}} />

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <input placeholder="CITY" value={form.city} onChange={e => setForm({...form, city: e.target.value})} style={inputStyle} />
          <input placeholder="STATE" value={form.state} onChange={e => setForm({...form, state: e.target.value})} style={inputStyle} />
          <input placeholder="ZIP" value={form.zipcode} onChange={e => setForm({...form, zipcode: e.target.value})} style={inputStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <input type="number" placeholder="BEDS" value={form.bedrooms} onChange={e => setForm({...form, bedrooms: e.target.value})} style={inputStyle} />
          <input type="number" placeholder="BATHS" value={form.bathrooms} onChange={e => setForm({...form, bathrooms: e.target.value})} style={inputStyle} />
          <input type="number" placeholder="SQFT" value={form.sqft} onChange={e => setForm({...form, sqft: e.target.value})} style={inputStyle} />
          <input type="number" placeholder="ASKING PRICE" value={form.asking_price} onChange={e => setForm({...form, asking_price: e.target.value})} style={inputStyle} />
        </div>

        <textarea placeholder="NOTES / STRATEGY" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={4} style={{...inputStyle, marginBottom: '16px', resize: 'vertical'}} />

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
          {saving? 'SAVING...' : 'SAVE + ANALYZE DEAL'}
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
