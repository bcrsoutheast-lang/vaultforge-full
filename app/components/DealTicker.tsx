'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'

type Deal = {
  id: number
  title: string
  city: string
  state: string
  asking_price: number
}

export default function DealTicker() {
  const [deals, setDeals] = useState<Deal[]>([])
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    const fetchDeals = async () => {
      const { data } = await supabase
        .from('vault_deals')
        .select('id, title, city, state, asking_price')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (data) setDeals(data)
    }
    
    fetchDeals()
    const interval = setInterval(fetchDeals, 60000)
    return () => clearInterval(interval)
  }, [])

  if (deals.length === 0) return null

  const tickerText = deals.map(d => 
    `NEW: ${d.title} • $${Number(d.asking_price).toLocaleString()} • ${d.city}, ${d.state}`
  ).join('   ›››   ')

  return (
    <div className="w-full bg-blue-600 text-white overflow-hidden py-2 border-b border-blue-500">
      <div className="animate-ticker whitespace-nowrap">
        <span className="text-sm font-bold mx-8">{tickerText}   ›››   {tickerText}</span>
      </div>
      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: inline-block;
          animation: ticker 40s linear infinite;
        }
      `}</style>
    </div>
  )
}
