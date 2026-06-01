import Link from 'next/link'

const FOUNDING_SEATS = {
  lenders: { total: 50, filled: 42, access: 1500, monthly: 299, desc: 'Fund DQI 90+ in 48hrs. SMS alerts. First money wins.' },
  buyers: { total: 200, filled: 167, access: 750, monthly: 199, desc: 'Vault Score priority. See pain deals before MLS.' },
  wholesalers: { total: 100, filled: 73, access: 500, monthly: 99, desc: 'List deals. BPS scores motivation for you.' },
  contractors: { total: 75, filled: 59, access: 1000, monthly: 249, desc: 'Bid DQI deals with scope attached. No chasing.' },
  title: { total: 25, filled: 11, access: 2500, monthly: 499, desc: 'Lien Stack Decoder feeds you clean closings.' },
  agents: { total: 100, filled: 73, access: 500, monthly: 149, desc: 'Get BPS 80+ sellers before they list MLS.' },
  appraisers: { total: 30, filled: 8, access: 1000, monthly: 199, desc: 'ACI feeds comps. Your ARV becomes data.' },
  inspectors: { total: 50, filled: 22, access: 500, monthly: 149, desc: 'Deal DNA flags CODE_VIOLATION. You get routed.' },
  pml: { total: 40, filled: 31, access: 2000, monthly: 399, desc: 'Fund gaps. See BPS + Vault Score. No flakes.' },
  architects: { total: 15, filled: 6, access: 1500, monthly: 299, desc: 'Value-add deals need plans. Get routed first.' },
}

export default function FoundersPage() {
  const totalSeats = Object.values(FOUNDING_SEATS).reduce((sum, r) => sum + r.total, 0)
  const totalFilled = Object.values(FOUNDING_SEATS).reduce((sum, r) => sum + r.filled, 0)

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black text-gray-900">FOUNDING MEMBERS</h1>
          <p className="text-xl text-gray-600 mt-4">685 Seats. 10 Roles. One Private Network.</p>
          <p className="text-lg text-gray-900 mt-6 font-semibold">
            We cap seats to protect deal flow. Once filled, waitlist only. Price doubles.
          </p>
          <div className="mt-8 inline-block bg-blue-600 text-white px-8 py-4 rounded-lg">
            <div className="text-3xl font-black">{totalFilled}/{totalSeats}</div>
            <div className="text-sm">Seats Filled</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.entries(FOUNDING_SEATS).map(([key, data]) => (
            <div key={key} className="bg-white border-2 border-gray-200 rounded-xl p-8">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold capitalize">{key}</h2>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{data.filled}/{data.total}</div>
                  <div className="text-xs text-gray-500">Filled</div>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6 h-16">{data.desc}</p>
              
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Access Fee</span>
                  <span className="font-black text-lg">${data.access.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-6">
                  <span className="text-gray-600">Monthly</span>
                  <span className="font-black text-lg">${data.monthly}/mo</span>
                </div>
                
                <button 
                  disabled={data.filled >= data.total}
                  className="w-full bg-gray-900 text-white py-3 rounded-md font-bold hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {data.filled >= data.total ? 'WAITLIST' : 'Apply Now'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-gray-900 text-white rounded-xl p-12 text-center">
          <h3 className="text-3xl font-black mb-4">WHY ACCESS FEES?</h3>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Filters browsers. Funds the network. Proves you’re serious. 
            One DQI 90+ deal pays your access fee 10x. 
            We don’t want 1,000 members. We want 685 killers.
          </p>
        </div>
      </div>
    </div>
  )
}
