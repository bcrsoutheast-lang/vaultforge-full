
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  section: "Core" | "Deal Flow" | "Network" | "Account";
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", section: "Core" },
  { label: "Alerts", href: "/alerts", section: "Core" },
  { label: "Intelligence", href: "/intelligence", section: "Core" },
  { label: "Routing Inbox", href: "/routing-inbox", section: "Core" },
  { label: "Introductions", href: "/introductions", section: "Core" },
  { label: "Activity", href: "/activity", section: "Core" },

  { label: "Create", href: "/submit", section: "Deal Flow" },
  { label: "Projects", href: "/projects", section: "Deal Flow" },
  { label: "Buy Bucket", href: "/buy-bucket", section: "Deal Flow" },
  { label: "Messages", href: "/messages", section: "Deal Flow" },

  { label: "Members", href: "/members", section: "Network" },
  { label: "Member Intelligence", href: "/member-intelligence", section: "Network" },

  { label: "Profile", href: "/profile", section: "Account" },
  { label: "Logout", href: "/logout", section: "Account" },
];

const sections: NavItem["section"][] = ["Core", "Deal Flow", "Network", "Account"];

export default function VaultForgeMemberNav({
  title = "Member Command Center",
  subtitle = "Private real estate intelligence network",
}: {
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();

  return (
    <section style={shell}>
      <style>{`
        @media (max-width: 820px) {
          .vf-nav-head {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .vf-nav-groups {
            grid-template-columns: 1fr !important;
          }

          .vf-nav-actions {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
          }

          .vf-nav-actions a {
            width: 100% !important;
            justify-content: center !important;
            box-sizing: border-box !important;
          }

          .vf-nav-link {
            width: 100% !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
          }
        }

        @media (max-width: 460px) {
          .vf-nav-actions {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={head} className="vf-nav-head">
        <Link href="/dashboard" style={brandLink}>
          <img src="/vaultforge-logo.png" alt="VaultForge" style={logo} />
          <div>
            <div style={brand}>VAULTFORGE</div>
            <div style={sub}>{subtitle}</div>
          </div>
        </Link>

        <div style={actions} className="vf-nav-actions">
          <Link href="/dashboard" style={actionBtn}>Dashboard</Link>
          <Link href="/command-navigation" style={actionBtn}>All Pages</Link>
          <Link href="/profile" style={goldBtn}>Profile</Link>
          <Link href="/logout" style={dangerBtn}>Logout</Link>
        </div>
      </div>

      <div style={titleWrap}>
        <div style={eyebrow}>MEMBER NAVIGATION</div>
        <h1 style={titleStyle}>{title}</h1>
      </div>

      <div style={groupsGrid} className="vf-nav-groups">
        {sections.map((section) => (
          <div key={section} style={groupBox}>
            <div style={groupTitle}>{section}</div>
            <div style={links}>
              {navItems
                .filter((item) => item.section === section)
                .map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname?.startsWith(item.href + "/"));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="vf-nav-link"
                      style={active ? activeLink : navLink}
                    >
                      <span>{item.label}</span>
                      <span>→</span>
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const shell: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.16)",
  borderRadius: 30,
  padding: 20,
  background:
    "radial-gradient(circle at top left, rgba(211,58,44,.12), transparent 34%), linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.015))",
  boxShadow: "0 24px 70px rgba(0,0,0,.38)",
  marginBottom: 26,
};

const head: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  marginBottom: 18,
};

const brandLink: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  color: "white",
  textDecoration: "none",
};

const logo: React.CSSProperties = {
  width: 54,
  height: 54,
  objectFit: "cover",
  borderRadius: 16,
  border: "1px solid rgba(232,196,107,.22)",
  boxShadow: "0 0 28px rgba(232,196,107,.16)",
};

const brand: React.CSSProperties = {
  color: "#e8c46b",
  fontWeight: 950,
  letterSpacing: 5,
  fontSize: 14,
};

const sub: React.CSSProperties = {
  color: "rgba(255,255,255,.58)",
  marginTop: 4,
  fontSize: 13,
};

const actions: React.CSSProperties = {
  display: "flex",
  gap: 9,
  flexWrap: "wrap",
};

const actionBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.11)",
  background: "rgba(255,255,255,.035)",
  borderRadius: 999,
  padding: "10px 13px",
  fontWeight: 850,
  fontSize: 13,
};

const goldBtn: React.CSSProperties = {
  ...actionBtn,
  color: "#050505",
  background: "linear-gradient(135deg,#f4d47b,#a96d02)",
  border: "1px solid rgba(232,196,107,.35)",
};

const dangerBtn: React.CSSProperties = {
  ...actionBtn,
  border: "1px solid rgba(211,58,44,.26)",
  color: "#ffb4aa",
};

const titleWrap: React.CSSProperties = {
  borderTop: "1px solid rgba(232,196,107,.10)",
  paddingTop: 16,
  marginBottom: 16,
};

const eyebrow: React.CSSProperties = {
  color: "#d33a2c",
  letterSpacing: 4,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 8,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(32px,6vw,58px)",
  lineHeight: .95,
  letterSpacing: -2,
};

const groupsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr 1fr .85fr",
  gap: 12,
};

const groupBox: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.10)",
  borderRadius: 22,
  padding: 14,
  background: "rgba(0,0,0,.18)",
};

const groupTitle: React.CSSProperties = {
  color: "#e8c46b",
  fontWeight: 950,
  letterSpacing: 3,
  fontSize: 12,
  marginBottom: 10,
  textTransform: "uppercase",
};

const links: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const navLink: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  gap: 8,
  alignItems: "center",
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.10)",
  background: "rgba(255,255,255,.03)",
  borderRadius: 999,
  padding: "10px 12px",
  fontWeight: 850,
  fontSize: 13,
};

const activeLink: React.CSSProperties = {
  ...navLink,
  color: "#050505",
  background: "linear-gradient(135deg,#f4d47b,#a96d02)",
  border: "1px solid rgba(232,196,107,.36)",
};
