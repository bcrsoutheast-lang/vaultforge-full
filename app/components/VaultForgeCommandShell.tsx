import Link from "next/link";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ShellProps = {
  children?: React.ReactNode;
  active?: string;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
};

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(245, 197, 91, 0.14), transparent 28%), radial-gradient(circle at top right, rgba(239, 68, 68, 0.14), transparent 28%), linear-gradient(180deg, #02040a 0%, #071018 50%, #02040a 100%)",
  color: "#f8fafc",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const layout: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "260px minmax(0, 1fr)",
  minHeight: "100vh",
};

const rail: React.CSSProperties = {
  borderRight: "1px solid rgba(245, 197, 91, 0.18)",
  background:
    "linear-gradient(180deg, rgba(2, 6, 23, 0.98), rgba(5, 10, 18, 0.96))",
  padding: "20px 14px",
  position: "sticky",
  top: 0,
  height: "100vh",
  overflow: "auto",
};

const logoBox: React.CSSProperties = {
  border: "1px solid rgba(245, 197, 91, 0.26)",
  background: "rgba(245, 197, 91, 0.06)",
  borderRadius: 18,
  padding: 16,
  marginBottom: 16,
};

const logo: React.CSSProperties = {
  fontSize: 25,
  fontWeight: 950,
  letterSpacing: "-0.04em",
  color: "#f5c55b",
  margin: 0,
};

const micro: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: ".12em",
  fontWeight: 900,
  marginTop: 5,
};

const userBox: React.CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  background: "rgba(15, 23, 42, 0.72)",
  borderRadius: 16,
  padding: 14,
  marginBottom: 14,
};

const navLinkBase: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  color: "#e5e7eb",
  textDecoration: "none",
  padding: "12px 12px",
  borderRadius: 13,
  marginBottom: 7,
  border: "1px solid transparent",
  fontSize: 13,
  fontWeight: 900,
};

const main: React.CSSProperties = {
  minWidth: 0,
  padding: "16px 18px 80px",
};

const ticker: React.CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.16)",
  background: "rgba(2, 6, 23, 0.88)",
  borderRadius: 18,
  padding: "11px 14px",
  marginBottom: 14,
  overflow: "hidden",
  whiteSpace: "nowrap",
  color: "#e5e7eb",
  fontSize: 12,
  fontWeight: 800,
};

const dangerBanner: React.CSSProperties = {
  border: "1px solid rgba(239, 68, 68, 0.34)",
  background:
    "linear-gradient(90deg, rgba(127, 29, 29, 0.62), rgba(20, 8, 8, 0.94))",
  color: "#fee2e2",
  borderRadius: 18,
  padding: "14px 16px",
  marginBottom: 14,
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(245, 197, 91, 0.22)",
  background:
    "linear-gradient(145deg, rgba(16, 24, 36, 0.9), rgba(2, 6, 23, 0.96))",
  borderRadius: 24,
  padding: "22px",
  marginBottom: 16,
};

const eyebrowStyle: React.CSSProperties = {
  color: "#f5c55b",
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: ".16em",
  textTransform: "uppercase",
  marginBottom: 8,
};

const h1: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(36px, 6vw, 68px)",
  lineHeight: 0.95,
  letterSpacing: "-0.07em",
  fontWeight: 950,
};

const sub: React.CSSProperties = {
  color: "#cbd5e1",
  fontSize: 18,
  lineHeight: 1.45,
  maxWidth: 820,
  margin: "12px 0 0",
};

const mobileWrap: React.CSSProperties = {
  display: "block",
};

const navItems = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", tag: "HOME" },
  { key: "opportunity", label: "Opportunity", href: "/opportunity-rooms", tag: "ROOMS" },
  { key: "projects", label: "Projects", href: "/projects", tag: "DEALS" },
  { key: "pain", label: "Pain Rooms", href: "/pressure-rooms", tag: "PAIN" },
  { key: "pain-feed", label: "Pain Feed", href: "/pain-feed", tag: "SIGNALS" },
  { key: "messages", label: "Messages", href: "/message-command", tag: "MSG" },
  { key: "alerts", label: "Alerts", href: "/alerts", tag: "URGENT" },
  { key: "routing", label: "Routing", href: "/routing-inbox", tag: "EXEC" },
  { key: "intelligence", label: "Intelligence", href: "/intelligence", tag: "AI" },
  { key: "members", label: "Members", href: "/members", tag: "NET" },
  { key: "profile", label: "Profile", href: "/profile", tag: "ID" },
];

export default async function VaultForgeCommandShell({
  children,
  active = "dashboard",
  title = "VaultForge Command Center",
  subtitle = "Opportunity rooms and Pain rooms are the operating lanes. Alerts, routing, intelligence, and messages run as live background layers.",
  eyebrow = "VAULTFORGE AI COMMAND CENTER",
}: ShellProps) {
  const cookieStore = await cookies();
  const email =
    cleanEmail(cookieStore.get("vf_email")?.value) ||
    cleanEmail(cookieStore.get("vf_member_email")?.value) ||
    "member@vaultforge.local";

  return (
    <main style={shell}>
      <div style={layout}>
        <aside style={rail}>
          <div style={logoBox}>
            <h1 style={logo}>VAULTFORGE</h1>
            <div style={micro}>AI Command Center</div>
          </div>

          <div style={userBox}>
            <div style={{ fontWeight: 950, marginBottom: 4 }}>{email}</div>
            <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 950 }}>
              AI ROUTING ACTIVE
            </div>
          </div>

          <nav>
            {navItems.map((item) => {
              const selected = active === item.key || active === item.href.replace("/", "");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    ...navLinkBase,
                    borderColor: selected
                      ? "rgba(245, 197, 91, 0.38)"
                      : "transparent",
                    background: selected
                      ? "linear-gradient(90deg, rgba(245,197,91,.18), rgba(245,197,91,.06))"
                      : "transparent",
                    color: selected ? "#fef3c7" : "#e5e7eb",
                  }}
                >
                  <span>{item.label}</span>
                  <span
                    style={{
                      color: selected ? "#f5c55b" : "#94a3b8",
                      fontSize: 10,
                      letterSpacing: ".11em",
                    }}
                  >
                    {item.tag}
                  </span>
                </Link>
              );
            })}

            <Link href="/logout" style={{ ...navLinkBase, color: "#fecaca" }}>
              <span>Logout</span>
              <span style={{ color: "#fca5a5", fontSize: 10 }}>EXIT</span>
            </Link>
          </nav>
        </aside>

        <section style={main}>
          <div style={mobileWrap}>
            <div style={ticker}>
              10Y UST ▲ 4.32% · SOFR 5.33% · DISTRESS INDEX ▲ 78.4 · CAPITAL DEMAND HIGH · OPERATOR SUPPLY LOW · LIVE
            </div>

            <div style={dangerBanner}>
              <strong>🔥 HIGH DISTRESS DETECTED</strong>
              <span>Foreclosure pressure rising across GA, FL, TX, TN.</span>
              <Link
                href="/intelligence"
                style={{
                  color: "#fef3c7",
                  textDecoration: "none",
                  fontWeight: 950,
                  border: "1px solid rgba(245,197,91,.3)",
                  borderRadius: 12,
                  padding: "8px 10px",
                }}
              >
                View Intelligence
              </Link>
            </div>

            <section style={hero}>
              <div style={eyebrowStyle}>{eyebrow}</div>
              <h1 style={h1}>{title}</h1>
              <p style={sub}>{subtitle}</p>
            </section>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}