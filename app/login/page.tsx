'use client'
import { useState } from 'react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    if (username.trim() === 'admin' && password === 'vault2024') {
      window.location.replace('/dashboard.html')
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div style={{padding: 40}}>
      <h1>VaultForge Login</h1>
      <input 
        placeholder="Username" 
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <br /><br />
      <input 
        type="password"
        placeholder="Password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />
      <button onClick={handleLogin}>Login</button>
      {error && <p style={{color: 'red'}}>{error}</p>}
    </div>
  )
}
