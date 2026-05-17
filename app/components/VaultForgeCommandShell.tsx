import Link from "next/link";

export default function VaultForgeCommandShell({
  children,
  title = "VaultForge Command Center",
  subtitle = "Private deal flow · AI routing · execution intelligence",
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020405",
        color: "#f7f4e8",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <header
        style={{
          borderBottom: "1px solid rgba(229,184,83,.22)",
          background:
            "linear-gradient(90deg, rgba(0,0,0,.92), rgba(9,13,13,.96))",
          padding: "14px 18px",
          display: "flex",
          justifyContent: "space-between",
          gap: 14,
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <Link href="/dashboard" style={{ color: "inherit", textDecoration: "none" }}>
          <b style={{ color: "#f2c766", letterSpacing: ".14em" }}>VAULTFORGE</b>
          <div style={{ color: "#aeb8b9", fontSize: 12 }}>{subtitle}</div>
        </Link>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/projects" style={pill}>Opportunities</Link>
          <Link href="/pressure-rooms" style={pill}>Pain Rooms</Link>
          <Link href="/message-command" style={pill}>Messages</Link>
          <Link href="/logout" style={{ ...pill, borderColor: "rgba(255,77,61,.45)", color: "#ffb5ad" }}>Logout</Link>
        </div>
      </header>
      <section style={{ padding: 18 }}>
        <div style={{ maxWidth: 1440, margin: "0 auto" }}>{children}</div>
      </section>
    </main>
  );
}

const pill: React.CSSProperties = {
  color: "#f7f4e8",
  textDecoration: "none",
  border: "1px solid rgba(229,184,83,.25)",
  borderRadius: 999,
  padding: "9px 12px",
  fontSize: 13,
  fontWeight: 800,
  background: "rgba(232,184,79,.06)",
};
