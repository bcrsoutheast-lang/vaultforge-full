export const metadata = {
  title: 'VaultForge - Private Deal Room',
  description: 'Members-only real estate deal intelligence. Residential, commercial, and land.',
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
