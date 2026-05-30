'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function JoinDirectory() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (!error) router.push('/pain-room')
    setLoading(false)
  }

  const inputClass = "w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white text-sm focus:border-red-500 outline-none"

  return (
    <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold mb-8">Join 6SIGMA</h1>
        <form onSubmit={handleJoin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={inputClass}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={inputClass}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 border border-red-500 text-white font-bold uppercase disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm text-zinc-500">
          Already have an account? <Link href="/login" className="text-red-500">Login</Link>
        </div>
      </div>
    </div>
  )
}
