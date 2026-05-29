"use client";
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Messages() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else {
        setUser(data.user)
        fetchMessages(data.user.id)
      }
    })
  }, [])

  const fetchMessages = async (userId: string) => {
    const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('receiver_id', userId)
    .order('created_at', { ascending: false })
    if (data) setMessages(data)
  }

  const markRead = async (id: string) => {
    await supabase.from('messages').update({ read: true }).eq('id', id)
    if (user?.id) fetchMessages(user.id)
  }

  if (!user) return null

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#E5E5E5', padding: '24px' }}>
      <header style={{ borderBottom: '1px solid #FFD700', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Image src="/IMG_4751.png" alt="VaultForge" width={40} height={40} style={{ objectFit: 'contain' }} />
          <div>
            <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>MESSAGES</div>
            <div style={{ color: '#666', fontSize: '11px', letterSpacing: '2px' }}>SECURE VAULT COMMS.</div>
          </div>
        </div>
        <button onClick={() => router.push('/dashboard')} style={{ border: '1px solid #FFD700', background: 'transparent', color: '#FFD700', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>← COMMAND CENTER</button>
      </header>

      {messages.length === 0? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>NO MESSAGES.</div>
      ) : (
        messages.map(m => (
          <div key={m.id} onClick={() =>!m.read && markRead(m.id)} style={{
            border: `1px solid ${m.read? '#333' : '#FF6B6B'}`,
            background: '#111',
            padding: '16px',
            marginBottom: '12px',
            cursor: m.read? 'default' : 'pointer'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#FFD700', fontSize: '12px', fontWeight: '700' }}>FROM: {m.sender_name}</span>
              {!m.read && <span style={{ color: '#FF6B6B', fontSize: '10px', fontWeight: '900' }}>NEW</span>}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px', color: '#E5E5E5' }}>{m.subject}</div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>{m.body}</div>
            <div style={{ fontSize: '10px', color: '#666' }}>{new Date(m.created_at).toLocaleString()}</div>
          </div>
        ))
      )}
    </div>
  )
}
