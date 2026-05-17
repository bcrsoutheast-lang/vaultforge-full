import Link from "next/link";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background: "#020405",
  color: "#f7f4e8",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const page: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "260px minmax(0, 1fr)",
  minHeight: "100vh",
};

const sidebar: React.CSSProperties = {
  position: "sticky",
  top: 0,
  height: "100vh",
  borderRight: "1px solid rgba(229, 184, 83, 0.24)",
  background:
    "linear-gradient(180deg, rgba(10,15,14,0.98), rgba(2,4,5,0.98)), radial-gradient(circle at top, rgba(229,184,83,.12), transparent 34%)",
  padding: 20,
  overflowY: "auto",
};

const main: React.CSSProperties = {
  minWidth: 0,
  padding: "0 18px 54px",
};

const ticker: React.CSSProperties = {
  display: "flex",
  gap: 22,
  alignItems: "center",
  overflowX: "auto",
  whiteSpace: "nowrap",
  borderBottom: "1px solid rgba(255,255,255,.08)",
  background: "rgba(0,0,0,.78)",
  padding: "12px 14px",
  fontSize: 13,
  letterSpacing: ".03em",
};

const card: React.CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(14,18,18,.96), rgba(5,8,10,.96))",
  border: "1px solid rgba(229,184,83,.22)",
  borderRadius: 18,
  boxShadow: "0 18px 60px rgba(0,0,0,.45)",
};

const panel: React.CSSProperties = {
  ...card,
  padding: 18,
};

const navLink: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "28px 1fr",
  gap: 10,
  alignItems: "center",
  textDecoration: "none",
  color: "#e8e2cf",
  padding: "12px 12px",
  borderRadius: 12,
  border: "1px solid transparent",
  fontSize: 13,
};

function getInitials(email: string) {
  const base = email.split("@")[0] || "VF";
  return base.slice(0, 2).toUpperCase();
}

function MiniSpark({ tone = "green" }: { tone?: "green" | "red" | "blue" | "purple" | "gold" }) {
  const color =
    tone === "red"
      ? "#ff3b30"
      : tone === "blue"
        ? "#21a7ff"
        : tone === "purple"
          ? "#a855f7"
          : tone === "gold"
            ? "#e8b84f"
            : "#31e981";

  return (
    <svg viewBox="0 0 120 34" width="100%" height="34" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.4"
        points="0,27 8,22 16,25 24,15 32,20 40,13 48,18 56,10 64,12 72,7 80,15 88,9 96,13 104,5 112,10 120,2"
      />
    </svg>
  );
}

function StatCard({ title, value, delta, tone }: { title: string; value: string; delta: string; tone?: "green" | "red" | "blue" | "purple" | "gold" }) {
  return (
    <div style={{ ...panel, minHeight: 132 }}>
      <div style={{ color: "#aeb8b9", fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 12 }}>
        <div style={{ fontSize: 32, fontWeight: 900 }}>{value}</div>
        <div style={{ color: tone === "red" ? "#ff4d3d" : "#31e981", fontSize: 13, fontWeight: 800 }}>{delta}</div>
      </div>
      <div style={{ marginTop: 10 }}><MiniSpark tone={tone} /></div>
    </div>
  );
}

function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <h2 style={{ margin: 0, color: "#f2c766", fontSize: 16, letterSpacing: ".06em", textTransform: "uppercase" }}>{title}</h2>
      {action ? <span style={{ border: "1px solid rgba(255,255,255,.14)", borderRadius: 10, padding: "7px 10px", color: "#d9d4c6", fontSize: 12 }}>{action}</span> : null}
    </div>
  );
}

