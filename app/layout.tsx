export default function RootLayout({ children }) {
  return (
    <html>
      <body style={{ background:"#071326", color:"white", fontFamily:"Arial" }}>
        {children}
      </body>
    </html>
  );
}
