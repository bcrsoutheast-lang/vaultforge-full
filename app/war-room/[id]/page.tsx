// @ts-nocheck
'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { Geist_Mono } from 'next/font/google'

const geistMono = Geist_Mono({ subsets: ['latin'] })

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
  const [showGavel, setShowGavel] = useState(false)
  const timerRef = useRef(null)

  // SOUNDS DISABLED FOR CLEAN DEPLOY - UNCOMMENT WHEN YOU ADD FILES
  // const [playBid] = useSound('/sounds/bid.mp3', { volume: 0.5 })
  // const [playExtend] = useSound('/sounds/extend.mp3', { volume: 0.7 })
  // const [playSold] = useSound('/sounds/gavel.mp3', { volume: 0.8 })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

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
   .order('amount', { ascending: true })

    setBids(bidData || [])

    const { data: statsData } = await supabase.rpc('get_war_room_stats', { room_id: params.id })
    setStats(statsData || { total_bids: 0, unique_bidders: 0 })

    updateTimer(roomData)
  }

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
        if (payload.new.status === 'completed') {
          // playSold() // UNCOMMENT WHEN SOUNDS ADDED
          setShowGavel(true)
        }
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
        // playBid() // UNCOMMENT WHEN SOUNDS ADDED
        setBids(prev => [...prev, payload.new])
        setStats(prev => ({...prev, total_bids: prev.total_bids + 1 }))
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
          // playExtend() // UNCOMMENT WHEN SOUNDS ADDED
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
      <div className={`min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center ${geistMono.className}`}>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-amber-500 text-sm tracking-[0.3em]"
        >
          INITIALIZING WAR ROOM...
        </motion.div>
      </div>
    )
  }

  const sortedBids = [...bids].sort((a, b) => b.amount - a.amount)
  const highBid = sortedBids[0]?.amount || room.starting_price
  const reserveMet = highBid >= deal.reserve_price
  const minBid = highBid + 1000

  const chartData = bids.map((b, i) => ({
    name: i + 1,
    value: b.amount
  }))

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className={`min-h-screen bg-zinc-950 text-zinc-100 ${geistMono.className}`}>
      {/* ANIMATED GLOW BACKGROUND */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 transition-all duration-1000 ${
          room.status === 'live'? 'bg-amber-500' :
          room.status === 'completed'? 'bg-green-500' : 'bg-zinc-700'
        }`} />
      </div>

      {/* HEADER */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative border-b border-zinc-800/50 bg-black/80 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Image src="/IMG_4751.png" alt="VaultForge" width={36} height={36} className="rounded" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -inset-1 bg-amber-500/20 rounded-full blur-sm"
              />
            </div>
            <div>
              <div className="text-xs text-amber-500 tracking-[0.3em]">VAULTFORGE WAR ROOM</div>
              <div className="text-sm font-bold tracking-tight">{deal.address}</div>
              <div className="text-xs text-zinc-500">{deal.city}, {deal.state}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-500 tracking-widest">STATUS</div>
            <motion.div
              layout
              className={`font-bold text-sm tracking-wider ${
                room.status === 'live'? 'text-green-400' :
                room.status === 'completed'? 'text-amber-400' :
                room.status === 'unsold'? 'text-red-400' : 'text-zinc-500'
              }`}
            >
              {room.status.toUpperCase()}
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="relative max-w-7xl mx-auto p-4 grid lg:grid-cols-3 gap-4">
        {/* LEFT: DEAL + CHART */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-black/60 backdrop-blur-xl border border-zinc-800/50 rounded-xl p-6 relative overflow-hidden"
          >
            {reserveMet && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10 pointer-events-none"
              />
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-xs text-zinc-500 tracking-widest">ARV</div>
                <div className="text-2xl font-bold tracking-tight">${deal.arv?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 tracking-widest">REPAIRS</div>
                <div className="text-2xl font-bold text-red-400 tracking-tight">-${deal.repairs?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 tracking-widest">RESERVE</div>
                <div className="text-2xl font-bold text-amber-400 tracking-tight">${deal.reserve_price?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 tracking-widest">HIGH BID</div>
                <motion.div
                  layout
                  className={`text-2xl font-bold tracking-tight ${reserveMet? 'text-green-400' : 'text-white'}`}
                >
                  ${highBid.toLocaleString()}
                </motion.div>
              </div>
            </div>

            {chartData.length > 1 && (
              <div className="h-24 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="bidGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{ background: '#000', border: '1px solid #27272a', fontSize: '10px' }}
                      labelStyle={{ display: 'none' }}
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Bid']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} fill="url(#bidGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {deal.photos?.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {deal.photos.slice(0, 3).map((url, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    className="relative aspect-video rounded-lg overflow-hidden border border-zinc-800"
                  >
                    <Image src={url} alt="" fill className="object-cover" />
                  </motion.div>
                ))}
              </div>
            )}

            <div className="text-xs text-zinc-400 leading-relaxed">{deal.description}</div>
          </motion.div>

          {/* BID FEED */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 0.1 } }}
            className="bg-black/60 backdrop-blur-xl border border-zinc-800/50 rounded-xl p-6"
          >
            <div className="text-xs text-amber-500 mb-4 tracking-[0.3em]">LIVE BID FEED</div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {sortedBids.map((bid, i) => (
                  <motion.div
                    key={bid.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    className="flex justify-between items-center py-2 border-b border-zinc-900/50"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${i === 0? 'bg-green-400' : 'bg-zinc-700'}`} />
                      <div className="text-xs text-zinc-400">
                        {bid.user_id === user?.id? 'YOU' : `BIDDER ${bid.user_id.slice(0, 6).toUpperCase()}`}
                      </div>
                    </div>
                    <motion.div
                      layout
                      className={`font-bold text-sm tracking-tight ${i === 0? 'text-green-400' : 'text-white'}`}
                    >
                      ${bid.amount.toLocaleString()}
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {bids.length === 0 && (
                <div className="text-zinc-600 text-xs tracking-widest py-8 text-center">AWAITING FIRST BID</div>
              )}
            </div>
          </motion.div>
        </div>

        {/* RIGHT: AUCTION PANEL */}
        <div className="space-y-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
            className="bg-black/60 backdrop-blur-xl border border-zinc-800/50 rounded-xl p-6 sticky top-4"
          >
            <div className="text-center mb-6">
              <div className="text-xs text-zinc-500 tracking-[0.3em]">TIME REMAINING</div>
              <motion.div
                layout
                className={`text-5xl font-bold tracking-tighter ${timeLeft < 60? 'text-red-500' : 'text-amber-400'}`}
              >
                {room.status === 'live'? formatTime(timeLeft) : '--:--'}
              </motion.div>
              <AnimatePresence>
                {extended && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="text-amber-400 font-bold text-sm mt-2 tracking-widest"
                  >
                    +2:00 EXTENDED
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {room.status === 'live' && (
              <>
                <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                  <div>
                    <div className="text-xs text-zinc-500">BIDS</div>
                    <div className="text-lg font-bold">{stats.total_bids}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">BIDDERS</div>
                    <div className="text-lg font-bold">{stats.unique_bidders}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500">RESERVE</div>
                    <div className={`text-lg font-bold ${reserveMet? 'text-green-400' : 'text-red-400'}`}>
                      {reserveMet? 'MET' : 'OPEN'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={e => setBidAmount(e.target.value)}
                    placeholder={`Min: $${minBid.toLocaleString()}`}
                    className="w-full bg-zinc-950/80 border border-zinc-700/50 rounded-lg px-4 py-4 text-center text-2xl font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={placeBid}
                    disabled={loading ||!bidAmount || parseInt(bidAmount) < minBid}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-600 py-4 rounded-lg font-bold text-lg tracking-wider transition-all shadow-lg shadow-amber-500/20"
                  >
                    {loading? 'PROCESSING...' : 'PLACE BID'}
                  </motion.button>
                  <div className="grid grid-cols-3 gap-2">
                    {[minBid, minBid + 5000, minBid + 10000].map(amt => (
                      <motion.button
                        key={amt}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setBidAmount(amt.toString())}
                        className="bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/50 py-2.5 rounded-lg text-xs tracking-wider transition-all"
                      >
                        ${amt.toLocaleString()}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {room.status === 'completed' && (
              <div className="text-center py-8">
                <AnimatePresence>
                  {showGavel && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-6xl mb-4"
                    >
                      🔨
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="text-3xl font-bold text-green-400 mb-2 tracking-tight">SOLD</div>
                <div className="text-xs text-zinc-500 tracking-widest">WINNING BID</div>
                <div className="text-4xl font-bold tracking-tighter">${room.final_price?.toLocaleString()}</div>
              </div>
            )}

            {room.status === 'unsold' && (
              <div className="text-center py-8">
                <div className="text-3xl font-bold text-red-400 mb-2 tracking-tight">UNSOLD</div>
                <div className="text-xs text-zinc-500 tracking-widest">RESERVE NOT MET</div>
              </div>
            )}

            {room.status === 'scheduled' && (
              <div className="text-center py-8">
                <div className="text-xl font-bold text-zinc-400 mb-2 tracking-tight">SCHEDULED</div>
                <div className="text-xs text-zinc-500 tracking-widest">
                  {new Date(room.scheduled_for).toLocaleString()}
                </div>
              </div>
            )}

            {deal.state === 'TX' && (
              <div className="mt-6 pt-6 border-t border-zinc-800/50 text-[9px] text-zinc-500 leading-relaxed space-y-1">
                <div className="text-amber-500 font-bold tracking-widest">TX AUCTION TERMS</div>
                <div>• Reserve auction. Seller may reject bids.</div>
                <div>• 2% Buyer Premium applies.</div>
                <div>• 15% earnest to title co. within 24hrs.</div>
                <div>• No cooling-off. Bids binding.</div>
                <div>• Broker: {deal.broker_name || '[Pending]'}, TREC #{deal.broker_license || '[Pending]'}</div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
