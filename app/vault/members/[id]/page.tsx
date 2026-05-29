'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

type Member = {
  id: string
  full_name: string
  email: string
  phone: string | null
  state_from: string
  city: string | null
  bio: string | null
  avatar_url: string | null
  deals_closed: number
  verified: boolean
}

type Message = {
  id: number
  sender_id: string
  receiver_id: string
  message_text: string
  is_read: boolean
  created_at: string
}

export default function MemberProfile() {
  const router = useRouter()
  const params = useParams()
  const memberId = params.id as string
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  const [member, setMember] = useState<Member | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel(`chat_${memberId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'member_messages',
          filter: `sender_id=eq.${memberId},receiver_id=eq.${currentUserId}`
        }, 
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
          markAsRead()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [memberId, currentUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    // Get member profile
    const { data: memberData } = await supabase
      .from('vault_members')
      .select('*')
      .eq('id', memberId)
      .single()

    if (memberData) setMember(memberData)

    // Get message history between these two users
    const { data: msgData } = await supabase
      .from('member_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${memberId}),and(sender_id.eq.${memberId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })

    if (msgData) setMessages(msgData)
    
    // Mark all their messages to you as read
    await markAsRead(user.id, memberId)
    setLoading(false)
  }

  const markAsRead = async (receiverId = currentUserId, senderId = memberId) => {
    if (!receiverId || !senderId) return
    await supabase
      .from('member_messages')
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .eq('is_read', false)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUserId || sending) return

    setSending(true)
    const { error } = await supabase
      .from('member_messages')
      .insert({
        sender_id: currentUserId,
        receiver_id: memberId,
        message_text: newMessage.trim()
      })

    if (!error) {
      setNewMessage('')
      // Add to local state immediately for instant feedback
      const tempMsg: Message = {
        id: Date.now(),
        sender_id: currentUserId,
        receiver_id: memberId,
        message_text: newMessage.trim(),
        is_read: false,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, tempMsg])
    }
    setSending(false)
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-4">Loading...</div>
  if (!member) return <div className="min-h-screen bg-black text-white p-4">Member not found</div>

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-zinc-900 p-4 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="text-zinc-400">←</button>
          <img
            src={member.avatar_url || 'https://via.placeholder.com/40/333/666?text=M'}
            alt={member.full_name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold">{member.full_name}</p>
              {member.verified && <span className="text-blue-400 text-sm">✓</span>}
            </div>
            <p className="text-xs text-zinc-400">{member.city ? `${member.city}, ` : ''}{member.state_from}</p>
          </div>
          <div className="text-right text-xs text-zinc-500">
            {member.deals_closed} deals closed
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        {/* Bio section */}
        {member.bio && (
          <div className="bg-zinc-900 p-4 rounded mb-4 text-sm text-zinc-300">
            <p className="text-xs text-zinc-500 mb-1">ABOUT</p>
            {member.bio}
          </div>
        )}

        <div className="space-y-3">
          {messages.map(msg => {
            const isMine = msg.sender_id === currentUserId
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-lg px-4 py-2 ${
                  isMine ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-white'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                  <p className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-zinc-500'}`}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 0 && (
          <div className="text-center text-zinc-500 mt-20">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Send a message to start networking</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="bg-zinc-900 p-4 border-t border-zinc-800 sticky bottom-0">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${member.full_name.split(' ')[0]}...`}
            className="flex-1 bg-zinc-800 text-white px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded font-bold disabled:bg-zinc-700 disabled:text-zinc-500"
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}
