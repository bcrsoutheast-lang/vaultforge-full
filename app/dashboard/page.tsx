'use client'
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else setUser(data.user)
    })
  }, [])

  if (!user) return (
    <div style={{ 
      background: '#000', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <img src="/IMG_4751.png" style={{ width: '120px', filter: 'drop-shadow(0 0 20px #FFD700)' }} />
      <div style={{ color: '#FFD700', fontSize: '14px', letterSpacing: '3px', fontWeight: '700' }}>
        LOADING COMMAND CENTER...
      </div>
    </div>
  )

  return (
    <div style={{ 
      background: 'linear-gradient(180deg, #000000 0%, #0A0A0A 100%)', 
      minHeight: '100vh', 
      color: '#E5E5E5',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* HEADER WITH BRANDING */}
      <header style={{
        borderBottom: '1px solid #FFD700',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(90deg, rgba(255,215,0,0.05) 0%, rgba(0,0,0,1) 100%)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img 
            src="/IMG_4751.png" 
            alt="VAULTFORGE"
            style={{ 
              width: '52px', 
              height: '52px',
              filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))'
            }} 
          />
          <div>
            <div style={{ 
              color: '#FFD700', 
              fontSize: '20px', 
              fontWeight: '900', 
              letterSpacing: '2px',
              textShadow: '0 0 20px rgba(255,215,0,0.5)'
            }}>
              VAULTFORGE
            </div>
            <div style={{ 
              color: '#888', 
              fontSize: '10px', 
              letterSpacing: '3px',
              marginTop: '2px'
            }}>
              COMMAND CENTER
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => router.push('/profile')}
          style={{
            background: 'transparent',
            border: '1px solid #FFD700',
            color: '#FFD700',
            padding: '10px 20px',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '1px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FFD700'
            e.currentTarget.style.color = '#000'
            e.currentTarget.style.boxShadow = '0 0 20px rgba(255,215,0,0.6)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#FFD700'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          PROFILE
        </button>
      </header>

      {/* MAIN OPS */}
      <main style={{ padding: '40px 24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <div style={{ 
            color: '#FFD700', 
            fontSize: '14px', 
            letterSpacing: '4px',
            fontWeight: '700',
            marginBottom: '8px'
          }}>
            FORTIFY YOUR PORTFOLIO
          </div>
          <div style={{ 
            color: '#666', 
            fontSize: '11px', 
            letterSpacing: '2px'
          }}>
            VETERAN PRIDE. DISCIPLINE. STRATEGY. RESULTS.
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '20px',
          marginBottom: '40px'
        }}>
          <button 
            onClick={() => router.push('/pain-intake')}
            style={{
              background: 'linear-gradient(135deg, #1A1A1A 0%, #000 100%)',
              border: '2px solid #FFD700',
              padding: '40px',
              cursor: 'pointer',
              transition: 'all 0.3s',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(255,215,0,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>
              PAIN INTAKE
            </div>
            <div style={{ color: '#888', fontSize: '11px', letterSpacing: '1px' }}>
              SUBMIT DISTRESSED DEAL FOR 6SIGMA SOLVING
            </div>
          </button>

          <button 
            onClick={() => router.push('/pain-help')}
            style={{
              background: 'linear-gradient(135deg, #1A1A1A 0%, #000 100%)',
              border: '2px solid #FFD700',
              padding: '40px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(255,215,0,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ color: '#FFD700', fontSize: '24px', fontWeight: '900', letterSpacing: '2px', marginBottom: '8px' }}>
              PAIN HELP
            </div>
            <div style={{ color: '#888', fontSize: '11px', letterSpacing: '1px' }}>
              DEPLOY EXPERT SOLUTION MATRIX
            </div>
          </button>
        </div>

        {/* STATS */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px'
        }}>
          {[
            { label: 'ACTIVE DEALS', value: '0' },
            { label: 'CLOSED THIS MONTH', value: '0' },
            { label: 'COMMISSION EARNED', value: '$0' }
          ].map((stat, i) => (
            <div key={i} style={{
              background: '#0A0A0A',
              border: '1px solid #333',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{ color: '#FFD700', fontSize: '32px', fontWeight: '900', marginBottom: '8px' }}>
                {stat.value}
              </div>
              <div style={{ color: '#666', fontSize: '10px', letterSpacing: '2px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* FOOTER BRANDING */}
      <footer style={{
        borderTop: '1px solid #222',
        padding: '20px',
        textAlign: 'center',
        marginTop: '60px'
      }}>
        <div style={{ color: '#444', fontSize: '9px', letterSpacing: '3px' }}>
          BUILT ON HONOR. DRIVEN BY PURPOSE.
        </div>
      </footer>
    </div>
  )
}
