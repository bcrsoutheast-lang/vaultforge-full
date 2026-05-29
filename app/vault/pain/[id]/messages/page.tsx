'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function PainMessagesPage() {
  const router = useRouter()
  const params = useParams()
  const painId = Number(params.id)
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const [painDeal, setPainDeal] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
    markMessagesRead()
  }, [painId])

  const fetchData = async () => {
    const { data: painData } = await supabase.from('pain_deals').select('*').eq('id', painId).single()
    const { data: msgData } = await supabase
     .from('vault_messages')
     .select('*')
     .eq('pain_deal_id', painId)
     .order('created_at', { ascending: true })

    setPainDeal(painData)
    setMessages(msgData || [])
    setLoading(false)
  }

  const markMessagesRead = async () => {
    await supabase.from('vault_messages').update({ is_read: true }).eq('pain_deal_id', painId).eq('is_read', false)
    await supabase.from('pain_deals').update({ unread_message_count: 0 }).eq('id', painId)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('vault_messages').insert({
      user_id: user.id,
      pain_deal_id: painId,
      sender_type: 'user',
      message_text: newMessage,
      is_read: true
    })

    if (!error) {
      setNewMessage('')
      fetchData()
    }
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-4">Loading...</div>
  if (!painDeal) return <div className="min-h-screen bg-black text-white p-4">Pain deal not found</div>

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="bg-zinc-900 p-4 border-b border-red-600">
        <div className="flex justify-between items-center mb-2">
          <button onClick={() => router.push('/vault/pain')} className="text-zinc-400 text-sm">
            ← Pain Room
          </button>
          <div className="text-xs text-zinc-500">PAIN THREAD</div>
        </div>
        <h1 className="text-xl font-bold text-red-500">
          Pain: {painDeal.seller_name || 'Seller'} • {painDeal.motivation_level}/10
        </h1>
        <p className="text-sm text-zinc-400">{painDeal.address} • {painDeal.city}, {painDeal.state}</p>
        {painDeal.facing_foreclosure && (
          <span className="inline-block bg-red-600 text-white text-xs px-2 py-1 rounded mt-1">FORECLOSURE</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0? (
          <p className="text-center text-zinc-500 mt-10">No messages yet. Start the conversation.</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_type === 'user'? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-3 rounded ${
                msg.sender_type === 'user'
                 ? 'bg-red-600 text-white'
                  : 'bg-zinc-800 text-white'
              }`}>
                <p className="text-xs opacity-70 mb-1">
                  {msg.sender_type === 'user'? 'You' : 'Seller'} • {new Date(msg.created_at).toLocaleTimeString()}
                </p>
                <p>{msg.message_text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={sendMessage} className="bg-zinc-900 p-4 border-t border-zinc-800">
        <div className="flex gap-2">
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type reply to seller..."
            className="flex-1 bg-zinc-800 p-3 rounded border border-zinc-700"
          />
          <button type="submit" className="bg-red-600 text-white font-bold px-6 rounded">
            SEND
          </button>
        </div>
      </form>
    </div>
  )
}
