import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const body = await req.json()
  
  // TODO: Replace with real auth. Using email from form for now
  const sender_email = body.current_user_email || 'guest@vaultforge.app'
  const sender_name = body.current_user_name || 'VaultForge User'

  const { error } = await supabase.from('messages').insert({
    deal_id: body.deal_id,
    sender_email,
    sender_name,
    sender_avatar: body.current_user_avatar || null,
    recipient_email: body.recipient_email,
    message: body.message,
    deal_snapshot: body.deal_snapshot
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
