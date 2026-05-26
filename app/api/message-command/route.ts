import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

function makeThreadKey(a: string, b: string, room: string) {
  const pair = [a, b].sort().join('::')
  return Buffer.from(`${pair}::${room || 'general'}`).toString('base64url')
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const lane = searchParams.get('lane')
  const thread = searchParams.get('thread')
  
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  if (thread) {
    const { data, error } = await supabase
     .from('vf_message_command_messages')
     .select('*')
     .eq('thread_key', thread)
     .order('created_at', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ messages: data })
  }

  let query = supabase
   .from('vf_message_command_messages')
   .select('*')
   .or(`from_email.eq.${email},recipient_email.eq.${email},to_email.eq.${email},sender_email.eq.${email},owner_email.eq.${email}`)

  if (lane && lane!== 'Archived' && lane!== 'Saved') {
    query = query.eq('folder_key', lane.toLowerCase())
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const grouped = new Map()
  for (const msg of data || []) {
    const key = msg.thread_key
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(msg)
  }

  const threads = Array.from(grouped.entries()).map(([key, msgs]: [string, any[]]) => {
    const latest = msgs[0]
    const unread = msgs.filter(m => 
      (m.recipient_email === email || m.to_email === email || m.owner_email === email) && 
      !m.read
    ).length
    return {
      threadKey: key,
      title: latest.title || latest.subject,
      room: latest.signal_id || latest.deal_id || latest.project_id || latest.pain_id || 'general',
      folder_key: latest.folder_key,
      latest_at: latest.created_at,
      latest_body: latest.body || latest.message,
      from_email: latest.from_email || latest.sender_email,
      recipient_email: latest.recipient_email || latest.to_email || latest.owner_email,
      unread_count: unread
    }
  })

  return NextResponse.json({ threads })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  if (action === 'send') {
    const { from_email, recipient_email, room, title, body: msgBody, folder_key } = body
    if (!from_email ||!recipient_email ||!msgBody) {
      return NextResponse.json({ error: 'from_email, recipient_email, body required' }, { status: 400 })
    }
    
    const tk = makeThreadKey(from_email, recipient_email, room || '')
    const { data, error } = await supabase
     .from('vf_message_command_messages')
     .insert({
        thread_key: tk,
        from_email,
        sender_email: from_email,
        recipient_email,
        to_email: recipient_email,
        owner_email: recipient_email,
        signal_id: room,
        room,
        title: title || 'No Subject',
        subject: title || 'No Subject',
        body: msgBody,
        message: msgBody,
        folder_key: folder_key || 'general',
        folder: folder_key || 'General',
        status: 'sent',
        read: false,
        source: 'message-command'
      })
     .select()
     .single()
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: data })
  }

  if (action === 'read') {
    const { ids } = body
    await supabase.from('vf_message_command_messages').update({ read: true }).in('id', ids)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'invalid action' }, { status: 400 })
}
