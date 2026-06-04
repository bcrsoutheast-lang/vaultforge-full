'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PainIntake() {
  const router = useRouter()
  const [assetType, setAssetType] = useState('RESIDENTIAL')
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    beds: '',
    baths: '',
    sqft: '',
    yearBuilt: '',
    ownerName: '',
    phone: '',
    email: '',
    motivation: '',
    condition: '',
    occupancy: '',
    askingPrice: '',
    estARV: '',
    estRepairs: '',
    notes: ''
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const states = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
  
  const motivations = [
    'Divorce',
    'Probate/Inherited', 
    'Foreclosure/NOD',
    'Tax Lien/Delinquent',
    'Tired Landlord',
    'Out of State Owner',
    'Code Violations',
    'Job Relocation',
    'Downsizing',
    'Financial Hardship',
    'Other'
  ]

  const conditions = ['A - Excellent', 'B - Good', 'C - Fair', 'D - Poor', 'F - Gut Job']
  const occupancy = ['Vacant', 'Owner Occupied', 'Tenant Occupied', 'Unknown']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = []
    
    if (!formData.address) newErrors.push('Property Address')
    if (!formData.city) newErrors.push('City')
    if (!formData.state) newErrors.push('State')
    if (!formData.zip) newErrors.push('Zip')
    if (!formData.beds) newErrors.push('Beds')
    if (!formData.baths) newErrors.push('Baths')
    if (!formData.sqft) newErrors.push('Sqft')
    if (!formData.ownerName) newErrors.push('Owner Name')
    if (!formData.phone) newErrors.push('Phone')
    if (!formData.motivation) newErrors.push('Motivation')
    if (!formData.condition) newErrors.push('Condition')
    if (!formData.occupancy) newErrors.push('Occupancy')
    if (!formData.askingPrice) newErrors.push('Asking Price')
    if (photos.length === 0) newErrors.push('Min 1 Photo')

    if (newErrors.length > 0) {
      setErrors(newErrors)
      window.scrollTo(0, 0)
      return
    }

    // Submit to /api/pain-intake
    console.log({ assetType,...formData, photos })
    router.push('/pain-room')
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).slice(0, 10)
      setPhotos(filesArray)
    }
  }

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white font-mono">
      {/* HEADER */}
      <div className="border-2 border-[#D4AF37] m-4">
        <div className="bg-[#1a1a1a] px-4 py-3 flex justify-between items-center border-b border-[#D4AF37]">
          <div className="text-[#D4AF37] text-sm">
            PAIN INTAKE FORM // NEW<br/>LEAD SUBMISSION
          </div>
          <button 
            onClick={() => router.back()}
            className="bg-[#FF3B30] text-white px-4 py-2 text-xs font-bold"
          >
            CLOSE<br/>[X]
          </button>
        </div>

        {/* ASSET TYPE TOGGLE */}
        <div className="border-b-2 border-[#D4AF37]">
          {['RESIDENTIAL', 'COMMERCIAL', 'LAND'].map((type) => (
            <button
              key={type}
              onClick={() => setAssetType(type)}
              className={`w-full py-4 text-center text-sm font-bold border-b border-[#333] ${
                assetType === type 
                 ? 'bg-[#D4AF37] text-[#0D0D0D]' 
                  : 'bg-[#1a1a1a] text-[#999]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* ERROR BANNER */}
        {errors.length > 0 && (
          <div className="bg-[#FF3B30] text-white p-4 text-xs font-bold">
            INCOMPLETE: FILL REQUIRED FIELDS + UPLOAD MIN 1 PHOTO
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="bg-[#1a1a1a]">
          {/* PROPERTY ADDRESS */}
          <div className="border-b border-[#333] p-4">
            <label className="text-[#666] text-xs mb-2 block">PROPERTY ADDRESS *</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="PROPERTY ADDRESS"
              className="w-full bg-[#0D0D0D] border border-[#333] rounded p-3 text-white text-sm focus:border-[#D4AF37] outline-none"
            />
          </div>

          {/* CITY */}
          <div className="border-b border-[#333] p-4">
            <label className="text-[#666] text-xs mb-2 block">CITY *</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              placeholder="CITY"
              className="w-full bg-[#0D0D0D] border border-[#333] rounded p-3 text-white text-sm focus:border-[#D4AF37] outline-none"
            />
          </div>

          {/* STATE */}
          <div className="border-b border-[#333] p-4">
            <label className="text-[#666] text-xs mb-2 block">STATE *</label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({...formData, state: e.target.value})}
              className="w-full bg-[#0D0D0D] border border-[#333] rounded p-3 text-white text-sm focus:border-[#D4AF37] outline-none"
            >
              <option value="">SELECT...</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* ZIP */}
          <div className="border-b border-[#333] p-4">
            <label className="text-[#666] text-xs mb-2 block">ZIP *</label>
            <input
              type="text"
              value={formData.zip}
              onChange={(e) => setFormData({...formData, zip: e.target.value})}
              placeholder="ZIP"
              className="w-full bg-[#0D0D0D] border border-[#333] rounded p-3 text-white text-sm focus:border-[#D4AF37] outline-none"
            />
          </div>

          {/* BEDS */}
          <div className="border-b border-[#333] p-4">
            <label className="text-[#666] text-xs mb-2 block">BEDS *</label>
            <select
              value={formData.beds}
              onChange={(e) => setFormData({...formData, beds: e.target.value})}
              className="w-full bg-[#0D0D0D] border border-[#333] rounded p-3 text-white text-sm focus:border-[#D4AF37] outline-none"
            >
              <option value="">SELECT...</option>
              {[1,2,3,4,5,6,7,8,9,'10+'].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* BATHS */}
          <div className="border-b border-[#333] p-4">
            <label className="text-[#666] text-xs mb-2 block">BATHS *</label>
            <select
              value={formData.baths}
              onChange={(e) => setFormData({...formData, baths: e.target.value})}
              className="w-full bg-[#0D0D0D] border border-[#333] rounded p-3 text-white text-sm focus:border-[#D4AF37] outline-none"
            >
              <option value="">SELECT...</option>
              {[1,1.5,2,2.5,3,3.5,4,4.5,5,6,7,8].map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* SQFT */}
          <div className="border-b border-[#333] p-4">
            <label className="text-[#666] text-xs mb-2 block">SQFT *</label>
            <input
              type="number"
              value={formData.sqft}
              onChange={(e) => setFormData({...formData, sqft: e.target.value})}
              placeholder="SQFT"
              className="w-full bg-[#0D0D0D] border border-[#333] rounded p-3 text-white text-sm focus:border-[#D4AF37] outline-none"
            />
          </div>

          {/* YEAR BUILT */}
          <div className="border-b border-[#333] p-4">
            <label className="text-[#666] text-xs mb-2 block">YEAR BUILT</label>
            <input
              type="number"
              value={formData.yearBuilt}
              onChange={(e) => setFormData({...formData, yearBuilt: e.target.value})}
              placeholder="YEAR BUILT"
              className="w-full bg-[#0D0D0D] border border-[#333] rounded p-3 text-white text-sm focus:border-[#D4AF37] outline-none"
            />
          </div>

          {/* OWNER NAME */}
          <div className="border-b border-[#333] p-4">
            <label className="text-[#666] text-xs mb-2 block">OWNER NAME *</label>
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
              placeholder="OWNER NAME"
              className="w-full bg-[#0D0D0D] border border-[#333] rounded p-3 text-white text-sm focus:border-[#D4AF37] outline-none"
            />
          </div>

          {/* PHONE */}
          <div className="border-b border-[#333] p-4">
            <label className="text-[#666] text-xs mb-2 block">PHONE *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="PHONE"
              className="w-full bg-[#0D0D0D] border border-[#333] rounded p-3 text-white text-sm focus:border-[#D4AF37] outline-none"
            />
          </div>

          {/* EMAIL */}
          <div className="border-b border-[#333] p-4">
            <label className="text-[#666] text-xs mb-2 block">EMAIL</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="EMAIL"
              className="w-full bg-[#0D0D0D] border border-[#333] rounded p-3 text-white text-sm focus:border-[#D4AF37] outline-none"
            />
          </div>

          {/* MOTIVATION */}
          <div className="border-b border-[#333] p-4">
            <label className="text-[#666] text-xs mb-2 block">MOTIVATION *</label>
            <select
              value={formData.motivation}
              onChange={(e) => setFormData({...formData, motivation: e.target.value})}
              className="w-full bg-[#0D0D0D] border border-[#333] rounded p-3 text-white text-sm focus:border-[#D4AF37] outline-none"
            >
              <option value="">SELECT...</option>
              {motivations.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* CONDITION */}
          <div className="border-b border-[#333] p-4">
            <label className="text-[#666] text-xs mb-2 block">CONDITION *</label>
            <select
              value={formData.condition}
              onChange={(e) => setFormData({...formData, condition: e.target.value})}
              className="w-full bg-[#0D0D0D] border border-[#333] rounded p-3 text-white text-sm focus:border-[#D4AF37] outline-none"
            >
              <option value="">SELECT...</option>
              {conditions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* OCCUPANCY */}
          <div className="border-b border-[#333] p-4">
            <label className="text-[#666] text-xs mb-2 block">OCCUPANCY *</label>
            <select
              value={formData.occupancy}
              onChange={(e) => setFormData({...formData, occupancy: e.target.value})}
              className="w-full bg-[#0D0D0D] border border-[#333] rounded p-3 text-white text-sm focus:border-[#D4AF37] outline-none"
            >
              <option value="">SELECT...</option>
              {occupancy.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* ASKING PRICE */}
          <div className="border-b border-[#333] p-4">
            <label className="text-[#666] text-xs mb-2 block">ASKING PRICE *</label>
            <input
              type="number"
              value={formData.askingPrice}
              onChange={(e) => setFormData({...formData, askingPrice: e.target.value})}
              placeholder="ASKING PRICE"
              className="w-full bg-[#0D0D0D] border border-[#333] rounded p-3 text-white text-sm focus:border-[#D4AF37] outline-none"
            />
          </div>

          {/* EST ARV */}
          <div className="border-b border-[#333] p-4">
            <label className="text-[#666] text-xs mb-2 block">EST ARV</label>
            <input
              type="number"
              value={formData.estARV}
              onChange={(e) => setFormData({...formData, estARV: e.target.value})}
              placeholder="EST ARV"
              className="w-full bg-[#0D0D0D] border border-[#333] rounded p-3 text-white text-sm focus:border-[#D4AF37] outline-none"
            />
          </div>

          {/* EST REPAIRS */}
          <div className="border-b border-[#333] p-4">
            <label className="text-[#666] text-xs mb-2 block">EST REPAIRS</label>
            <input
              type="number"
              value={formData.estRepairs}
              onChange={(e) => setFormData({...formData, estRepairs: e.target.value})}
              placeholder="EST REPAIRS"
              className="w-full bg-[#0D0D0D] border border-[#333] rounded p-3 text-white text-sm focus:border-[#D4AF37] outline-none"
            />
          </div>

          {/* NOTES */}
          <div className="border-b border-[#333] p-4">
            <label className="text-[#666] text-xs mb-2 block">NOTES</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="ADDITIONAL DETAILS..."
              rows={4}
              className="w-full bg-[#0D0D0D] border border-[#333] rounded p-3 text-white text-sm focus:border-[#D4AF37] outline-none resize-none"
            />
          </div>

          {/* PHOTOS */}
          <div className="border-b border-[#333] p-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[#666] text-xs">PHOTOS *</label>
              <span className="text-[#D4AF37] text-xs">{photos.length} / 10</span>
            </div>
            <label className="w-full bg-[#0D0D0D] border-2 border-dashed border-[#333] rounded p-8 text-center block cursor-pointer hover:border-[#D4AF37] transition">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <div className="text-[#666] text-xs">
                CLICK OR DRAG TO UPLOAD // MAX 10<br/>PHOTOS // JPG PNG ONLY
              </div>
            </label>
            {photos.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {photos.map((photo, i) => (
                  <div key={i} className="relative aspect-square bg-[#0D0D0D] rounded overflow-hidden">
                    <img src={URL.createObjectURL(photo)} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BUTTONS */}
          <div className="p-4 flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-[#1a1a1a] border border-[#333] text-[#999] py-4 rounded text-sm font-bold hover:border-[#D4AF37] transition"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#333] text-[#999] py-4 rounded text-sm font-bold hover:bg-[#D4AF37] hover:text-[#0D0D0D] transition"
            >
              SUBMIT PAIN
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
