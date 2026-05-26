import { Suspense } from 'react'
import ConnectClient from './connect-client'

export const dynamic = 'force-dynamic'

export default function ConnectPage({ params }: { params: { signalId: string } }) {
  return (
    <Suspense fallback={<div style={{padding:'20px',color:'#fff'}}>Loading...</div>}>
      <ConnectClient signalId={params.signalId} />
    </Suspense>
  )
}
