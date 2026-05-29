'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SavedDealsPage() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  const [deals, setDeals] = useState<any[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [messages, setMessages] = useState<{[key: number]: any[]}>({})
  const [newMessage, setNewMessage] = useState<{[key: number]: string}>({})
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchDeals()
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)
  }

  const fetchDeals = async () => {
    const { data, error } = await supabase
     .from('deals')
     .select('*')
     .eq('status', 'saved')
     .order('created_at', { ascending: false })
    
    if (error) {
      alert('Failed to load deals: ' + error.message)
    } else {
      setDeals(data || [])
    }
    setLoading(false)
  }

  const fetchMessages = async (dealId: number) => {
    const { data, error } = await supabase
     .from('deal_messages')
     .select('*')
     .eq('deal_id', dealId)
     .order('created_at', { ascending: true })
    
    if (!error && data) {
      setMessages(prev => ({...prev, [dealId]: data }))
    }
  }

  const handleView = (dealId: number) => {
    if (expandedId === dealId) {
      setExpandedId(null)
    } else {
      setExpandedId(dealId)
      fetchMessages(dealId)
    }
  }

  const handleArchive = async (dealId: number) => {
    const { error } = await supabase
     .from('deals')
     .update({ status: 'archive' })
     .eq('id', dealId)
    
    if (error) {
      alert('Archive failed: ' + error.message)
    } else {
      setDeals(deals.filter(d => d.id!== dealId))
      setExpandedId(null)
    }
  }

  const handleDelete = async (dealId: number) => {
    if (!confirm('Move this deal to Recycle Bin?')) return
    
    const { error } = await supabase
     .from('deals')
     .update({ status: 'deleted' })
     .eq('id', dealId)
    
    if (error) {
      alert('Delete failed: ' + error.message)
    } else {
      setDeals(deals.filter(d => d.id!== dealId))
      setExpandedId(null)
    }
  }

  const sendMessage = async (dealId: number) => {
    const message = newMessage[dealId]?.trim()
    if (!message) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const deal = deals.find(d => d.id === dealId)
    if (!deal) return

    const { error } = await supabase.from('deal_messages').insert({
      deal_id: dealId,
      sender_id: user.id,
      recipient_id: deal.user_id,
      message: message
    })
    
    if (error) {
      alert('Message failed: ' + error.message)
    } else {
      setNewMessage(prev => ({...prev, [dealId]: '' }))
      fetchMessages(dealId)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-black text-white p-4 flex items-center justify-center">
      <div className="text-yellow-500">Loading deals...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-yellow-500">SAVED DEALS</h1>
        <button 
          onClick={() => router.push('/')}
          className="text-zinc-400 text-sm">
          ← Command Center
        </button>
      </div>

      {deals.length === 0? (
        <div className="text-center text-zinc-500 mt-20">
          <p className="text-lg mb-2">No saved deals yet</p>
          <button 
            onClick={() => router.push('/vault/new')}
            className="bg-yellow-500 text-black font-bold px-6 py-3 rounded mt-4">
            + ADD YOUR FIRST DEAL
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map(deal => (
            <div key={deal.id} className="bg-zinc-900 rounded border border-zinc-800">
              <div className="p-4">
                <div className="flex gap-4">
                  <img 
                    src={deal.image_urls?.[0] || 'https://via.placeholder.com/100x100/333/666?text=No+Image'} 
                    alt="Deal"
                    className="w-20 h-20 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xl font-bold text-green-500">
                          ${deal.price?.toLocaleString() || '0'}
                        </p>
                        <p className="text-sm text-white truncate">
                          {deal.address}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {deal.city}, {deal.state} {deal.zip}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs text-zinc-400 mt-2">
                      <span>{deal.bedrooms || 0}bd</span>
                      <span>{deal.bathrooms || 0}ba</span>
                      <span>{deal.sqft?.toLocaleString() || 0} sqft</span>
                    </div>
                    <div className="flex gap-2 text-xs text-yellow-500 mt-1">
                      <span>{deal.property_type}</span>
                      <span>•</span>
                      <span>{deal.deal_type}</span>
                    </div>
                    {deal.asking_price && (
                      <p className="text-xs text-zinc-500 mt-1">
                        Asking: ${deal.asking_price.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => handleView(deal.id)}
                    className="bg-zinc-700 text-white px-4 py-2 rounded text-sm flex-1">
                    {expandedId === deal.id? 'HIDE' : 'VIEW'}
                  </button>
                  <button 
                    onClick={() => router.push(`/vault/deal/${deal.id}/pain`)}
                    className="bg-red-600 text-white px-4 py-2 rounded text-sm">
                    PAIN
                  </button>
                  <button 
                    onClick={() => handleArchive(deal.id)}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
                    ARCHIVE
                  </button>
                  <button 
                    onClick={() => handleDelete(deal.id)}
                    className="bg-red-900 text-white px-4 py-2 rounded text-sm">
                    DELETE
                  </button>
                </div>
              </div>

              {expandedId === deal.id && (
                <div className="border-t border-zinc-800 p-4 space-y-4">
                  {deal.image_urls && deal.image_urls.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {deal.image_urls.slice(1).map((url: string, idx: number) => (
                        <img key={idx} src={url} alt={`Pic ${idx + 2}`} className="w-full h-24 object-cover rounded" />
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {deal.arv && (
                      <div>
                        <p className="text-zinc-500 text-xs">ARV</p>
                        <p className="text-white">${deal.arv.toLocaleString()}</p>
                      </div>
                    )}
                    {deal.repair_cost && (
                      <div>
                        <p className="text-zinc-500 text-xs">Repairs</p>
                        <p className="text-white">${deal.repair_cost.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {deal.notes && (
                    <div>
                      <p className="text-zinc-500 text-xs mb-1">Notes</p>
                      <p className="text-zinc-300 text-sm whitespace-pre-wrap">{deal.notes}</p>
                    </div>
                  )}

                  <div className="border-t border-zinc-800 pt-4">
                    <p className="text-zinc-500 text-xs mb-2">Messages</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                      {messages[deal.id]?.length > 0? (
                        messages[deal.id].map((msg: any) => (
                          <div key={msg.id} className={`text-sm p-2 rounded ${
                            msg.sender_id === currentUserId 
                             ? 'bg-yellow-900/30 ml-8' 
                              : 'bg-zinc-800 mr-8'
                          }`}>
                            <p className="text-xs text-zinc-500 mb-1">
                              {msg.sender_id === currentUserId? 'You' : 'User'} • {new Date(msg.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-zinc-200">{msg.message}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-zinc-600 text-xs">No messages yet</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="Type message..."
                        value={newMessage[deal.id] || ''}
                        onChange={e => setNewMessage(prev => ({...prev, [deal.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && sendMessage(deal.id)}
                        className="flex-1 bg-zinc-800 p-2 rounded text-sm border border-zinc-700"
                      />
                      <button 
                        onClick={() => sendMessage(deal.id)}
                        className="bg-yellow-500 text-black px-4 py-2 rounded text-sm font-bold">
                        SEND
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
