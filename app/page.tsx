import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ 
      backgroundColor: '#000', 
      minHeight: '100vh', 
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      textAlign: 'center'
    }}>
      <h1 style={{ 
        fontSize: '48px', 
        fontWeight: '900', 
        color: '#facc15', 
        marginBottom: '16px' 
      }}>
        VAULTFORGE
      </h1>
      
      <p style={{ 
        fontSize: '20px', 
        color: '#a1a1aa', 
        marginBottom: '8px' 
      }}>
        Private Investor Network
      </p>
      
      <p style={{ 
        fontSize: '16px', 
        color: '#71717a', 
        marginBottom: '32px' 
      }}>
        Residential • Commercial • Land • Deal Intelligence
      </p>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/login" style={{
          backgroundColor: '#facc15',
          color: '#000',
          fontWeight: '900',
          fontSize: '18px',
          padding: '16px 32px',
          borderRadius: '8px',
          textDecoration: 'none',
          display: 'inline-block'
        }}>
          MEMBER LOGIN
        </Link>
        
        <Link href="/pain-intake" style={{
          backgroundColor: '#27272a',
          color: '#fff',
          fontWeight: '700',
          fontSize: '18px',
          padding: '16px 32px',
          borderRadius: '8px',
          textDecoration: 'none',
          display: 'inline-block',
          border: '1px solid #3f3f46'
        }}>
          SUBMIT PAIN DEAL
        </Link>
      </div>
    </div>
  )
}
