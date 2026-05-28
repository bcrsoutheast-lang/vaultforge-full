import { createClient } from '@supabase/supabase-js'
import DealOpportunities from './DealOpportunities'

export const revalidate = 0 // Always fetch fresh data, no caching

export default async function Page() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-only key, safe here
  )
  
  // Only grab active deals, newest first
  const { data: deals, error } = await supabase
    .from('deals')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching deals:', error)
    return <div style={{ color: '#ef4444', padding: 20 }}>Failed to load deals.</div>
  }

  // Pass deals to client component
  return <DealOpportunities deals={deals || []} />
}
