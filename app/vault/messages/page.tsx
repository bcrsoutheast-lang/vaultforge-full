'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

type Thread = {
  other_user_id: string
  full_name: string
  avatar_url: string | null
  state_from: string
  last_message: string
  last_message_time: string
  unread_count: number
}

export default function MessagesInbox() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState('')

  useEffect(() => {
    fetchThreads()

    const channel = supabase
      .channel('inbox_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'member_messages' }, 
        () => fetchThreads()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchThreads = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    // Get all messages involving current user
    const { data: messages } = await supabase
      .from('member_messages')
      .select(`
        id,
        sender_id,
        receiver_id,
        message_text,
        is_read,
        created_at,
        sender:vault_members!member_messages_sender_id_fkey(id, full_name, avatar_url, state_from),
        receiver:vault_members!member_messages_receiver_id_fkey(id, full_name, avatar_url, state_from)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!messages) {
      setLoading(false)
      return
    }

    // Group by other user and get latest message + unread count
    const threadMap = new Map<string, Thread>()

    messages.forEach((msg: any) => {
      const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender
      const otherUserId = otherUser.id

      if (!threadMap.has(otherUserId)) {
        threadMap.set(otherUserId, {
          other_user_id: otherUserId,
          full_name: otherUser.full_name,
          avatar_url: otherUser.avatar_url,
          state_from: otherUser.state_from,
          last_message: msg.message_text,
          last_message_time: msg.created_at,
          unread_count: 0
        })
      }

      // Count unread messages TO current user
      if (msg.receiver_id === user.id && !msg.is_read) {
        const thread = threadMap.get(otherUserId)!
        thread.unread_count += 1
      }
    })

    // Sort: unread first, then by most recent
    const sorted = Array.from(threadMap.values()).sort((a, b) => {
      if (a.unread_count > 0 && b.unread_count === 0) return -1
      if (a.unread_count === 0 && b.unread_count > 0) return 1
      return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
    })

    setThreads(sorted)
    setLoading(false)
  }

  const openThread = async (otherUserId: string) => {
    // Mark all messages from this user as read
    await supabase
      .from('member_messages')
      .update({ is_read: true })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', currentUserId)
      .eq('is_read', false)

    router.push(`/vault/members/${otherUserId}`)
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-4">Loading messages...</div>

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-yellow-500">MESSAGES</h1>
          <button onClick={() => router.push('/vault')} className="text-zinc-400 text-sm">
            ← Dashboard
          </button>
        </div>

        {threads.length === 0 ? (
          <div className="text-center text-zinc-500 mt-20">
            <p>No messages yet</p>
            <button 
              onClick={() => router.push('/vault/members')}
              className="text-blue-400 text-sm mt-2"
            >
              Browse Member Directory →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map(thread => (
              <button
                key={thread.other_user_id}
                onClick={() => openThread(thread.other_user_id)}
                className={`w-full bg-zinc-900 p-4 rounded border text-left hover:bg-zinc-800 ${
                  thread.unread_count > 0 ? 'border-blue-500' : 'border-zinc-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={thread.avatar_url || 'https://via.placeholder.com/48/333/666?text=M'}
                    alt={thread.full_name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="font-bold text-white">{thread.full_name}</p>
                        <p className="text-xs text-zinc-400">{thread.state_from}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-xs text-zinc-500">
                          {formatDistanceToNow(new Date(thread.last_message_time), { addSuffix: true })}
                        </p>
                        {thread.unread_count > 0 && (
                          <span className="inline-block bg-red-600 text-white text-xs px-2 py-0.5 rounded-full mt-1">
                            {thread.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className={`text-sm truncate ${thread.unread_count > 0 ? 'text-white font-medium' : 'text-zinc-400'}`}>
                      {thread.last_message}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
