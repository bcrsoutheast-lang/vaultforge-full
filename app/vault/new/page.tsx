'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewDealPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [formData, setFormData] = useState({
    address: '', city: '', state: '', zip: '',
    price: '', bedrooms: '', bathrooms: '', sqft: '',
    property_type: 'RESIDENTIAL',
    notes: '', exit_strategy: '', owner_contact: ''
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const runAIAnalyzer = async () => {
    if(!formData.price || !formData.address) return alert('Enter address and price first')
    setAnalyzing(true)
    // Real analyzer: replace this with OpenAI call later
    // For now this mocks it so you can see it save
    const mockAnalysis = {
      score: Math.floor(70 + Math.random() * 25),
      summary: `${formData.bedrooms}BR in ${formData.city} shows strong rental comps.`,
      estimated_arv: Math.floor(parseInt(formData.price) * 1.15),
      exit: formData.exit_strategy || "BRRRR recommended",
      risks: "Verify roof age. Check comps within 0.5mi"
    }
    setAiAnalysis(mockAnalysis)
    setAnalyzing(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Not logged in')
      setLoading(false)
      return
    }
    
    let photoUrl = ''
    if (photoFile) {
      const fileName = `${user.id}/${Date.now()}-${photoFile.name}`
      const { data, error: uploadError } = await supabase.storage
        .from('deal-photos')
        .upload(fileName, photoFile)
      
      if (uploadError) {
        alert('Photo upload failed: ' + uploadError.message)
        setLoading(false)
        return
      }
      if (data) photoUrl = supabase.storage.from('deal-photos').getPublicUrl(fileName).data.publicUrl
    }

    const { error } = await supabase.from('deals').insert({
      user_id: user.id,
     ...formData,
      price: parseInt(formData.price) || 0,
      bedrooms: parseInt(formData.bedrooms) || 0,
      bathrooms: parseInt(formData.bathrooms) || 0,
      sqft: parseInt(formData.sqft) || 0,
      ai_analysis: aiAnalysis, // This is the "smart ai analyzation saved with it"
      photos: photoUrl? [photoUrl] : [],
      card_image_url: photoUrl // This is "Pic needs to save on front"
    })

    setLoading(false)
    if (!error) router.push('/vault/saved')
    else alert('Save failed: ' + error.message)
  }

  return (
    <div className="bg-black min-h-screen text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center border-b border-yellow-500/30 pb-4 mb-8">
          <h1 className="text-yellow-500 text-2xl font-bold">NEW DEAL</h1>
          <button onClick={() => router.push('/vault/saved')} className="border border-yellow-500 px-4 py-2 text-sm">← SAVED DEALS</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Address" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3" />
            <select value={formData.property_type} onChange={e => setFormData({...formData, property_type: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3">
              <option>RESIDENTIAL</option><option>COMMERCIAL</option><option>LAND</option>
            </select>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <input placeholder="City" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3" />
            <input placeholder="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3" />
            <input placeholder="Zip" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3" />
            <input placeholder="Price" required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <input placeholder="Beds" type="number" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3" />
            <input placeholder="Baths" type="number" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3" />
            <input placeholder="SqFt" type="number" value={formData.sqft} onChange={e => setFormData({...formData, sqft: e.target.value})} className="bg-zinc-900 border border-zinc-700 p-3" />
          </div>

          <textarea placeholder="NOTES / STRATEGY" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 p-3 h-24" />
          
          <input placeholder="EXIT STRATEGY - Exit route" value={formData.exit_strategy} onChange={e => setFormData({...formData, exit_strategy: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 p-3" />
          
          <input placeholder="OWNER CONTACT / MESSAGE OWNER INFO" value={formData.owner_contact} onChange={e => setFormData({...formData, owner_contact: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 p-3" />

          <div>
            <p className="text-yellow-500 text-xs mb-2">PHOTOS - Saves on front and inside</p>
            <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="text-sm" />
          </div>

          <div className="border border-yellow-500/30 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-yellow-500">AI DEAL ANALYZER</h3>
              <button type="button" onClick={runAIAnalyzer} disabled={analyzing} className="bg-yellow-500 text-black px-4 py-2 text-sm font-bold disabled:opacity-50">
                {analyzing? 'ANALYZING...' : 'RUN ANALYSIS'}
              </button>
            </div>
            {aiAnalysis && (
              <div className="text-sm space-y-2 bg-zinc-900 p-4">
                <p><span className="text-yellow-500">VAULTFORGE SCORE:</span> {aiAnalysis.score}/100</p>
                <p><span className="text-yellow-500">SUMMARY:</span> {aiAnalysis.summary}</p>
                <p><span className="text-yellow-500">EST ARV:</span> ${aiAnalysis.estimated_arv?.toLocaleString()}</p>
                <p><span className="text-yellow-500">EXIT:</span> {aiAnalysis.exit}</p>
                <p><span className="text-yellow-500">RISKS:</span> {aiAnalysis.risks}</p>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-yellow-500 text-black py-4 font-bold text-lg disabled:opacity-50">
            {loading? 'SAVING TO VAULT...' : 'SAVE TO VAULT'}
          </button>
        </form>
      </div>
    </div>
  )
}
