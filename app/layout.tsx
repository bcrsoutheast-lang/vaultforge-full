import './globals.css'
import Link from 'next/link'
import { ReactNode } from 'react'

export const metadata = {
  title: 'VaultForge',
  description: 'Deal DNA + Borrower Pain Score for Institutional Real Estate',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {/* GLOBAL NAV = EXIT ROUTE ON EVERY PAGE */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              
              {/* LEFT: LOGO = HOME EXIT */}
              <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600">
                VaultForge
              </Link>

              {/* RIGHT: MAIN EXITS */}
              <div className="flex items-center gap-4 sm:gap-6">
                <Link 
                  href="/deals" 
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Deals
                </Link>
                <Link 
                  href="/deals/new" 
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  List Deal
                </Link>
                <Link 
                  href="/command-center" 
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Command
                </Link>
                <Link 
                  href="/pricing" 
                  className="text-sm font-medium bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700"
                >
                  Pricing
                </Link>
              </div>

            </div>
          </div>
        </nav>

        {/* PAGE CONTENT RENDERS HERE */}
        <main>{children}</main>

        {/* FOOTER EXIT = BACK TO HOME */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-500">
                © 2026 VaultForge. Stuck? Click logo to go home.
              </p>
              <div className="flex gap-6">
                <Link href="/deals" className="text-sm text-gray-500 hover:text-gray-900">Deals</Link>
                <Link href="/command-center" className="text-sm text-gray-500 hover:text-gray-900">Help</Link>
                <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">Home</Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