function PressureMap() {
  const states = [
    ["Florida", "92.1"],
    ["Georgia", "88.3"],
    ["Texas", "81.7"],
    ["North Carolina", "78.8"],
    ["Tennessee", "74.2"],
  ];

  return (
    <div style={{ ...panel }}>
      <SectionTitle title="Market Intelligence Overview" />
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: 16, minHeight: 252, background: "radial-gradient(circle at 35% 40%, rgba(255,61,45,.35), transparent 34%), radial-gradient(circle at 70% 52%, rgba(232,184,79,.25), transparent 28%), #071012" }}>
          <div style={{ color: "#c9d0d0", fontSize: 12, textTransform: "uppercase", marginBottom: 18 }}>State Pressure Heat Map</div>
          <div style={{ height: 150, borderRadius: 18, background: "linear-gradient(135deg, rgba(255,210,72,.95), rgba(235,70,35,.9) 38%, rgba(120,8,12,.95) 75%, rgba(32,2,4,.95))", clipPath: "polygon(3% 42%, 16% 28%, 28% 37%, 40% 25%, 58% 32%, 74% 22%, 92% 34%, 86% 58%, 66% 68%, 42% 78%, 22% 68%, 8% 57%)", boxShadow: "0 0 55px rgba(255,70,25,.22)" }} />
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 15, fontSize: 11, color: "#b7bebf" }}>
            <span>Low</span><span style={{ width: 32, height: 8, background: "#2f80ed" }} /><span style={{ width: 32, height: 8, background: "#31e981" }} /><span style={{ width: 32, height: 8, background: "#ffd43b" }} /><span style={{ width: 32, height: 8, background: "#ff8a00" }} /><span style={{ width: 32, height: 8, background: "#ff3030" }} /><span>Extreme</span>
          </div>
        </div>
        <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: 16 }}>
          <div style={{ color: "#c9d0d0", fontSize: 12, textTransform: "uppercase", marginBottom: 14 }}>Top Pressure States</div>
          {states.map(([name, score], index) => (
            <div key={name} style={{ display: "grid", gridTemplateColumns: "24px 1fr 80px 52px", alignItems: "center", gap: 9, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
              <b>{index + 1}</b><span>{name}</span><span style={{ height: 5, borderRadius: 999, background: `linear-gradient(90deg,#ff3434 ${Number(score)}%, rgba(255,255,255,.08) 0)` }} /><b style={{ color: "#ff4d3d" }}>{score}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OpportunityList() {
  const rows = [
    ["Atlanta Multifamily Portfolio", "Atlanta, GA | 96 Units", "$12.6M", "HOT", "92"],
    ["Dallas Industrial Portfolio", "Dallas, TX | 512K SF", "$38.7M", "NEW", "89"],
    ["Tampa Retail Center", "Tampa, FL | 84K SF", "$18.2M", "HOT", "87"],
    ["Nashville Development Site", "Nashville, TN | 8.4 Acres", "$12.7M", "NEW", "84"],
  ];
  return (
    <div style={panel}>
      <SectionTitle title="Top Opportunity Rooms" action="VIEW ALL" />
      {rows.map((row) => (
        <Link key={row[0]} href="/projects" style={{ display: "grid", gridTemplateColumns: "62px 1fr 48px", gap: 12, alignItems: "center", textDecoration: "none", color: "inherit", border: "1px solid rgba(255,255,255,.08)", borderRadius: 13, padding: 10, marginBottom: 10, background: "rgba(232,184,79,.045)" }}>
          <div style={{ height: 48, borderRadius: 10, background: "linear-gradient(135deg,#5f86a6,#d6b674)", border: "1px solid rgba(255,255,255,.18)" }} />
          <div><b>{row[0]}</b><div style={{ color: "#aeb8b9", fontSize: 12, marginTop: 3 }}>{row[1]}</div><div style={{ color: "#31e981", fontWeight: 800, marginTop: 3 }}>{row[2]}</div></div>
          <div style={{ textAlign: "right" }}><span style={{ color: row[3] === "HOT" ? "#ff4d3d" : "#21a7ff", fontSize: 11, fontWeight: 900 }}>{row[3]}</span><div style={{ color: "#31e981", fontSize: 24, fontWeight: 900 }}>{row[4]}</div></div>
        </Link>
      ))}
    </div>
  );
}

function PainList() {
  const rows = [
    ["Distressed Seller - Motivated", "Atlanta, GA | Close in 14 Days", "CRITICAL", "2h"],
    ["Foreclosure - Auction Next Week", "Orlando, FL | Auction 6/14", "CRITICAL", "3h"],
    ["Operator Needed - 220 Units", "Houston, TX | Immediate", "HIGH", "5h"],
    ["Construction Halted", "Tampa, FL | Permit Issue", "HIGH", "6h"],
  ];
  return (
    <div style={{ ...panel, borderColor: "rgba(255,64,45,.34)", background: "linear-gradient(180deg, rgba(30,8,8,.88), rgba(7,7,8,.96))" }}>
      <SectionTitle title="Urgent Pain Rooms" action="VIEW ALL" />
      {rows.map((row) => (
        <Link key={row[0]} href="/pressure-rooms" style={{ display: "grid", gridTemplateColumns: "44px 1fr 70px", gap: 12, alignItems: "center", textDecoration: "none", color: "inherit", border: "1px solid rgba(255,64,45,.18)", borderRadius: 13, padding: 11, marginBottom: 10, background: "rgba(255,64,45,.07)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "radial-gradient(circle,#ffb0a0,#802018)", boxShadow: "0 0 22px rgba(255,64,45,.28)" }} />
          <div><b>{row[0]}</b><div style={{ color: "#b9bfc0", fontSize: 12, marginTop: 4 }}>{row[1]}</div></div>
          <div style={{ textAlign: "right", color: "#ff4d3d", fontSize: 12, fontWeight: 900 }}>{row[2]}<div style={{ marginTop: 6 }}>{row[3]}</div></div>
        </Link>
      ))}
    </div>
  );
}

function RightRail() {
  const alerts = [
    ["2m", "Foreclosure Spike", "Hillsborough County, FL", "CRITICAL"],
    ["4m", "Price Drop Surge", "Broward County, FL", "HIGH"],
    ["7m", "Distressed Seller Added", "Orlando, FL", "HIGH"],
    ["9m", "New Off-Market Lead", "Austin, TX", "MEDIUM"],
  ];
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={panel}>
        <SectionTitle title="Live Alert Feed" action="VIEW ALL" />
        {alerts.map((a) => (
          <div key={a[1]} style={{ display: "grid", gridTemplateColumns: "36px 1fr 70px", gap: 10, alignItems: "center", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: 11, marginBottom: 9 }}>
            <span style={{ color: "#ff4d3d", fontSize: 12 }}>{a[0]}</span><span><b>{a[1]}</b><div style={{ color: "#aeb8b9", fontSize: 12 }}>{a[2]}</div></span><b style={{ color: a[3] === "CRITICAL" ? "#ff3b30" : "#f2c766", fontSize: 11, textAlign: "right" }}>{a[3]}</b>
          </div>
        ))}
      </div>
      <div style={panel}>
        <SectionTitle title="County Heat Map" action="VIEW MAP" />
        <div style={{ height: 170, borderRadius: 15, background: "radial-gradient(circle at 45% 42%, #ffe066, transparent 15%), radial-gradient(circle at 54% 52%, #ff3b30, transparent 30%), radial-gradient(circle at 35% 68%, #771010, transparent 33%), #080c0d", border: "1px solid rgba(255,255,255,.1)" }} />
      </div>
      <div style={panel}>
        <SectionTitle title="Command Shortcuts" />
        {[["+ New Opportunity", "/submit"], ["+ New Pain Room", "/pain"], ["Messages", "/message-command"], ["Find Members", "/members"], ["AI Search", "/intelligence"]].map(([label, href]) => (
          <Link key={label} href={href} style={{ display: "block", color: "#f7f4e8", textDecoration: "none", border: "1px solid rgba(229,184,83,.22)", borderRadius: 12, padding: "13px 14px", marginBottom: 10, background: "rgba(232,184,79,.045)", fontWeight: 800 }}>{label}</Link>
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const email = String(cookieStore.get("vf_email")?.value || "dm2107137@gmail.com").trim();

  const nav = [
    ["⌂", "Dashboard", "HOME", "/dashboard"],
    ["▣", "Opportunity", "DEALS", "/projects"],
    ["◇", "Pain Rooms", "INTAKE", "/pressure-rooms"],
    ["≋", "Pain Feed", "SIGNALS", "/pain-feed"],
    ["✉", "Messages", "MSG", "/message-command"],
    ["⟲", "Routing", "COMMAND", "/routing-inbox"],
    ["▤", "Intelligence", "MARKETS", "/intelligence"],
    ["⚠", "Alerts", "URGENT", "/alerts"],
    ["◎", "Members", "NETWORK", "/members"],
    ["→", "Logout", "SIGN OUT", "/logout"],
  ];

  return (
    <main style={shell}>
      <div style={page}>
        <aside style={sidebar}>
          <Link href="/dashboard" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
              <div style={{ width: 72, height: 72, borderRadius: 18, background: "linear-gradient(135deg,#f2c766,#141414 42%,#e8b84f)", color: "#020405", display: "grid", placeItems: "center", fontWeight: 1000, fontSize: 28, border: "1px solid rgba(255,255,255,.18)" }}>VF</div>
              <div><div style={{ color: "#f2c766", fontWeight: 1000, fontSize: 20, letterSpacing: ".04em" }}>VAULTFORGE</div><div style={{ color: "#9ea9aa", fontSize: 11, letterSpacing: ".13em" }}>AI COMMAND CENTER</div></div>
            </div>
          </Link>

          <div style={{ ...card, padding: 14, marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,.13)", display: "grid", placeItems: "center", fontWeight: 900 }}>{getInitials(email)}</div>
              <div style={{ minWidth: 0 }}><b style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</b><span style={{ color: "#31e981", fontSize: 12, fontWeight: 900 }}>AI ROUTING ACTIVE</span></div>
            </div>
          </div>

          <nav style={{ display: "grid", gap: 5 }}>
            {nav.map(([icon, label, sub, href], index) => (
              <Link key={label} href={href} style={{ ...navLink, background: index === 0 ? "rgba(232,184,79,.15)" : "transparent", borderColor: index === 0 ? "rgba(232,184,79,.38)" : "transparent" }}>
                <span style={{ color: "#f2c766", fontSize: 18 }}>{icon}</span><span><b>{label}</b><small style={{ display: "block", color: "#9aa3a4", fontSize: 10, marginTop: 2 }}>{sub}</small></span>
              </Link>
            ))}
          </nav>
        </aside>

        <section style={main}>
          <div style={ticker}>
            {[["10Y UST", "4.32%", "▲ 0.03"], ["SOFR", "5.33%", "▼ 0.01"], ["CPI YoY", "3.4%", "▲ 0.1"], ["CAP RATE", "6.21%", "▲ 0.02"], ["DISTRESS INDEX", "78.4", "▲ 6.3"]].map((item) => (
              <span key={item[0]}><b>{item[0]}</b> <span style={{ color: "#31e981" }}>{item[1]}</span> <span style={{ color: item[2].includes("▼") ? "#ff4d3d" : "#31e981" }}>{item[2]}</span></span>
            ))}
            <span style={{ marginLeft: "auto", color: "#31e981", fontWeight: 900 }}>● LIVE</span>
          </div>

          <div style={{ paddingTop: 18 }}>
            <div style={{ ...card, padding: "18px 22px", marginBottom: 16, borderColor: "rgba(255,64,45,.35)", background: "linear-gradient(90deg, rgba(98,12,10,.86), rgba(25,7,7,.94))", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={{ fontSize: 26 }}>🔥</span><b style={{ color: "#ff6b5c", fontSize: 21, letterSpacing: ".04em" }}>HIGH DISTRESS DETECTED</b></div>
              <span style={{ color: "#f0ece0" }}>Foreclosure filings up 38% in FL, GA, & TX</span>
              <Link href="/intelligence" style={{ color: "#f7f4e8", border: "1px solid rgba(255,120,100,.45)", borderRadius: 10, padding: "10px 14px", textDecoration: "none", fontWeight: 900 }}>VIEW INTELLIGENCE</Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 12, marginBottom: 16 }}>
              <StatCard title="Active Opportunities" value="128" delta="▲ 12" />
              <StatCard title="Active Pain Rooms" value="93" delta="▲ 7" tone="red" />
              <StatCard title="Execution Deals" value="41" delta="▲ 5" tone="blue" />
              <StatCard title="Capital Deploying" value="$482.6M" delta="▲ $34.7M" />
              <StatCard title="Unread Messages" value="27" delta="▲ 9" tone="purple" />
              <div style={{ ...panel, textAlign: "center" }}><div style={{ color: "#aeb8b9", fontSize: 12, textTransform: "uppercase" }}>Market Pressure</div><div style={{ color: "#ff4d3d", fontSize: 12, fontWeight: 1000, marginTop: 6 }}>VERY HIGH</div><div style={{ width: 112, height: 112, borderRadius: "50%", border: "12px solid rgba(255,255,255,.08)", borderTopColor: "#ff3b30", borderRightColor: "#ff3b30", display: "grid", placeItems: "center", margin: "12px auto 0" }}><b style={{ fontSize: 34, color: "#ff4d3d" }}>78</b></div></div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 310px", gap: 16 }}>
              <div style={{ display: "grid", gap: 16 }}>
                <PressureMap />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}><OpportunityList /><PainList /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  <div style={panel}><SectionTitle title="Routing Activity" action="VIEW ALL" /><p>12 new matches today</p><p>7 introductions pending</p><p>4 deals moving to execution</p></div>
                  <div style={panel}><SectionTitle title="Execution Pipeline" action="VIEW ALL" /><div style={{ display: "grid", gap: 7 }}><div style={{ background: "#155eaa", padding: 12, textAlign: "center" }}>Intake / Signal · 166</div><div style={{ background: "#7e2fb8", padding: 12, textAlign: "center" }}>Routed · 89</div><div style={{ background: "#b92f2f", padding: 12, textAlign: "center" }}>Negotiation · 41</div><div style={{ background: "#b7791f", padding: 12, textAlign: "center" }}>Under Contract · 17</div><div style={{ background: "#1b7f3a", padding: 12, textAlign: "center" }}>Closed · 6</div></div></div>
                  <div style={panel}><SectionTitle title="AI Command Insights" /><p>🔥 Distress spike detected in Central Florida counties.</p><p>💧 Capital demand up 27% for multifamily deals.</p><p>🏭 Operator shortage in Texas markets is critical.</p></div>
                </div>
              </div>
              <RightRail />
            </div>
          </div>
        </section>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          main > div { grid-template-columns: 1fr !important; }
          aside { position: relative !important; height: auto !important; }
          section { padding: 0 10px 44px !important; }
          section div[style*="repeat(6"] { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
        }
        @media (max-width: 760px) {
          aside { padding: 14px !important; }
          section div[style*="repeat(6"] { grid-template-columns: 1fr !important; }
          section div[style*="310px"] { grid-template-columns: 1fr !important; }
          section div[style*="1fr 1fr"] { grid-template-columns: 1fr !important; }
          section div[style*="1fr 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
