import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CountCard = {
  label: string;
  value: number;
  note: string;
  href: string;
};

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 16% 10%, rgba(245,197,66,.12), transparent 30%), radial-gradient(circle at 88% 8%, rgba(120,0,30,.16), transparent 34%), #05070b",
  color: "#f7f8ff",
  padding: "28px 20px 84px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shell: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const nav: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 12,
  marginBottom: 22,
};

const brand: React.CSSProperties = {
  color: "#ffda5e",
  fontWeight: 1000,
  fontSize: 28,
  letterSpacing: "-.04em",
  marginRight: 10,
};

const button: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  border: "1px solid rgba(207,216,230,.18)",
  background: "rgba(18,24,38,.92)",
  color: "#f7f8ff",
  padding: "12px 18px",
  fontWeight: 900,
  textDecoration: "none",
};

const goldButton: React.CSSProperties = {
  ...button,
  background: "linear-gradient(135deg,#ffe16a,#f4bf37)",
  color: "#080a10",
  border: "1px solid rgba(255,220,90,.65)",
};

const redButton: React.CSSProperties = {
  ...button,
  background: "rgba(90,10,18,.72)",
  color: "#ffb2b2",
  border: "1px solid rgba(255,65,65,.65)",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.16)",
  borderRadius: 26,
  background: "rgba(15,21,34,.88)",
  padding: 24,
  boxShadow: "0 18px 50px rgba(0,0,0,.24)",
  marginBottom: 20,
};

const goldCard: React.CSSProperties = {
  ...card,
  borderColor: "rgba(245,197,66,.42)",
  background:
    "linear-gradient(135deg,rgba(22,25,37,.96),rgba(33,31,20,.82))",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  gap: 14,
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.15)",
  borderRadius: 22,
  background: "rgba(17,23,36,.78)",
  padding: 20,
  textDecoration: "none",
  color: "#f7f8ff",
  display: "block",
};

const eyebrow: React.CSSProperties = {
  color: "#ffda5e",
  textTransform: "uppercase",
  letterSpacing: ".34em",
  fontSize: 12,
  fontWeight: 1000,
};

const h1: React.CSSProperties = {
  fontSize: "clamp(42px,7vw,82px)",
  lineHeight: ".92",
  letterSpacing: "-.08em",
  margin: "12px 0",
  fontWeight: 1000,
};

const h2: React.CSSProperties = {
  fontSize: "clamp(30px,4.5vw,54px)",
  lineHeight: ".95",
  letterSpacing: "-.065em",
  margin: "10px 0",
  fontWeight: 1000,
};

const muted: React.CSSProperties = {
  color: "rgba(235,240,255,.68)",
  fontSize: 15,
  lineHeight: 1.45,
  margin: "6px 0",
};

const sub: React.CSSProperties = {
  color: "rgba(235,240,255,.78)",
  fontSize: 20,
  lineHeight: 1.45,
  margin: "8px 0",
};

const row: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
};

const adminCards: CountCard[] = [
  {
    label: "Profile Approvals",
    value: 0,
    note: "submitted profiles waiting on approval",
    href: "#profile-approvals",
  },
  {
    label: "Member Payment Ready",
    value: 0,
    note: "members approved for payment but not activated",
    href: "#member-payments",
  },
  {
    label: "New Members",
    value: 0,
    note: "pending member approvals",
    href: "#members",
  },
  {
    label: "Active Members",
    value: 2,
    note: "approved and active members",
    href: "#members",
  },
  {
    label: "Deleted Members",
    value: 0,
    note: "member cleanup folder",
    href: "#member-cleanup",
  },
  {
    label: "New Investors",
    value: 0,
    note: "pending investor approvals",
    href: "#investors",
  },
  {
    label: "Investor Payment Ready",
    value: 0,
    note: "investors approved for payment but not activated",
    href: "#investor-payments",
  },
  {
    label: "Paid Investors",
    value: 1,
    note: "active investor access",
    href: "#investors",
  },
  {
    label: "Deleted Investors",
    value: 0,
    note: "investor cleanup folder",
    href: "#investor-cleanup",
  },
];

function CountTile({ cardData }: { cardData: CountCard }) {
  return (
    <a href={cardData.href} style={panel}>
      <div style={eyebrow}>{cardData.label}</div>
      <h2 style={{ ...h2, color: "#1e90ff" }}>{cardData.value}</h2>
      <p style={muted}>{cardData.note}</p>
      <p style={{ ...muted, color: "#ffd45a", fontWeight: 950 }}>Open</p>
    </a>
  );
}

