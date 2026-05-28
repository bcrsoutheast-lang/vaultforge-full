use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function CommandCenter() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalDeals: 0,
    activeDeals: 0,
    painCases: 0,
    membersOnline: 0
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        loadStats()
      }
    }
    getUser()
  }, [router, supabase])

  const loadStats = async () => {
    const { count: deals } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })

    const { count: active } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'archived')

    const { count: pain } = await supabase
    .from('pain_intake')
    .select('*', { count: 'exact', head: true })

    setStats({
      totalDeals: deals || 0,
      activeDeals: active || 0,
      painCases: pain || 0,
      membersOnline: 47
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    {
      title: 'DEAL ROOM',
      subtitle: 'Create New Project',
      icon: '⚡',
      path: '/deal-room',
      color: '#FFD700',
      description: 'Submit residential, commercial, or land deals'
    },
    {
      title: 'DEAL OPPORTUNITY',
      subtitle: 'Live Deal Feed',
      icon: '🎯',
      path: '/deals',
      color: '#FFD700',
      description: 'Browse, analyze, and acquire off-market deals'
    },
    {
      title: 'PAIN INTAKE',
      subtitle: '6Sigma Problem Solver',
      icon: '🚨',
      path: '/pain-intake',
      color: '#FF4444',
      description: 'Submit distressed deals needing expert help'
    },
    {
      title: 'PAIN HELP',
      subtitle: 'Solution Center',
      icon: '🛠️',
      path: '/pain-help',
      color: '#00FF88',
      description: 'Solve member problems, earn deal flow'
    }
  ]

  if (!user) {
    return (
      <div style={{
        backgroundColor: '#000000',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFD700'
      }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>AUTHENTICATING...</div>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: '#0A0A0A',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#FFFFFF'
    }}>
      {/* Header Bar */}
      <div style={{
        backgroundColor: '#000000',
        borderBottom: '2px solid #FFD700',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(255, 215, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#FFD700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: '900',
            color: '#000000',
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
          }}>
            VF
          </div>
          <div>
            <div style={{
              fontSize: '24px',
              fontWeight: '900',
              letterSpacing: '2px',
              color: '#FFD700'
            }}>
              VAULTFORGE
            </div>
            <div style={{
              fontSize: '10px',
              color: '#888888',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              Command Center | Private Investor Architecture
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#888888' }}>OPERATOR</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFD700' }}>
              {user?.email?.split('@')[0]?.toUpperCase() || 'OPERATOR'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #FF4444',
              color: '#FF4444',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 'bold',
              letterSpacing: '1px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FF4444'
              e.currentTarget.style.color = '#000000'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#FF4444'
            }}
          >
            LOGOUT
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{
        backgroundColor: '#111111',
        borderBottom: '1px solid #222222',
        padding: '16px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        {[
          { label: 'TOTAL DEALS', value: stats.totalDeals, color: '#FFD700' },
          { label: 'ACTIVE OPS', value: stats.activeDeals, color: '#00FF88' },
          { label: 'PAIN CASES', value: stats.painCases, color: '#FF4444' },
          { label: 'MEMBERS ONLINE', value: stats.membersOnline, color: '#00AAFF' }
        ].map((stat, i) => (
          <div key={i} style={{
            backgroundColor: '#000000',
            border: '1px solid #222222',
            padding: '16px',
            borderLeft: `3px solid ${stat.color}`
          }}>
            <div style={{ fontSize: '10px', color: '#888888', letterSpacing: '1px' }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '900',
              color: stat.color,
              marginTop: '4px'
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ padding: '32px 24px' }}>
        <div style={{
          fontSize: '12px',
          color: '#888888',
          letterSpacing: '2px',
          marginBottom: '24px',
          fontWeight: 'bold'
        }}>
          TACTICAL OPERATIONS
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {navItems.map((item, i) => (
            <button
              key={i}
              onClick={() => router.push(item.path)}
              style={{
                backgroundColor: '#111111',
                border: '1px solid #222222',
                borderTop: `2px solid ${item.color}`,
                padding: '32px 24px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1A1A1A'
                e.currentTarget.style.borderColor = item.color
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 8px 24px ${item.color}33`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#111111'
                e.currentTarget.style.borderColor = '#222222'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                fontSize: '48px',
                marginBottom: '16px',
                filter: 'grayscale(0.3)'
              }}>
                {item.icon}
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '900',
                color: item.color,
                letterSpacing: '1px',
                marginBottom: '4px'
              }}>
                {item.title}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#888888',
                letterSpacing: '1px',
                marginBottom: '12px',
                textTransform: 'uppercase'
              }}>
                {item.subtitle}
              </div>
              <div style={{
                fontSize: '13px',
                color: '#AAAAAA',
                lineHeight: '1.5'
              }}>
                {item.description}
              </div>
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                fontSize: '10px',
                color: item.color,
                fontWeight: 'bold',
                letterSpacing: '1px'
              }}>
                ENTER →
              </div>
            </button>
          ))}
        </div>

        {/* System Status */}
        <div style={{
          marginTop: '48px',
          backgroundColor: '#000000',
          border: '1px solid #222222',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#00FF88',
              borderRadius: '50%',
              boxShadow: '0 0 12px #00FF88'
            }}></div>
            <div style={{ fontSize: '12px', color: '#888888', letterSpacing: '1px' }}>
              SYSTEM STATUS: <span style={{ color: '#00FF88', fontWeight: 'bold' }}>OPERATIONAL</span>
            </div>
          </div>
          <div style={{ fontSize: '10px', color: '#555555', letterSpacing: '1px' }}>
            VAULTFORGE v1.0 | PRIVATE INVESTOR ARCHITECTURE
          </div>
        </div>
      </div>
    </div>
  )
}
