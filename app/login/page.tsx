'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      })
      if (error) setError(error.message)
      else router.push('/pain-room')
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) setError(error.message)
      else router.push('/pain-room')
    }
    setLoading(false)
  }

  const inputClass = "w-full p-3 bg-zinc-800 border border-zinc-700 text-white focus:border-red-500 outline-none"

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center">6SIGMA</h1>
        <p className="text-zinc-500 text-center mb-8 text-sm uppercase">Pain Intake System</p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <input 
              placeholder="Full Name" 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className={inputClass}
              required
            />
          )}
          
          <input 
            placeholder="Email" 
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={inputClass}
            required
          />

          <input 
            placeholder="Password" 
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={inputClass}
            required
          />

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-500 text-sm">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 border border-red-500 text-white uppercase font-bold disabled:opacity-50"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
          </button>

          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
            }}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs uppercase"
          >
            {isSignUp ? 'Already have account? Login' : 'Need account? Sign Up'}
          </button>
        </form>
      </div>
    </div>
  )
}
