"use client";
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [counts, setCounts] = useState({ saved: 0, archived: 0, deleted: 0 })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || !data.user.email) router.push('/login')
      else {
        setUser(data.user)
        fetchCounts(data.user.email)
      }
    })
  }, [])

  const fetchCounts = async (email: string) => {
    const [saved, archived, deleted] = await Promise.all([
      supabase.from('deals').select('id', { count: 'exact' }).eq('user_email', email).eq('status', 'saved'),
      supabase.from('deals').select('id', { count: 'exact' }).eq('user_email', email).eq('status', 'archived'),
      supabase.from('deals').select('id', { count: 'exact' }).eq('user_email', email).eq('status', 'deleted')
    ])
    setCounts({
      saved: saved.count || 0,
      archived: archived.count || 0,
      deleted: deleted.count || 0
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return null

  const cardStyle = { border: '1px solid #FFD700', background: '#111', padding: '24px', cursor: 'pointer', textAlign: 'center' as const }

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#E5E5E5', padding: '24px' }}>
      <header style={{ borderBottom: '1px solid #FFD700', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Image src="/IMG_4751.png" alt="VaultForge" width={40} height={40} style={{ objectFit: 'contain' }} />
          <div>
            <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>COMMAND CENTER</div>
            <div style={{ color: '#666', fontSize: '11px', letterSpacing: '2px' }}>PRIVATE INVESTOR ARCHITECTURE</div>
          </div>
        </div>
        <button onClick={handleSignOut} style={{ border: '1px solid #FF6B6B', background: 'transparent', color: '#FF6B6B', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>EXIT VAULT</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <div onClick={() => router.push('/deals/saved')} style={cardStyle}>
          <div style={{ color: '#FFD700', fontSize: '36px', fontWeight: '900', marginBottom: '8px' }}>{counts.saved}</div>
          <div style={{ fontSize: '12px', letterSpacing: '2px' }}>SAVED DEALS</div>
        </div>
        <div onClick={() => router.push('/deals/archive')} style={cardStyle}>
          <div style={{ color: '#FFD700', fontSize: '36px', fontWeight: '900', marginBottom: '8px' }}>{counts.archived}</div>
          <div style={{ fontSize: '12px', letterSpacing: '2px' }}>DEAL ARCHIVE</div>
        </div>
        <div onClick={() => router.push('/deals/deleted')} style={cardStyle}>
          <div style={{ color: '#FFD700', fontSize: '36px', fontWeight: '900', marginBottom: '8px' }}>{counts.deleted}</div>
          <div style={{ fontSize: '12px', letterSpacing: '2px' }}>RECYCLE BIN</div>
        </div>
      </div>
    </div>
  )
}
