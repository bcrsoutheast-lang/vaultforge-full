"use client";

import Link from "next/link";

type VaultForgeMemberNavProps = {
  active?: string;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  children?: React.ReactNode;
};

const links = [
  { key: "command", label: "Command", href: "/command" },
  { key: "members", label: "Members", href: "/members" },
  { key: "deals", label: "Deal Rooms", href: "/deal-rooms" },
  { key: "pain", label: "Pain Button", href: "/pain-intake" },
  { key: "pain-rooms", label: "Pain Rooms", href: "/pain-rooms" },
  { key: "messages", label: "Messages", href: "/messages" },
  { key: "profile", label: "Profile", href: "/profile" },
  { key: "saved", label: "Saved", href: "/saved-rooms" },
  { key: "archived", label: "Archived", href: "/archived-rooms" },
  { key: "deleted", label: "Deleted", href: "/deleted-rooms" },
  { key: "admin", label: "Admin", href: "/admin" },
];

export default function VaultForgeMemberNav({
  active = "",
  title,
  subtitle,
  eyebrow = "VAULTFORGE MEMBER AREA",
  children,
}: VaultForgeMemberNavProps) {
  return (
    <main className="vf-member-page">
      <style>{`
        .vf-member-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(245, 200, 76, .14), transparent 30%),
            radial-gradient(circle at top right, rgba(59, 130, 246, .10), transparent 28%),
            linear-gradient(180deg, #02040a, #071018 52%, #02040a);
          color: #fff;
          padding: 18px;
          font-family: Inter, Arial, system-ui, sans-serif;
        }

        .vf-member-wrap {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          gap: 18px;
        }

        .vf-member-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          border: 1px solid rgba(245, 200, 76, .20);
          background: rgba(2, 6, 23, .86);
          border-radius: 24px;
          padding: 16px;
          backdrop-filter: blur(14px);
        }

        .vf-member-logo {
          color: #f5c84c;
          font-weight: 950;
          font-size: 30px;
          letter-spacing: -.05em;
          text-decoration: none;
        }

        .vf-member-nav {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
          align-items: center;
        }

        .vf-member-nav a {
          color: #e5e7eb;
          text-decoration: none;
          border: 1px solid rgba(148, 163, 184, .20);
          background: rgba(15, 23, 42, .72);
          border-radius: 999px;
          padding: 10px 12px;
          font-weight: 900;
          font-size: 13px;
          white-space: nowrap;
        }

        .vf-member-nav a.active {
          color: #111827;
          border-color: transparent;
          background: linear-gradient(135deg, #fde68a, #e8c46b);
        }

        .vf-member-nav a.admin {
          color: #111827;
          border-color: transparent;
          background: linear-gradient(135deg, #fde68a, #e8c46b);
          box-shadow: 0 0 22px rgba(245, 200, 76, .25);
        }

        .vf-member-nav a.exit {
          color: #fecaca;
          border-color: rgba(239, 68, 68, .30);
          background: rgba(127, 29, 29, .22);
        }

        .vf-member-hero,
        .vf-card {
          border: 1px solid rgba(245, 200, 76, .24);
          background: linear-gradient(145deg, rgba(16, 24, 36, .94), rgba(2, 6, 23, .98));
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 24px 70px rgba(0, 0, 0, .28);
        }

        .vf-eyebrow {
          color: #f5c84c;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .22em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .vf-title {
          font-size: clamp(42px, 8vw, 84px);
          line-height: .88;
          letter-spacing: -.08em;
          margin: 0;
        }

        .vf-subtitle {
          color: #cbd5e1;
          font-size: 20px;
          line-height: 1.45;
          max-width: 960px;
          margin: 16px 0 0;
        }

        @media (max-width: 700px) {
          .vf-member-page { padding: 12px; }
          .vf-member-logo { font-size: 25px; }
          .vf-member-nav { overflow-x: auto; flex-wrap: nowrap; padding-bottom: 2px; width: 100%; }
          .vf-member-hero, .vf-card { padding: 20px; border-radius: 24px; }
        }
      `}</style>

      <div className="vf-member-wrap">
        <header className="vf-member-top">
          <Link href="/command" className="vf-member-logo">
            VAULTFORGE
          </Link>

          <nav className="vf-member-nav">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${active === item.key ? "active" : ""} ${item.key === "admin" ? "admin" : ""}`.trim()}
              >
                {item.label}
              </Link>
            ))}

            <Link href="/" className="exit">
              Exit
            </Link>
          </nav>
        </header>

        {title ? (
          <section className="vf-member-hero">
            <div className="vf-eyebrow">{eyebrow}</div>
            <h1 className="vf-title">{title}</h1>
            {subtitle ? <p className="vf-subtitle">{subtitle}</p> : null}
          </section>
        ) : null}

        {children}
      </div>
    </main>
  );
}
