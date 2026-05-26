'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Thread = {
  id: string
  from: string
  recipient: string
  title: string
  room: string
  message: string
  status: 'active' | 'unread' | 'saved' | 'archived' | 'deleted'
  created_at: string
}

function MessagesContent() {
  const searchParams = useSearchParams()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeFolder, setActiveFolder] = useState('active')
  
  const [form, setForm] = useState({
    messageType: 'Deal',
    from: '',
    recipient: '',
    title: '',
    room: '',
    message: ''
  })

  // Get logged in user email for FROM
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const email = user?.email || ''
      setCurrentUserEmail(email)
      setForm(f => ({...f, from: email }))
    })
  }, [supabase])

  // Pull recipient + room from URL or attached room data
  useEffect(() => {
    const urlRecipient = searchParams.get('recipient') || ''
    const urlRoom = searchParams.get('room') || ''
    const urlTitle = searchParams.get('title') || ''
    
    setForm(f => ({
  ...f,
      from: currentUserEmail,
      recipient: urlRecipient, // Actual owner email from deal
      title: urlTitle || (urlRoom? `Message about ${urlRoom}` : ''),
      room: urlRoom,
      message: ''
    }))
  }, [searchParams, currentUserEmail])

  useEffect(() => {
    const raw = localStorage.getItem('vf_messages')
    if (raw) {
      try {
        setThreads(JSON.parse(raw))
      } catch {
        setThreads([])
      }
    }
  }, [])

  function saveThreads(newThreads: Thread[]) {
    setThreads(newThreads)
    localStorage.setItem('vf_messages', JSON.stringify(newThreads))
  }

  async function handleSendMessage() {
    if (!form.from) return alert('You must be logged in')
    if (!form.recipient) return alert('Owner email missing - cannot send')
    if (!form.message) return alert('Message required')
    
    const newThread: Thread = {
      id: crypto.randomUUID(),
      from: form.from,
      recipient: form.recipient,
      title: form.title || 'No Title',
      room: form.room || 'General',
      message: form.message,
      status: 'unread',
      created_at: new Date().toISOString()
    }
    
    saveThreads([newThread,...threads])
    setForm(f => ({...f, message: '' }))
    alert(`Message sent to ${form.recipient}`)
  }

  const counts = {
    active: threads.filter(t => t.status === 'active' || t.status === 'unread').length,
    unread: threads.filter(t => t.status === 'unread' && t.recipient === currentUserEmail).length,
    saved: threads.filter(t => t.status === 'saved').length,
    archived: threads.filter(t => t.status === 'archived').length,
    deleted: threads.filter(t => t.status === 'deleted').length
  }

  const filteredThreads = threads.filter(t => {
    if (activeFolder === 'active') return t.status === 'active' || t.status === 'unread'
    if (activeFolder === 'unread') return t.status === 'unread' && t.recipient === currentUserEmail
    return t.status === activeFolder
  })

  return (
    <main style={{padding: '20px', background: '#02040a', minHeight: '100vh', color: '#fff'}}>
      <style>{`
    .vf-card{border:1px solid rgba(245,197,91,.24);background:linear-gradient(145deg,rgba(16,24,36,.94),rgba(2,6,23,.98));border-radius:20px;padding:16px;margin-bottom:16px}
    .vf-btn{border:1px solid rgba(245,197,91,.25);background:rgba(245,197,91,.07);color:#f8fafc;border-radius:12px;padding:10px 16px;font-weight:900;font-size:14px;cursor:pointer;margin-right:8px}
    .vf-btn-primary{background:linear-gradient(135deg,#fde68a,#e8c46b);color:#111827;border:0}
    .vf-input{width:100%;background:rgba(15,23,42,.78);border:1px solid rgba(148,163,184,.18);border-radius:12px;padding:10px 14px;color:#fff;margin-top:6px}
    .vf-input:read-only{background:rgba(15,23,42,.5);color:#94a3b8;cursor:not-allowed}
    .vf-label{color:#f5c55b;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
    .vf-folder{border:1px solid rgba(245,197,91,.25);background:rgba(15,23,42,.78);border-radius:16px;padding:16px;cursor:pointer}
    .vf-folder-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
      `}</style>

      <h1 style={{fontSize:'42px',marginBottom:'20px'}}>Messages</h1>

      <div className="vf-card">
        <div className="vf-label">Message Folders</div>
        <div className="vf-folder-grid" style={{marginTop:'12px'}}>
          {Object.entries(counts).map(([key, count]) => (
            <div key={key} className="vf-folder" onClick={()=>setActiveFolder(key)}>
              <div className="vf-label">{key}</div>
              <div style={{fontSize:'32px',fontWeight:900,color:'#3b82f6',margin:'8px 0'}}>{count}</div>
              <div style={{fontSize:'12px',color:'#94a3b8'}}>message thread(s)</div>
              <div style={{fontSize:'12px',color:'#f5c55b',marginTop:'4px'}}>Tap to open</div>
            </div>
          ))}
        </div>
      </div>

      {form.room && (
        <div className="vf-card">
          <div className="vf-label">Attached Room</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginTop:'12px'}}>
            <div style={{border:'1px solid rgba(148,163,184,.18)',borderRadius:'16px',padding:'12px'}}>
              <div style={{fontWeight:900,fontSize:'20px'}}>{form.room}</div>
            </div>
            <div style={{border:'1px solid rgba(148,163,184,.18)',borderRadius:'16px',padding:'12px'}}>
              <div className="vf-label">Message Recipient</div>
              <div style={{fontWeight:900,marginTop:'4px'}}>{form.recipient || 'Owner email not listed'}</div>
              <div style={{fontSize:'12px',color:'#94a3b8',marginTop:'4px'}}>
                {form.recipient? 'Deal owner' : 'Owner email missing'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="vf-card">
        <div className="vf-label">Create Message</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'12px',marginTop:'12px'}}>
          <div>
            <div className="vf-label">Message Type</div>
            <select className="vf-input" value={form.messageType} onChange={e=>setForm({...form,messageType:e.target.value})}>
              <option>General</option>
              <option>Deal</option>
              <option>Pain</option>
              <option>Project</option>
            </select>
          </div>
          <div>
            <div className="vf-label">From</div>
            <input className="vf-input" value={form.from} readOnly placeholder="Login required" />
          </div>
          <div>
            <div className="vf-label">Recipient</div>
            <input className="vf-input" value={form.recipient} readOnly placeholder="Owner email auto-fills" />
          </div>
          <div>
            <div className="vf-label">Title</div>
            <input className="vf-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="message title" />
          </div>
          <div>
            <div className="vf-label">Deal / Pain / Project Room</div>
            <input className="vf-input" value={form.room} readOnly placeholder="auto-fills from deal" />
          </div>
        </div>
        
        <div style={{marginTop:'12px'}}>
          <div className="vf-label">Message</div>
          <textarea 
            className="vf-input" 
            rows={5}
            value={form.message} 
            onChange={e=>setForm({...form,message:e.target.value})} 
            placeholder="Write the message here"
          />
        </div>

        <div style={{marginTop:'16px'}}>
          <button className="vf-btn vf-btn-primary" onClick={handleSendMessage}>Send Message</button>
          <button className="vf-btn" onClick={()=>setForm({...form,recipient:'admin@vaultforge.com',room:'Admin'})}>Message Admin</button>
        </div>
      </div>

      <div className="vf-card">
        <div className="vf-label">Active Messages</div>
        <h2 style={{margin:'8px 0 16px'}}>Message Threads</h2>
        {filteredThreads.length === 0? (
          <div>
            <h3>No messages here.</h3>
            <p style={{color:'#94a3b8'}}>Messages from deals, pains, or projects will appear here.</p>
          </div>
        ) : (
          filteredThreads.map(t => (
            <div key={t.id} style={{borderTop:'1px solid rgba(148,163,184,.18)',paddingTop:'12px',marginTop:'12px'}}>
              <div style={{fontSize:'12px',color:'#94a3b8'}}>From: {t.from} → {t.recipient}</div>
              <div style={{fontWeight:900,margin:'4px 0'}}>{t.title}</div>
              <div style={{fontSize:'12px',color:'#f5c55b'}}>Room: {t.room}</div>
              <div style={{marginTop:'8px'}}>{t.message}</div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}

// Wrapper fixes the Vercel build error
export default function MessagesPage() {
  return (
    <Suspense fallback={<div style={{padding:'20px',color:'#fff'}}>Loading messages...</div>}>
      <MessagesContent />
    </Suspense>
  )
}
