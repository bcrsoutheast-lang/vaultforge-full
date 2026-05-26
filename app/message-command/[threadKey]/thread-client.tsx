
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ThreadClient({ messages, threadKey, userEmail }: { messages: any[], threadKey: string, userEmail: string }) {
  const [body, setBody] = useState('')
  const router = useRouter()
  
  const sendMessage = async () => {
    if (!body.trim()) return
    await fetch('/api/message-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thread_key: threadKey,
        subject: messages[0]?.subject || 'Reply',
        body,
        lane: messages[0]?.lane || 'General',
        members: messages[0]?.members || []
      })
    })
    setBody('')
    router.refresh()
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <button onClick={() => router.push('/message-command')} className="mb-4 text-blue-600">← Back</button>
      <h1 className="text-xl font-bold mb-4">{messages[0]?.subject || threadKey}</h1>
      <div className="space-y-4 mb-4">
        {messages.map(m => (
          <div key={m.id} className="border rounded p-3 bg-white">
            <div className="text-sm text-gray-500 mb-1">{new Date(m.created_at).toLocaleString()}</div>
            <div>{m.body}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
      </div>
    </div>
  )
}
