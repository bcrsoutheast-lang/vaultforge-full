'use client'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const supabase = createClientComponentClient()
  const router = useRouter()

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) router.push('/')
    else alert(error.message)
  }

  const input = "bg-black border border-amber-900 text-amber-400 px-4 py-3 w-full font-mono text-sm focus:border-amber-500 outline-none"

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/IMG_4751.png" alt="VaultForge" width={120} height={120} className="mx-auto mb-4" />
          <h1 className="text-amber-400 font-mono tracking-widest text-xl">VAULTFORGE</h1>
          <p className="text-amber-600 text-xs mt-2 tracking-wider">FORTIFY YOUR PORTFOLIO</p>
        </div>
        
        <div className="space-y-4">
          <input placeholder="OPERATOR EMAIL" className={input} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="ACCESS CODE" className={input} onChange={e => setPassword(e.target.value)} />
          <button onClick={login} className="w-full bg-amber-600 text-black py-3 font-bold tracking-wider hover:bg-amber-500">
            AUTHENTICATE
          </button>
        </div>
        
        <div className="mt-8 text-center text-xs text-zinc-700 border-t border-zinc-900 pt-4">
          VETERAN PRIDE. DISCIPLINE. STRATEGY. RESULTS.
        </div>
      </div>
    </div>
  )
}
