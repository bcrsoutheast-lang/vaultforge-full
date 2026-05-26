import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function MessagesRedirect({ searchParams }: { searchParams: Record<string, string> }) {
  const params = new URLSearchParams(searchParams).toString()
  redirect(`/message-command${params? `?${params}` : ''}`)
}
