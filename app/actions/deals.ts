'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function archiveDeal(dealId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { error } = await supabase
    .from('deals')
    .update({ status: 'archived' })
    .eq('id', Number(dealId))
  
  if (error) return { error: error.message }
  revalidatePath('/deal-opportunities')
  return { error: null }
}

export async function deleteDeal(dealId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { error } = await supabase
    .from('deals')
    .delete()
    .eq('id', Number(dealId))
  
  if (error) return { error: error.message }
  revalidatePath('/deal-opportunities')
  return { error: null }
}

export async function saveDeal(dealId: number, userEmail: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { error } = await supabase
    .from('saved_deals')
    .insert({ deal_id: dealId, user_email: userEmail })
  
  // 23505 = unique violation = already saved, that's fine
  if (error && error.code !== '23505') return { error: error.message }
  revalidatePath('/deal-opportunities')
  return { error: null }
}

export async function unsaveDeal(dealId: number, userEmail: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const { error } = await supabase
    .from('saved_deals')
    .delete()
    .eq('deal_id', dealId)
    .eq('user_email', userEmail)
  
  if (error) return { error: error.message }
  revalidatePath('/deal-opportunities')
  return { error: null }
}
