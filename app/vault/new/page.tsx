'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

export default function NewDealPage() {
  const router = useRouter()
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [form, setForm] = useState({address:'',city:'',state:'GA',price:'',bedrooms:'3',bathrooms:'2',sqft:''})
  const [loading,setLoading]=useState(false)

  const save = async (e:any) => {
    e.preventDefault(); setLoading(true)
    const {data:{user}} = await supabase.auth.getUser()
    const {error} = await supabase.from('deals').insert({
      user_id: user?.id,
      address: form.address,
      city: form.city,
      state: form.state,
      price: Number(form.price),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      sqft: Number(form.sqft)||0
    })
    setLoading(false)
    if(error) alert('SAVE FAILED: '+error.message)
    else router.push('/vault/saved')
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-yellow-500 text-xl mb-6">ADD DEAL - TEST</h1>
      <form onSubmit={save} className="space-y-4 max-w-md">
        <input placeholder="Address" required value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="w-full bg-zinc-900 p-3 border border-zinc-700"/>
        <div className="flex gap-2">
          <input placeholder="City" required value={form.city} onChange={e=>setForm({...form,city:e.target.value})} className="flex-1 bg-zinc-900 p-3 border border-zinc-700"/>
          <select value={form.state} onChange={e=>setForm({...form,state:e.target.value})} className="bg-zinc-900 p-3 border border-zinc-700 w-20">
            {STATES.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <input placeholder="Price" type="number" required value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="w-full bg-zinc-900 p-3 border border-zinc-700"/>
        <button disabled={loading} className="w-full bg-yellow-500 text-black font-bold p-3">{loading?'SAVING...':'SAVE TEST DEAL'}</button>
      </form>
    </div>
  )
}
