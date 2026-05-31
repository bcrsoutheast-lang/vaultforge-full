import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAuctionTerms } from '@/lib/auction-terms'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )

  const { data: room } = await supabase
  .from('war_rooms')
  .select('*, deals(*)')
  .eq('id', params.id)
  .single()

  if (!room || room.status !== 'completed') {
    return new NextResponse('Auction not complete', { status: 400 })
  }

  const html = `
<!DOCTYPE html>
<html>
<head><style>body{font-family:Arial;padding:40px}h1{color:#f59e0b}.box{border:1px solid #ccc;padding:20px;margin:20px 0}</style></head>
<body>
  <h1>VAULTFORGE CLOSING PACKET</h1>
  <div class="box">
    <h2>WINNING BID CERTIFICATE</h2>
    <p><b>Property:</b> ${room.deals.address}, ${room.deals.city}, ${room.deals.state}</p>
    <p><b>Winning Bid:</b> $${room.final_price?.toLocaleString()}</p>
    <p><b>Buyer Premium (2%):</b> $${(room.final_price * 0.02).toLocaleString()}</p>
    <p><b>Total Due:</b> $${(room.final_price * 1.02).toLocaleString()}</p>
    <p><b>Earnest Money Due:</b> $${(room.final_price * 0.15).toLocaleString()} (15%)</p>
    <p><b>Winner:</b> ${room.winner_name} | ${room.winner_email}</p>
    <p><b>Auction Closed:</b> ${new Date(room.updated_at).toLocaleString()}</p>
  </div>
  <div class="box">
    <h2>EARNEST MONEY INSTRUCTIONS</h2>
    <p>Wire 15% earnest money ($${(room.final_price * 0.15).toLocaleString()}) within 24 hours to:</p>
    <p><b>Title Company:</b> ${room.deals.title_company}</p>
    <p><b>Property Ref:</b> ${room.deals.address}</p>
    <p>Failure to remit earnest money within 24 hours constitutes default. Seller may retain bid as liquidated damages.</p>
  </div>
  <div class="box">
    <h2>AUCTION TERMS & CONDITIONS</h2>
    <pre style="white-space:pre-wrap;font-size:10px">${getAuctionTerms(room.deals.state, room.deals)}</pre>
  </div>
</body>
</html>
  `

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="VaultForge-Closing-${room.id}.html"`
    }
  })
}
