// @ts-nocheck
'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Image from 'next/image'

export default function WarRoomPage() {
  const params = useParams()
  const [room, setRoom] = useState(null)
  const [deal, setDeal] = useState(null)
  const [bids, setBids] = useState([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [bidAmount, setBidAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [extended, setExtended] = useState(false)
  const [stats, setStats] = useState({ total_bids: 0, unique_bidders: 0 })
  const [user, setUser] = useState(null)
  const timerRef = useRef(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // 1. Load initial data + user
  useEffect(() => {
    loadRoom()
    getUser()
  }, [params.id])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadRoom = async () => {
    const { data: roomData } = await supabase
     .from('war_rooms')
     .select('*, deals(*)')
     .eq('id', params.id)
     .single()

    if (!roomData) return

    setRoom(roomData)
    setDeal(roomData.deals)

    const { data: bidData } = await supabase
     .from('war_room_bids')
     .select('*')
     .eq('war_room_id', params.id)
     .order('amount', { ascending: false })

    setBids(bidData || [])

    // Get stats
    const { data: statsData } = await supabase.rpc('get_war_room_stats', { room_id: params.id })
    setStats(statsData || { total_bids: 0, unique_bidders: 0 })

    updateTimer(roomData)
  }

  // 2. Realtime subscriptions
  useEffect(() => {
    if (!params.id) return

    const roomChannel = supabase
     .channel(`room-${params.id}`)
     .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'war_rooms',
        filter: `id=eq.${params.id}`
      }, (payload) => {
        setRoom(payload.new)
        updateTimer(payload.new)
      })
     .subscribe()

    const bidChannel = supabase
     .channel(`bids-${params.id}`)
     .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'war_room_bids',
        filter: `war_room_id=eq.${params.id}`
      }, (payload) => {
        setBids(prev => [payload.new,...prev])
        setStats(prev => ({
         ...prev,
          total_bids: prev.total_bids + 1
        }))
      })
     .subscribe()

    const eventChannel = supabase
     .channel(`events-${params.id}`)
     .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'war_room_events',
        filter: `war_room_id=eq.${params.id}`
      }, (payload) => {
        if (payload.new.event_type === 'bid_placed' && payload.new.event_data.extended) {
          setExtended(true)
          setTimeout(() => setExtended(false), 3000)
        }
      })
     .subscribe()

    return () => {
      supabase.removeChannel(roomChannel)
      supabase.removeChannel(bidChannel)
      supabase.removeChannel(eventChannel)
    }
  }, [params.id])

  // 3. Timer logic
  const updateTimer = (roomData) => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (roomData.status!== 'live') return

    timerRef.current = setInterval(() => {
      const end = new Date(roomData.ends_at).getTime()
      const now = new Date().getTime()
      const diff = Math.max(0, Math.floor((end - now) / 1000))
      setTimeLeft(diff)

      if (diff === 0) {
        clearInterval(timerRef.current)
        // Call end route
        fetch('/api/war-room/end', {
          method: 'POST',
          body: JSON.stringify({ war_room_id: params.id })
        })
      }
    }, 1000)
  }

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // 4. Place bid
  const placeBid = async () => {
    if (!user) {
      alert('Sign in to bid')
      return
    }

    setLoading(true)
    const res = await fetch('/api/war-room/bid', {
      method: 'POST',
      body: JSON.stringify({
        war_room_id: params.id,
        amount: parseInt(bidAmount)
      })
    })

    const data = await res.json()
    if (data.error) alert(data.error)
    else setBidAmount('')

    setLoading(false)
  }

  if (!room ||!deal) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-mono">
        <div className="text-amber-500">LOADING WAR ROOM...</div>
      </div>
    )
  }

  const highBid = bids[0]?.amount || room.starting_price
  const reserveMet = highBid >= deal.reserve_price
  const minBid = highBid + 1000

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono">
      {/* HEADER */}
      <div className="border-b border-zinc-800 bg-black">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/IMG_4751.png" alt="VaultForge" width={32} height={32} className="rounded" />
            <div>
              <div className="text-xs text-amber-500 tracking-widest">VAULTFORGE WAR ROOM</div>
              <div className="text-sm font-bold">{deal.address}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-500">STATUS</div>
            <div className={`font-bold ${
              room.status === 'live'? 'text-green-500' :
              room.status === 'completed'? 'text-amber-500' :
              room.status === 'unsold'? 'text-red-500' : 'text-zinc-500'
            }`}>
              {room.status.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-3 gap-4">
        {/* LEFT: DEAL INFO */}
        <div className="col-span-2 space-y-4">
          <div className="bg-black border border-zinc-800 rounded-lg p-6">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-xs text-zinc-500">ARV</div>
                <div className="text-xl font-bold">${deal.arv?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">REPAIRS</div>
                <div className="text-xl font-bold text-red-400">-${deal.repairs?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">RESERVE</div>
                <div className="text-xl font-bold text-amber-500">${deal.reserve_price?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">HIGH BID</div>
                <div className={`text-xl font-bold ${reserveMet? 'text-green-500' : 'text-white'}`}>
                  ${highBid.toLocaleString()}
                </div>
              </div>
            </div>

            {deal.photos?.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {deal.photos.slice(0, 3).map((url, i) => (
                  <div key={i} className="relative aspect-video rounded overflow-hidden">
                    <Image src={url} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs text-zinc-400">{deal.description}</div>
          </div>

          {/* BID HISTORY */}
          <div className="bg-black border border-zinc-800 rounded-lg p-6">
            <div className="text-xs text-amber-500 mb-3 tracking-widest">LIVE BID FEED</div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {bids.map((bid, i) => (
                <div key={bid.id} className="flex justify-between text-sm border-b border-zinc-900 pb-2">
                  <div className="text-zinc-400">
                    {bid.user_id === user?.id? 'YOU' : `BIDDER ${bid.user_id.slice(0, 6)}`}
                  </div>
                  <div className={`font-bold ${i === 0? 'text-green-500' : 'text-white'}`}>
                    ${bid.amount.toLocaleString()}
                  </div>
                </div>
              ))}
              {bids.length === 0 && (
                <div className="text-zinc-600 text-sm">NO BIDS YET</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: AUCTION PANEL */}
        <div className="space-y-4">
          <div className="bg-black border border-zinc-800 rounded-lg p-6">
            <div className="text-center mb-4">
              <div className="text-xs text-zinc-500">TIME REMAINING</div>
              <div className={`text-4xl font-bold ${timeLeft < 60? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
                {room.status === 'live'? formatTime(timeLeft) : '--:--'}
              </div>
              {extended && (
                <div className="text-amber-500 font-bold animate-pulse mt-1">
                  +2:00 EXTENDED
                </div>
              )}
            </div>

            {room.status === 'live' && (
              <>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">TOTAL BIDS</span>
                    <span className="font-bold">{stats.total_bids}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">BIDDERS</span>
                    <span className="font-bold">{stats.unique_bidders}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">RESERVE</span>
                    <span className={`font-bold ${reserveMet? 'text-green-500' : 'text-red-500'}`}>
                      {reserveMet? 'MET' : 'NOT MET'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={e => setBidAmount(e.target.value)}
                    placeholder={`Min: $${minBid.toLocaleString()}`}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded px-4 py-3 text-center text-xl font-bold focus:border-amber-500 outline-none"
                  />
                  <button
                    onClick={placeBid}
                    disabled={loading ||!bidAmount || parseInt(bidAmount) < minBid}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-800 disabled:text-zinc-600 py-4 rounded-lg font-bold text-lg transition-colors"
                  >
                    {loading? 'PLACING BID...' : 'PLACE BID'}
                  </button>
                  <div className="grid grid-cols-3 gap-2">
                    {[minBid, minBid + 5000, minBid + 10000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setBidAmount(amt.toString())}
                        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 py-2 rounded text-xs"
                      >
                        ${amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {room.status === 'completed' && (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500 mb-2">SOLD</div>
                <div className="text-sm text-zinc-400">Winning Bid</div>
                <div className="text-3xl font-bold">${room.final_price?.toLocaleString()}</div>
              </div>
            )}

            {room.status === 'unsold' && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500 mb-2">UNSOLD</div>
                <div className="text-sm text-zinc-400">Reserve not met</div>
              </div>
            )}

            {room.status === 'scheduled' && (
              <div className="text-center">
                <div className="text-xl font-bold text-zinc-500 mb-2">AUCTION SCHEDULED</div>
                <div className="text-sm text-zinc-400">
                  Starts {new Date(room.scheduled_for).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
