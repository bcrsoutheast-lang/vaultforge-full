'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // TEMP: Fake login. Any email/password works.
    // Replace with Supabase later.
    if (email && password) {
      localStorage.setItem('vaultforge_auth', 'true')
      localStorage.setItem('vaultforge_email', email)
      setTimeout(() => {
        router.push('/members')
      }, 800)
    } else {
      setError('Enter email and password')
      setLoading(false)
    }
  }

  return (
    <main className="bg-[#0A0A0A] min-h-screen font-mono text-white flex items-center justify-center p-4">
      <div className="bg-black border-2 border-[#D4AF37] p-8 md:p-12 w-full max-w-md">
        <Image
          src="/IMG_4751.png"
          alt="VaultForge"
          width={300}
          height={300}
          priority
          className="mx-auto w-48 h-auto mb-8"
        />

        <h1 className="text-3xl font-black text-[#D4AF37] text-center mb-2">MEMBER LOGIN</h1>
        <p className="text-[#D4AF37]/60 text-sm text-center mb-8 tracking-[0.3em]">FOUNDING MEMBERS ONLY</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-[#D4AF37] text-sm font-bold tracking-wider block mb-2">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#D4AF37]/30 text-white p-3 focus:border-[#D4AF37] outline-none text-sm"
              placeholder="founder@vaultforge.com"
              required
            />
          </div>

          <div>
            <label className="text-[#D4AF37] text-sm font-bold tracking-wider block mb-2">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#D4AF37]/30 text-white p-3 focus:border-[#D4AF37] outline-none text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-[#DC2626]/10 border border-[#DC2626] text-[#DC2626] p-3 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF37] text-black py-3 font-black tracking-wider hover:bg-[#F4CF47] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading? 'ACCESSING VAULT...' : 'ENTER VAULT'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#D4AF37]/20 text-center">
          <p className="text-[#D4AF37]/60 text-xs mb-3">NOT A MEMBER?</p>
          <a href="/" className="text-[#D4AF37] font-bold text-sm hover:text-[#F4CF47] underline">
            START 3-DAY TRIAL
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-[#D4AF37]/20 text-center">
          <p className="text-[#D4AF37]/40 text-xs">© 2026 VAULTFORGE // VETERAN OWNED // NDA PROTECTED</p>
        </div>
      </div>
    </main>
  )
}
