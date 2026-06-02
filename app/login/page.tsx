'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    setError('')
    if (username.trim() === 'admin' && password === 'vault2024') {
      // Force hard redirect - no Next.js router
      window.location.replace('/dashboard.html')
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div style={{padding: '40px', fontFamily: 'monospace'}}>
      <h1>VaultForge</h1>
      <div>
        <input 
          placeholder="Username" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{padding: '10px', marginBottom: '10px', display: 'block'}}
        />
        <input 
          type="password"
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{padding: '10px', marginBottom: '10px', display: 'block'}}
        />
        <button 
          onClick={handleLogin}
          style={{padding: '10px 20px', background: '#0066ff', color: 'white', border: 'none'}}
        >
          Login
        </button>
        {error && <p style={{color: 'red'}}>{error}</p>}
      </div>
      <p style={{marginTop: '40px', fontSize: '12px'}}>
        © 2026 VaultForge. Stuck? Click logo to go home.
      </p>
    </div>
  )
}
