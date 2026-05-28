'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function submitOffer(formData: FormData) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const deal_id = formData.get('deal_id') as string
  const deal_address = formData.get('deal_address') as string
  const buyer_name = formData.get('name') as string
  const buyer_phone = formData.get('phone') as string
  const buyer_email = formData.get('email') as string
  const offer_price = formData.get('offer_price') as string
  const buyer_type = formData.get('buyer_type') as string
  const property_type = formData.get('property_type') as string
  const close_date = formData.get('close_date') as string
  const contingencies = formData.get('contingencies') as string
  const message = formData.get('message') as string
  const has_pof = formData.get('has_pof') === 'on'
  
  // New owner finance fields
  const owner_finance = formData.get('owner_finance') === 'on'
  const down_payment = formData.get('down_payment') as string
  const owner_finance_terms = formData.get('owner_finance_terms') as string

  if (!buyer_name || !buyer_phone || !buyer_email || !offer_price) {
    return { error: 'Name, phone, email, and offer price are required' }
  }

  if (!deal_id) {
    return { error: 'Deal ID missing. Please refresh and try again.' }
  }

  const { error } = await supabase.from('offers').insert({
    deal_id: Number(deal_id),
    deal_address,
    buyer_name,
    buyer_phone,
    buyer_email,
    offer_price: Number(offer_price),
    buyer_type,
    property_type,
    close_date,
    contingencies,
    message,
    has_pof,
    owner_finance,
    down_payment,
    owner_finance_terms,
    created_at: new Date().toISOString()
  })
  
  if (error) {
    console.error('Offer insert error:', error)
    return { error: 'Failed to submit offer. Please try again.' }
  }

  revalidatePath('/deal-opportunities')
  revalidatePath('/my-work/offers')
  
  return { error: null }
}
