import './globals.css'

export const metadata = {
  title: 'VaultForge',
  description: 'Private routing for off-market deals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
