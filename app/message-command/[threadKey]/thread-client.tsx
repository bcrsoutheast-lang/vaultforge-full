'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

type Message = {
  id: string
  from_email: string
  recipient_email: string
  room: string
  title: string
  body: string
  created_at: string
  read_by: string[]
  saved_by: string[]
  archived_by: string[]
}

export default function ThreadClient({ threadKey }: { threadKey: string }) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [email, setEmail] = useState('')
  const [msgs, setMsgs] = useState<Message[]>([])
  const [reply, setReply] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email)
    })
  }, [supabase])

  async function load() {
    if (!email) return
    const res = await fetch(`/api/message-command?email=${encodeURIComponent(email)}&thread=${threadKey}`)
    const json = await res.json()
    setMsgs(json.messages || [])
    if (json.messages?.length) {
      const ids = json.messages
      .filter((m: Message) => m.recipient_email === email &&!m.read_by?.includes(email))
      .map((m: Message) => m.id)
      if (ids.length) {
        await fetch('/api/message-command', {
          method: 'POST',
          body: JSON.stringify({ action: 'read', ids, email })
        })
      }
    }
  }

  useEffect(() => {
    if (email) load()
  }, [email, threadKey])

  async function sendReply() {
    if (!reply ||!email || msgs.length === 0) return
    const last = msgs[msgs.length - 1]
    const to = last.from_email === email? last.recipient_email : last.from_email
    await fetch('/api/message-command', {
      method: 'POST',
      body: JSON.stringify({
        action: 'send',
        from_email: email,
        recipient_email: to,
        room: last.room,
        title: last.title,
        body: reply,
        message_type: 'General'
      })
    })
    setReply('')
    load()
  }

  async function act(action: string) {
    const ids = msgs.map(m => m.id)
    await fetch('/api/message-command', {
      method: 'POST',
      body: JSON.stringify({ action, ids, email })
    })
    if (action === 'delete' || action === 'archive') router.push('/message-command')
    else load()
  }

  const first = msgs[0]

  return (
    <main style={{padding: '20px', background: '#02040a', minHeight: '100vh', color: '#fff'}}>
      <style>{`
 .vf-card{border:1px solid rgba(245,197,91,.24);background:linear-gradient(145deg,rgba(16,24,36,.94),rgba(2,6,23,.98));border-radius:20px;padding:16px;margin-bottom:16px}
 .vf-btn{border:1px solid rgba(245,197,91,.25);background:rgba(245,197,91,.07);color:#f8fafc;border-radius:12px;padding:10px 16px;font-weight:900;font-size:14px;cursor:pointer;margin-right:8px}
 .vf-btn-primary{background:linear-gradient(135deg,#fde68a,#e8c46b);color:#111827;border:0}
 .vf-input{width:100%;background:rgba(15,23,42,.78);border:1px solid rgba(148,163,184,.18);border-radius:12px;padding:10px 14px;color:#fff;margin-top:6px}
 .vf-label{color:#f5c55b;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
      `}</style>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <button className="vf-btn" onClick={()=>router.push('/message-command')}>← Back to Command</button>
        <div style={{display:'flex',gap:'8px'}}>
          <button className="vf-btn" onClick={()=>act('save')}>Save</button>
          <button className="vf-btn" onClick={()=>act('archive')}>Archive</button>
          <button className="vf-btn" onClick={()=>act('delete')}>Delete</button>
        </div>
      </div>

      {first && (
        <div className="vf-card">
          <div className="vf-label">Thread</div>
          <h2 style={{margin:'8px 0'}}>{first.title}</h2>
          <div style={{fontSize:'12px',color:'#94a3b8'}}>Room: {first.room}</div>
        </div>
      )}

      <div className="vf-card">
        {msgs.map(m => (
          <div key={m.id} style={{borderBottom:'1px solid rgba(148,163,184,.18)',padding:'12px 0'}}>
            <div style={{fontSize:'12px',color:'#94a3b8'}}>{m.from_email} → {m.recipient_email}</div>
            <div style={{margin:'8px 0',whiteSpace:'pre-wrap'}}>{m.body}</div>
            <div style={{fontSize:'11px',color:'#64748b'}}>{new Date(m.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="vf-card">
        <div className="vf-label">Reply</div>
        <textarea className="vf-input" rows={4} value={reply} onChange={e=>setReply(e.target.value)} placeholder="Type reply..." />
        <div style={{marginTop:'12px'}}>
          <button className="vf-btn vf-btn-primary" onClick={sendReply}>Send Reply</button>
        </div>
      </div>
    </main>
  )
}
