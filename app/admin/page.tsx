import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, rgba(181,92,255,.28), transparent 30%), radial-gradient(circle at top right, rgba(157,243,191,.16), transparent 26%), radial-gradient(circle at bottom right, rgba(232,196,107,.18), transparent 30%), linear-gradient(180deg,#030208 0%,#130526 45%,#04120d 100%)",
  color: "white",
  padding: "30px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  background: "linear-gradient(145deg, rgba(181,92,255,.20), rgba(232,196,107,.10), rgba(157,243,191,.07), rgba(255,255,255,.03))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 36px 110px rgba(0,0,0,.46)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  gap: 16,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(181,92,255,.28)",
  background: "linear-gradient(145deg, rgba(181,92,255,.13), rgba(157,243,191,.06), rgba(255,255,255,.035))",
  borderRadius: 28,
  padding: 22,
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 58%,#b55cff)",
  color: "#061120",
  border: "none",
  borderRadius: 999,
  padding: "13px 17px",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
  margin: "7px 7px 0 0",
};

const ghost: React.CSSProperties = {
  ...btn,
  background: "linear-gradient(135deg, rgba(181,92,255,.22), rgba(255,255,255,.055))",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
};

const muted: React.CSSProperties = { color: "rgba(255,255,255,.70)", lineHeight: 1.55 };

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function isAdmin(email: string, adminCookie: string, isAdminCookie: string) {
  return email === OWNER_EMAIL || adminCookie === "1" || isAdminCookie.toLowerCase() === "true";
}

function AdminCard({
  title,
  label,
  description,
  href,
  primary,
}: {
  title: string;
  label: string;
  description: string;
  href: string;
  primary?: boolean;
}) {
  return (
    <div style={card}>
      <div style={{ color: primary ? "#9df3bf" : "#e8c46b", letterSpacing: 4, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
        {label}
      </div>

      <h2 style={{ fontSize: 30, margin: "0 0 10px" }}>{title}</h2>

      <p style={muted}>{description}</p>

      <Link href={href} style={primary ? btn : ghost}>
        Open
      </Link>
    </div>
  );
}

export default async function AdminPage() {
  const cookieStore = await cookies();

  const email = cleanEmail(cookieStore.get("vf_email")?.value);
  const memberLogin = String(cookieStore.get("vf_member_login")?.value || "").trim();
  const adminCookie = String(cookieStore.get("vf_admin")?.value || "").trim();
  const isAdminCookie = String(cookieStore.get("isAdmin")?.value || "").trim();

  if (!email || memberLogin !== "1") {
    redirect("/admin-login");
  }

  if (!isAdmin(email, adminCookie, isAdminCookie)) {
    redirect("/admin-login");
  }

  return (
    <main style={shell}>
      <style>{`
        a:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.08);
        }

        @media (max-width: 760px) {
          a {
            box-sizing: border-box;
          }
        }
      `}</style>
      <div style={wrap}>
        <section style={hero}>
          <div style={{ color: "#e8c46b", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            VaultForge Admin
          </div>

          <h1 style={{ fontSize: "clamp(58px,12vw,106px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            Owner control center.
          </h1>

          <p style={{ ...muted, fontSize: 20 }}>
            Logged in as <strong>{email}</strong>. This restores admin navigation safely without changing member workflows.
          </p>

          <Link href="/dashboard" style={btn}>Member Dashboard</Link>
          <Link href="/submit" style={ghost}>Create Deal</Link>
          <Link href="/projects" style={ghost}>Projects</Link>
          <Link href="/logout" style={ghost}>Logout</Link>
        </section>

        <section style={grid}>
          <AdminCard title="Projects" label="Deals" description="Review live deals, open Deal Rooms, check photos, and test project actions." href="/projects" primary />
          <AdminCard title="Create Deal" label="Submit" description="Submit residential, commercial, and land opportunities with uploads." href="/submit" primary />
          <AdminCard title="Buy Bucket" label="Saved" description="Check saved acquisition targets and follow-up folders." href="/buy-bucket" />
          <AdminCard title="Messages" label="Comms" description="Review member and deal-tied conversations." href="/messages" />
          <AdminCard title="Alerts" label="Signals" description="Review smart alerts, routing signals, and Buy Bucket activity." href="/alerts" />
          <AdminCard title="Network" label="Members" description="Open member network/admin controls if the network page exists." href="/network" />
          <AdminCard title="Profile" label="Owner Profile" description="Open profile and buy-box settings." href="/profile" />
          <AdminCard title="Payment" label="Access" description="Open payment/access preview page." href="/payment" />
        </section>
      </div>
    </main>
  );
}