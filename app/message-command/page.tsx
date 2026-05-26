import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import MessageCommandClient from './message-command-client'
export const dynamic = 'force-dynamic'
export default async function MessageCommandPage() {
const cookieStore = cookies()
const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get(name: string) { return cookieStore.get(name)?.value } } })
const { data: { session } } = await supabase.auth.getSession()
if (!session) redirect('/login')
const { data: messages } = await supabase.from('vf_message_command_messages').select('*').eq('from_email', session.user.email).order('created_at', { ascending: false })
return <MessageCommandClient messages={messages || []} userEmail={session.user.email} />
}
