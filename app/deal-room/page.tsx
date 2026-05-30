import { supabase } from '@/lib/supabase' // Add at top

// Replace useEffect
useEffect(() => {
  const fetchDeals = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get all live deals + user's saved/archived/hidden status
    const { data: dealsData, error } = await supabase
     .from('deals')
     .select(`
        *,
        user_deals!left (action, notes)
      `)
     .eq('stage', 'LIVE')
     .order('created_at', { ascending: false })

    if (error) {
      showToast('ERROR LOADING DEALS')
      setLoading(false)
      return
    }

    const mapped = dealsData.map((d: any) => ({
     ...d,
      id: d.id,
      askingPrice: d.asking_price,
      assignmentFee: d.assignment_fee,
      inspectionDays: d.inspection_days,
      closeDate: d.close_date,
      sellerName: d.seller_name,
      sellerPhone: d.seller_phone,
      sellerEmail: d.seller_email,
      sellerId: d.seller_id,
      userAction: d.user_deals?.[0]?.action,
      notes: d.user_deals?.[0]?.notes || []
    }))
    
    setDeals(mapped)
    setLoading(false)
  }
  fetchDeals()
}, [])

// Replace handleSave
const handleSave = async (dealId: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return showToast('LOGIN REQUIRED')
  
  const deal = deals.find(d => d.id === dealId)
  const isSaved = deal?.userAction === 'SAVED'
  
  if (isSaved) {
    await supabase.from('user_deals')
     .delete()
     .eq('user_id', user.id)
     .eq('deal_id', dealId)
     .eq('action', 'SAVED')
    showToast('REMOVED FROM SAVED')
  } else {
    await supabase.from('user_deals').upsert({
      user_id: user.id,
      deal_id: dealId,
      action: 'SAVED'
    })
    showToast('SAVED TO YOUR ROOM')
  }
  
  // Refetch to update UI
  setDeals(deals.map(d => d.id === dealId? {...d, userAction: isSaved? undefined : 'SAVED'} : d))
}

// Replace handleArchive
const handleArchive = async (dealId: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  
  await supabase.from('user_deals').upsert({
    user_id: user.id,
    deal_id: dealId,
    action: 'ARCHIVED'
  })
  setDeals(deals.map(d => d.id === dealId? {...d, userAction: 'ARCHIVED'} : d))
  showToast('ARCHIVED FROM YOUR ROOM')
  setSelectedDeal(null)
}

// Replace handleDeleteFromRoom
const handleDeleteFromRoom = async (dealId: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  if (!confirm('Remove this deal from YOUR Deal Room? The deal stays live for others.')) return
  
  await supabase.from('user_deals').upsert({
    user_id: user.id,
    deal_id: dealId,
    action: 'HIDDEN'
  })
  setDeals(deals.map(d => d.id === dealId? {...d, userAction: 'HIDDEN'} : d))
  showToast('REMOVED FROM YOUR ROOM')
  setSelectedDeal(null)
}

// Replace handleDeleteGlobal
const handleDeleteGlobal = async (dealId: string) => {
  const deal = deals.find(d => d.id === dealId)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (deal?.sellerId!== user?.id) {
    showToast('ERROR: You can only delete deals you posted')
    return
  }
  if (!confirm('DELETE DEAL FOR EVERYONE? This cannot be undone.')) return
  
  const { error } = await supabase.from('deals').delete().eq('id', dealId)
  if (error) return showToast('DELETE FAILED')
  
  setDeals(deals.filter(d => d.id!== dealId))
  showToast('DEAL DELETED GLOBALLY')
  setSelectedDeal(null)
}
