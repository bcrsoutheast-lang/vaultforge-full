
'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

type Signal = {
  id: string
  title: string
  owner_email: string
}

export default function ConnectClient({ signalId }: { signalId: string }) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [signal, setSignal] = useState<Signal | null>(null)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email)
    })
    // Replace this with your actual signal fetch
    // Example: supabase.from('signals').select('*').eq('id', signalId).single()
    setSignal({ id: signalId, title: 'Goober Head', owner_email: 'owner@test.com' })
  }, [signalId, supabase])

  function messageOwner() {
    if (!signal ||!userEmail) return alert('Login required')
    const params = new URLSearchParams({
      new: '1',
      recipient: signal.owner_email,
      room: signal.title,
      title: `Message about ${signal.title}`,
      type: 'Signals'
    })
    router.push(`/message-command?${params.toString()}`)
  }

  return (
    <main style={{padding: '20px', background: '#02040a', minHeight: '100vh', color: '#fff'}}>
      <h1>Signal: {signal?.title}</h1>
      <p>Owner: {signal?.owner_email}</p>
      <button 
        style={{border:'1px solid rgba(245,197,91,.25)',background:'linear-gradient(135deg,#fde68a,#e8c46b)',color:'#111827',borderRadius:'12px',padding:'10px 16px',fontWeight:900,cursor:'pointer'}}
        onClick={messageOwner}
      >
        Message Owner
      </button>
    </main>
  )
}
