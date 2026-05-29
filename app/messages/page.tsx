"use client";
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function Messages() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user ||!data.user.email) router.push('/login')
      else {
        setUser(data.user)
        fetchMessages(data.user.email)
      }
    })
  }, [])

  const fetchMessages = async (email: string) => {
    const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('receiver_email', email)
    .order('created_at', { ascending: false })
    if (data) setMessages(data)
  }

  const markRead = async (id: string) => {
    await supabase.from('messages').update({ read: true }).eq('id', id)
    if (user?.email) fetchMessages(user.email)
  }

  if (!user) return null

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#E5E5E5', padding: '24px' }}>
      <header style={{ borderBottom: '1px solid #FFD700', paddingBottom: '16px', marginBottom: '24px' }}>
        <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>MESSAGES</div>
      </header>
      {messages.map(m => (
        <div key={m.id} onClick={() =>!m.read && markRead(m.id)} style={{
          border: `1px solid ${m.read? '#333' : '#FF6B6B'}`,
          background: '#111',
          padding: '16px',
          marginBottom: '12px',
          cursor: m.read? 'default' : 'pointer'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#FFD700', fontSize: '12px' }}>FROM: {m.sender_name}</span>
            {!m.read && <span style={{ color: '#FF6B6B', fontSize: '10px', fontWeight: '900' }}>NEW</span>}
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>{m.subject}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>{m.body}</div>
        </div>
      ))}
    </div>
  )
}
