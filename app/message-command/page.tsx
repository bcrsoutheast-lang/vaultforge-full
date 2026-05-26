
'use client'
import { useRouter } from 'next/navigation'

const LANES = ['Saved', 'Alerts', 'Pain', 'Signals', 'Routing', 'Introductions', 'Projects', 'Members', 'General']

export default function MessageCommandClient({ messages, userEmail }: { messages: any[], userEmail: string }) {
  const router = useRouter()
  
  const getLaneCount = (lane: string) => messages.filter(m => m.lane === lane).length
  
  const getThreads = (lane: string) => {
    const laneMessages = messages.filter(m => m.lane === lane)
    const threads = Array.from(new Set(laneMessages.map(m => m.thread_key)))
    return threads.map(threadKey => ({
      key: threadKey,
      count: laneMessages.filter(m => m.thread_key === threadKey).length,
      latest: laneMessages.find(m => m.thread_key === threadKey)
    }))
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Message Command</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {LANES.map(lane => (
          <div key={lane} className="border rounded-lg p-4 bg-white shadow">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">{lane}</h2>
              <span className="bg-gray-100 px-2 py-1 rounded text-sm">{getLaneCount(lane)}</span>
            </div>
            <div className="space-y-2">
              {getThreads(lane).slice(0, 3).map(thread => (
                <div 
                  key={thread.key}
                  onClick={() => router.push(`/message-command/${thread.key}`)}
                  className="text-sm p-2 hover:bg-gray-50 rounded cursor-pointer border"
                >
                  <div className="font-medium truncate">{thread.latest?.subject || 'No subject'}</div>
                  <div className="text-gray-500 text-xs">{thread.count} messages</div>
                </div>
              ))}
              {getLaneCount(lane) === 0 && <div className="text-gray-400 text-sm">Empty</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
