'use client'
import { useState } from 'react'

export default function MessageOwner({ deal, currentUser }: any) {
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState(`Hey, I'm interested in your ${deal.beds}bd/${deal.baths}ba in ${deal.city}. Is it still available?`)
  const [sending, setSending] = useState(false)

  async function sendMessage() {
    setSending(true)
    const res = await fetch('/api/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deal_id: deal.id,
        recipient_email: deal.user_email,
        message: msg,
        current_user_email: currentUser?.email || 'guest@vaultforge.app',
        current_user_name: currentUser?.name || 'Guest User',
        current_user_avatar: currentUser?.avatar || null,
        deal_snapshot: {
          image_url: deal.image_url || deal.image,
          title: `${deal.address || deal.city}, ${deal.state}`,
          price: deal.asking_price,
          beds: deal.beds,
          baths: deal.baths,
          sqft: deal.sqft
        }
      })
    })
    setSending(false)
    if (res.ok) {
      setOpen(false)
      alert('Message sent to owner!')
    } else {
      alert('Failed to send')
    }
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)} 
        className="w-full bg-yellow-400 text-black font-bold py-3 rounded-lg hover:bg-yellow-300"
      >
        MESSAGE OWNER
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 p-6 rounded-lg w-full max-w-md border border-zinc-700">
            <h3 className="text-xl font-bold mb-4">Message Owner</h3>
            
            <div className="flex gap-3 mb-4 p-3 bg-zinc-800 rounded">
              <img 
                src={deal.image_url || deal.image} 
                className="w-20 h-20 object-cover rounded" 
                alt="Property"
              />
              <div className="text-sm">
                <div className="font-bold text-yellow-400">{deal.address || deal.city}, {deal.state}</div>
                <div className="text-blue-400">${deal.asking_price?.toLocaleString()}</div>
                <div>{deal.beds}bd {deal.baths}ba {deal.sqft && `• ${deal.sqft} sqft`}</div>
              </div>
            </div>

            <textarea 
              value={msg} 
              onChange={e => setMsg(e.target.value)}
              className="w-full h-32 bg-zinc-800 p-3 rounded mb-4 text-white border border-zinc-700"
              placeholder="Write your message..."
            />
            
            <div className="flex gap-2">
              <button 
                onClick={sendMessage} 
                disabled={sending}
                className="flex-1 bg-yellow-400 text-black font-bold py-2 rounded disabled:opacity-50"
              >
                {sending ? 'SENDING...' : 'SEND MESSAGE'}
              </button>
              <button 
                onClick={() => setOpen(false)} 
                className="flex-1 bg-zinc-700 py-2 rounded"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
