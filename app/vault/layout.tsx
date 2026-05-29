'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import DealTicker from '../components/DealTicker'
import Link from 'next/link'

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserEmail(user.email || null)
      setLoading(false)
    }
    checkAuth()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-yellow-500">Securing vault...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Live ticker - shows 5 newest deals */}
      <DealTicker />
      
      {/* Vault nav bar */}
      <nav className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/vault" className="text-yellow-500 font-bold text-lg">
              VAULT
            </Link>
            <Link href="/vault/members" className="text-zinc-300 hover:text-white text-sm">
              Members
            </Link>
            <Link href="/vault/new" className="text-zinc-300 hover:text-white text-sm">
              Post Deal
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/vault/members/edit" className="text-zinc-400 text-xs hover:text-white">
              {userEmail}
            </Link>
            <button 
              onClick={handleLogout}
              className="text-zinc-500 hover:text-red-500 text-xs"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* All vault pages render here */}
      <main>{children}</main>
    </div>
  )
}
