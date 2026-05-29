'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Deal = {
  id: number // bigint from DB
  user_id: string
  address: string
  city: string
  state: string
  price: number
  bedrooms: number
  bathrooms: number
  sqft: number
  property_type: string
  deal_type: string
  arv: number
  repair_cost: number
  asking_price: number
  notes: string
  analyzer_pic_url: string
  image_urls: string[]
  status: string
}

type Message = {
  id: number
  sender_id: string
  message: string
  created_at: string
}

export default function SavedDeals() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [deals, setDeals] = useState<Deal[]>([])
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUser, setCurrentUser] = useState<string>('')

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    setCurrentUser(user.id)
    const { data } = await supabase.from('deals').select('*').eq('user_id', user.id).eq('status', 'saved').order('created_at', { ascending: false })
    if (data) setDeals(data)
  }

  const loadMessages = async (dealId: number) => {
    const { data } = await supabase.from('deal_messages').select('*').eq('deal_id', dealId).order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: number, status: string) => {
    await supabase.from('deals').update({ status }).eq('id', id)
    load()
    setActiveDeal(null)
  }

  const sendMessage = async (deal: Deal) => {
    if (!newMessage) return
    await supabase.from('deal_messages').insert({
      deal_id: deal.id,
      sender_id: currentUser,
      recipient_id: deal.user_id,
      message: newMessage
    })
    setNewMessage('')
    loadMessages(deal.id)
  }

  const toggleView = (deal: Deal) => {
    if (activeDeal?.id === deal.id) {
      setActiveDeal(null)
    } else {
      setActiveDeal(deal)
      loadMessages(deal.id)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">VAULT</h1>
          <p className="text-zinc-400 text-sm">{deals.length} ACTIVE DEALS</p>
        </div>
        <button onClick={() => router.push('/vault/new')} className="bg-zinc-800 text-blue-400 px-4 py-2 rounded text-sm font-semibold">+ NEW DEAL</button>
      </div>

      <div className="space-y-4">
        {deals.map((deal) => (
          <div key={deal.id} className="bg-zinc-900 rounded border border-zinc-800 overflow-hidden">
            {deal.image_urls?.[0] && <img src={deal.image_urls[0]} alt={deal.address} className="w-full h-48 object-cover"/>}
            <div className="p-4">
              <div className="text-2xl font-bold">${deal.price?.toLocaleString()}</div>
              <div className="text-zinc-300">{deal.address}</div>
              <div className="text-zinc-400 text-sm">{deal.city}, {deal.state}</div>
              <div className="text-zinc-400 text-sm mt-1">{deal.bedrooms}BD · {deal.bathrooms}BA · {deal.sqft}SQFT</div>
              <div className="text-xs text-yellow-500 mt-2">{deal.property_type} | {deal.deal_type}</div>
              {deal.asking_price && <div className="text-green-500 text-sm mt-1">Asking: ${deal.asking_price.toLocaleString()}</div>}
              
              <div className="flex gap-2 mt-4">
                <button onClick={() => toggleView(deal)} className="border border-blue-400 text-blue-400 px-4 py-1 rounded text-sm">VIEW</button>
                <button onClick={() => updateStatus(deal.id, 'archive')} className="border border-zinc-600 text-zinc-400 px-3 py-1 rounded text-sm">ARCHIVE</button>
                <button onClick={() => updateStatus(deal.id, 'deleted')} className="border border-red-600 text-red-500 px-3 py-1 rounded text-sm">DELETE</button>
              </div>

              {activeDeal?.id === deal.id && (
                <div className="mt-4 pt-4 border-t border-zinc-700 space-y-3">
                  {deal.analyzer_pic_url && <img src={deal.analyzer_pic_url} alt="Analyzer" className="w-full rounded"/>}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {deal.arv && <div>ARV: ${deal.arv.toLocaleString()}</div>}
                    {deal.repair_cost && <div>Repairs: ${deal.repair_cost.toLocaleString()}</div>}
                  </div>
                  {deal.notes && <div className="text-sm text-zinc-300 whitespace-pre-wrap">{deal.notes}</div>}
                  <div className="grid grid-cols-5 gap-1">
                    {deal.image_urls?.slice(1).map((url, i) => (
                      <img key={i} src={url} className="w-full h-16 object-cover rounded" alt=""/>
                    ))}
                  </div>
                  
                  <div className="bg-zinc-800 p-3 rounded">
                    <div className="text-xs text-zinc-400 mb-2">MESSAGES</div>
                    <div className="space-y-2 max-h-32 overflow-y-auto mb-2">
                      {messages.map(m => (
                        <div key={m.id} className="text-xs">
                          <span className={m.sender_id === currentUser? "text-blue-400" : "text-green-400"}>
                            {m.sender_id === currentUser? "You" : "User"}:
                          </span> {m.message}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={newMessage} onChange={e=>setNewMessage(e.target.value)} placeholder="Message..." className="flex-1 bg-zinc-900 p-2 rounded text-sm"/>
                      <button onClick={()=>sendMessage(deal)} className="bg-blue-600 px-3 rounded text-sm">SEND</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
