import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VaultForge",
  description: "Private real estate deal routing network",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#071326" }}>
        {children}
      </body>
    </html>
  );
}
