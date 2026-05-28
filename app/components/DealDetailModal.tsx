'use client'

import { useState } from 'react'
import MakeOfferModal from './MakeOfferModal'
import MessageOwner from './MessageOwner'

type Deal = {
  id: number
  title: string | null
  address: string
  city: string
  state: string
  zipcode: string | null
  asking_price: number
  arv: number
  beds: number | null
  baths: number | null
  sqft: number | null
  description: string | null
  photo_url: string | null
  user_email: string
  status: string
  created_at: string
  owner_phone?: string | null
  owner_name?: string | null
  repairs?: number | null
  property_type?: string | null
}

type CurrentUser = {
  email: string
  name?: string | null
  avatar?: string | null
}

export default function DealDetailModal({ 
  deal, 
  currentUser, // ✅ ADDED THIS PROP
  isSaved,
  onClose,
  onSave
}: { 
  deal: Deal | null
  currentUser?: CurrentUser | null // ✅ ADDED THIS TYPE
  isSaved?: boolean
  onClose: () => void
  onSave?: () => void
}) {
  const [showMakeOffer, setShowMakeOffer] = useState(false)

  if (!deal) return null

  const profit = deal.arv - deal.asking_price - (deal.repairs || 0)
  const mao = deal.arv * 0.7 - (deal.repairs || 0)

  return (
    <>
      <div className="fixed inset-0 bg-black/90 flex items-start justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-zinc-950 rounded-lg w-full max-w-2xl border border-zinc-800 my-8">
          
          {/* Image */}
          <div className="relative">
            <img 
              src={deal.photo_url || '/placeholder-house.jpg'} 
              alt={deal.address}
              className="w-full h-64 object-cover rounded-t-lg"
            />
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/80"
            >
              ✕
            </button>
          </div>

          <div className="p-6">
            {/* Header */}
            <h2 className="text-2xl font-bold text-yellow-400 mb-1">
              {deal.city}, {deal.state} {deal.zipcode}
            </h2>
            <p className="text-zinc-400 mb-4">
              {deal.beds} Beds • {deal.baths} Baths • {deal.sqft?.toLocaleString()} Sqft
            </p>

            {/* Price Boxes */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
                <div className="text-xs text-zinc-500">ASKING</div>
                <div className="text-lg font-bold text-blue-400">
                  ${deal.asking_price?.toLocaleString()}
                </div>
              </div>
              <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
                <div className="text-xs text-zinc-500">ARV</div>
                <div className="text-lg font-bold text-green-400">
                  ${deal.arv?.toLocaleString()}
                </div>
              </div>
              <div className="bg-zinc-900 p-3 rounded border border-zinc-800">
                <div className="text-xs text-zinc-500">REPAIRS</div>
                <div className="text-lg font-bold text-yellow-400">
                  ${(deal.repairs || 0)?.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Smart AI Analyzer */}
            <div className="bg-zinc-900 border border-red-900/50 rounded p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-xs text-zinc-500">SMART AI ANALYZER</div>
                <div className={`text-xs px-2 py-1 rounded ${profit > 0 ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                  {profit > 0 ? 'BUY' : 'PASS'}
                </div>
              </div>
              <div className={`text-xl font-bold mb-1 ${profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                Est. Profit: ${profit?.toLocaleString()}
              </div>
              <div className="text-sm text-zinc-400">
                {profit > 0 
                  ? `Good deal. Potential profit of $${profit.toLocaleString()}.` 
                  : `Overpriced. You'd lose $${Math.abs(profit).toLocaleString()}. Walk away.`}
              </div>
              <div className="text-sm text-zinc-500 mt-1">
                Max Allowable Offer: ${mao?.toLocaleString()}
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-zinc-900 p-4 rounded mb-4 border border-zinc-800">
              <div className="text-xs text-zinc-500 mb-2">PROPERTY DETAILS</div>
              <div className="text-sm text-zinc-300 mb-2">{deal.description || 'Motivated'}</div>
              <div className="text-sm text-zinc-400">
                Location: {deal.address || deal.city}, {deal.state} {deal.zipcode}
              </div>
              {deal.property_type && (
                <div className="text-sm text-zinc-400">Type: {deal.property_type}</div>
              )}
            </div>

            {/* Owner Contact */}
            <div className="bg-zinc-900 p-4 rounded mb-4 border border-zinc-800">
              <div className="text-xs text-zinc-500 mb-2">OWNER CONTACT</div>
              <div className="text-sm text-zinc-300">{deal.user_email}</div>
              {deal.owner_phone && (
                <div className="text-sm text-zinc-300">{deal.owner_phone}</div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-2">
              <button 
                onClick={() => setShowMakeOffer(true)}
                className="flex-1 bg-yellow-400 text-black font-bold py-3 rounded hover:bg-yellow-300"
              >
                MAKE OFFER
              </button>
              <button 
                onClick={onClose}
                className="flex-1 bg-zinc-700 py-3 rounded hover:bg-zinc-600"
              >
                EXIT
              </button>
            </div>

            {/* Message Owner Button */} 
            <div className="mb-2">
              <MessageOwner 
                deal={deal} 
                currentUser={currentUser || { email: 'guest@vaultforge.app', name: 'Guest' }} 
              />
            </div>

            {/* Other Actions */}
            <div className="flex gap-2">
              <button 
                onClick={onSave}
                className="flex-1 bg-zinc-800 py-2 rounded hover:bg-zinc-700 text-sm"
              >
                {isSaved ? 'SAVED' : 'SAVE'}
              </button>
              <button className="flex-1 bg-zinc-800 py-2 rounded hover:bg-zinc-700 text-sm">ARCHIVE</button>
              <button className="flex-1 bg-red-900/50 text-red-400 py-2 rounded hover:bg-red-900 text-sm">DELETE</button>
            </div>

            <div className="text-xs text-zinc-600 mt-4 text-center">
              Posted by: {deal.user_email} • {new Date(deal.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {showMakeOffer && (
        <MakeOfferModal deal={deal} onClose={() => setShowMakeOffer(false)} />
      )}
    </>
  )
}
