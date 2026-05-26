import Link from 'next/link'

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui'
    }}>
      <h1 style={{ fontSize: 32, color: '#D4AF37', marginBottom: 24 }}>
        VAULTFORGE
      </h1>
      <p style={{ marginBottom: 32, opacity: 0.7 }}>
        Members-only deal platform
      </p>
      <Link 
        href="/login"
        style={{
          padding: '12px 24px',
          background: '#D4AF37',
          color: '#000',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 600
        }}
      >
        Login
      </Link>
    </main>
  );
}
