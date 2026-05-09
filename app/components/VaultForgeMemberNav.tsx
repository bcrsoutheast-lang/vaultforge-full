
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  group: "Core" | "Deal Flow" | "Network" | "Account";
};

const items: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", group: "Core" },
  { label: "Alerts", href: "/alerts", group: "Core" },
  { label: "Intelligence", href: "/intelligence", group: "Core" },
  { label: "Routing Inbox", href: "/routing-inbox", group: "Core" },
  { label: "Introductions", href: "/introductions", group: "Core" },
  { label: "Activity", href: "/activity", group: "Core" },

  { label: "Create", href: "/submit", group: "Deal Flow" },
  { label: "Projects", href: "/projects", group: "Deal Flow" },
  { label: "Buy Bucket", href: "/buy-bucket", group: "Deal Flow" },
  { label: "Messages", href: "/messages", group: "Deal Flow" },

  { label: "Members", href: "/members", group: "Network" },
  { label: "Member Intelligence", href: "/member-intelligence", group: "Network" },

  { label: "Profile", href: "/profile", group: "Account" },
  { label: "Logout", href: "/logout", group: "Account" },
];

const groups: NavItem["group"][] = ["Core", "Deal Flow", "Network", "Account"];

export default function VaultForgeMemberNav({
  title = "Member Command Center",
  subtitle = "Private intelligence network",
}: {
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();

  return (
    <div style={shell}>
      <style>{`
        @media (max-width: 760px) {
          .vf-member-nav-top {
            align-items: flex-start !important;
            flex-direction: column !important;
          }

          .vf-member-nav-grid {
            grid-template-columns: 1fr !important;
          }

          .vf-member-nav-link {
            width: 100%;
            justify-content: space-between !important;
          }
        }
      `}</style>

      <div style={top} className="vf-member-nav-top">
        <Link href="/dashboard" style={brandWrap}>
          <img
            src="/vaultforge-logo.png"
            alt="VaultForge"
            style={logo}
          />
          <div>
            <div style={brand}>VAULTFORGE</div>
            <div style={small}>{subtitle}</div>
          </div>
        </Link>

        <div style={quickActions}>
          <Link href="/dashboard" style={quickBtn}>
            Command Center
          </Link>
          <Link href="/alerts" style={quickBtn}>
            Alerts
          </Link>
          <Link href="/routing-inbox" style={quickBtn}>
            Routing
          </Link>
          <Link href="/profile" style={quickBtnGold}>
            Profile
          </Link>
        </div>
      </div>

      <div style={titleRow}>
        <div>
          <div style={eyebrow}>MEMBER NAVIGATION</div>
          <h1 style={heading}>{title}</h1>
        </div>
      </div>

      <div style={navGrid} className="vf-member-nav-grid">
        {groups.map((group) => (
          <div key={group} style={groupBox}>
            <div style={groupTitle}>{group}</div>
            <div style={linkWrap}>
              {items
                .filter((item) => item.group === group)
                .map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname?.startsWith(item.href + "/"));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="vf-member-nav-link"
                      style={active ? activeLink : navLink}
                    >
                      <span>{item.label}</span>
                      <span style={arrow}>→</span>
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
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

const top: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  marginBottom: 18,
};

const brandWrap: React.CSSProperties = {
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

const small: React.CSSProperties = {
  color: "rgba(255,255,255,.58)",
  marginTop: 4,
  fontSize: 13,
};

const quickActions: React.CSSProperties = {
  display: "flex",
  gap: 9,
  flexWrap: "wrap",
};

const quickBtn: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.11)",
  background: "rgba(255,255,255,.035)",
  borderRadius: 999,
  padding: "10px 13px",
  fontWeight: 850,
  fontSize: 13,
};

const quickBtnGold: React.CSSProperties = {
  ...quickBtn,
  color: "#050505",
  background: "linear-gradient(135deg,#f4d47b,#a96d02)",
  border: "1px solid rgba(232,196,107,.35)",
};

const titleRow: React.CSSProperties = {
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

const heading: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(32px,6vw,58px)",
  lineHeight: .95,
  letterSpacing: -2,
};

const navGrid: React.CSSProperties = {
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

const linkWrap: React.CSSProperties = {
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

const arrow: React.CSSProperties = {
  opacity: .85,
};
