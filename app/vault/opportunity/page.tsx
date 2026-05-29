'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function OpportunityRoom() {
  const [deals, setDeals] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      
      const { data: dealData } = await supabase
       .from('deals')
       .select('*')
       .eq('status', 'opportunity')
       .order('created_at', { ascending: false })
      
      setDeals(dealData || [])
    }
    load()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-black text-amber-400 font-mono">
      <header className="flex justify-between items-center border-b border-amber-900 p-4">
        <div>
          <h1 className="text-xl tracking-widest">DEAL OPPORTUNITY ROOM // CLASSIFIED</h1>
          <p className="text-xs text-amber-600">CLEARANCE: {profile?.role?.toUpperCase()} | AO: {profile?.states?.join(', ')}</p>
        </div>
        <Image src="/IMG_4751.png" alt="VaultForge" width={60} height={60} priority />
      </header>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deals.length === 0 && <div className="col-span-full text-center py-20 text-zinc-600">NO ACTIVE TARGETS IN YOUR AO</div>}
        
        {deals.map(d => (
          <div key={d.id} className="bg-zinc-950 border border-amber-900 hover:border-amber-600 transition-all">
            <img src={d.image_urls?.[0] || 'https://placehold.co/600x400/000000/333?text=NO+INTEL'} className="w-full h-48 object-cover border-b border-amber-900" alt="Property" />
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="text-lg font-bold">${Number(d.asking_price || 0).toLocaleString()}</div>
                <div className="text-xs bg-amber-900 text-black px-2 py-1">{d.property_type?.toUpperCase()}</div>
              </div>
              <div className="text-xs text-amber-600 mt-1">{d.address}, {d.city}, {d.state}</div>
              <div className="text-xs mt-2">{d.beds}BD / {d.baths}BA / {d.sqft}SQFT</div>
              <div className="mt-3 border-t border-zinc-800 pt-2 text-xs">
                <span className="text-green-500">{d.analyzer_feedback}</span>
              </div>
              <button onClick={() => router.push(`/vault/deal/${d.id}`)} 
                className="w-full mt-3 bg-amber-600 text-black py-2 text-xs font-bold tracking-wider hover:bg-amber-500">
                VIEW TARGET
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
