'use client'
import { useState } from 'react'

type Deal = {
  id: number
  city: string
  state: string
  photo_url: string | null
  asking_price: number
  beds: number | null
  baths: number | null
  sqft: number | null
  user_email: string
}

type CurrentUser = {
  email: string
  name?: string | null
  avatar?: string | null
}

export default function MessageOwner({ 
  deal, 
  currentUser 
}: { 
  deal: Deal
  currentUser: CurrentUser 
}) {
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState(`Hey, I'm interested in your ${deal.beds}bd/${deal.baths}ba in ${deal.city}. Is it still available?`)
  const [sending, setSending] = useState(false)

  async function sendMessage() {
    if (!msg.trim()) {
      alert('Type a message first')
      return
    }
    
    setSending(true)
    
    try {
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: deal.id,
          recipient_email: deal.user_email,
          message: msg,
          current_user_email: currentUser?.email,
          current_user_name: currentUser?.name || 'VaultForge User',
          current_user_avatar: currentUser?.avatar,
          deal_snapshot: {
            image_url: deal.photo_url,
            title: `${deal.city}, ${deal.state}`,
            price: deal.asking_price,
            beds: deal.beds,
            baths: deal.baths,
            sqft: deal.sqft
          }
        })
      })
      
      if (res.ok) {
        setOpen(false)
        setMsg(`Hey, I'm interested in your ${deal.beds}bd/${deal.baths}ba in ${deal.city}. Is it still available?`)
        alert('Message sent to owner!')
      } else {
        const error = await res.json()
        alert(`Failed to send: ${error.error || 'Unknown error'}`)
      }
    } catch (err) {
      alert('Network error. Try again.')
    }
    
    setSending(false)
  }

  // Don't show MESSAGE OWNER if you're looking at your own deal
  if (currentUser?.email === deal.user_email) {
    return null
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)} 
        className="w-full bg-yellow-400 text-black font-bold py-3 rounded-lg hover:bg-yellow-300 active:bg-yellow-500 text-sm md:text-base"
      >
        MESSAGE OWNER
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className="bg-zinc-950 p-4 md:p-6 rounded-lg w-full max-w-md border border-zinc-800 my-8">
            <h3 className="text-xl font-bold mb-4 text-yellow-400">Message Owner</h3>
            
            <div className="flex gap-3 mb-4 p-3 bg-zinc-900 rounded border border-zinc-800">
              <img 
                src={deal.photo_url || '/placeholder-house.jpg'} 
                className="w-20 h-20 object-cover rounded" 
                alt="Property"
              />
              <div className="text-sm">
                <div className="font-bold text-yellow-400">{deal.city}, {deal.state}</div>
                <div className="text-blue-400 font-bold">${deal.asking_price?.toLocaleString()}</div>
                <div className="text-zinc-400">
                  {deal.beds}bd {deal.baths}ba {deal.sqft && `• ${deal.sqft.toLocaleString()} sqft`}
                </div>
              </div>
            </div>

            <textarea 
              value={msg} 
              onChange={e => setMsg(e.target.value)}
              className="w-full h-32 bg-zinc-900 p-3 rounded mb-4 text-white border border-zinc-800 focus:border-yellow-400 outline-none text-sm"
              placeholder="Write your message to the owner..."
            />
            
            <div className="flex gap-2">
              <button 
                onClick={sendMessage} 
                disabled={sending || !msg.trim()}
                className="flex-1 bg-yellow-400 text-black font-bold py-3 rounded disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {sending? 'SENDING...' : 'SEND MESSAGE'}
              </button>
              <button 
                onClick={() => setOpen(false)} 
                disabled={sending}
                className="flex-1 bg-zinc-800 py-3 rounded hover:bg-zinc-700 text-sm"
              >
                CANCEL
              </button>
            </div>

            <div className="text-xs text-zinc-500 mt-3 text-center">
              Messaging: {deal.user_email}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
