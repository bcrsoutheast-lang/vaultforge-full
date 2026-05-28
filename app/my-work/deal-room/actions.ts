'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function createDeal(formData: FormData) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role to bypass RLS
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const data = {
    user_email: 'dm2107137@gmail.com',
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    zipcode: formData.get('zipcode') as string,
    asking_price: Number(formData.get('asking_price')),
    arv: Number(formData.get('arv')),
    beds: Number(formData.get('beds')) || null,
    baths: Number(formData.get('baths')) || null,
    sqft: Number(formData.get('sqft')) || null,
    description: formData.get('description') as string,
    title: `${formData.get('beds') || '?'}bd ${formData.get('baths') || '?'}ba ${formData.get('city')}`,
    created_at: new Date().toISOString()
  }

  const { error } = await supabase.from('deals').insert(data)
  
  if (error) {
    return { error: error.message }
  }

  revalidatePath('/deal-opportunities')
  return { error: null }
}
