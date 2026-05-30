// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Image from 'next/image'

export default function RSVPPage() {
  const { id } = useParams()
  const router = useRouter()
  const [status, setStatus] = useState(null)
  const [room, setRoom] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    const { data: roomData } = await supabase
    .from('war_rooms')
    .select('*, deals(address, scheduled_for)')
    .eq('id', id)
    .single()

    setRoom(roomData)
    setLoading(false)
  }

  const rsvp = async (answer) => {
    if (!user) {
      alert('Please sign in first')
      return
    }

    await supabase.from('war_room_invites')
    .update({
        status: answer,
        responded_at: new Date().toISOString(),
        rsvp_ip: await fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => d.ip)
      })
    .eq('war_room_id', id)
    .eq('user_id', user.id)

    setStatus(answer)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-amber-500 font-mono">LOADING...</div>
      </div>
    )
  }

  if (status === 'confirmed') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold font-mono mb-2">YOU'RE IN</h1>
          <p className="text-zinc-400 mb-6">War Room: {room?.deals?.address}</p>
          <div className="bg-black border border-green-800 rounded p-4 text-sm">
            <div className="text-green-500 font-mono mb-2">CONFIRMED</div>
            <div className="text-zinc-400">You’ll get a text 10min before start.</div>
            <div className="text-zinc-600 mt-2 text-xs">Winner pays 15% deposit via Stripe if reserve met.</div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'declined') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold font-mono mb-2">MAYBE NEXT TIME</h1>
          <p className="text-zinc-400">We’ll hit you for the next one.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-black border border-amber-800 rounded-xl p-8">
        <div className="text-center mb-6">
          <Image src="/IMG_4751.png" alt="VaultForge" width={60} height={60} className="mx-auto mb-4 rounded" />
          <div className="text-amber-500 font-mono text-sm tracking-widest">🔴 WAR ROOM INVITE</div>
          <h1 className="text-2xl font-bold mt-2">{room?.deals?.address}</h1>
          <p className="text-zinc-400 mt-1">
            {room?.scheduled_for? new Date(room.scheduled_for).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            }) : 'TBD'}
          </p>
          <p className="text-zinc-500 text-sm">15 minute live auction</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => rsvp('confirmed')}
            className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg font-mono transition-colors"
          >
            YES, I'M IN
          </button>
          <button
            onClick={() => rsvp('declined')}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-mono transition-colors"
          >
            Can't make it
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-800">
          <p className="text-xs text-zinc-600 text-center font-mono">
            By confirming, you agree to War Room Terms. If you win: 15% non-refundable deposit due instantly. If UNSOLD: seller pays $150 listing fee.
          </p>
        </div>
      </div>
    </div>
  )
}
