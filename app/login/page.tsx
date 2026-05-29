"use client";
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogin = async () => {
    if (!email) return
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    })

    setLoading(false)
    if (error) {
      alert(`Error: ${error.message}`)
    } else {
      setSent(true)
    }
  }

  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#E5E5E5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <Image src="/IMG_4751.png" alt="VaultForge" width={80} height={80} style={{ objectFit: 'contain', marginBottom: '24px' }} />
        
        <div style={{ color: '#FFD700', fontSize: '32px', fontWeight: '900', letterSpacing: '3px', marginBottom: '8px' }}>
          VAULTFORGE
        </div>
        <div style={{ color: '#666', fontSize: '11px', letterSpacing: '2px', marginBottom: '48px' }}>
          PRIVATE INVESTOR MEMBER ONLY ARCHITECTURE PLATFORM
        </div>

        {!sent? (
          <>
            <input
              type="email"
              placeholder="YOUR EMAIL"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{
                width: '100%',
                background: '#111',
                border: '1px solid #333',
                color: '#E5E5E5',
                padding: '16px',
                fontSize: '14px',
                marginBottom: '16px',
                textAlign: 'center',
                outline: 'none'
              }}
            />
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%',
                border: '1px solid #FFD700',
                background: '#FFD700',
                color: '#000',
                padding: '16px',
                fontSize: '14px',
                fontWeight: '900',
                cursor: loading? 'not-allowed' : 'pointer',
                letterSpacing: '2px'
              }}>
              {loading? 'SENDING...' : 'ENTER VAULT'}
            </button>
          </>
        ) : (
          <div style={{ border: '1px solid #FFD700', background: '#111', padding: '24px' }}>
            <div style={{ color: '#FFD700', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>
              CHECK YOUR EMAIL
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              Magic link sent to {email}. Click to enter.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
