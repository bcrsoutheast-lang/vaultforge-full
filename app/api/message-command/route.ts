import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url ||!key) {
    throw new Error('Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key)
}

function threadKey(from: string, to: string, room: string) {
  const pair = [from, to].sort().join('::')
  return Buffer.from(`${pair}::${room || 'general'}`).toString('base64url')
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const lane = searchParams.get('lane')
  const thread = searchParams.get('thread')
  
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  try {
    const supabase = getSupabase()

    if (thread) {
      const { data, error } = await supabase
      .from('vf_message_command_messages')
      .select('*')
      .eq('thread_key', thread)
      .not('deleted_by', 'cs', `{${email}}`)
      .order('created_at', { ascending: true })
      if (error) throw error
      return NextResponse.json({ messages: data })
    }

    let query = supabase
    .from('vf_message_command_messages')
    .select('*')
    .or(`from_email.eq.${email},recipient_email.eq.${email}`)
    .not('deleted_by', 'cs', `{${email}}`)

    if (lane === 'Saved') query = query.contains('saved_by', [email])
    else if (lane === 'Alerts') query = query.eq('message_type', 'Alerts')
    else if (lane === 'Pain') query = query.eq('message_type', 'Pain')
    else if (lane === 'Signals') query = query.eq('message_type', 'Signals')
    else if (lane === 'Routing') query = query.eq('message_type', 'Routing')
    else if (lane === 'Introductions') query = query.eq('message_type', 'Introductions')
    else if (lane === 'Projects') query = query.eq('message_type', 'Projects')
    else if (lane === 'Members') query = query.eq('message_type', 'Members')
    else if (lane === 'General') query = query.eq('message_type', 'General')
    else if (lane === 'Archived') query = query.contains('archived_by', [email])

    if (lane!== 'Archived') query = query.not('archived_by', 'cs', `{${email}}`)

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error

    const grouped = new Map()
    for (const msg of data || []) {
      const key = msg.thread_key
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key).push(msg)
    }

    const threads = Array.from(grouped.entries()).map(([key, msgs]) => {
      const latest = msgs[0]
      const unread = msgs.filter(m => m.recipient_email === email &&!m.read_by?.includes(email)).length
      return {
        threadKey: key,
        title: latest.title,
        room: latest.room,
        message_type: latest.message_type,
        latest_at: latest.created_at,
        latest_body: latest.body,
        from_email: latest.from_email,
        recipient_email: latest.recipient_email,
        unread_count: unread,
        saved: latest.saved_by?.includes(email),
        archived: latest.archived_by?.includes(email)
      }
    })

    return NextResponse.json({ threads })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    const body = await req.json()
    const { action } = body

    if (action === 'send') {
      const { from_email, recipient_email, room, title, body: msgBody, message_type } = body
      if (!from_email ||!recipient_email ||!msgBody) {
        return NextResponse.json({ error: 'from_email, recipient_email, body required' }, { status: 400 })
      }
      
      const tk = threadKey(from_email, recipient_email, room || '')
      const { data, error } = await supabase
      .from('vf_message_command_messages')
      .insert({
          thread_key: tk,
          from_email,
          recipient_email,
          room: room || 'general',
          title: title || 'No Title',
          body: msgBody,
          message_type: message_type || 'General',
          read_by: [from_email],
          saved_by: [],
          archived_by: [],
          deleted_by: []
        })
      .select()
      .single()
      
      if (error) throw error
      return NextResponse.json({ message: data })
    }

    if (['save', 'unsave', 'archive', 'unarchive', 'delete', 'undelete', 'read', 'unread'].includes(action)) {
      const { ids, email } = body
      if (!ids ||!email) return NextResponse.json({ error: 'ids and email required' }, { status: 400 })

      const { data: rows } = await supabase.from('vf_message_command_messages').select('*').in('id', ids)
      if (!rows) return NextResponse.json({ error: 'not found' }, { status: 404 })

      for (const row of rows) {
        const patch: any = {}
        if (action === 'save') patch.saved_by = Array.from(new Set([...(row.saved_by || []), email]))
        if (action === 'unsave') patch.saved_by = (row.saved_by || []).filter((e: string) => e!== email)
        if (action === 'archive') patch.archived_by = Array.from(new Set([...(row.archived_by || []), email]))
        if (action === 'unarchive') patch.archived_by = (row.archived_by || []).filter((e: string) => e!== email)
        if (action === 'delete') patch.deleted_by = Array.from(new Set([...(row.deleted_by || []), email]))
        if (action === 'undelete') patch.deleted_by = (row.deleted_by || []).filter((e: string) => e!== email)
        if (action === 'read') patch.read_by = Array.from(new Set([...(row.read_by || []), email]))
        if (action === 'unread') patch.read_by = (row.read_by || []).filter((e: string) => e!== email)
        
        await supabase.from('vf_message_command_messages').update(patch).eq('id', row.id)
      }
      
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'invalid action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
