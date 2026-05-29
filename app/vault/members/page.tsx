'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Member = {
  id: string
  full_name: string
  state_from: string
  city: string | null
  bio: string | null
  avatar_url: string | null
  deals_closed: number
  verified: boolean
  unread_message_count: number
}

const US_STATES = [
  'ALL', 'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
]

export default function MembersDirectory() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [selectedState, setSelectedState] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [isOnboarded, setIsOnboarded] = useState(false)

  useEffect(() => {
    loadMembers()

    const channel = supabase
      .channel('directory_updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vault_members' }, 
        () => loadMembers()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    filterMembers()
  }, [members, selectedState, searchQuery])

  const loadMembers = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    // Check if current user is onboarded
    const { data: myProfile } = await supabase
      .from('vault_members')
      .select('id')
      .eq('id', user.id)
      .single()
    
    setIsOnboarded(!!myProfile)

    // Get all members except current user
    const { data } = await supabase
      .from('vault_members')
      .select('*')
      .neq('id', user.id)
      .order('deals_closed', { ascending: false })

    if (data) setMembers(data)
    setLoading(false)
  }

  const filterMembers = () => {
    let filtered = members

    // Filter by state
    if (selectedState !== 'ALL') {
      filtered = filtered.filter(m => m.state_from === selectedState)
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(m => 
        m.full_name.toLowerCase().includes(query) ||
        m.city?.toLowerCase().includes(query) ||
        m.bio?.toLowerCase().includes(query)
      )
    }

    setFilteredMembers(filtered)
  }

  const openChat = (memberId: string) => {
    if (!isOnboarded) {
      alert('Join the directory first to message members')
      router.push('/vault/members/onboard')
      return
    }
    router.push(`/vault/members/${memberId}`)
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-4">Loading directory...</div>

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-yellow-500">MEMBER DIRECTORY</h1>
          <button onClick={() => router.push('/vault')} className="text-zinc-400 text-sm">
            ← Dashboard
          </button>
        </div>

        {!isOnboarded && (
          <div className="bg-blue-900/30 border border-blue-600 p-4 rounded mb-6 text-center">
            <p className="text-blue-400 font-bold mb-2">You’re not in the directory yet</p>
            <button 
              onClick={() => router.push('/vault/members/onboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-500"
            >
              Join Now to Connect
            </button>
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, city, or bio..."
          className="w-full bg-zinc-900 text-white px-4 py-3 rounded border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />

        {/* State Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {US_STATES.map(state => (
            <button
              key={state}
              onClick={() => setSelectedState(state)}
              className={`px-4 py-2 rounded whitespace-nowrap text-sm font-bold ${
                selectedState === state 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {state}
            </button>
          ))}
        </div>

        {/* Member Grid */}
        {filteredMembers.length === 0 ? (
          <div className="text-center text-zinc-500 mt-20">
            <p>No members found</p>
            {selectedState !== 'ALL' && (
              <button 
                onClick={() => setSelectedState('ALL')}
                className="text-blue-400 text-sm mt-2"
              >
                View all states →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map(member => (
              <button
                key={member.id}
                onClick={() => openChat(member.id)}
                className="bg-zinc-900 p-4 rounded border border-zinc-800 text-left hover:bg-zinc-800 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={member.avatar_url || 'https://via.placeholder.com/56/333/666?text=M'}
                    alt={member.full_name}
                    className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-white truncate">{member.full_name}</p>
                      {member.verified && <span className="text-blue-400 text-xs">✓</span>}
                    </div>
                    <p className="text-xs text-zinc-400">
                      {member.city ? `${member.city}, ` : ''}{member.state_from}
                    </p>
                  </div>
                </div>

                {member.bio && (
                  <p className="text-sm text-zinc-300 mb-3 line-clamp-2">{member.bio}</p>
                )}

                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">{member.deals_closed} deals closed</span>
                  <span className="text-blue-400 font-bold">Message →</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="text-center text-zinc-600 text-xs mt-8">
          {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'} 
          {selectedState !== 'ALL' && ` in ${selectedState}`}
        </div>
      </div>
    </div>
  )
}
