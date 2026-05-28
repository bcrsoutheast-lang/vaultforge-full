import { createClient } from '@supabase/supabase-js'
import DealOpportunities from './DealOpportunities'

export const revalidate = 0

export default async function Page() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const currentUser = 'dm2107137@gmail.com'
  
  // Get all deals
  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .order('created_at', { ascending: false })

  // Get saved deal IDs for this user
  const { data: savedRows } = await supabase
    .from('saved_deals')
    .select('deal_id')
    .eq('user_email', currentUser)

  const savedIds = savedRows?.map(r => r.deal_id) || []

  return <DealOpportunities deals={deals || []} initialSavedIds={savedIds} currentUser={currentUser} />
}
