'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
]

const INVESTOR_TYPES = [
  'WHOLESALER',
  'FLIPPER',
  'BUY_AND_HOLD',
  'HARD_MONEY_LENDER',
  'PRIVATE_LENDER',
  'AGENT',
  'INSTITUTIONAL_BUYER',
  'CONTRACTOR',
  'TITLE_ATTORNEY',
  'APPRAISER'
]

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [email, setEmail] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    getProfile()
  }, [])

  const getProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setEmail(user.email || '')

    const { data } = await supabase
      .from('member_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) setProfile(data)
    setLoading(false)
  }

  const updateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const updates = {
      state: formData.get('state') as string,
      city: formData.get('city') as string,
      investor_types: formData.getAll('investor_types') as string[],
      buy_box_min: Number(formData.get('buy_box_min')),
      buy_box_max: Number(formData.get('buy_box_max')),
      bio: formData.get('bio') as string,
      updated_at: new Date().toISOString(),
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('member_profiles')
      .upsert({ user_id: user?.id, email, ...updates })

    if (!error) {
      alert('PROFILE UPDATED // VAULTFORGE SYNCED')
      router.push('/deals')
    } else {
      alert('ERROR: ' + error.message)
    }
    setLoading(false)
  }

  if (loading) return <div className="bg-black text-white min-h-screen p-8">LOADING VAULTFORGE...</div>

  return (
    <div className="bg-black text-white min-h-screen p-8 font-mono">
      <h1 className="text-2xl font-bold mb-8">MEMBER PROFILE // {email}</h1>
      <form onSubmit={updateProfile} className="max-w-2xl space-y-6">
        <div>
          <label className="block text-xs text-gray-400 mb-2">RESIDENCE STATE</label>
          <select name="state" defaultValue={profile?.state} className="w-full bg-zinc-900 border border-zinc-700 p-3">
            <option value="">SELECT STATE</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-2">CITY</label>
          <input name="city" defaultValue={profile?.city} className="w-full bg-zinc-900 border border-zinc-700 p-3" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-2">INVESTOR TYPE</label>
          <div className="grid grid-cols-2 gap-2">
            {INVESTOR_TYPES.map(type => (
              <label key={type} className="flex items-center gap-2 text-sm">
                <input 
                  type="checkbox" 
                  name="investor_types" 
                  value={type} 
                  defaultChecked={profile?.investor_types?.includes(type)} 
                />
                {type.replace('_', ' ')}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">BUY BOX MIN</label>
            <input name="buy_box_min" type="number" defaultValue={profile?.buy_box_min} className="w-full bg-zinc-900 border border-zinc-700 p-3" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">BUY BOX MAX</label>
            <input name="buy_box_max" type="number" defaultValue={profile?.buy_box_max} className="w-full bg-zinc-900 border border-zinc-700 p-3" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-2">BIO</label>
          <textarea name="bio" defaultValue={profile?.bio} rows={4} className="w-full bg-zinc-900 border border-zinc-700 p-3" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-white text-black py-4 font-bold">
          {loading ? 'SYNCING...' : 'UPDATE VAULTFORGE PROFILE'}
        </button>
      </form>
    </div>
  )
}
         
