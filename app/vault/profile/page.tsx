'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
]

const ROLES = ['buyer', 'seller', 'wholesaler', 'investor', 'lender', 'contractor']

export default function ProfileSetup() {
  const [profile, setProfile] = useState<any>({ states: [], role: '' })
  const [user, setUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      setUser(user)
      
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data)
      else setProfile({ id: user.id, email: user.email, states: [], role: '' })
    }
    load()
  }, [router, supabase])

  const toggleState = (st: string) => {
    setProfile((p:any) => ({
      ...p,
      states: p.states.includes(st) 
        ? p.states.filter((s:string) => s !== st)
        : [...p.states, st]
    }))
  }

  const save = async () => {
    if (!user || !profile.role || profile.states.length === 0) {
      return alert('SELECT AT LEAST ONE STATE AND YOUR ROLE')
    }
    setSaving(true)
    
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: profile.full_name || '',
      states: profile.states,
      role: profile.role
    })
    
    if (!error) router.push('/')
    else alert('ERROR: ' + error.message)
    setSaving(false)
  }

  const input = "bg-zinc-900 border border-amber-900 text-amber-400 px-3 py-2 w-full font-mono text-sm"
  const label = "text-xs text-amber-600 tracking-wider mb-2"

  return (
    <div className="min-h-screen bg-black text-amber-400 font-mono p-4">
      <header className="flex justify-between items-center border-b border-amber-900 pb-4 mb-6">
        <div>
          <h1 className="text-xl tracking-widest">OPERATOR PROFILE // VAULTFORGE</h1>
          <p className="text-xs text-amber-600">SET YOUR AO AND CLEARANCE LEVEL</p>
        </div>
        <Image src="/IMG_4751.png" alt="VaultForge" width={60} height={60} priority />
      </header>

      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className={label}>FULL NAME / ENTITY</div>
          <input 
            value={profile.full_name || ''} 
            onChange={e => setProfile({...profile, full_name: e.target.value})} 
            className={input} 
          />
        </div>

        <div>
          <div className={label}>ROLE // CLEARANCE LEVEL</div>
          <select 
            value={profile.role} 
            onChange={e => setProfile({...profile, role: e.target.value})} 
            className={input}
          >
            <option value="">SELECT ROLE</option>
            {ROLES.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
          </select>
        </div>

        <div>
          <div className={label}>OPERATING STATES // AO - SELECT ALL THAT APPLY</div>
          <div className="grid grid-cols-6 md:grid-cols-10 gap-2 border border-amber-900 p-4 bg-zinc-950">
            {US_STATES.map(st => (
              <button
                key={st}
                onClick={() => toggleState(st)}
                className={`text-xs py-2 border ${
                  profile.states.includes(st) 
                    ? 'bg-amber-600 text-black border-amber-600' 
                    : 'bg-black text-amber-600 border-amber-900 hover:border-amber-600'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          <div className="text-xs text-zinc-600 mt-2">SELECTED: {profile.states.join(', ') || 'NONE'}</div>
        </div>

        <button 
          onClick={save} 
          disabled={saving}
          className="w-full bg-amber-600 text-black py-3 font-bold tracking-wider hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-600"
        >
          {saving ? 'SAVING...' : 'LOCK IN PROFILE'}
        </button>

        <div className="text-xs text-zinc-700 text-center border-t border-zinc-900 pt-4">
          YOUR STATES DETERMINE WHICH DEALS APPEAR IN OPPORTUNITY ROOM. YOUR ROLE SETS CLEARANCE.
        </div>
      </div>
    </div>
  )
}
