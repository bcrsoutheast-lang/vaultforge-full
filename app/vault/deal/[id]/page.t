'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'

export default function DealDetail() {
  const [deal, setDeal] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [user, setUser] = useState<any>(null)
  const [activeImg, setActiveImg] = useState(0)
  const [claimed, setClaimed] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const dealId = params.id

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      setUser(user)

      const { data: dealData } = await supabase
       .from('deals')
       .select('*')
       .eq('id', dealId)
       .single()
      
      if (!dealData) return router.push('/vault/opportunity')
      setDeal(dealData)
      setClaimed(dealData.status === 'claimed' || dealData.status === 'saved')

      const { data: msgData } = await supabase
       .from('deal_messages')
       .select('*')
       .eq('deal_id', dealId)
       .order('created_at', { ascending: true })
      
      setMessages(msgData || [])

      // REALTIME MESSAGES
      const channel = supabase
       .channel(`deal-${dealId}`)
       .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'deal_messages',
          filter: `deal_id=eq.${dealId}`
        }, (payload) => {
          setMessages((m) => [...m, payload.new])
        })
       .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
    load()
  }, [dealId, router, supabase])

  const claimDeal = async () => {
    if (!user ||!deal) return
    const { error } = await supabase
     .from('deals')
     .update({ status: 'claimed' })
     .eq('id', deal.id)
    
    if (!error) {
      setClaimed(true)
      setDeal({...deal, status: 'claimed'})
    } else alert('CLAIM FAILED: ' + error.message)
  }

  const sendMessage = async () => {
    if (!newMsg.trim() ||!user ||!deal) return
    
    const { error } = await supabase.from('deal_messages').insert({
      deal_id: deal.id,
      sender_id: user.id,
      recipient_id: deal.user_id,
      message: newMsg.trim()
    })
    
    if (!error) setNewMsg('')
  }

  if (!deal) return <div className="min-h-screen bg-black text-amber-400 font-mono p-4">LOADING TARGET...</div>

  const input = "bg-zinc-900 border border-amber-900 text-amber-400 px-3 py-2 w-full font-mono text-sm"

  return (
    <div className="min-h-screen bg-black text-amber-400 font-mono">
      <header className="flex justify-between items-center border-b border-amber-900 p-4">
        <div>
          <h1 className="text-xl tracking-widest">TARGET INTEL // DEAL #{deal.id}</h1>
          <p className="text-xs text-amber-600">{deal.address?.toUpperCase()}, {deal.city?.toUpperCase()}, {deal.state}</p>
        </div>
        <Image src="/IMG_4751.png" alt="VaultForge" width={60} height={60} priority />
      </header>

      <div className="grid md:grid-cols-3 gap-6 p-4">
        <div className="md:col-span-2 space-y-4">
          {/* IMAGE GALLERY */}
          <div className="border border-amber-900 bg-zinc-950">
            <img 
              src={deal.image_urls?.[activeImg] || 'https://placehold.co/1200x800/000000/333?text=NO+VISUAL+INTEL'} 
              className="w-full h-96 object-cover" 
              alt="Property" 
            />
            {deal.image_urls?.length > 1 && (
              <div className="flex gap-2 p-2 overflow-x-auto">
                {deal.image_urls.map((url:string, i:number) => (
                  <img 
                    key={i} 
                    src={url} 
                    onClick={() => setActiveImg(i)}
                    className={`h-16 w-24 object-cover cursor-pointer border-2 ${i === activeImg? 'border-amber-500' : 'border-zinc-800'}`}
                    alt={`Thumb ${i}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* SPECS */}
          <div className="border border-amber-900 p-4 bg-zinc-950">
            <div className="text-xs text-amber-600 mb-3">TARGET SPECIFICATIONS</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>TYPE<br/><span className="text-lg">{deal.property_type?.toUpperCase()}</span></div>
              <div>PRICE<br/><span className="text-lg">${Number(deal.asking_price || 0).toLocaleString()}</span></div>
              {deal.beds && <div>BEDS<br/><span className="text-lg">{deal.beds}</span></div>}
              {deal.baths && <div>BATHS<br/><span className="text-lg">{deal.baths}</span></div>}
              {deal.sqft && <div>SQFT<br/><span className="text-lg">{deal.sqft.toLocaleString()}</span></div>}
              {deal.acres && <div>ACRES<br/><span className="text-lg">{deal.acres}</span></div>}
              <div>ARV<br/><span className="text-lg">${Number(deal.arv || 0).toLocaleString()}</span></div>
              <div>REPAIRS<br/><span className="text-lg">${Number(deal.repair_cost || 0).toLocaleString()}</span></div>
            </div>
          </div>

          {/* ANALYZER */}
          <div className="border border-amber-900 p-4 bg-zinc-950">
            <div className="text-xs text-amber-600 mb-2">ANALYZER OUTPUT</div>
            <div className="text-lg font-bold text-green-500 mb-3">{deal.analyzer_feedback}</div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>WHOLESALE FEE<br/><span className="text-green-500 text-base">${Number(deal.wholesale_fee || 0).toLocaleString()}</span></div>
              <div>FLIP PROFIT<br/><span className="text-green-500 text-base">${Number(deal.flip_profit || 0).toLocaleString()}</span></div>
              <div>70% MAO<br/><span className="text-green-500 text-base">${Number(deal.mao_70 || 0).toLocaleString()}</span></div>
            </div>
          </div>

          {deal.notes && (
            <div className="border border-amber-900 p-4 bg-zinc-950">
              <div className="text-xs text-amber-600 mb-2">OPERATOR NOTES</div>
              <div className="text-sm whitespace-pre-wrap">{deal.notes}</div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* CLAIM */}
          <div className="border border-amber-900 p-4 bg-zinc-950">
            <div className="text-xs text-amber-600 mb-3">TARGET STATUS: {deal.status.toUpperCase()}</div>
            {deal.user_id === user?.id? (
              <div className="text-xs text-zinc-500">YOU CONTROL THIS ASSET</div>
            ) : claimed || deal.status === 'claimed'? (
              <div className="text-xs text-green-500">TARGET CLAIMED</div>
            ) : (
              <button 
                onClick={claimDeal} 
                className="w-full bg-amber-600 text-black py-3 font-bold tracking-wider hover:bg-amber-500"
              >
                CLAIM TARGET
              </button>
            )}
          </div>

          {/* OWNER INFO */}
          <div className="border border-amber-900 p-4 bg-zinc-950">
            <div className="text-xs text-amber-600 mb-2">CONTACT INTEL</div>
            <div className="text-sm space-y-1">
              <div>NAME: {deal.owner_name || 'CLASSIFIED'}</div>
              <div>PHONE: {deal.owner_phone || 'CLASSIFIED'}</div>
              <div>EMAIL: {deal.owner_email || 'CLASSIFIED'}</div>
            </div>
          </div>

          {/* MESSAGING */}
          <div className="border border-amber-900 p-4 bg-zinc-950 flex flex-col h-96">
            <div className="text-xs text-amber-600 mb-2">SECURE CHANNEL // DEAL OWNER</div>
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 text-xs">
              {messages.length === 0 && <div className="text-zinc-600">NO TRANSMISSIONS</div>}
              {messages.map(m => (
                <div key={m.id} className={`${m.sender_id === user?.id? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-3 py-2 ${m.sender_id === user?.id? 'bg-amber-900 text-black' : 'bg-zinc-800 text-amber-400'}`}>
                    {m.message}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                value={newMsg} 
                onChange={e => setNewMsg(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="TRANSMIT..." 
                className={input} 
              />
              <button onClick={sendMessage} className="bg-amber-600 text-black px-4 font-bold">SEND</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
