"use client";

import Link from "next/link";

export type VaultForgeRoomType = "opportunity" | "pain";

type RoomCardProps = {
  type: VaultForgeRoomType;
  title: string;
  subtitle?: string;
  location?: string;
  valueLine?: string;
  score?: string | number;
  status?: string;
  urgency?: string;
  href: string;
  imageUrl?: string;
  meta?: string[];
};

const severityColor: Record<string, string> = {
  critical: "#ff3b30",
  high: "#ff7a18",
  medium: "#f5c84c",
  low: "#68e18f",
  active: "#68e18f",
  saved: "#f5c84c",
  archived: "#9aa4b2",
  hidden: "#6b7280",
  deleted: "#6b7280",
  routed: "#38bdf8",
  review: "#f5c84c",
};

function normalize(value?: string) {
  return String(value || "active").trim().toLowerCase();
}

function compactText(value?: string, max = 138) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}…`;
}

function extractMoney(value?: string) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  return clean
    .replace(/Economics:/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickMeta(meta: string[] = []) {
  const clean = meta
    .map((item) => String(item || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const preferred = clean.filter((item) => {
    const lower = item.toLowerCase();
    return (
      lower.includes("fix") ||
      lower.includes("flip") ||
      lower.includes("residential") ||
      lower.includes("commercial") ||
      lower.includes("land") ||
      lower.includes("multifamily") ||
      lower.includes("buyer") ||
      lower.includes("operator") ||
      lower.includes("capital") ||
      lower.includes("urgent") ||
      lower.includes("medium") ||
      lower.includes("high") ||
      lower.includes("critical")
    );
  });

  return (preferred.length ? preferred : clean).slice(0, 4);
}

export default function VaultForgeRoomTerminalCard({
  type,
  title,
  subtitle,
  location,
  valueLine,
  score,
  status,
  urgency,
  href,
  imageUrl,
  meta = [],
}: RoomCardProps) {
  const level = normalize(urgency || status);
  const accent = severityColor[level] || (type === "pain" ? "#ff3b30" : "#f5c84c");
  const isPain = type === "pain";

  const cleanSubtitle = compactText(subtitle, isPain ? 126 : 118);
  const cleanValueLine = extractMoney(valueLine);
  const visibleMeta = pickMeta(meta);

  const aiSummary = isPain
    ? "Open room for pressure summary, blockers, matched execution profiles, AI next steps, and routing context."
    : "Open room for deal numbers, AI good/bad/next steps, matched profiles, alerts, and execution context.";

  return (
    <article className={`vf-room-terminal-card ${isPain ? "pain" : "opportunity"}`}>
      <style>{`
        .vf-room-terminal-card {
          position: relative;
          overflow: hidden;
          border-radius: 22px;
          border: 1px solid rgba(245,200,76,.24);
          background:
            radial-gradient(circle at top right, rgba(245,200,76,.09), transparent 30%),
            linear-gradient(145deg, rgba(12,16,25,.96), rgba(2,4,7,.99));
          box-shadow: 0 0 28px rgba(245,200,76,.10);
          color: #f8fafc;
        }

        .vf-room-terminal-card.pain {
          border-color: rgba(255,59,48,.34);
          background:
            radial-gradient(circle at top right, rgba(255,59,48,.14), transparent 30%),
            linear-gradient(145deg, rgba(35,8,8,.96), rgba(2,4,7,.99));
          box-shadow: 0 0 28px rgba(255,59,48,.12);
        }

        .vf-room-terminal-bar {
          height: 4px;
          background: linear-gradient(90deg, var(--vf-accent), transparent);
        }

        .vf-room-terminal-inner {
          display: grid;
          grid-template-columns: 118px minmax(0, 1fr);
          gap: 14px;
          padding: 15px;
        }

        .vf-room-terminal-img {
          height: 118px;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.12);
          background:
            radial-gradient(circle at top left, rgba(245,200,76,.18), transparent 30%),
            linear-gradient(135deg,#111827,#020617);
        }

        .vf-room-terminal-img img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .vf-room-terminal-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .vf-room-terminal-kicker {
          color: var(--vf-accent);
          font-size: 10px;
          letter-spacing: .18em;
          text-transform: uppercase;
          font-weight: 950;
        }

        .vf-room-terminal-title {
          margin: 6px 0 4px;
          font-size: 24px;
          line-height: .98;
          letter-spacing: -.055em;
          font-weight: 950;
          color: #fff;
          overflow-wrap: anywhere;
        }

        .vf-room-terminal-sub {
          margin: 0;
          color: #c6ced9;
          font-size: 13px;
          line-height: 1.35;
        }

        .vf-room-terminal-status {
          flex: 0 0 auto;
          text-align: right;
        }

        .vf-room-terminal-score {
          color: var(--vf-accent);
          font-size: 28px;
          font-weight: 950;
          line-height: 1;
          letter-spacing: -.06em;
        }

        .vf-room-terminal-state {
          color: #9aa4b2;
          font-size: 10px;
          letter-spacing: .16em;
          text-transform: uppercase;
          font-weight: 900;
          margin-top: 4px;
        }

        .vf-room-terminal-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .vf-room-terminal-pill {
          border: 1px solid rgba(255,255,255,.13);
          background: rgba(255,255,255,.045);
          color: #cbd5e1;
          border-radius: 999px;
          padding: 6px 9px;
          font-size: 11px;
          font-weight: 850;
          max-width: 100%;
        }

        .vf-room-terminal-pill.hot {
          border-color: var(--vf-accent);
          color: var(--vf-accent);
        }

        .vf-room-terminal-ai {
          margin-top: 12px;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(2,6,23,.48);
          color: #dbeafe;
          border-radius: 14px;
          padding: 10px;
          font-size: 12px;
          line-height: 1.35;
        }

        .vf-room-terminal-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .vf-room-terminal-actions a {
          text-decoration: none;
          border-radius: 999px;
          padding: 8px 10px;
          font-size: 11px;
          font-weight: 950;
          border: 1px solid rgba(245,200,76,.22);
          color: #fef3c7;
          background: rgba(245,200,76,.065);
        }

        .vf-room-terminal-actions a.primary {
          background: linear-gradient(135deg, rgba(245,200,76,.24), rgba(245,200,76,.08));
          border-color: rgba(245,200,76,.38);
          color: #fff7d6;
        }

        @media (max-width: 700px) {
          .vf-room-terminal-inner {
            grid-template-columns: 96px minmax(0, 1fr);
            gap: 12px;
            padding: 13px;
          }

          .vf-room-terminal-img {
            height: 96px;
            border-radius: 14px;
          }

          .vf-room-terminal-title {
            font-size: 20px;
          }

          .vf-room-terminal-head {
            gap: 8px;
          }

          .vf-room-terminal-score {
            font-size: 22px;
          }

          .vf-room-terminal-sub {
            font-size: 12px;
          }

          .vf-room-terminal-ai {
            display: none;
          }
        }
      `}</style>

      <div className="vf-room-terminal-bar" style={{ ["--vf-accent" as string]: accent }} />

      <div className="vf-room-terminal-inner" style={{ ["--vf-accent" as string]: accent }}>
        <Link href={href} className="vf-room-terminal-img" aria-label={`Open ${title || "room"}`}>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" />
          ) : null}
        </Link>

        <div>
          <div className="vf-room-terminal-head">
            <Link href={href} style={{ color: "inherit", textDecoration: "none", minWidth: 0 }}>
              <div className="vf-room-terminal-kicker">
                {isPain ? "Pain Execution Room" : "Opportunity Room"}
              </div>
              <h3 className="vf-room-terminal-title">{title || "Untitled Room"}</h3>
              {cleanSubtitle ? <p className="vf-room-terminal-sub">{cleanSubtitle}</p> : null}
            </Link>

            <div className="vf-room-terminal-status">
              {score !== undefined && score !== null && String(score) !== "" ? (
                <div className="vf-room-terminal-score">{score}</div>
              ) : null}
              <div className="vf-room-terminal-state">{status || "active"}</div>
            </div>
          </div>

          <div className="vf-room-terminal-pills">
            {location ? <span className="vf-room-terminal-pill">{compactText(location, 46)}</span> : null}
            {cleanValueLine ? <span className="vf-room-terminal-pill hot">{compactText(cleanValueLine, 50)}</span> : null}
            {urgency ? <span className="vf-room-terminal-pill hot">{urgency}</span> : null}
            {visibleMeta.map((item) => (
              <span key={item} className="vf-room-terminal-pill">
                {compactText(item, 34)}
              </span>
            ))}
          </div>

          <div className="vf-room-terminal-ai">{aiSummary}</div>

          <div className="vf-room-terminal-actions">
            <Link href={href} className="primary">Open Room</Link>
            <Link href="/saved-rooms">Save</Link>
            <Link href="/archived-rooms">Archive</Link>
            <Link href="/deleted-rooms">Hide</Link>
          </div>
        </div>
      </div>
    </article>
  );
}