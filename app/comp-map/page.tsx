'use client'
import { useRouter } from 'next/navigation'

export default function CompMapLocked() {
  const router = useRouter()

  return (
    <div style={{ 
      background: '#000', 
      minHeight: '100vh', 
      color: '#f8f8f8', 
      padding: '16px',
      fontFamily: 'monospace',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    }}>
      <div style={{ 
        fontSize: '18px', 
        fontWeight: '700', 
        marginBottom: '16px',
        letterSpacing: '0.05em'
      }}>
        VAULTFORGE COMP MAP
      </div>
      <div style={{ 
        fontSize: '11px', 
        color: '#f87171', 
        marginBottom: '24px', 
        letterSpacing: '0.1em',
        animation: 'pulse 2s infinite'
      }}>
        BLOOMBERG 3D INTEL // COMING ONLINE Q3 2026
      </div>
      <div style={{ 
        background: '#111', 
        border: '1px solid #dc2626', 
        padding: '24px',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '11px', marginBottom: '12px', fontWeight: '700' }}>
          MODULE LOCKED FOR DEPLOYMENT
        </div>
        <div style={{ fontSize: '10px', color: '#888', lineHeight: '1.6' }}>
          Comp Map requires Mapbox integration.
          <br/><br/>
          All deal data + DQI intel operational.
          <br/>
          Use COMMAND CENTER + DEALS GRID until unlock.
          <br/><br/>
          Your deals are being logged to power the map.
        </div>
        <button 
          onClick={() => router.push('/dashboard')}
          style={{
            marginTop: '20px',
            background: '#f8f8f8',
            color: '#000',
            border: 'none',
            padding: '12px 24px',
            fontSize: '10px',
            fontWeight: '700',
            cursor: 'pointer',
            letterSpacing: '0.1em'
          }}
        >
          RETURN TO COMMAND CENTER
        </button>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
