
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MEMBER_ROUTES = [
  "/dashboard",
  "/alerts",
  "/intelligence",
  "/routing-inbox",
  "/introductions",
  "/activity",
  "/submit",
  "/projects",
  "/buy-bucket",
  "/messages",
  "/members",
  "/member-intelligence",
  "/signals",
  "/routing-room",
  "/deal-room",
  "/introduction",
  "/profile",
  "/command-navigation",
];

const HIDE_ON_ROUTES = [
  "/",
  "/login",
  "/admin-login",
  "/apply",
  "/terms",
  "/member-preview",
  "/payment",
  "/logout",
];

export default function VaultForgeGlobalMemberNavGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";

  const shouldHide =
    HIDE_ON_ROUTES.includes(pathname) ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/owner-control-check");

  const shouldShow =
    !shouldHide &&
    MEMBER_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));

  if (!shouldShow) {
    return <>{children}</>;
  }

  return (
    <>
      <GlobalMemberNav />
      {children}
    </>
  );
}

function GlobalMemberNav() {
  const pathname = usePathname() || "";

  return (
    <div style={outer}>
      <style>{`
        @media (max-width: 860px) {
          .vf-global-nav-inner {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .vf-global-nav-links {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            width: 100% !important;
          }

          .vf-global-nav-links a {
            justify-content: center !important;
            text-align: center !important;
          }
        }

        @media (max-width: 460px) {
          .vf-global-nav-links {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={inner} className="vf-global-nav-inner">
        <Link href="/dashboard" style={brand}>
          <img src="/vaultforge-logo.png" alt="VaultForge" style={logo} />
          <div>
            <div style={brandText}>VAULTFORGE</div>
            <div style={subText}>Member Command Navigation</div>
          </div>
        </Link>

        <nav style={links} className="vf-global-nav-links">
          <NavButton href="/dashboard" label="Dashboard" pathname={pathname} />
          <NavButton href="/alerts" label="Alerts" pathname={pathname} />
          <NavButton href="/intelligence" label="Intelligence" pathname={pathname} />
          <NavButton href="/routing-inbox" label="Routing" pathname={pathname} />
          <NavButton href="/introductions" label="Intros" pathname={pathname} />
          <NavButton href="/activity" label="Activity" pathname={pathname} />
          <NavButton href="/command-navigation" label="All Pages" pathname={pathname} />
          <NavButton href="/profile" label="Profile" pathname={pathname} gold />
        </nav>
      </div>
    </div>
  );
}

function NavButton({
  href,
  label,
  pathname,
  gold = false,
}: {
  href: string;
  label: string;
  pathname: string;
  gold?: boolean;
}) {
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));

  return (
    <Link
      href={href}
      style={gold ? goldLink : active ? activeLink : navLink}
    >
      {label}
    </Link>
  );
}

const outer: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 999,
  background:
    "linear-gradient(180deg, rgba(2,2,2,.98), rgba(2,2,2,.90))",
  borderBottom: "1px solid rgba(232,196,107,.16)",
  backdropFilter: "blur(18px)",
};

const inner: React.CSSProperties = {
  maxWidth: 1420,
  margin: "0 auto",
  padding: "12px 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
};

const brand: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "white",
  textDecoration: "none",
  minWidth: 220,
};

const logo: React.CSSProperties = {
  width: 42,
  height: 42,
  objectFit: "cover",
  borderRadius: 13,
  border: "1px solid rgba(232,196,107,.22)",
  boxShadow: "0 0 22px rgba(232,196,107,.16)",
};

const brandText: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 4,
  fontSize: 13,
  fontWeight: 950,
};

const subText: React.CSSProperties = {
  color: "rgba(255,255,255,.55)",
  fontSize: 12,
  marginTop: 3,
};

const links: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: 8,
};

const navLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.10)",
  background: "rgba(255,255,255,.035)",
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

const goldLink: React.CSSProperties = {
  ...navLink,
  color: "#050505",
  background: "linear-gradient(135deg,#f4d47b,#a96d02)",
  border: "1px solid rgba(232,196,107,.36)",
};
