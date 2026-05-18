import Link from "next/link";

type Active =
  | "command"
  | "deals"
  | "pain-intake"
  | "pain-rooms"
  | "messages"
  | "saved"
  | "archived"
  | "deleted";

type Props = {
  active: Active;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

const nav: Array<{ key: Active; label: string; href: string }> = [
  { key: "command", label: "Command", href: "/command" },
  { key: "deals", label: "Deal Rooms", href: "/deal-rooms" },
  { key: "pain-intake", label: "Pain Intake", href: "/pain-intake" },
  { key: "pain-rooms", label: "Pain Rooms", href: "/pain-rooms" },
  { key: "messages", label: "Messages", href: "/messages" },
  { key: "saved", label: "Saved", href: "/saved-rooms" },
  { key: "archived", label: "Archived", href: "/archived-rooms" },
  { key: "deleted", label: "Deleted", href: "/deleted-rooms" },
];

export default function VaultForgeCleanShell({
  active,
  eyebrow = "VAULTFORGE CLEAN BUILD",
  title,
  subtitle,
  children,
}: Props) {
  return (
    <main className="vf-page">
      <style>{`
        .vf-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(245, 200, 76, .14), transparent 30%),
            radial-gradient(circle at top right, rgba(239, 68, 68, .10), transparent 28%),
            linear-gradient(180deg, #02040a, #071018 52%, #02040a);
          color: #fff;
          padding: 18px;
          font-family: Inter, Arial, system-ui, sans-serif;
        }

        .vf-wrap {
          max-width: 1180px;
          margin: 0 auto;
          display: grid;
          gap: 18px;
        }

        .vf-top {
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

        .vf-logo {
          color: #f5c84c;
          font-weight: 950;
          font-size: 30px;
          letter-spacing: -.05em;
          text-decoration: none;
        }

        .vf-nav {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
          align-items: center;
        }

        .vf-nav a {
          color: #e5e7eb;
          text-decoration: none;
          border: 1px solid rgba(148, 163, 184, .20);
          background: rgba(15, 23, 42, .72);
          border-radius: 999px;
          padding: 10px 12px;
          font-weight: 900;
          font-size: 13px;
        }

        .vf-nav a.active {
          color: #111827;
          border-color: transparent;
          background: linear-gradient(135deg, #fde68a, #e8c46b);
        }

        .vf-nav a.exit {
          color: #fecaca;
          border-color: rgba(239, 68, 68, .30);
          background: rgba(127, 29, 29, .22);
        }

        .vf-hero,
        .vf-card {
          border: 1px solid rgba(245, 200, 76, .24);
          background: linear-gradient(145deg, rgba(16, 24, 36, .94), rgba(2, 6, 23, .98));
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 24px 70px rgba(0, 0, 0, .28);
        }

        .vf-card.red {
          border-color: rgba(239, 68, 68, .30);
          background: linear-gradient(145deg, rgba(35, 8, 8, .94), rgba(2, 6, 23, .98));
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
          font-size: clamp(44px, 8vw, 88px);
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

        .vf-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(245px, 1fr));
          gap: 16px;
        }

        .vf-metric {
          border: 1px solid rgba(148, 163, 184, .16);
          background: rgba(255, 255, 255, .045);
          border-radius: 22px;
          padding: 18px;
        }

        .vf-metric span {
          display: block;
          color: #94a3b8;
          font-size: 12px;
          letter-spacing: .16em;
          text-transform: uppercase;
          font-weight: 900;
        }

        .vf-metric strong {
          display: block;
          margin-top: 8px;
          font-size: 38px;
          color: #f5c84c;
          letter-spacing: -.05em;
        }

        .vf-btns {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .vf-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #111827;
          background: linear-gradient(135deg, #fde68a, #e8c46b);
          border-radius: 999px;
          padding: 12px 15px;
          font-weight: 950;
          text-decoration: none;
          border: 0;
          cursor: pointer;
        }

        .vf-btn.dark {
          color: #fff;
          background: rgba(255, 255, 255, .06);
          border: 1px solid rgba(255, 255, 255, .15);
        }

        .vf-btn.danger {
          color: #fecaca;
          background: rgba(127, 29, 29, .22);
          border: 1px solid rgba(239, 68, 68, .34);
        }

        .vf-copy {
          color: #cbd5e1;
          font-size: 18px;
          line-height: 1.55;
        }

        .vf-h2 {
          font-size: clamp(30px, 6vw, 56px);
          line-height: .95;
          letter-spacing: -.06em;
          margin: 8px 0 12px;
        }

        @media (max-width: 700px) {
          .vf-page { padding: 12px; }
          .vf-logo { font-size: 25px; }
          .vf-nav { overflow-x: auto; flex-wrap: nowrap; padding-bottom: 2px; width: 100%; }
          .vf-nav a { white-space: nowrap; }
          .vf-hero, .vf-card { padding: 20px; border-radius: 24px; }
        }
      `}</style>

      <div className="vf-wrap">
        <header className="vf-top">
          <Link href="/command" className="vf-logo">VAULTFORGE</Link>

          <nav className="vf-nav">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={active === item.key ? "active" : ""}
              >
                {item.label}
              </Link>
            ))}

            <Link href="/" className="exit">Exit</Link>
          </nav>
        </header>

        <section className="vf-hero">
          <div className="vf-eyebrow">{eyebrow}</div>
          <h1 className="vf-title">{title}</h1>
          {subtitle ? <p className="vf-subtitle">{subtitle}</p> : null}
        </section>

        {children}
      </div>
    </main>
  );
}