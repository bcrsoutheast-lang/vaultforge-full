'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const LANES = ['Saved', 'Alerts', 'Pain', 'Signals', 'Routing', 'Introductions', 'Projects', 'Members', 'General']

type Thread = {
  threadKey: string
  title: string
  room: string
  message_type: string
  latest_at: string
  latest_body: string
  from_email: string
  recipient_email: string
  unread_count: number
  saved: boolean
  archived: boolean
}

export default function MessageCommandClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [email, setEmail] = useState('')
  const [activeLane, setActiveLane] = useState<string | null>(null)
  const [threads, setThreads] = useState<Thread[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [newMsg, setNewMsg] = useState({
    to: searchParams.get('recipient') || '',
    room: searchParams.get('room') || '',
    title: searchParams.get('title') || '',
    body: '',
    type: searchParams.get('type') || 'General'
  })
  const [showNew, setShowNew] = useState(searchParams.get('new') === '1')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email)
    })
  }, [supabase])

  async function loadCounts() {
    if (!email) return
    const newCounts: Record<string, number> = {}
    for (const lane of [...LANES, 'Archived']) {
      const res = await fetch(`/api/message-command?email=${encodeURIComponent(email)}&lane=${lane}`)
      const json = await res.json()
      newCounts[lane] = json.threads?.length || 0
    }
    setCounts(newCounts)
  }

  async function loadLane(lane: string) {
    if (!email) return
    const res = await fetch(`/api/message-command?email=${encodeURIComponent(email)}&lane=${lane}`)
    const json = await res.json()
    setThreads(json.threads || [])
    setActiveLane(lane)
  }

  useEffect(() => {
    if (email) loadCounts()
  }, [email])

  async function sendNew() {
    if (!email ||!newMsg.to ||!newMsg.body) return alert('From, To, and Message required')
    await fetch('/api/message-command', {
      method: 'POST',
      body: JSON.stringify({
        action: 'send',
        from_email: email,
        recipient_email: newMsg.to,
        room: newMsg.room,
        title: newMsg.title,
        body: newMsg.body,
        message_type: newMsg.type
      })
    })
    setShowNew(false)
    setNewMsg({ to: '', room: '', title: '', body: '', type: 'General' })
    loadCounts()
    if (activeLane) loadLane(activeLane)
  }

  async function act(action: string, threadKeys: string[]) {
    const idsRes = await Promise.all(threadKeys.map(async tk => {
      const r = await fetch(`/api/message-command?email=${encodeURIComponent(email)}&thread=${tk}`)
      const j = await r.json()
      return j.messages.map((m: any) => m.id)
    }))
    const ids = idsRes.flat()
    await fetch('/api/message-command', {
      method: 'POST',
      body: JSON.stringify({ action, ids, email })
    })
    loadCounts()
    if (activeLane) loadLane(activeLane)
  }

  return (
    <main style={{padding: '20px', background: '#02040a', minHeight: '100vh', color: '#fff'}}>
      <style>{`
.vf-card{border:1px solid rgba(245,197,91,.24);background:linear-gradient(145deg,rgba(16,24,36,.94),rgba(2,6,23,.98));border-radius:20px;padding:16px;margin-bottom:16px}
.vf-btn{border:1px solid rgba(245,197,91,.25);background:rgba(245,197,91,.07);color:#f8fafc;border-radius:12px;padding:10px 16px;font-weight:900;font-size:14px;cursor:pointer;margin-right:8px}
.vf-btn-primary{background:linear-gradient(135deg,#fde68a,#e8c46b);color:#111827;border:0}
.vf-input{width:100%;background:rgba(15,23,42,.78);border:1px solid rgba(148,163,184,.18);border-radius:12px;padding:10px 14px;color:#fff;margin-top:6px}
.vf-input:read-only{background:rgba(15,23,42,.5);color:#94a3b8;cursor:not-allowed}
.vf-label{color:#f5c55b;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
.vf-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
.vf-lane{border:1px solid rgba(245,197,91,.25);background:rgba(15,23,42,.78);border-radius:16px;padding:16px;cursor:pointer}
.vf-lane.active{border-color:#f5c55b;background:rgba(245,197,91,.1)}
      `}</style>

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
        <h1 style={{fontSize:'42px'}}>Message Command</h1>
        <button className="vf-btn vf-btn-primary" onClick={()=>setShowNew(true)}>New Message</button>
      </div>

      {!activeLane &&!showNew && (
        <div className="vf-card">
          <div className="vf-label">Command Lanes</div>
          <div className="vf-grid" style={{marginTop:'12px'}}>
            {LANES.map(lane => (
              <div key={lane} className="vf-lane" onClick={()=>loadLane(lane)}>
                <div className="vf-label">{lane}</div>
                <div style={{fontSize:'32px',fontWeight:900,color:'#3b82f6',margin:'8px 0'}}>{counts[lane] || 0}</div>
                <div style={{fontSize:'12px',color:'#94a3b8'}}>threads</div>
              </div>
            ))}
            <div className="vf-lane" onClick={()=>loadLane('Archived')}>
              <div className="vf-label">Archived</div>
              <div style={{fontSize:'32px',fontWeight:900,color:'#64748b',margin:'8px 0'}}>{counts['Archived'] || 0}</div>
              <div style={{fontSize:'12px',color:'#94a3b8'}}>threads</div>
            </div>
          </div>
        </div>
      )}

      {showNew && (
        <div className="vf-card">
          <div className="vf-label">New Message</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginTop:'12px'}}>
            <div>
              <div className="vf-label">From</div>
              <input className="vf-input" value={email} readOnly />
            </div>
            <div>
              <div className="vf-label">To</div>
              <input className="vf-input" value={newMsg.to} onChange={e=>setNewMsg({...newMsg,to:e.target.value})} placeholder="owner@email.com" />
            </div>
            <div>
              <div className="vf-label">Room</div>
              <input className="vf-input" value={newMsg.room} onChange={e=>setNewMsg({...newMsg,room:e.target.value})} placeholder="Deal / Pain / Project" />
            </div>
            <div>
              <div className="vf-label">Type</div>
              <select className="vf-input" value={newMsg.type} onChange={e=>setNewMsg({...newMsg,type:e.target.value})}>
                {LANES.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginTop:'12px'}}>
            <div className="vf-label">Title</div>
            <input className="vf-input" value={newMsg.title} onChange={e=>setNewMsg({...newMsg,title:e.target.value})} />
          </div>
          <div style={{marginTop:'12px'}}>
            <div className="vf-label">Message</div>
            <textarea className="vf-input" rows={5} value={newMsg.body} onChange={e=>setNewMsg({...newMsg,body:e.target.value})} />
          </div>
          <div style={{marginTop:'16px'}}>
            <button className="vf-btn vf-btn-primary" onClick={sendNew}>Send</button>
            <button className="vf-btn" onClick={()=>setShowNew(false)}>Cancel</button>
          </div>
        </div>
      )}

      {activeLane &&!showNew && (
        <div className="vf-card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div className="vf-label">{activeLane}</div>
            <button className="vf-btn" onClick={()=>setActiveLane(null)}>Close Lane</button>
          </div>
          <div style={{marginTop:'16px'}}>
            {threads.length === 0? (
              <p style={{color:'#94a3b8'}}>No threads in this lane.</p>
            ) : threads.map(t => (
              <div key={t.threadKey} style={{borderTop:'1px solid rgba(148,163,184,.18)',padding:'12px 0'}}>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <div style={{fontWeight:900,cursor:'pointer'}} onClick={()=>router.push(`/message-command/${t.threadKey}`)}>
                    {t.title} <span style={{color:'#94a3b8',fontSize:'12px'}}>in {t.room}</span>
                  </div>
                  {t.unread_count > 0 && <div style={{background:'#3b82f6',borderRadius:'12px',padding:'2px 8px',fontSize:'12px'}}>{t.unread_count}</div>}
                </div>
                <div style={{fontSize:'12px',color:'#94a3b8',margin:'4px 0'}}>{t.from_email} → {t.recipient_email}</div>
                <div style={{fontSize:'14px',margin:'8px 0'}}>{t.latest_body.slice(0,120)}...</div>
                <div style={{display:'flex',gap:'8px'}}>
                  <button className="vf-btn" style={{fontSize:'12px',padding:'6px 10px'}} onClick={()=>act(t.saved?'unsave':'save',[t.threadKey])}>{t.saved?'Unsave':'Save'}</button>
                  <button className="vf-btn" style={{fontSize:'12px',padding:'6px 10px'}} onClick={()=>act(t.archived?'unarchive':'archive',[t.threadKey])}>{t.archived?'Unarchive':'Archive'}</button>
                  <button className="vf-btn" style={{fontSize:'12px',padding:'6px 10px'}} onClick={()=>act('delete',[t.threadKey])}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
