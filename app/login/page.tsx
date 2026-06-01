'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else router.push('/deals')
    setLoading(false)
  }

  const handleSignup = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else alert('CHECK EMAIL // CONFIRM ACCOUNT')
    setLoading(false)
  }

  return (
    <div className="bg-black text-white min-h-screen flex items-center justify-center font-mono">
      <div className="w-full max-w-md p-8">
        <h1 className="text-3xl font-bold mb-2">VAULTFORGE</h1>
        <p className="text-xs text-gray-400 mb-8">PRIVATE DEAL INTELLIGENCE NETWORK</p>
        
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="EMAIL" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 p-3 text-sm"
          />
          <input 
            type="password" 
            placeholder="PASSWORD" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 p-3 text-sm"
          />
          {error && <div className="text-red-500 text-xs">{error}</div>}
          <button onClick={handleLogin} disabled={loading} className="w-full bg-white text-black py-3 font-bold text-sm">
            {loading ? 'AUTHENTICATING...' : 'ENTER NETWORK'}
          </button>
          <button onClick={handleSignup} disabled={loading} className="w-full bg-zinc-900 border border-zinc-700 py-3 text-sm">
            REQUEST ACCESS
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-8 text-center">MEMBERS ONLY // VETTED ACCESS</p>
      </div>
    </div>
  )
}
