"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import VaultForgeMemberNav from "../../components/VaultForgeMemberNav";
import VaultForgeRoutingCommandStack from "../../components/VaultForgeRoutingCommandStack";

type Row = Record<string, any>;

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) return "";

  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function getEmail() {
  if (typeof window === "undefined") return "";

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    try {
      const localValue = cleanEmail(window.localStorage.getItem(key));
      if (localValue.includes("@")) return localValue;

      const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
      if (sessionValue.includes("@")) return sessionValue;
    } catch {
      // Continue.
    }
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function meta(row: Row | null) {
  return row && typeof row.metadata === "object" && row.metadata ? row.metadata : {};
}

function first(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const found = value.find((item) => clean(item));
      if (found !== undefined) return clean(found);
      continue;
    }

    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function titleOf(row: Row | null, signalId: string) {
  const m = meta(row);
  return first(row?.title, row?.signal_title, row?.event_title, row?.alert_title, row?.subject, m.title, m.signal_title, `Routing Room ${signalId}`);
}

function summaryOf(row: Row | null) {
  const m = meta(row);
  return first(
    row?.route_summary,
    row?.routing_summary,
    row?.summary,
    row?.note,
    row?.notes,
    row?.description,
    m.route_summary,
    m.routing_summary,
    m.ai_summary,
    m.summary,
    "Routing room is ready for review and controlled member matching."
  );
}

function statusOf(row: Row | null) {
  const m = meta(row);
  return first(row?.routing_status, row?.status, m.routing_status, m.status, "Open");
}

function locationOf(row: Row | null) {
  const m = meta(row);
  const city = first(row?.city, m.city);
  const state = first(row?.state, row?.market, row?.operating_state, m.state, m.market, m.operating_state);
  return [city, state].filter(Boolean).join(", ") || state || "Market not listed";
}

function scoreOf(row: Row | null) {
  const m = meta(row);
  const raw = Number(first(row?.confidence_score, row?.match_score, row?.priority_score, m.confidence_score, m.priority_score));
  if (Number.isFinite(raw) && raw > 0) return Math.max(0, Math.min(100, Math.round(raw)));
  return 72;
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 10%, rgba(157,243,191,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1180px,100%)",
  margin: "0 auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
};

const pill: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.24)",
  borderRadius: 999,
  padding: "8px 11px",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  fontWeight: 900,
  fontSize: 13,
  display: "inline-flex",
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 46,
  borderRadius: 999,
  padding: "11px 16px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

export default function RoutingRoomPage({
  params,
}: {
  params: { signalId: string };
}) {
  const signalId = decodeURIComponent(clean(params?.signalId));
  const [email, setEmail] = useState("");
  const [row, setRow] = useState<Row | null>(null);
  const [status, setStatus] = useState("Loading routing room...");

  async function load() {
    const viewer = getEmail();
    setEmail(viewer);
    setStatus("Loading routing room...");

    const urls = [
      `/api/routing/actions?email=${encodeURIComponent(viewer)}&owner=0`,
      `/api/signals/${encodeURIComponent(signalId)}?email=${encodeURIComponent(viewer)}`,
      `/api/pain/feed?email=${encodeURIComponent(viewer)}&owner=0`,
    ];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          cache: "no-store",
          credentials: "include",
          headers: {
            "x-vf-email": viewer || "",
            "x-vf-admin": "0",
          },
        });

        const data = await safeJson(response);

        const direct = data.action || data.signal || data.pain || data.record || data.data;
        const lists = [
          ...(Array.isArray(data.actions) ? data.actions : []),
          ...(Array.isArray(data.signals) ? data.signals : []),
          ...(Array.isArray(data.pains) ? data.pains : []),
          ...(Array.isArray(data.items) ? data.items : []),
          ...(Array.isArray(data.data) ? data.data : []),
        ];

        const found =
          (direct && typeof direct === "object" ? direct : null) ||
          lists.find((item: Row) => {
            const m = meta(item);
            const possible = first(item.signal_id, item.signalId, item.id, item.item_id, item.pain_id, item.deal_id, m.signal_id, m.item_id, m.pain_id, m.deal_id);
            return possible === signalId;
          });

        if (found) {
          setRow(found);
          setStatus("");
          return;
        }
      } catch {
        // Try next.
      }
    }

    const fallback = {
      id: signalId,
      signal_id: signalId,
      title: `Routing Room ${signalId}`,
      summary: "Routing context could not be fully loaded yet, but the room shell is available.",
      status: "Open",
    };

    setRow(fallback);
    setStatus("");
  }

  useEffect(() => {
    load();
  }, [signalId]);

  const title = titleOf(row, signalId);
  const messageHref =
    `/messages/new?to=${encodeURIComponent("bcrsoutheast@gmail.com")}` +
    `&subject=${encodeURIComponent(title)}` +
    `&room_title=${encodeURIComponent(title)}` +
    `&title=${encodeURIComponent(title)}` +
    `&room_type=${encodeURIComponent("Routing Room")}` +
    `&room_id=${encodeURIComponent(signalId)}` +
    `&signal_id=${encodeURIComponent(signalId)}` +
    `&source=${encodeURIComponent("routing-room")}` +
    `&type=${encodeURIComponent("routing")}` +
    `&folder=${encodeURIComponent("routing")}` +
    `&source_route=${encodeURIComponent(`/routing-room/${signalId}`)}`;

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media(max-width:760px) {
          .vf-grid {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Routing Room"
          subtitle="Controlled member routing, intro staging, and execution matching."
          active="routing"
        />

        <section style={card}>
          <div style={label}>VaultForge Routing Room</div>
          <h1
            style={{
              fontSize: "clamp(48px,9vw,92px)",
              lineHeight: 0.9,
              letterSpacing: "-.065em",
              margin: "10px 0 16px",
            }}
          >
            {title}
          </h1>

          <p style={{ ...muted, fontSize: 18, marginTop: 0 }}>
            {summaryOf(row)}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "14px 0" }}>
            <span style={pill}>Signal: {signalId}</span>
            <span style={pill}>Status: {statusOf(row)}</span>
            <span style={pill}>Market: {locationOf(row)}</span>
            <span style={pill}>Score: {scoreOf(row)}%</span>
            {email ? <span style={pill}>Viewer: {email}</span> : null}
          </div>

          <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <Link href={messageHref} style={button}>Message / Route Owner</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <button type="button" onClick={load} style={ghost}>Refresh</button>
          </div>
        </section>

        {status ? (
          <section style={card}>
            <p style={{ ...muted, margin: 0 }}>{status}</p>
          </section>
        ) : null}

        {row ? (
          <VaultForgeRoutingCommandStack room={row} signalId={signalId} />
        ) : null}

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <section style={card}>
            <div style={label}>Routing Summary</div>
            <p style={{ ...muted }}>{summaryOf(row)}</p>
          </section>

          <section style={card}>
            <div style={label}>Controlled Next Steps</div>
            <p style={{ ...muted }}>
              Route only to members who match state, role, capability, capital path, buyer fit, operator fit, or pressure-solving ability.
            </p>
          </section>
        </section>
      </div>
    </main>
  );
}
