import Link from 'next/link'

const tiers = [
  {
    name: 'Free',
    price: '$0',
    description: 'Test the waters.',
    features: [
      'View 3 deals/month',
      'DQI Score only',
      'No BPS data',
      'No contact seller',
    ],
    cta: 'Current Plan',
    href: '/deals',
    featured: false,
  },
  {
    name: 'Pro Wholesaler',
    price: '$99',
    description: 'List deals. Find motivation.',
    features: [
      'List 5 deals/month',
      'Full Deal DNA',
      'Manual BPS Scan',
      'DQI + BPS bonuses',
      'Message buyers',
    ],
    cta: 'Upgrade to Pro',
    href: 'https://buy.stripe.com/test_pro_wholesaler',
    featured: true,
  },
  {
    name: 'Pro Lender',
    price: '$299',
    description: 'First shot at institutional deals.',
    features: [
      'See all DQI 70+ deals',
      'BPS 60+ filter',
      'SMS Lender Alerts',
      'Vault Score on buyers',
      'Priority support',
    ],
    cta: 'Upgrade to Lender',
    href: 'https://buy.stripe.com/test_pro_lender',
    featured: false,
  },
  {
    name: 'Fund',
    price: '$2,999',
    description: 'Command center for capital.',
    features: [
      'Unlimited deal feed',
      'Portfolio dashboard',
      'VaultForge API access',
      'ACI Confidence Index',
      'Dedicated rep',
    ],
    cta: 'Contact Sales',
    href: 'mailto:sales@vaultforge.com',
    featured: false,
  },
]

export default function PricingPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Pricing That Pays For Itself</h1>
        <p className="mt-4 text-lg text-gray-600">One HIGH_MOTIVATION deal covers 10 years of fees.</p>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {tiers.map((tier) => (
          <div key={tier.name} className={`rounded-lg border p-8 ${tier.featured ? 'border-blue-600 ring-2 ring-blue-600' : 'border-gray-200'}`}>
            <h2 className="text-lg font-semibold">{tier.name}</h2>
            <p className="mt-4 text-3xl font-bold">{tier.price}<span className="text-base font-medium text-gray-500">/mo</span></p>
            <p className="mt-2 text-sm text-gray-600">{tier.description}</p>
            
            <ul className="mt-8 space-y-3">
              {tier.features.map((feature) => (
                <li key={feature} className="flex text-sm">
                  <span className="text-blue-600 mr-2">✓</span>{feature}
                </li>
              ))}
            </ul>

            <Link
              href={tier.href}
              className={`mt-8 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold ${tier.featured ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
