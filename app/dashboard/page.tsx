"use client";
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// ... your existing dashboard code ...

<header style={{ borderBottom: '1px solid #FFD700', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
    <Image src="/IMG_4751.png" alt="VaultForge" width={40} height={40} style={{ objectFit: 'contain' }} />
    <div>
      <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: '900', letterSpacing: '2px' }}>COMMAND CENTER</div>
      <div style={{ color: '#666', fontSize: '11px', letterSpacing: '2px' }}>PRIVATE INVESTOR ARCHITECTURE</div>
    </div>
  </div>
  <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} style={{ border: '1px solid #FF6B6B', background: 'transparent', color: '#FF6B6B', padding: '10px 20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>EXIT VAULT</button>
</header>
