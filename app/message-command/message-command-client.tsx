'use client'
import { useRouter } from 'next/navigation'
export default function MessageCommandClient({ messages, userEmail }: { messages: any[], userEmail: string }) {
const router = useRouter()
const lanes = ['Saved', 'Alerts', 'Pain', 'Signals', 'Routing', 'Introductions', 'Projects', 'Members', 'General']
return (
<div className="p-4 max-w-7xl mx-auto">
<h1 className="text-2xl font-bold mb-6">Message Command</h1>
<div className="text-sm mb-4">Logged in as: {userEmail}</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
{lanes.map(lane => {
const count = messages.filter(m => m.lane === lane).length
return (
<div key={lane} className="border rounded-lg p-4 bg-white shadow">
<div className="flex justify-between items-center mb-3">
<h2 className="text-lg font-semibold">{lane}</h2>
<span className="bg-gray-100 px-2 py-1 rounded text-sm">{count}</span>
</div>
<div className="text-gray-400 text-sm">{count === 0 ? 'Empty' : count + ' messages'}</div>
</div>
)
})}
</div>
)
}
