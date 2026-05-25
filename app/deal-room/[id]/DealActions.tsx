'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function DealActions({ dealId }: { dealId: string }) {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [loading, setLoading] = useState('')
  const [currentStatus, setCurrentStatus] = useState('active')

  useEffect(() => {
    async function loadStatus() {
      const { data } = await supabase
        .from('vf_deal_actions')
        .select('status')
        .eq('deal_id', dealId)
        .single()
      if (data) setCurrentStatus(data.status)
    }
    loadStatus()
  }, [dealId, supabase])

  async function updateStatus(status: 'active' | 'saved' | 'archived') {
    setLoading(status)
    const { error } = await supabase
      .from('vf_deal_actions')
      .upsert({ deal_id: dealId, status, updated_at: new Date().toISOString() }, { onConflict: 'deal_id' })
    
    setLoading('')
    if (error) return alert('Failed: ' + error.message)
    setCurrentStatus(status)
    router.refresh()
  }

  async function hardDelete() {
    if (!confirm('Remove this deal from your view? This only deletes your save/archive status. The original deal data is untouched.')) return
    
    setLoading('delete')
    const { error } = await supabase
      .from('vf_deal_actions')
      .delete()
      .eq('deal_id', dealId)
    
    setLoading('')
    if (error) return alert('Delete failed: ' + error.message)
    router.push('/deal-rooms')
  }

  return (
    <div className="vf-actions">
      <button 
        onClick={() => updateStatus('saved')} 
        disabled={!!loading || currentStatus === 'saved'} 
        className="vf-btn"
      >
        {loading === 'saved' ? 'Saving...' : currentStatus === 'saved' ? 'Saved ✓' : 'Save'}
      </button>
      <button 
        onClick={() => updateStatus('archived')} 
        disabled={!!loading || currentStatus === 'archived'} 
        className="vf-btn"
      >
        {loading === 'archived' ? 'Archiving...' : currentStatus === 'archived' ? 'Archived ✓' : 'Archive'}
      </button>
      <button 
        onClick={() => updateStatus('active')} 
        disabled={!!loading || currentStatus === 'active'} 
        className="vf-btn"
      >
        {loading === 'active' ? 'Restoring...' : 'Restore Active'}
      </button>
      <button onClick={hardDelete} disabled={!!loading} className="vf-btn vf-btn-danger">
        {loading === 'delete' ? 'Removing...' : 'Remove from View'}
      </button>
    </div>
  )
}
