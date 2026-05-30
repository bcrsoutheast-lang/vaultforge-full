'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function JoinDirectory() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleJoin = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) router.push('/members')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Join Directory</h1>
        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full py-3 bg-red-600 hover:bg-red-700 border border-red-500 text-white font-bold uppercase disabled:opacity-50"
        >
          {loading ? 'Joining...' : 'Join Now'}
        </button>
      </div>
    </div>
  )
}
