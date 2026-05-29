'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VaultDashboard() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const [counts, setCounts] = useState({
    dealUnread: 0,
    painUnread: 0,
    memberUnread: 0,
    totalDeals: 0,
    totalPain: 0,
    totalMembers: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCounts()
    
    const channel = supabase
      .channel('dashboard_alerts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'member_messages' }, 
        () => fetchCounts()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vault_messages' }, 
        () => fetchCounts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchCounts = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [
      dealUnreadRes,
      painUnreadRes,
      memberUnreadRes,
      totalDealsRes,
      totalPainRes,
      totalMembersRes
    ] = await Promise.all([
      supabase
        .from('deals')
        .select('unread_message_count')
        .eq('user_id', user.id)
        .eq('status', 'saved'),
      
      supabase
        .from('pain_deals')
        .select('unread_message_count')
        .eq('user_id', user.id)
        .eq('status', 'active'),
      
      supabase
        .from('member_messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false),
      
      supabase
        .from('deals')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'saved'),
      
      supabase
        .from('pain_deals')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active'),
      
      supabase
        .from('vault_members')
        .select('id', { count: 'exact', head: true })
    ])

    const dealUnread = dealUnreadRes.data?.reduce((sum, d) => sum + (d.unread_message_count || 0), 0) || 0
    const painUnread = painUnreadRes.data?.reduce((sum, d) => sum + (d.unread_message_count || 0), 0) || 0
    
    setCounts({
      dealUnread,
      painUnread,
      memberUnread: memberUnreadRes.count || 0,
      totalDeals: totalDealsRes.count || 0,
      totalPain: totalPainRes.count || 0,
      totalMembers: totalMembersRes.count || 0
    })
    setLoading(false)
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-4">Loading Dashboard...</div>

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-500 mb-8 text-center">VAULT DASHBOARD</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button 
            onClick={() => router.push('/vault/opportunities')}
            className={`relative bg-zinc-900 p-6 rounded border-2 text-left hover:bg-zinc-800 ${
              counts.dealUnread > 0 ? 'border-yellow-500 animate-pulse' : 'border-zinc-800'
            }`}
          >
            <p className="text-sm text-zinc-400">DEAL ROOM</p>
            <p className="text-3xl font-bold text-yellow-500">{counts.totalDeals}</p>
            {counts.dealUnread > 0 && (
              <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                {counts.dealUnread} NEW
              </span>
            )}
          </button>

          <button 
            onClick={() => router.push('/vault/pain')}
            className={`relative bg-zinc-900 p-6 rounded border-2 text-left hover:bg-zinc-800 ${
              counts.painUnread > 0 ? 'border-red-500 animate-pulse' : 'border-zinc-800'
            }`}
          >
            <p className="text-sm text-zinc-400">PAIN ROOM</p>
            <p className="text-3xl font-bold text-red-500">{counts.totalPain}</p>
            {counts.painUnread > 0 && (
              <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                {counts.painUnread} NEW
              </span>
            )}
          </button>

          <button 
            onClick={() => router.push('/vault/messages')}
            className={`relative bg-zinc-900 p-6 rounded border-2 text-left hover:bg-zinc-800 ${
              counts.memberUnread > 0 ? 'border-blue-500 animate-pulse' : 'border-zinc-800'
            }`}
          >
            <p className="text-sm text-zinc-400">MESSAGES</p>
            <p className="text-3xl font-bold text-blue-500">{counts.memberUnread}</p>
            {counts.memberUnread > 0 && (
              <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                {counts.memberUnread} NEW
              </span>
            )}
          </button>

          <button 
            onClick={() => router.push('/vault/members')}
            className="relative bg-zinc-900 p-6 rounded border-2 border-zinc-800 text-left hover:bg-zinc-800"
          >
            <p className="text-sm text-zinc-400">MEMBER DIRECTORY</p>
            <p className="text-3xl font-bold text-green-500">{counts.totalMembers}</p>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => router.push('/vault/new')}
            className="w-full bg-yellow-500 text-black font-bold py-4 rounded hover:bg-yellow-400"
          >
            + ADD NEW DEAL
          </button>
          
          <button 
            onClick={() => router.push('/vault/pain/new')}
            className="w-full bg-red-600 text-white font-bold py-4 rounded hover:bg-red-500"
          >
            + ADD PAIN DEAL
          </button>

          <button 
            onClick={() => router.push('/vault/members/onboard')}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded hover:bg-blue-700"
          >
            JOIN MEMBER DIRECTORY
          </button>
        </div>

        {(counts.dealUnread > 0 || counts.painUnread > 0 || counts.memberUnread > 0) && (
          <div className="mt-8 bg-red-900/30 border border-red-600 p-4 rounded text-center">
            <p className="text-red-400 font-bold">⚠️ YOU HAVE UNREAD MESSAGES</p>
            <p className="text-sm text-zinc-300 mt-1">
              {counts.dealUnread > 0 && `${counts.dealUnread} in Deal Room • `}
              {counts.painUnread > 0 && `${counts.painUnread} in Pain Room • `}
              {counts.memberUnread > 0 && `${counts.memberUnread} from Members`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
