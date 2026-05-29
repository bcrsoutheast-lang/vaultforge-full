'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

type Message = {
  id: number
  content: string
  created_at: string
  sender_id: string
  receiver_id: string
}

type Member = {
  id: string
  full_name: string
  avatar_url: string | null
  verified: boolean
}

export default function DirectMessage() {
  const router = useRouter()
  const params = useParams()
  const memberId = params.id as string
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChat()
    
    const channel = supabase
    .channel(`dm-${memberId}`)
    .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'vault_messages' }, 
        (payload) => {
          const msg = payload.new as Message
          if ((msg.sender_id === currentUserId && msg.receiver_id === memberId) ||
              (msg.sender_id === memberId && msg.receiver_id === currentUserId)) {
            setMessages(prev => [...prev, msg])
          }
        }
      )
    .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [memberId, currentUserId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadChat = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    const { data: memberData } = await supabase
    .from('vault_members')
    .select('id, full_name, avatar_url, verified')
    .eq('id', memberId)
    .single()

    if (memberData) setMember(memberData)

    const { data: msgs } = await supabase
    .from('vault_messages')
    .select('*')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${memberId}),and(sender_id.eq.${memberId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true })

    if (msgs) setMessages(msgs)

    await supabase
    .from('vault_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', memberId)
    .eq('receiver_id', user.id)
    .is('read_at', null)

    setLoading(false)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() ||!currentUserId) return

    await supabase
    .from('vault_messages')
    .insert({
        sender_id: currentUserId,
        receiver_id: memberId,
        content: newMessage
      })

    setNewMessage('')
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-4">Loading chat...</div>
  if (!member) return <div className="min-h-screen bg-black text-white p-4">Member not found</div>

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-zinc-400">←</button>
        <img
          src={member.avatar_url || 'https://via.placeholder.com/40/333/666?text=M'}
          alt={member.full_name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold">{member.full_name}</p>
            {member.verified && <span className="text-blue-400 text-xs">✓</span>}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.sender_id === currentUserId? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-lg ${
              msg.sender_id === currentUserId 
              ? 'bg-blue-600 text-white' 
                : 'bg-zinc-800 text-white'
            }`}>
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs text-zinc-400 mt-1">{formatTime(msg.created_at)}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
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
