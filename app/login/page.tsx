'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    setError('')
    if (username.trim() === 'admin' && password === 'vault2024') {
      window.location.href = '/dashboard.html'
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div style={{padding: '40px', fontFamily: 'monospace', maxWidth: '400px', margin: '0 auto'}}>
      <h1 style={{marginBottom: '30px'}}>VaultForge</h1>
      
      <input 
        placeholder="Username" 
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{padding: '12px', marginBottom: '12px', display: 'block', width: '100%', border: '1px solid #ccc'}}
      />
      <input 
        type="password"
        placeholder="Password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{padding: '12px', marginBottom: '12px', display: 'block', width: '100%', border: '1px solid #ccc'}}
      />
      <button 
        onClick={handleLogin}
        style={{padding: '12px 24px', background: '#0066ff', color: 'white', border: 'none', cursor: 'pointer', width: '100%'}}
      >
        Login
      </button>
      
      {error && <p style={{color: 'red', marginTop: '12px'}}>{error}</p>}
      
      <p style={{marginTop: '60px', fontSize: '12px', color: '#666'}}>
        © 2026 VaultForge. Stuck? Click logo to go home.
      </p>
    </div>
  )
}
