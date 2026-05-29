'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Message = {
  id: number
  content: string
  created_at: string
  user_id: string
  sender_name: string
}

export default function DealMessages() {
  const router = useRouter()
  const params = useParams()
  const dealId = params.id as string
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    loadMessages()

    const channel = supabase
    .channel(`deal-${dealId}`)
    .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'vault_deal_messages', filter: `deal_id=eq.${dealId}` }, 
        () => loadMessages()
      )
    .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dealId])

  const loadMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data } = await supabase
    .from('vault_deal_messages')
    .select('*, vault_members(full_name)')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: true })

    if (data) {
      const formatted = data.map(m => ({
        id: m.id,
        content: m.content,
        created_at: m.created_at,
        user_id: m.user_id,
        sender_name: m.vault_members?.full_name || 'Unknown'
      }))
      setMessages(formatted)
    }
    setLoading(false)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() ||!userId) return

    await supabase
    .from('vault_deal_messages')
    .insert({
        deal_id: dealId,
        user_id: userId,
        content: newMessage
      })

    setNewMessage('')
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-4">Loading...</div>

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-zinc-400">←</button>
        <h1 className="text-xl font-bold">Deal Chat</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.user_id === userId? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-lg ${
              msg.user_id === userId 
              ? 'bg-blue-600 text-white' 
                : 'bg-zinc-800 text-white'
            }`}>
              {msg.user_id!== userId && (
                <p className="text-xs text-zinc-400 mb-1">{msg.sender_name}</p>
              )}
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs text-zinc-400 mt-1">{formatTime(msg.created_at)}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-zinc-900 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-zinc-800 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-500 disabled:bg-zinc-700"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
