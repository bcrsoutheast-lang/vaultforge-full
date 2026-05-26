import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ThreadClient from './thread-client'

export const dynamic = 'force-dynamic'

export default async function ThreadPage({ params }: { params: { threadKey: string } }) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) redirect('/login')

  const { data: messages } = await supabase
   .from('vf_message_command_messages')
   .select('*')
   .eq('thread_key', params.threadKey)
   .eq('from_email', session.user.email)
   .order('created_at', { ascending: true })

  return <ThreadClient messages={messages || []} threadKey={params.threadKey} userEmail={session.user.email} />
}
