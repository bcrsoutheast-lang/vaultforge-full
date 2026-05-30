// @ts-nocheck
'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Image from 'next/image'

export default function WarRoomPage() {
  const { id } = useParams()
  const router = useRouter()
  const [room, setRoom] = useState(null)
  const [bids, setBids] = useState([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [bidAmount, setBidAmount] = useState('')
  const [stats, setStats] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePhoto, setActivePhoto] = useState(0)
  const bidEndRef = useRef(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadRoom()
    loadUser()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [id])

  useEffect(() => {
    if (!room?.id) return
    const channel = supabase.channel(`war_room_${room.id}`)
     .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'war_room_bids', filter: `war_room_id=eq.${room.id}` },
        payload => {
          setBids(prev => [...prev, payload.new])
          bidEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
      )
     .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'war_rooms', filter: `id=eq.${room.id}` },
        payload => setRoom(payload.new)
      )
     .subscribe()
    return () => supabase.removeChannel(channel)
  }, [room?.id])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadRoom = async () => {
    const { data: roomData } = await supabase.from('war_rooms')
     .select('*, deals(*)').eq('id', id).single()
    const { data: bidData } = await supabase.from('war_room_bids')
     .select('*, users:auth.users(email)').eq('war_room_id', id).order('created_at', { ascending: true })
    const { data: statsData } = await supabase.rpc('get_war_room_stats', { room_id: id })

    setRoom(roomData)
    setBids(bidData || [])
    setStats(statsData)
    setLoading(false)
  }

  const tick = () => {
    if (!room?.ends_at) return
    const remaining = Math.max(0, Math.floor((new Date(room.ends_at).getTime() - Date.now()) / 1000))
    setTimeLeft(remaining)
    if (remaining === 0 && room.status === 'live') endAuction()
  }

  const placeBid = async () => {
    if (!user) return alert('Sign in to bid')
    const amount = parseInt(bidAmount)
    if (amount <= (room.current_price || room.starting_price)) return alert('Bid must be higher than current')

    await supabase.from('war_room_bids').insert({
      war_room_id: id,
      user_id: user.id,
      amount
    })
    setBidAmount('')
  }

  const endAuction = async () => {
    await fetch('/api/war-room/end', {
      method: 'POST',
      body: JSON.stringify({ war_room_id: id })
    })
  }

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-amber-500 font-mono">LOADING WAR ROOM...</div>
  if (!room) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-red-500 font-mono">ROOM NOT FOUND</div>

  const isLive = room.status === 'live'
  const isEnded = ['completed', 'unsold', 'cancelled'].includes(room.status)
  const highBid = bids[bids.length - 1]?.amount || room.starting_price
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const photos = room.deals?.photos || []

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      {/* HEADER - Bloomberg Military */}
      <div className="border-b border-zinc-800 bg-black">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/IMG_4751.png" alt="VaultForge" width={40} height={40} className="rounded" />
            <div>
              <div className="text-xs text-amber-500 tracking-widest">VAULTFORGE WAR ROOM</div>
              <div className="text-lg font-bold tracking-tight">{room.deals?.address?.toUpperCase()}</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-zinc-500">STATUS</div>
              <div className={`text-sm font-bold ${isLive? 'text-green-500 animate-pulse' : 'text-zinc-400'}`}>
                {room.status.toUpperCase()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-500">BIDDERS</div>
              <div className="text-sm font-bold text-amber-500">{stats?.unique_bidders || 0}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-12 gap-4">
        {/* LEFT: DEAL INTEL + PHOTOS */}
        <div className="col-span-3 space-y-4">
          {photos.length > 0 && (
            <div className="bg-black border border-zinc-800 rounded overflow-hidden">
              <div className="relative aspect-video bg-zinc-900">
                <Image
                  src={photos[activePhoto]}
                  alt="Property"
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                  {activePhoto + 1}/{photos.length}
                </div>
              </div>
              {photos.length > 1 && (
                <div className="flex gap-1 p-2 overflow-x-auto">
                  {photos.map((photo, i) => (
                    <button key={i} onClick={() => setActivePhoto(i)} className={`relative w-12 h-12 flex-shrink-0 rounded overflow-hidden ${i === activePhoto? 'ring-2 ring-amber-500' : 'opacity-50'}`}>
                      <Image src={photo} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-black border border-zinc-800 rounded p-4">
            <div className="text-xs text-zinc-500 mb-2">DEAL INTEL</div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">ARV</span>
                <span className="font-bold">${room.deals?.arv?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">REPAIRS</span>
                <span className="font-bold">${room.deals?.repairs?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">RESERVE</span>
                <span className="font-bold text-amber-500">${room.deals?.reserve_price?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">MIN ASSIGN</span>
                <span className="font-bold">${room.deals?.minimum_assignment?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-black border border-zinc-800 rounded p-4">
            <div className="text-xs text-zinc-500 mb-2">AUCTION RULES</div>
            <div className="text-xs text-zinc-400 space-y-1">
              <div>• 2% fee if SOLD</div>
              <div>• $150 fee if UNSOLD</div>
              <div>• 15% deposit due on win</div>
              <div>• 2min extension on bid</div>
            </div>
          </div>
        </div>

        {/* CENTER: BIDDING TERMINAL */}
        <div className="col-span-6 space-y-4">
          <div className="bg-black border-2 border-amber-600 rounded p-6 text-center">
            <div className="text-xs text-zinc-500 mb-1">TIME REMAINING</div>
            <div className={`text-6xl font-bold tracking-tighter ${timeLeft < 60? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </div>

          <div className="bg-black border border-zinc-800 rounded p-6 text-center">
            <div className="text-xs text-zinc-500 mb-1">CURRENT HIGH BID</div>
            <div className="text-5xl font-bold text-green-500 tracking-tight">
              ${highBid.toLocaleString()}
            </div>
            <div className="text-xs text-zinc-600 mt-2">
              {bids.length} BIDS | START: ${room.starting_price.toLocaleString()}
            </div>
          </div>

          {isLive && (
            <div className="bg-black border border-zinc-800 rounded p-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-xs text-zinc-500 mb-1">YOUR BID</div>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={e => setBidAmount(e.target.value)}
                    placeholder={String(highBid + 1000)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-3 text-2xl font-bold text-green-500 focus:border-amber-500 outline-none"
                  />
                </div>
                <button
                  onClick={placeBid}
                  disabled={!bidAmount || parseInt(bidAmount) <= highBid}
                  className="bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-800 disabled:text-zinc-600 px-8 rounded font-bold text-lg"
                >
                  BID
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                {[1000, 2500, 5000].map(inc => (
                  <button key={inc} onClick={() => setBidAmount(String(highBid + inc))}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded py-2 text-xs">
                    +${inc.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isEnded && (
            <div className="bg-black border-2 border-zinc-700 rounded p-8 text-center">
              <div className="text-2xl font-bold mb-2">
                {room.status === 'completed'? '🔨 SOLD' : room.status === 'unsold'? '❌ UNSOLD' : 'CANCELLED'}
              </div>
              {room.status === 'completed' && (
                <div className="text-zinc-400">Winner: {bids[bids.length-1]?.users?.email?.split('@')[0]} @ ${room.final_price?.toLocaleString()}</div>
              )}
              {room.status === 'unsold' && (
                <div className="text-zinc-400">Reserve not met. Seller charged $150 listing fee.</div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: BID TAPE */}
        <div className="col-span-3">
          <div className="bg-black border border-zinc-800 rounded h-[calc(100vh-140px)] flex flex-col">
            <div className="border-b border-zinc-800 p-3">
              <div className="text-xs text-amber-500 tracking-widest">LIVE BID TAPE</div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {bids.slice().reverse().map((bid, i) => (
                <div key={bid.id} className={`text-xs p-2 rounded ${i === 0? 'bg-green-950 border border-green-800' : 'bg-zinc-950'}`}>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">{new Date(bid.created_at).toLocaleTimeString()}</span>
                    <span className={`font-bold ${i === 0? 'text-green-500' : 'text-zinc-300'}`}>
                      ${bid.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-zinc-600 truncate">{bid.users?.email?.split('@')[0] || 'Anon'}</div>
                </div>
              ))}
              <div ref={bidEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
