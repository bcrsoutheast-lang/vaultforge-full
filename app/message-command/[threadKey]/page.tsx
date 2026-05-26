import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
export const dynamic = 'force-dynamic'
export default async function ThreadPage({ params }: { params: { threadKey: string } }) {
const cookieStore = cookies()
const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get(name: string) { return cookieStore.get(name)?.value } } })
const { data: { session } } = await supabase.auth.getSession()
if (!session) redirect('/login')
const { data: messages } = await supabase.from('vf_message_command_messages').select('*').eq('thread_key', params.threadKey).order('created_at', { ascending: true })
return (
<div className="p-4 max-w-3xl mx-auto">
 <h1 className="text-xl font-bold mb-4">Thread: {params.threadKey}</h1>
 <div className="space-y-4">
 {messages?.map((m: any) => (
 <div key={m.id} className="border rounded p-3 bg-white">
 <div className="text-sm text-gray-500">{m.from_email} - {m.created_at}</div>
 <div className="font-semibold">{m.subject}</div>
 <div>{m.body}</div>
 </div>
 ))}
 </div>
 </div>
 )
 }
