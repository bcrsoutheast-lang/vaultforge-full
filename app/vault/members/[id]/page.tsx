'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function MemberProfilePage() {
  const router = useRouter()
  const params = useParams()
  const memberId = params.id as string
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const [member, setMember] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [memberId])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    const { data: memberData } = await supabase.from('vault_members').select('*').eq('id', memberId).single()
    const { data: msgData } = await supabase
    .from('member_messages')
    .select('*')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${memberId}),and(sender_id.eq.${memberId},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true })

    setMember(memberData)
    setMessages(msgData || [])
    setLoading(false)

    await supabase.from('member_messages')
    .update({ is_read: true })
    .eq('receiver_id', user.id)
    .eq('sender_id', memberId)
    .eq('is_read', false)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() ||!currentUserId) return

    const { error } = await supabase.from('member_messages').insert({
      sender_id: currentUserId,
      receiver_id: memberId,
      message_text: newMessage,
      is_read: false
    })

    if (!error) {
      setNewMessage('')
      fetchData()
    }
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-4">Loading...</div>
  if (!member) return <div className="min-h-screen bg-black text-white p-4">Member not found</div>

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="bg-zinc-900 p-4 border-b border-yellow-600">
        <div className="flex justify-between items-center mb-3">
          <button onClick={() => router.push('/vault/members')} className="text-zinc-400 text-sm">
            ← Directory
          </button>
          <div className="text-xs text-zinc-500">MEMBER PROFILE</div>
        </div>

        <div className="flex items-start gap-4">
          <img
            src={member.avatar_url || 'https://via.placeholder.com/80/333/666?text=M'}
            alt={member.full_name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-yellow-500">{member.full_name}</h1>
            <p className="text-sm text-zinc-400">{member.city}, {member.state_from}</p>
            <div className="flex gap-2 mt-2">
              {member.verified && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">VERIFIED</span>
              )}
              <span className="bg-zinc-700 text-white text-xs px-2 py-1 rounded">{member.deals_closed} Deals</span>
            </div>
          </div>
        </div>

        {member.bio && (
          <div className="mt-3 bg-zinc-800 p-3 rounded">
            <p className="text-sm text-zinc-300">{member.bio}</p>
          </div>
        )}

        <div className="flex gap-3 mt-3">
          {member.email && (
            <a href={`mailto:${member.email}`} className="text-xs bg-zinc-700 px-3 py-1 rounded">
              {member.email}
            </a>
          )}
          {member.phone && (
            <a href={`tel:${member.phone}`} className="text-xs bg-zinc-700 px-3 py-1 rounded">
              {member.phone}
            </a>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <p className="text-center text-xs text-zinc-500 mb-4">NETWORK MESSAGES</p>
        {messages.length === 0? (
          <p className="text-center text-zinc-500 mt-10">No messages yet. Start networking.</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_id === currentUserId? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-3 rounded ${
                msg.sender_id === currentUserId
                ? 'bg-yellow-600 text-black'
                  : 'bg-zinc-800 text-white'
              }`}>
                <p className="text-xs opacity-70 mb-1">
                  {msg.sender_id === currentUserId? 'You' : member.full_name} • {new Date(msg.created_at).toLocaleTimeString()}
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
            placeholder={`Message ${member.full_name}...`}
            className="flex-1 bg-zinc-800 p-3 rounded border border-zinc-700"
          />
          <button type="submit" className="bg-yellow-500 text-black font-bold px-6 rounded">
            SEND
          </button>
        </div>
      </form>
    </div>
  )
}
