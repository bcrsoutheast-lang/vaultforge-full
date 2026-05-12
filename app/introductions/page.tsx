"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

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
    const localValue = cleanEmail(window.localStorage.getItem(key));
    if (localValue.includes("@")) return localValue;

    const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
    if (sessionValue.includes("@")) return sessionValue;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function meta(row: Row) {
  return typeof row?.metadata === "object" && row.metadata ? row.metadata : {};
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

function signalIdOf(row: Row) {
  const m = meta(row);
  return first(row.signal_id, row.signalId, row.routing_signal_id, m.signal_id, m.routing_signal_id);
}

function itemIdOf(row: Row) {
  const m = meta(row);
  return first(row.item_id, row.itemId, row.pain_id, row.deal_id, row.project_id, m.item_id, m.pain_id, m.deal_id, m.project_id);
}

function titleOf(row: Row) {
  const m = meta(row);
  return first(row.title, row.intro_title, row.subject, row.signal_title, m.title, m.intro_title, m.subject, "Controlled Introduction");
}

function summaryOf(row: Row) {
  const m = meta(row);
  return first(
    row.summary,
    row.note,
    row.notes,
    row.message,
    row.description,
    row.route_summary,
    m.summary,
    m.note,
    m.notes,
    m.message,
    m.route_summary,
    "Controlled introduction request ready for review."
  );
}

function statusOf(row: Row) {
  const m = meta(row);
  return first(row.status, row.introduction_status, row.response_status, m.status, m.introduction_status, "Pending");
}

function roleOf(row: Row) {
  const m = meta(row);
  return first(row.role_needed, row.target_role, row.member_role, row.role, m.role_needed, m.target_role, m.member_role, "Member Fit");
}

function ownerOf(row: Row) {
  const m = meta(row);
  return cleanEmail(first(row.owner_email, row.sender_email, row.from_email, row.created_by_email, row.member_email, m.owner_email, m.sender_email, m.from_email, m.created_by_email, m.member_email));
}

function targetOf(row: Row) {
  const m = meta(row);
  return cleanEmail(first(row.target_email, row.recipient_email, row.to_email, row.member_email, m.target_email, m.recipient_email, m.to_email, m.member_email));
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 10%, rgba(56,189,248,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1220px,100%)",
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

const glass: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 22,
  padding: 18,
  background: "rgba(255,255,255,.045)",
};

const eyebrow: React.CSSProperties = {
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

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 50,
  borderRadius: 999,
  padding: "12px 18px",
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

const chip: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.22)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  margin: "0 7px 7px 0",
  fontSize: 12,
  fontWeight: 850,
  display: "inline-flex",
};

function IntroCard({ row, viewer }: { row: Row; viewer: string }) {
  const signalId = signalIdOf(row);
  const itemId = itemIdOf(row);
  const owner = ownerOf(row);
  const target = targetOf(row);
  const title = titleOf(row);
  const summary = summaryOf(row);
  const status = statusOf(row);
  const role = roleOf(row);

  const connectHref = signalId
    ? `/connect/${encodeURIComponent(signalId)}?email=${encodeURIComponent(viewer)}${itemId ? `&item_id=${encodeURIComponent(itemId)}` : ""}`
    : "/messages";

  return (
    <article style={glass}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <span style={chip}>Status: {status}</span>
        <span style={{ ...chip, color: "#f8e7b0", borderColor: "rgba(232,196,107,.26)", background: "rgba(232,196,107,.07)" }}>
          {role}
        </span>
      </div>

      <h3 style={{ fontSize: 30, lineHeight: 1.02, margin: "16px 0 10px" }}>{title}</h3>
      <p style={muted}>{summary}</p>

      <div style={{ marginTop: 14 }}>
        {signalId ? <span style={chip}>Signal: {signalId}</span> : null}
        {itemId ? <span style={chip}>Item: {itemId}</span> : null}
        {owner ? <span style={chip}>Owner: {owner}</span> : null}
        {target ? <span style={chip}>Target: {target}</span> : null}
      </div>

      <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <Link href={connectHref} style={button}>Message / Reply</Link>
        {signalId ? <Link href={`/signals/${encodeURIComponent(signalId)}`} style={ghost}>Open Signal</Link> : null}
        {signalId ? <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={ghost}>Routing Room</Link> : null}
      </div>
    </article>
  );
}