function AdminSection({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={card}>
      <div style={eyebrow}>{title}</div>
      <h2 style={h2}>{subtitle}</h2>
      {children}
    </section>
  );
}

export default function AdminPage() {
  return (
    <main style={wrap}>
      <div style={shell}>
        <nav style={nav}>
          <div style={brand}>VAULTFORGE</div>
          <Link href="/" style={button}>Home</Link>
          <Link href="/admin" style={goldButton}>Admin Command</Link>
          <Link href="/members" style={button}>Members</Link>
          <Link href="/investor-room" style={button}>Investor Room</Link>
          <Link href="/member-controlled-threads" style={button}>Controlled Threads</Link>
          <Link href="/my-rooms" style={button}>My Rooms</Link>
          <Link href="/logout" style={redButton}>Logout</Link>
        </nav>

        <section style={goldCard}>
          <div style={eyebrow}>VaultForge Admin Command</div>
          <h1 style={h1}>Admin command center.</h1>
          <p style={sub}>
            Owner control for members, investors, payment approval, folders, and cleanup. This page is restored as the main admin hub.
          </p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Admin Control Board</div>
          <h2 style={h2}>Profiles, users, investors, payments, and cleanup.</h2>
          <div style={grid}>
            {adminCards.map((item) => (
              <CountTile key={item.label} cardData={item} />
            ))}
          </div>
        </section>

        <AdminSection
          id="profile-approvals"
          title="Profile Approvals"
          subtitle="Submitted profiles waiting on approval."
        >
          <div style={panel}>
            <p style={sub}>No pending profile approvals found in this restored admin shell.</p>
            <p style={muted}>
              Next production step: wire this section to the canonical profile/member source so approvals update live.
            </p>
          </div>
        </AdminSection>

        <AdminSection
          id="member-payments"
          title="Member Payment Ready"
          subtitle="Members ready for access activation."
        >
          <div style={panel}>
            <p style={sub}>No member payment-ready cards are currently loaded.</p>
            <p style={muted}>
              Founder pricing can be added here after auth/payment rules are locked.
            </p>
          </div>
        </AdminSection>

        <AdminSection id="members" title="Members" subtitle="Member control lane.">
          <div style={grid}>
            <div style={panel}>
              <div style={eyebrow}>Active Members</div>
              <h2 style={{ ...h2, color: "#1e90ff" }}>2</h2>
              <p style={muted}>Approved and active members.</p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>New Members</div>
              <h2 style={{ ...h2, color: "#1e90ff" }}>0</h2>
              <p style={muted}>Pending member approvals.</p>
            </div>
          </div>
        </AdminSection>

        <AdminSection id="investors" title="Investors" subtitle="Investor control lane.">
          <div style={grid}>
            <div style={panel}>
              <div style={eyebrow}>Paid Investors</div>
              <h2 style={{ ...h2, color: "#1e90ff" }}>1</h2>
              <p style={muted}>Active investor access.</p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>New Investors</div>
              <h2 style={{ ...h2, color: "#1e90ff" }}>0</h2>
              <p style={muted}>Pending investor approvals.</p>
            </div>
          </div>
        </AdminSection>

        <AdminSection
          id="investor-payments"
          title="Investor Payment Ready"
          subtitle="Investors approved for payment but not activated."
        >
          <div style={panel}>
            <p style={sub}>No investor payment-ready cards are currently loaded.</p>
          </div>
        </AdminSection>

        <AdminSection
          id="member-cleanup"
          title="Member Cleanup"
          subtitle="Saved, archived, deleted, and restored member records."
        >
          <div style={panel}>
            <p style={sub}>No deleted member records are currently loaded.</p>
          </div>
        </AdminSection>

        <AdminSection
          id="investor-cleanup"
          title="Investor Cleanup"
          subtitle="Saved, archived, deleted, and restored investor records."
        >
          <div style={panel}>
            <p style={sub}>No deleted investor records are currently loaded.</p>
          </div>
        </AdminSection>

        <section style={card}>
          <div style={eyebrow}>Do Not Touch Without Intent</div>
          <h2 style={h2}>Auth, middleware, payment, and RLS stay separate.</h2>
          <p style={sub}>
            This restored admin page is a safe front-end control hub. Real security and live data should be wired through dedicated API/auth work next, not mixed into this page blindly.
          </p>
          <div style={row}>
            <Link href="/member-controlled-threads" style={goldButton}>Open Controlled Threads</Link>
            <Link href="/my-rooms" style={button}>Open My Rooms</Link>
            <Link href="/investor-room" style={button}>Open Investor Room</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
