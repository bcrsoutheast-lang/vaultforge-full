= filtered.filter(m => saved.includes(m.id))
    } else if (view === 'hidden') {
      filtered = filtered.filter(m => hidden.includes(m.id))
    } else {
      filtered = filtered.filter(m =>!hidden.includes(m.id))
    }

    const grouped = filtered.reduce((acc, member) => {
      const state = member.state_from || 'Unknown'
      if (!acc[state]) acc[state] = []
      acc[state].push(member)
      return acc
    }, {} as Record<string, any[]>)

    setMembersByState(grouped)
    setLoading(false)
  }

  const toggleSave = async (memberId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (savedIds.includes(memberId)) {
      await supabase.from('saved_members').delete().eq('user_id', user.id).eq('member_id', memberId)
      setSavedIds(savedIds.filter(id => id!== memberId))
    } else {
      await supabase.from('saved_members').insert({ user_id: user.id, member_id: memberId })
      setSavedIds([...savedIds, memberId])
    }
  }

  const toggleHide = async (memberId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (hiddenIds.includes(memberId)) {
      await supabase.from('hidden_members').delete().eq('user_id', user.id).eq('member_id', memberId)
      setHiddenIds(hiddenIds.filter(id => id!== memberId))
    } else {
      await supabase.from('hidden_members').insert({ user_id: user.id, member_id: memberId })
      setHiddenIds([...hiddenIds, memberId])
    }
    fetchData()
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-4">Loading Directory...</div>

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-yellow-500">MEMBER DIRECTORY</h1>
        <button onClick={() => router.push('/vault')} className="text-zinc-400 text-sm">
          ← Dashboard
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('all')}
          className={`px-4 py-2 rounded text-sm font-bold ${view === 'all'? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-white'}`}
        >
          ALL MEMBERS
        </button>
        <button
          onClick={() => setView('saved')}
          className={`px-4 py-2 rounded text-sm font-bold ${view === 'saved'? 'bg-green-600 text-white' : 'bg-zinc-800 text-white'}`}
        >
          SAVED ({savedIds.length})
        </button>
        <button
          onClick={() => setView('hidden')}
          className={`px-4 py-2 rounded text-sm font-bold ${view === 'hidden'? 'bg-red-600 text-white' : 'bg-zinc-800 text-white'}`}
        >
          HIDDEN ({hiddenIds.length})
        </button>
      </div>

      {Object.keys(membersByState).length === 0? (
        <div className="text-center text-zinc-500 mt-20">
          <p>No members found</p>
        </div>
      ) : (
        Object.keys(membersByState).sort().map(state => (
          <div key={state} className="mb-8">
            <h2 className="text-xl font-bold text-yellow-500 mb-4 border-b border-zinc-800 pb-2">
              {state} • {membersByState[state].length}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {membersByState[state].map(member => (
                <div key={member.id} className="bg-zinc-900 rounded border border-zinc-800 p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={member.avatar_url || 'https://via.placeholder.com/60/333/666?text=M'}
                      alt={member.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-white">{member.full_name}</p>
                      <p className="text-xs text-zinc-400">{member.city}, {member.state_from}</p>
                      {member.verified && (
                        <span className="inline-block bg-blue-600 text-white text-xs px-2 py-0.5 rounded mt-1">VERIFIED</span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 mb-1">Deals Closed: {member.deals_closed}</p>
                  {member.bio && (
                    <p className="text-sm text-zinc-300 mb-3 line-clamp-2">{member.bio}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => router.push(`/vault/members/${member.id}`)}
                      className="bg-blue-600 text-white py-2 rounded text-sm font-bold"
                    >
                      VIEW + MESSAGE
                    </button>
                    <button
                      onClick={() => toggleSave(member.id)}
                      className={`py-2 rounded text-sm font-bold ${
                        savedIds.includes(member.id)
                        ? 'bg-green-600 text-white'
                          : 'bg-zinc-700 text-white'
                      }`}
                    >
                      {savedIds.includes(member.id)? 'SAVED' : 'SAVE'}
                    </button>
                  </div>

                  {member.id === currentUserId && (
                    <button
                      onClick={() => router.push('/vault/members/edit')}
                      className="w-full mt-2 bg-zinc-700 text-white py-1 rounded text-xs"
                    >
                      EDIT MY PROFILE
                    </button>
                  )}

                  {view!== 'hidden' && member.id!== currentUserId && (
                    <button
                      onClick={() => toggleHide(member.id)}
                      className="w-full mt-2 bg-red-900/50 text-red-400 py-1 rounded text-xs"
                    >
                      HIDE MEMBER
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
