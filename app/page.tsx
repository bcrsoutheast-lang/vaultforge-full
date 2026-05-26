import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { thread_key, subject, body, lane, members } = await req.json()
  
  const { data, error } = await supabase
   .from('vf_message_command_messages')
   .insert({
      thread_key,
      subject,
      body,
      lane,
      members,
      from_email: session.user.email
    })
   .select()
   .single()
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
