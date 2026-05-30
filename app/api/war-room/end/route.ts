import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

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

  if (!room || room.status !== 'live') {
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
  const deposit = Math.floor(highBid?.amount * 0.15 * 100) // 15% in cents

  // 3. SOLD PATH - Reserve met
  if (reserveMet && highBid) {
    const vaultforgeFee = Math.floor(deposit * 0.02) // 2% of deposit to you
    
    // Charge winner 15% deposit via Stripe
    await stripe.paymentIntents.create({
      amount: deposit,
      currency: 'usd',
      customer: room.deals.seller_stripe_customer_id,
      payment_method: room.deals.seller_default_payment_method,
      confirm: true,
      description: `War Room Deposit - ${room.deals.address}`,
      metadata: { war_room_id, winner_id: highBid.user_id }
    })

    // Update war room as SOLD
    await supabase.from('war_rooms').update({
      status: 'completed',
      winner_user_id: highBid.user_id,
      winning_bid_id: highBid.id,
      final_price: highBid.amount,
      deposit_collected: deposit,
      vaultforge_fee_collected: vaultforgeFee,
      seller_payout: deposit - vaultforgeFee,
      ended_at: new Date().toISOString()
    }).eq('id', war_room_id)

    // Log event
    await supabase.from('war_room_events').insert({
      war_room_id,
      event_type: 'auction_completed',
      event_data: { winner: highBid.user_id, price: highBid.amount, deposit }
    })

    return NextResponse.json({ status: 'completed', winner: highBid.user_id, price: highBid.amount })
  }

  // 4. UNSOLD PATH - Reserve not met
  const unsoldFee = 15000 // $150 in cents
  
  // Charge seller $150 listing fee
  await stripe.paymentIntents.create({
    amount: unsoldFee,
    currency: 'usd',
    customer: room.deals.seller_stripe_customer_id,
    payment_method: room.deals.seller_default_payment_method,
    confirm: true,
    description: `War Room Unsold Fee - ${room.deals.address}`,
    metadata: { war_room_id, reason: 'reserve_not_met' }
  })

  // Update war room as UNSOLD
  await supabase.from('war_rooms').update({
    status: 'unsold',
    vaultforge_fee_collected: unsoldFee,
    ended_at: new Date().toISOString()
  }).eq('id', war_room_id)

  // Log event
  await supabase.from('war_room_events').insert({
    war_room_id,
    event_type: 'auction_unsold',
    event_data: { high_bid: highBid?.amount || 0, reserve: room.deals.reserve_price, fee_charged: 150 }
  })

  return NextResponse.json({ status: 'unsold', fee_charged: 150 })
}
