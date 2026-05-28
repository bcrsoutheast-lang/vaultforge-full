'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const OWNER_EMAIL = 'dm2107137@gmail.com' // Your email - only you can manage deals

export async function archiveDeal(dealId: string) {
  if (!dealId) return { error: 'Deal ID required' }

  const { error } = await supabase
    .from('deals')
    .update({ 
      status: 'archived', 
      archived_at: new Date().toISOString() 
    })
    .eq('id', dealId)
    .eq('user_email', OWNER_EMAIL) // Only owner can archive
  
  if (error) {
    console.error('Archive error:', error)
    return { error: 'Failed to archive deal' }
  }

  revalidatePath('/deal-opportunities')
  revalidatePath('/my-work/deal-room')
  return { error: null }
}

export async function deleteDeal(dealId: string) {
  if (!dealId) return { error: 'Deal ID required' }

  const { error } = await supabase
    .from('deals')
    .delete()
    .eq('id', dealId)
    .eq('user_email', OWNER_EMAIL) // Only owner can delete
  
  if (error) {
    console.error('Delete error:', error)
    return { error: 'Failed to delete deal' }
  }

  revalidatePath('/deal-opportunities')
  revalidatePath('/my-work/deal-room')
  return { error: null }
}

export async function unarchiveDeal(dealId: string) {
  const { error } = await supabase
    .from('deals')
    .update({ 
      status: 'active', 
      archived_at: null 
    })
    .eq('id', dealId)
    .eq('user_email', OWNER_EMAIL)
  
  if (error) return { error: 'Failed to unarchive deal' }
  revalidatePath('/deal-opportunities')
  return { error: null }
}
