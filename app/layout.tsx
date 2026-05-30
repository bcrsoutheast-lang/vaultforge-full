import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '6SIGMA Pain Room',
  description: 'Real Estate Pain Intake & Deal Flow System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black`}>
        <nav className="bg-zinc-900 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <a href="/pain-room" className="text-xl font-bold text-white">
                6SIGMA
              </a>
              <div className="flex gap-6 text-sm">
                <a href="/pain-room" className="text-zinc-400 hover:text-red-500 uppercase">Pain Room</a>
                <a href="/pain-intake" className="text-zinc-400 hover:text-red-500 uppercase">New Lead</a>
                <a href="/members" className="text-zinc-400 hover:text-red-500 uppercase">Members</a>
                <a href="/deal-room/new" className="text-zinc-400 hover:text-red-500 uppercase">Post Deal</a>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
