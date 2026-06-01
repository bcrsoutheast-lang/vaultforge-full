import Link from 'next/link'

const shippedFeatures = [
  {
    name: 'Deal DNA',
    status: 'LIVE',
    path: '/deals',
    description: 'Red flag badges for seller motivation. Auto-detects problems that kill deals.',
    howToUse: [
      '1. Go to /deals to see all listings',
      '2. Look for red badges: FLOOD_ZONE, LIEN, VACANT',
      '3. Hover badge for details',
      '4. Use filters to find distressed deals'
    ],
    color: 'red'
  },
  {
    name: 'DQI Score',
    status: 'LIVE',
    path: '/deals',
    description: 'Deal Quality Index 0-100. Green 85+ = INSTITUTIONAL. Red <50 = REJECT.',
    howToUse: [
      '1. DQI shows on every deal card',
      '2. Click deal to see breakdown',
      '3. DQI +10 for BPS triggers, +5 for photos',
      '4. Only show DQI 70+ to lenders'
    ],
    color: 'blue'
  },
  {
    name: 'Borrower Pain Score // BPS',
    status: 'LIVE',
    path: '/deals/new',
    description: 'Detects seller motivation. Pre-foreclosure +40, Tax Lien +25, Probate +30. Score 80+ = HIGH_MOTIVATION.',
    howToUse: [
      '1. Click "List New Deal"',
      '2. Fill BPS section: Pre-foreclosure date, back taxes, vacant days',
      '3. Submit → BPS auto-calculates',
      '4. BPS 80+ adds +20 to DQI and shows ⚠ HIGH_MOTIVATION badge'
    ],
    color: 'orange'
  },
  {
    name: 'Add Deal Form',
    status: 'LIVE',
    path: '/deals/new',
    description: 'List deals with BPS fields. Manual entry for Tier 1 BPS data.',
    howToUse: [
      '1. Click "List New Deal"',
      '2. Enter address, ask, ARV',
      '3. Check BPS boxes if seller mentioned foreclosure, divorce, etc',
      '4. Submit → Deal goes live with BPS + DQI'
    ],
    color: 'green'
  },
  {
    name: 'Pricing Page',
    status: 'LIVE',
    path: '/pricing',
    description: 'Stripe pricing tiers. $99 Pro Wholesaler, $299 Pro Lender, $2999 Fund.',
    howToUse: [
      '1. Send users here to upgrade',
      '2. Replace Stripe test links with live links',
      '3. Free users see 3 deals/mo limit',
      '4. Paywall triggers on "Message Owner" button'
    ],
    color: 'purple'
  }
]

export default function CommandCenterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAV BAR = EXIT ROUTE. ON EVERY PAGE */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">VaultForge</Link>
          <div className="flex gap-6">
            <Link href="/deals" className="text-gray-700 hover:text-blue-600">Deals</Link>
            <Link href="/deals/new" className="text-gray-700 hover:text-blue-600">List Deal</Link>
            <Link href="/pricing" className="text-gray-700 hover:text-blue-600">Pricing</Link>
            <Link href="/command-center" className="text-blue-600 font-semibold">Command Center</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Command Center</h1>
          <p className="mt-2 text-gray-600">Every feature we shipped. How it works. Where to use it.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shippedFeatures.map((feature) => (
            <div key={feature.name} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{feature.name}</h2>
                <span className={`text-xs font-bold px-2 py-1 rounded bg-${feature.color}-100 text-${feature.color}-800`}>
                  {feature.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
              
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">How To Use</h3>
                <ul className="space-y-1">
                  {feature.howToUse.map((step, i) => (
                    <li key={i} className="text-sm text-gray-700">{step}</li>
                  ))}
                </ul>
              </div>

              <Link 
                href={feature.path}
                className={`block w-full text-center px-4 py-2 rounded-md text-white font-semibold bg-${feature.color}-600 hover:bg-${feature.color}-700`}
              >
                Go to {feature.name}
              </Link>
            </div>
          ))}
        </div>

        {/* EXIT ROUTE FOOTER */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900">Stuck? Exit Routes:</h3>
          <p className="text-sm text-blue-800 mt-2">
            Every page has the nav bar at top. Click "VaultForge" logo = home. Click "Deals" = deal feed. 
            If you hit a 404, use browser back button. No dead ends.
          </p>
        </div>
      </div>
    </div>
  )
}
