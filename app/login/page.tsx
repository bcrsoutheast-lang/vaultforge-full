'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/vault')
  }

  const handleSignup = async () => {
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      alert('Check your email to confirm signup')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-yellow-500 text-center mb-8">VAULT LOGIN</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-500 disabled:bg-zinc-700"
          >
            {loading? 'Loading...' : 'Login'}
          </button>
          
          <button
            type="button"
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-zinc-800 text-white py-3 rounded hover:bg-zinc-700 disabled:text-zinc-500"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  )
}
