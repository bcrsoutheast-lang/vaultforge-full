import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Uses service role to bypass RLS
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const {
      deal_id,
      recipient_email,
      message,
      current_user_email,
      current_user_name,
      current_user_avatar,
      deal_snapshot
    } = body

    // Validation
    if (!deal_id || !recipient_email || !message || !current_user_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Don't let users message themselves
    if (current_user_email === recipient_email) {
      return NextResponse.json(
        { error: 'Cannot message yourself' },
        { status: 400 }
      )
    }

    // Insert into messages table
    const { data, error } = await supabase
      .from('messages')
      .insert({
        deal_id: deal_id,
        sender_email: current_user_email,
        sender_name: current_user_name || 'VaultForge User',
        sender_avatar: current_user_avatar,
        recipient_email: recipient_email,
        message: message,
        deal_image: deal_snapshot?.image_url,
        deal_title: deal_snapshot?.title,
        deal_price: deal_snapshot?.price,
        deal_beds: deal_snapshot?.beds,
        deal_baths: deal_snapshot?.baths,
        deal_sqft: deal_snapshot?.sqft,
        created_at: new Date().toISOString(),
        read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save message', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Message sent successfully',
      data 
    })

  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json(
      { error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}
