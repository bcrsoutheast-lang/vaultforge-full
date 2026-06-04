'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Message {
  id: string
  type: 'deal' | 'pain'
  status: 'saved' | 'archived' | 'deleted'
  from: string
  timestamp: string
  sellerName: string
  sellerPhone: string
  sellerEmail: string
  ps: number
  vs?: number
  address: string
  ask: number
  arv: number
  spread: number
  unread: boolean
  flagged: boolean
  photo: string
}

function MessageCenterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [time, setTime] = useState('')
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all')
  
  useEffect(() => {
    setTime(new Date().toLocaleTimeString('en-US', {hour12: false}))
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', {hour12: false}))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'deal',
      status: 'saved',
      from: 'VaultForge OS',
      timestamp: '14 MIN AGO',
      sellerName: 'John Smith',
      sellerPhone: '404-555-0192',
      sellerEmail: 'jsmith@gmail.com',
      ps: 94,
      vs: 820,
      address: '123 Main St Atlanta, GA',
      ask: 180000,
      arv: 285000,
      spread: 22000,
      unread: true,
      flagged: false,
      photo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'
    },
    {
      id: '2',
      type: 'pain',
      status: 'saved',
      from: 'VaultForge AI',
      timestamp: '1 HR AGO',
      sellerName: 'Lisa Johnson',
      sellerPhone: '404-555-0143',
      sellerEmail: 'lisa@gmail.com',
      ps: 88,
      vs: 701,
      address: '456 Oak Ave Atlanta, GA',
      ask: 210000,
      arv: 295000,
      spread: 18000,
      unread: true,
      flagged: false,
      photo: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400'
    },
    {
      id: '3',
      type: 'deal',
      status: 'archived',
      from: 'VaultForge OS',
      timestamp: '3 HR AGO',
      sellerName: 'Robert Chen',
      sellerPhone: '404-555-0177',
      sellerEmail: 'rchen@gmail.com',
      ps: 88,
      vs: 910,
      address: '789 Pine Rd Atlanta, GA',
      ask: 295000,
      arv: 420000,
      spread: 45000,
      unread: false,
      flagged: false,
      photo: 'https://images.unsplash.com/photo-1518780664697-55e365304249?w=400'
    },
    {
      id: '4',
      type: 'pain',
      status: 'archived',
      from: 'VaultForge AI',
      timestamp: '5 HR AGO',
      sellerName: 'Mary Williams',
      sellerPhone: '404-555-0188',
      sellerEmail: 'mwilliams@gmail.com',
      ps: 76,
      vs: 685,
      address: '321 Elm St Atlanta, GA',
      ask: 165000,
      arv: 245000,
      spread: 19000,
      unread: false,
      flagged: true,
      photo: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400'
    },
    {
      id: '5',
      type: 'deal',
      status: 'saved',
      from: 'VaultForge OS',
      timestamp: '8 HR AGO',
      sellerName: 'David Brown',
      sellerPhone: '404-555-0199',
      sellerEmail: 'dbrown@gmail.com',
      ps: 82,
      vs: 775,
      address: '654 Maple Dr Atlanta, GA',
      ask: 225000,
      arv: 315000,
      spread: 28000,
      unread: true,
      flagged: false,
      photo: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400'
    },
    {
      id: '6',
      type: 'pain',
      status: 'saved',
      from: 'VaultForge AI',
      timestamp: '12 HR AGO',
      sellerName: 'Susan Davis',
      sellerPhone: '404-555-0111',
      sellerEmail: 'sdavis@gmail.com',
      ps: 91,
      vs: 830,
      address: '987 Cedar Ln Atlanta, GA',
      ask: 195000,
      arv: 290000,
      spread: 31000,
      unread: true,
      flagged: false,
      photo: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400'
    }
  ])

  const counts = {
    dealSaved: messages.filter(m => m.type === 'deal' && m.status === 'saved').length,
    dealArchived: messages.filter(m => m.type === 'deal' && m.status === 'archived
