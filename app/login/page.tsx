'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Change these to whatever you want
    if (username === 'admin' && password === 'vault2024') {
      // Send them to dashboard after login
      window.location.href = '/dashboard.html'
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <main className="bg-[#0A0A0A] min-h-screen flex items-center justify-center font-sans">
      <div className="bg-black border border-[#D4AF37] rounded-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-[#D4AF37] text-4xl font-bold tracking-widest">VAULTFORGE</h1>
          <p className="text-gray-400 mt-2">Deal Flow OS</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[#D4AF37] text-sm font-bold mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full bg-[#1A1A1A] border border-[#333] rounded px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-[#D4AF37] text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="w-full bg-[#1A1A1A] border border-[#333] rounded px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#D4AF37] text-black font-bold py-3 rounded hover:bg-[#B8941F] transition"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  )
}
