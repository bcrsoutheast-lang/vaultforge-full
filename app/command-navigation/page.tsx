
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const groups = [
  {
    title: "Core Intelligence",
    links: [
      ["Dashboard", "/dashboard"],
      ["Alerts", "/alerts"],
      ["Intelligence", "/intelligence"],
      ["Routing Inbox", "/routing-inbox"],
      ["Introductions", "/introductions"],
      ["Activity", "/activity"],
    ],
  },
  {
    title: "Deal Flow",
    links: [
      ["Create", "/submit"],
      ["Projects", "/projects"],
      ["Buy Bucket", "/buy-bucket"],
      ["Messages", "/messages"],
      ["Pain Feed", "/pain"],
      ["Pain Button", "/pain-submit"],
      ["Pain Messages", "/pain-messages"],
    ],
  },
  {
    title: "Network",
    links: [
      ["Members", "/members"],
      ["Member Intelligence", "/member-intelligence"],
    ],
  },
  {
    title: "Account",
    links: [
      ["Profile", "/profile"],
      ["Payment", "/payment"],
      ["Logout", "/logout"],
    ],
  },
];

export default function CommandNavigationPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(178,24,24,.22), transparent 28%), radial-gradient(circle at 85% 10%, rgba(232,196,107,.16), transparent 24%), linear-gradient(180deg,#020202 0%,#070707 55%,#020202 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "28px 18px 90px",
      }}
    >
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        <VaultForgeMemberNav
          title="All Pages"
          subtitle="Central command navigation for the member operating system"
        />

        <section
          style={{
            border: "1px solid rgba(232,196,107,.18)",
            borderRadius: 34,
            padding: 28,
            background:
              "radial-gradient(circle at top left, rgba(211,58,44,.12), transparent 34%), linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.015))",
            boxShadow: "0 24px 70px rgba(0,0,0,.38)",
          }}
        >
          <div
            style={{
              color: "#d33a2c",
              letterSpacing: 4,
              fontWeight: 950,
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            COMMAND NAVIGATION
          </div>

          <h1
            style={{
              margin: "0 0 12px",
              fontSize: "clamp(42px,8vw,82px)",
              lineHeight: .9,
              letterSpacing: -3,
            }}
          >
            One place to move through the member area.
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,.72)",
              fontSize: 20,
              lineHeight: 1.6,
              maxWidth: 900,
            }}
          >
            Use this page when you need to jump between VaultForge command sections fast.
            This is the central map for the member operating system.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 16,
            marginTop: 24,
          }}
        >
          {groups.map((group) => (
            <div
              key={group.title}
              style={{
                border: "1px solid rgba(232,196,107,.14)",
                borderRadius: 26,
                padding: 20,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.015))",
              }}
            >
              <div
                style={{
                  color: "#e8c46b",
                  letterSpacing: 3,
                  fontWeight: 950,
                  fontSize: 12,
                  marginBottom: 14,
                  textTransform: "uppercase",
                }}
              >
                {group.title}
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {group.links.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    style={{
                      color: "white",
                      textDecoration: "none",
                      border: "1px solid rgba(255,255,255,.10)",
                      background: "rgba(255,255,255,.035)",
                      borderRadius: 999,
                      padding: "13px 14px",
                      fontWeight: 850,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{label}</span>
                    <span style={{ color: "#e8c46b" }}>→</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
