// @ts-nocheck
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Image from 'next/image'

export default function NewWarRoomPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [photos, setPhotos] = useState([])
  const [form, setForm] = useState({
    address: '',
    arv: '',
    repairs: '',
    reserve_price: '',
    starting_price: '',
    minimum_assignment: '',
    scheduled_for: '',
    description: ''
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    setLoading(true)
    
    for (const file of files) {
      const fileName = `${Date.now()}-${file.name}`
      const { error } = await supabase.storage
        .from('deal-photos')
        .upload(fileName, file)
      
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('deal-photos')
          .getPublicUrl(fileName)
        setPhotos(prev => [...prev, publicUrl])
      } else {
        alert('Photo upload failed: ' + error.message)
      }
    }
    setLoading(false)
  }

  const createWarRoom = async () => {
    setLoading(true)
    
    // 1. Get current user for RLS
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('You must be signed in to create a War Room')
      setLoading(false)
      return
    }

    // 2. Create deal first
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .insert({
        address: form.address,
        arv: parseInt(form.arv),
        repairs: parseInt(form.repairs),
        reserve_price: parseInt(form.reserve_price),
        minimum_assignment: parseInt(form.minimum_assignment),
        description: form.description,
        photos: photos,
        status: 'active',
        created_by: user.id
      })
      .select()
      .single()

    if (dealError) {
      alert('Error creating deal: ' + dealError.message)
      setLoading(false)
      return
    }

    // 3. Create war room - 15 min auction
    const endsAt = new Date(form.scheduled_for)
    endsAt.setMinutes(endsAt.getMinutes() + 15)

    const { data: room, error: roomError } = await supabase
      .from('war_rooms')
      .insert({
        deal_id: deal.id,
        scheduled_for: form.scheduled_for,
        ends_at: endsAt.toISOString(),
        starting_price: parseInt(form.starting_price),
        status: 'scheduled'
      })
      .select()
      .single()

    if (roomError) {
      alert('Error creating war room: ' + roomError.message)
      setLoading(false)
      return
    }

    router.push(`/war-room/${room.id}`)
  }

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i!== index))
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      {/* HEADER */}
      <div className="border-b border-zinc-800 bg-black">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Image src="/IMG_4751.png" alt="VaultForge" width={40} height={40} className="rounded" />
          <div>
            <div className="text-xs text-amber-500 tracking-widest">VAULTFORGE</div>
            <div className="text-lg font-bold">CREATE WAR ROOM</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-black border border-zinc-800 rounded-lg p-8 space-y-6">
          
          {/* PROPERTY DETAILS */}
          <div>
            <div className="text-xs text-amber-500 mb-4 tracking-widest">PROPERTY DETAILS</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-zinc-500">ADDRESS</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  placeholder="123 Main St, Atlanta GA"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-3 mt-1 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">ARV</label>
                <input
                  type="number"
                  value={form.arv}
                  onChange={e => setForm({...form, arv: e.target.value})}
                  placeholder="450000"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-3 mt-1 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">REPAIRS</label>
                <input
                  type="number"
                  value={form.repairs}
                  onChange={e => setForm({...form, repairs: e.target.value})}
                  placeholder="45000"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-3 mt-1 focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* AUCTION SETTINGS */}
          <div>
            <div className="text-xs text-amber-500 mb-4 tracking-widest">AUCTION SETTINGS</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-500">RESERVE PRICE</label>
                <input
                  type="number"
                  value={form.reserve_price}
                  onChange={e => setForm({...form, reserve_price: e.target.value})}
                  placeholder="300000"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-3 mt-1 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">STARTING BID</label>
                <input
                  type="number"
                  value={form.starting_price}
                  onChange={e => setForm({...form, starting_price: e.target.value})}
                  placeholder="250000"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-3 mt-1 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">MIN ASSIGNMENT FEE</label>
                <input
                  type="number"
                  value={form.minimum_assignment}
                  onChange={e => setForm({...form, minimum_assignment: e.target.value})}
                  placeholder="15000"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-3 mt-1 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">SCHEDULED START</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_for}
                  onChange={e => setForm({...form, scheduled_for: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-3 mt-1 focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* PHOTOS */}
          <div>
            <div className="text-xs text-amber-500 mb-4 tracking-widest">PROPERTY PHOTOS</div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-3 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-amber-600 file:text-black file:font-bold"
            />
            {photos.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {photos.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden group">
                    <Image src={url} alt="" fill className="object-cover" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-0 right-0 bg-red-600 text-white text-xs w-5 h-5 rounded-bl opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-xs text-zinc-500">DESCRIPTION / NOTES</label>
            <textarea
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder="3BR/2BA brick ranch. Needs roof + HVAC. Good rental area..."
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-3 mt-1 focus:border-amber-500 outline-none"
            />
          </div>

          {/* TERMS */}
          <div className="bg-zinc-900 border border-zinc-800 rounded p-4 text-xs text-zinc-400">
            <div className="font-bold text-amber-500 mb-2">WAR ROOM TERMS</div>
            <div>• Auction runs 15 minutes from scheduled start</div>
            <div>• Each new bid extends timer to 2:00 minimum</div>
            <div>• If SOLD: Winner pays 15% deposit. 2% platform fee applies.</div>
            <div>• If UNSOLD: $150 listing fee applies</div>
            <div>• All sales subject to contract + due diligence</div>
          </div>

          {/* SUBMIT */}
          <button
            onClick={createWarRoom}
            disabled={loading || !form.address || !form.reserve_price || !form.scheduled_for}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-800 disabled:text-zinc-600 py-4 rounded-lg font-bold text-lg transition-colors"
          >
            {loading? 'CREATING...' : 'LAUNCH WAR ROOM'}
          </button>
        </div>
      </div>
    </div>
  )
}
