import { supabase } from '@/lib/supabase' // Add this at top

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setErrors([])
  setSubmitError('')

  const passed = runAnalyzer()
  if (!passed) {
    setErrors(['ANALYZER REJECT: Fix red flags before posting.'])
    return
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Must be logged in to post')

    // Upload photos first
    const photoUrls: string[] = []
    for (const photo of form.photos) {
      const fileName = `${user.id}/${Date.now()}-${photo.name}`
      const { error: uploadError } = await supabase.storage
       .from('deal-files')
       .upload(fileName, photo)
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
       .from('deal-files')
       .getPublicUrl(fileName)
      photoUrls.push(publicUrl)
    }

    // Insert deal
    const { data, error } = await supabase.from('deals').insert({
      seller_id: user.id,
      seller_name: form.sellerName,
      seller_phone: form.sellerPhone,
      seller_email: form.sellerEmail,
      title: form.title,
      deal_type: form.dealType,
      exit_strategy: form.exitStrategy,
      property_type: form.propertyType,
      condition: form.condition,
      street: form.street,
      city: form.city,
      state: form.state,
      zip: form.zip,
      asking_price: Number(form.askingPrice),
      assignment_fee: Number(form.assignmentFee),
      arv: Number(form.arv),
      rehab: Number(form.rehab),
      comp1_addr: form.comp1Addr,
      comp1_price: Number(form.comp1Price) || null,
      comp2_addr: form.comp2Addr,
      comp2_price: Number(form.comp2Price) || null,
      comp3_addr: form.comp3Addr,
      comp3_price: Number(form.comp3Price) || null,
      loan_balance: Number(form.loanBalance) || null,
      loan_rate: Number(form.loanRate) || null,
      occupancy: form.occupancy,
      access: form.access,
      inspection_days: Number(form.inspectionDays),
      close_date: form.closeDate || null,
      why_selling: form.whySelling,
      photos: photoUrls,
      stage: 'LIVE',
      licensed: form.licensed
    }).select().single()

    if (error) throw error
    
    setDealId(data.id.slice(0, 8).toUpperCase())
    setSubmitted(true)
  } catch (err: any) {
    setSubmitError(`SUBMIT FAILED: ${err.message}`)
  }
}
