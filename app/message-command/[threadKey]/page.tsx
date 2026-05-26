import { Suspense } from 'react'
import ThreadClient from './thread-client'

export const dynamic = 'force-dynamic'

export default function ThreadPage({ params }: { params: { threadKey: string } }) {
  return (
    <Suspense fallback={<div style={{padding:'20px',color:'#fff',background:'#02040a',minHeight:'100vh'}}>Loading thread...</div>}>
      <ThreadClient threadKey={params.threadKey} />
    </Suspense>
  )
}
