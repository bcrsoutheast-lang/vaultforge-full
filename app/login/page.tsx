'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/deals')
  }

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#18181b', padding: '32px', borderRadius: '8px', border: '1px solid #27272a', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ color: '#facc15', fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center' }}>VAULTFORGE MEMBER LOGIN</h1>
        {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '12px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '12px', marginBottom: '16px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
        />
        <button 
          onClick={handleLogin}
          style={{ width: '100%', backgroundColor: '#facc15', color: '#000', fontWeight: 'bold', padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
        >
          ENTER DEAL ROOM
        </button>
      </div>
    </div>
  )
}
