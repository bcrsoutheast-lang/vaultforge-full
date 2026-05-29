'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Thread = {
  member_id: string
  full_name: string
  avatar_url: string | null
  last_message: string
  last_message_at: string
  unread_count: number
}

export default function MessagesInbox() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    loadThreads()

    const channel = supabase
    .channel('inbox_updates')
    .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'vault_messages' }, 
        () => loadThreads()
      )
    .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadThreads = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data } = await supabase.rpc('get_message_threads', { current_user_id: user.id })
    if (data) setThreads(data)
    setLoading(false)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / 3600000)
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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

        {threads.length === 0? (
          <div className="text-center text-zinc-500 mt-20">
            <p>No messages yet</p>
            <button 
              onClick={() => router.push('/vault/members')}
              className="text-blue-400 text-sm mt-2"
            >
              Browse members to start a chat →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map(thread => (
              <button
                key={thread.member_id}
                onClick={() => router.push(`/vault/members/${thread.member_id}`)}
                className="w-full bg-zinc-900 p-4 rounded border border-zinc-800 text-left hover:bg-zinc-800 flex items-center gap-3"
              >
                <img
                  src={thread.avatar_url || 'https://via.placeholder.com/48/333/666?text=M'}
                  alt={thread.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-white truncate">{thread.full_name}</p>
                    <span className="text-xs text-zinc-500 ml-2">{formatTime(thread.last_message_at)}</span>
                  </div>
                  <p className="text-sm text-zinc-400 truncate">{thread.last_message}</p>
                </div>
                {thread.unread_count > 0 && (
                  <div className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {thread.unread_count}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
