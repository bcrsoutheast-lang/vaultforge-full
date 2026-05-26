import { Suspense } from 'react'
import MessageCommandClient from './message-command-client'

export const dynamic = 'force-dynamic'

export default function MessageCommandPage() {
  return (
    <Suspense fallback={<div style={{padding:'20px',color:'#fff',background:'#02040a',minHeight:'100vh'}}>Loading Message Command...</div>}>
      <MessageCommandClient />
    </Suspense>
  )
}
