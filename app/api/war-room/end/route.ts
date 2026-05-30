import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { war_room_id } = await request.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Get war room + deal data
  const { data: room } = await supabase
  .from('war_rooms')
  .select('*, deals(*)')
  .eq('id', war_room_id)
  .single()

  if (!room || room.status!== 'live') {
    return NextResponse.json({ error: 'Room not live' }, { status: 400 })
  }

  // 2. Get highest bid
  const { data: bids } = await supabase
  .from('war_room_bids')
  .select('*')
  .eq('war_room_id', war_room_id)
  .order('amount', { ascending: false })
  .limit(1)

  const highBid = bids?.[0]
  const reserveMet = highBid && highBid.amount >= room.deals.reserve_price

  // 3. SOLD PATH - Reserve met
  if (reserveMet && highBid) {
    await supabase.from('war_rooms').update({
      status: 'completed',
      winner_user_id: highBid.user_id,
      winning_bid_id: highBid.id,
      final_price: highBid.amount,
      ended_at: new Date().toISOString()
    }).eq('id', war_room_id)

    await supabase.from('war_room_events').insert({
      war_room_id,
      event_type: 'auction_completed',
      event_data: { winner: highBid.user_id, price: highBid.amount }
    })

    return NextResponse.json({ status: 'completed', winner: highBid.user_id, price: highBid.amount })
  }

  // 4. UNSOLD PATH - Reserve not met
  await supabase.from('war_rooms').update({
    status: 'unsold',
    ended_at: new Date().toISOString()
  }).eq('id', war_room_id)

  await supabase.from('war_room_events').insert({
    war_room_id,
    event_type: 'auction_unsold',
    event_data: { high_bid: highBid?.amount || 0, reserve: room.deals.reserve_price }
  })

  return NextResponse.json({ status: 'unsold' })
}
