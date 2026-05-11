
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

function titleOf(row: Row) {
  const m = meta(row);
  return first(row.title, row.signal_title, row.event_title, row.alert_title, row.subject, row.name, m.title, m.signal_title, "VaultForge Record");
}

function noteOf(row: Row) {
  const m = meta(row);
  return first(row.note, row.notes, row.summary, row.description, row.message, row.body, row.route_summary, m.note, m.summary, m.description, m.message, "Live VaultForge operational record.");
}

function signalIdOf(row: Row) {
  const m = meta(row);
  return first(row.signal_id, row.signalId, row.alert_id, row.id, m.signal_id, m.alert_id);
}

function itemIdOf(row: Row) {
  const m = meta(row);
  return first(row.item_id, row.itemId, row.pain_id, row.deal_id, row.project_id, m.item_id, m.pain_id, m.deal_id, m.project_id);
}

function ownerEmailOf(row: Row) {
  const m = meta(row);
  return cleanEmail(first(row.owner_email, row.submitted_by_email, row.created_by_email, row.member_email, row.target_email, row.recipient_email, m.owner_email, m.submitted_by_email, m.created_by_email, m.member_email, m.target_email, m.recipient_email));
}

function imgOf(row: Row) {
  const m = meta(row);
  const photos = Array.isArray(row.photos) ? row.photos : [];
  const photoUrls = Array.isArray(row.photo_urls) ? row.photo_urls : [];
  const mPhotos = Array.isArray(m.photos) ? m.photos : [];
  const mPhotoUrls = Array.isArray(m.photo_urls) ? m.photo_urls : [];

  return first(row.image_url, row.photo_url, row.primary_photo_url, m.image_url, m.photo_url, photoUrls[0], mPhotoUrls[0], photos[0]?.url, photos[0], mPhotos[0]?.url, mPhotos[0]);
}

function connectHref(row: Row, email: string) {
  const signalId = signalIdOf(row);
  if (!signalId) return "/messages";

  const query = new URLSearchParams();
  if (email) query.set("email", email);
  const itemId = itemIdOf(row);
  if (itemId) query.set("item_id", itemId);

  return `/connect/${encodeURIComponent(signalId)}?${query.toString()}`;
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.15), transparent 30%), radial-gradient(circle at 85% 10%, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 92px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(1180px,100%)", margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(255,255,255,.06)",
  marginBottom: 16,
  boxShadow: "0 24px 80px rgba(0,0,0,.26)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 48,
  borderRadius: 999,
  padding: "12px 18px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.08)",
  color: "white",
  padding: 14,
  fontSize: 16,
  outline: "none",
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

function RecordCard({ row, email, mode }: { row: Row; email: string; mode: "alerts" | "routing" | "introductions" | "signals" }) {
  const signalId = signalIdOf(row);
  const itemId = itemIdOf(row);
  const image = imgOf(row);
  const owner = ownerEmailOf(row);

  const signalHref = signalId ? `/signals/${encodeURIComponent(signalId)}` : "/signals";
  const routingHref = signalId ? `/routing-room/${encodeURIComponent(signalId)}` : "/routing-inbox";
  const introHref = row.id ? `/introduction/${encodeURIComponent(String(row.id))}` : "/introductions";
  const sourceHref = mode === "introductions" ? introHref : mode === "routing" ? routingHref : signalHref;

  return (
    <article style={card}>
      {image ? (
        <div style={{ borderRadius: 22, overflow: "hidden", border: "1px solid rgba(232,196,107,.22)", marginBottom: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={titleOf(row)} style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }} />
        </div>
      ) : null}

      <p style={eyebrow}>{mode} · operational card</p>
      <h2 style={{ fontSize: 34, lineHeight: 1, margin: "0 0 10px" }}>{titleOf(row)}</h2>
      <p style={{ ...muted, fontSize: 17 }}>{noteOf(row)}</p>

      <div>
        {signalId ? <span style={chip}>Signal: {signalId}</span> : null}
        {itemId ? <span style={chip}>Item: {itemId}</span> : null}
        {owner ? <span style={chip}>Owner: {owner}</span> : null}
        <span style={chip}>Source: {mode}</span>
      </div>

      <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <Link href="/dashboard" style={ghost}>Dashboard</Link>
        <Link href={sourceHref} style={button}>Open</Link>
        {signalId ? <Link href={connectHref(row, email)} style={ghost}>Message Owner</Link> : null}
        {signalId ? <Link href={routingHref} style={ghost}>Routing Room</Link> : null}
      </div>
    </article>
  );
}

export default function CommandPage() {
  const [email, setEmail] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading routing...");
  const [search, setSearch] = useState("");

  async function load() {
    const viewer = getEmail();
    setEmail(viewer);
    setStatus("Loading routing...");

    try {
      const collected: Row[] = [];
      const urls = [
        `/api/routing/actions?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/pain/feed?email=${encodeURIComponent(viewer)}&owner=0`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            cache: "no-store",
            headers: { "x-vf-email": viewer || "", "x-vf-admin": "0" },
          });
          const data = await safeJson(res);
          const list = Array.isArray(data.actions)
            ? data.actions
            : Array.isArray(data.routing_actions)
            ? data.routing_actions
            : Array.isArray(data.pains)
            ? data.pains
            : Array.isArray(data.data)
            ? data.data
            : [];
          if (Array.isArray(list)) collected.push(...list);
        } catch {
          // Keep page alive if one feed is unavailable.
        }
      }

      const seen = new Set<string>();
      const unique = collected.filter((row) => {
        const key = first(signalIdOf(row), itemIdOf(row), row.id, titleOf(row) + noteOf(row));
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setRows(unique);
      setStatus(unique.length ? "" : "No routing records found yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load routing.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) =>
      [titleOf(row), noteOf(row), signalIdOf(row), itemIdOf(row), ownerEmailOf(row)]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }
        input::placeholder {
          color: rgba(255,255,255,.42);
        }
        @media (max-width: 760px) {
          .vf-grid {
            grid-template-columns: 1fr !important;
          }
          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
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
        <VaultForgeMemberNav title="Routing" subtitle="Routing inbox with dashboard access, signal rooms, and member-message flow." active="routing" />

        <section style={card}>
          <p style={eyebrow}>VaultForge Routing</p>
          <h1 style={{ fontSize: "clamp(50px,10vw,92px)", lineHeight: 0.88, margin: "10px 0 18px", letterSpacing: "-.06em" }}>
            Routing.
          </h1>
          <p style={{ ...muted, fontSize: 18 }}>Routing inbox with dashboard access, signal rooms, and member-message flow.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Records: {rows.length}</span>
          </div>
          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link href="/dashboard" style={button}>Dashboard</Link>
            <button type="button" onClick={load} style={ghost}>Refresh</button>
            <Link href="/messages" style={ghost}>Messages</Link>
          </div>
        </section>

        <section style={card}>
          <p style={eyebrow}>Search</p>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, signal id, owner, note..."
            style={input}
          />
        </section>

        {status ? <section style={card}>{status}</section> : null}

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: 16 }}>
          {filtered.map((row, index) => (
            <RecordCard key={`${signalIdOf(row)}-${itemIdOf(row)}-${row.id || index}`} row={row} email={email} mode="routing" />
          ))}
        </section>
      </div>
    </main>
  );
}
