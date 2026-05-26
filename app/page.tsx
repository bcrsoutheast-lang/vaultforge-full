import Link from 'next/link'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export default async function Home() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  )
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    return (
      <main style={{
        minHeight: '100vh', background: '#0f0f0f', color: '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <h1 style={{ fontSize: 32, color: '#D4AF37', marginBottom: 24 }}>VAULTFORGE</h1>
        <Link href="/profile" style={{ padding: '12px 24px', background: '#D4AF37', color: '#000', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
          Go to Profile
        </Link>
      </main>
    )
  }

  return (
    <main style={{
      minHeight: '100vh', background: '#0f0f0f', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      <h1 style={{ fontSize: 32, color: '#D4AF37', marginBottom: 24 }}>VAULTFORGE</h1>
      <p style={{ marginBottom: 32, opacity: 0.7 }}>Members-only deal platform</p>
      <Link href="/login" style={{ padding: '12px 24px', background: '#D4AF37', color: '#000', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
        Login
      </Link>
    </main>
  );
}