export default function IntroductionsPage() {
  const [email, setEmail] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading introductions...");

  async function load() {
    const viewer = getEmail();
    setEmail(viewer);
    setStatus("Loading introductions...");

    try {
      const urls = [
        `/api/routing/introductions?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/routing/actions?email=${encodeURIComponent(viewer)}&owner=0`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            cache: "no-store",
            headers: { "x-vf-email": viewer || "", "x-vf-admin": "0" },
          });

          const data = await safeJson(res);
          const list = [
            ...(Array.isArray(data.introductions) ? data.introductions : []),
            ...(Array.isArray(data.items) ? data.items : []),
            ...(Array.isArray(data.actions) ? data.actions : []),
            ...(Array.isArray(data.data) ? data.data : []),
          ];

          if (list.length) {
            setItems(list);
            setStatus("");
            return;
          }
        } catch {
          // Try next source.
        }
      }

      setItems([]);
      setStatus("No controlled introductions connected yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load introductions.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const pending = items.filter((item) => statusOf(item).toLowerCase().includes("pending") || statusOf(item).toLowerCase().includes("generated")).length;
    const active = items.length;
    const ownerReady = items.filter((item) => ownerOf(item)).length;

    return { pending, active, ownerReady };
  }, [items]);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          .vf-grid,
          .vf-three,
          .vf-actions {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Introductions"
          subtitle="Controlled member introductions, owner review, replies, and execution handoff."
          active="introductions"
        />

        <section style={card}>
          <div style={eyebrow}>VaultForge Introduction Control</div>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Controlled introductions.
          </h1>
          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>
            This is where member-fit routes become safe introductions. Keep communication on-platform,
            review the context, and move only the right opportunities forward.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Active: {counts.active}</span>
            <span style={chip}>Pending: {counts.pending}</span>
            <span style={chip}>Owner Ready: {counts.ownerReady}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/messages" style={ghost}>Messages</Link>
            <button type="button" onClick={load} style={button}>Refresh</button>
          </div>
        </section>

        <section className="vf-three" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 18 }}>
          <section style={card}>
            <div style={eyebrow}>Review</div>
            <h2 style={{ fontSize: 46, lineHeight: 1, margin: "10px 0" }}>{counts.pending}</h2>
            <p style={muted}>Introductions waiting on response or owner/member review.</p>
          </section>

          <section style={card}>
            <div style={eyebrow}>Network Fit</div>
            <h2 style={{ fontSize: 46, lineHeight: 1, margin: "10px 0" }}>{counts.active}</h2>
            <p style={muted}>Possible member-fit handoffs, controlled intros, and routing opportunities.</p>
          </section>

          <section style={card}>
            <div style={eyebrow}>Control</div>
            <h2 style={{ fontSize: 46, lineHeight: 1, margin: "10px 0" }}>Safe</h2>
            <p style={muted}>Private contact details stay protected until the correct next step is approved.</p>
          </section>
        </section>

        <section style={card}>
          <div style={eyebrow}>Introduction Queue</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "10px 0 18px" }}>Member-fit handoffs.</h2>

          {items.length ? (
            <div style={{ display: "grid", gap: 14 }}>
              {items.map((item, index) => (
                <IntroCard key={clean(item.id) || `${signalIdOf(item)}-${index}`} row={item} viewer={email} />
              ))}
            </div>
          ) : (
            <div style={glass}>
              <h3 style={{ marginTop: 0 }}>No introductions yet.</h3>
              <p style={muted}>
                When routing actions or controlled intros are created, they will appear here with message,
                signal, and routing room controls.
              </p>
              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <Link href="/routing-inbox" style={button}>Open Routing</Link>
                <Link href="/signals" style={ghost}>Open Signals</Link>
              </div>
            </div>
          )}
        </section>

        {status ? <section style={card}>{status}</section> : null}
      </div>
    </main>
  );
}
