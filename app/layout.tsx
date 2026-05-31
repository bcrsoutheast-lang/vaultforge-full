export const metadata = {
  title: 'VaultForge - Veteran Pride Deals',
  description: 'We Fight Dirt. We Fight Bad Deals.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ 
        margin: 0, 
        backgroundColor: '#000', 
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {children}
      </body>
    </html>
  )
}
