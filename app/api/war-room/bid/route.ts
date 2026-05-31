import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { war_room_id, amount } = await request.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Get user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // 2. Get current room + highest bid
  const { data: room } = await supabase
    .from('war_rooms')
    .select('*, deals(reserve_price)')
    .eq('id', war_room_id)
    .single()

  if (!room || room.status!== 'live') {
    return NextResponse.json({ error: 'Auction not live' }, { status: 400 })
  }

  const { data: highBid } = await supabase
    .from('war_room_bids')
    .select('amount')
    .eq('war_room_id', war_room_id)
    .order('amount', { ascending: false })
    .limit(1)
    .single()

  const minBid = highBid?.amount? highBid.amount + 1000 : room.starting_price

  if (amount < minBid) {
    return NextResponse.json({ error: `Bid must be $${minBid.toLocaleString()} or higher` }, { status: 400 })
  }

  // 3. Insert the bid
  const { data: newBid, error: bidError } = await supabase
    .from('war_room_bids')
    .insert({
      war_room_id,
      user_id: user.id,
      amount
    })
    .select()
    .single()

  if (bidError) {
    return NextResponse.json({ error: bidError.message }, { status: 500 })
  }

  // 4. 2-MINUTE EXTENSION LOGIC
  const now = new Date()
  const endsAt = new Date(room.ends_at)
  const msLeft = endsAt.getTime() - now.getTime()
  const twoMinutes = 2 * 60 * 1000

  // If less than 2 min left, bump ends_at to 2 min from now
  if (msLeft < twoMinutes) {
    const newEndsAt = new Date(now.getTime() + twoMinutes)
    
    await supabase
      .from('war_rooms')
      .update({ 
        ends_at: newEndsAt.toISOString(),
        current_price: amount 
      })
      .eq('id', war_room_id)
  } else {
    // Just update current_price
    await supabase
      .from('war_rooms')
      .update({ current_price: amount })
      .eq('id', war_room_id)
  }

  // 5. Log event for realtime feed
  await supabase.from('war_room_events').insert({
    war_room_id,
    event_type: 'bid_placed',
    event_data: { 
      user_id: user.id, 
      amount,
      extended: msLeft < twoMinutes 
    }
  })

  return NextResponse.json({ success: true, bid: newBid })
}
