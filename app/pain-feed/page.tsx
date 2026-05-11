"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type PainItem = Record<string, any>;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(181,92,255,.18), transparent 24%), radial-gradient(circle at bottom right, rgba(157,243,191,.13), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1220, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.34)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.035))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.34)",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.10), rgba(232,196,107,.055), rgba(255,255,255,.03))",
  borderRadius: 28,
  padding: 22,
  marginBottom: 18,
  boxShadow: "0 26px 80px rgba(0,0,0,.30)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
  gap: 16,
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#06100a",
  border: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
  margin: "6px 6px 0 0",
  minHeight: 46,
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.055)",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  textDecoration: "none",
  cursor: "pointer",
  margin: "6px 6px 0 0",
  minHeight: 46,
};

const danger: React.CSSProperties = {
  ...ghost,
  border: "1px solid rgba(255,120,120,.38)",
  color: "#ffd0d0",
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.25)",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  fontSize: 13,
  margin: "0 7px 7px 0",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.075)",
  color: "white",
  padding: 15,
  fontSize: 16,
};

const eyebrow: React.CSSProperties = {
  color: "#9df3bf",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.72)",
  lineHeight: 1.55,
};

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
  return cleanEmail(
    localStorage.getItem("vf_email") ||
      sessionStorage.getItem("vf_email") ||
      readCookie("vf_email") ||
      readCookie("vf_admin_email") ||
      ""
  );
}

function isOwner(email: string) {
  return email === OWNER_EMAIL || readCookie("vf_admin") === "1" || readCookie("isAdmin") === "true";
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function titleOf(item: PainItem) {
  return first(item.title, item.pain_label, item.name, "Pain Signal");
}

function noteOf(item: PainItem) {
  return first(item.note, item.notes, item.description, item.message, item.route_summary, item.metadata?.route_summary, "Pain signal routed into VaultForge.");
}

function idOf(item: PainItem) {
  return first(item.id, item.pain_id, item.uuid, item.metadata?.pain_id);
}

function signalIdOf(item: PainItem) {
  return first(item.signal_id, item.related_alert_id, item.alert_id, item.metadata?.signal_id);
}

function priorityOf(item: PainItem) {
  return first(item.priority, item.urgency, item.metadata?.priority, "medium").toLowerCase();
}

function marketOf(item: PainItem) {
  return first(item.market, [item.city, item.state].filter(Boolean).join(", "), item.state, item.metadata?.market);
}

function imageOf(item: PainItem) {
  return first(item.image_url, item.photo_url, item.primary_photo_url, item.metadata?.image_url, item.metadata?.photo_urls?.[0]);
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function PainFeedPage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [items, setItems] = useState<PainItem[]>([]);
  const [status, setStatus] = useState("Loading pain feed...");
  const [search, setSearch] = useState("");

  async function load() {
    setStatus("Loading pain feed...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentEmail) {
        setStatus("Login email not found. Please log in again.");
        return;
      }

      const res = await fetch(`/api/pain/feed?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": currentEmail,
          "x-vf-admin": currentOwner ? "1" : "0",
        },
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load pain feed.");
      }

      const realItems = Array.isArray(data.pains) ? data.pains : [];

      setItems(realItems);
      setStatus(realItems.length ? "" : "No real pain records found yet. Submit a new Pain Button item first.");
    } catch (error: any) {
      setItems([]);
      setStatus(error?.message || "Could not load pain feed.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) =>
      [titleOf(item), noteOf(item), marketOf(item), priorityOf(item), idOf(item), signalIdOf(item)]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [items, search]);

  const urgent = items.filter((item) => priorityOf(item) === "urgent").length;
  const high = items.filter((item) => priorityOf(item) === "high").length;

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        input::placeholder { color: rgba(255,255,255,.48); }
        @media (max-width: 760px) { a, button { width: 100%; box-sizing: border-box; } }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav title="Pain Feed" subtitle="Real pain records, routing pressure, and operational follow-up" />

        <section style={hero}>
          <div style={eyebrow}>VaultForge Pain Feed</div>
          <h1 style={{ fontSize: "clamp(56px,12vw,104px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            Pain signal command feed.
          </h1>
          <p style={{ ...muted, fontSize: 21 }}>
            This feed shows real saved Pain Button records from Supabase.
          </p>

          <div>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Pain Signals: {items.length}</span>
            <span style={chip}>Urgent: {urgent}</span>
            <span style={chip}>High: {high}</span>
            <span style={chip}>{owner ? "Owner View" : "Member View"}</span>
          </div>

          <button type="button" onClick={load} style={btn}>Refresh Pain Feed</button>
          <Link href="/pain" style={btn}>Submit New Pain</Link>
          <Link href="/activity" style={ghost}>Activity</Link>
          <Link href="/alerts" style={ghost}>Alerts</Link>
          <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/logout" style={danger}>Logout</Link>
        </section>

        <section style={hero}>
          <div style={eyebrow}>Search Pain Signals</div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search pain title, market, signal id, priority..."
            style={input}
          />
        </section>

        {status && <section style={hero}>{status}</section>}

        <section style={grid}>
          {filtered.map((item, index) => {
            const painId = idOf(item);
            const signalId = signalIdOf(item);
            const image = imageOf(item);
            const priority = priorityOf(item);

            return (
              <article key={`${painId}-${signalId}-${index}`} style={card}>
                <div style={eyebrow}>{priority} · Pain Signal</div>

                {image && (
                  <img
                    src={image}
                    alt={titleOf(item)}
                    style={{
                      width: "100%",
                      height: 190,
                      objectFit: "cover",
                      borderRadius: 20,
                      border: "1px solid rgba(255,255,255,.14)",
                      marginBottom: 14,
                    }}
                  />
                )}

                <h2 style={{ fontSize: 32, lineHeight: 1.05, margin: "0 0 12px" }}>{titleOf(item)}</h2>
                <p style={{ ...muted, fontSize: 17 }}>{noteOf(item)}</p>

                <div>
                  {marketOf(item) && <span style={chip}>{marketOf(item)}</span>}
                  {painId && <span style={chip}>Pain: {painId}</span>}
                  {signalId && <span style={chip}>Signal: {signalId}</span>}
                </div>

                <div>
                  {painId && <Link href={`/pain-room/${encodeURIComponent(painId)}`} style={btn}>Open Pain Room</Link>}
                  {signalId && <Link href={`/signals/${encodeURIComponent(signalId)}`} style={ghost}>Open Signal</Link>}
                  {signalId && <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={ghost}>Routing Room</Link>}
                  <Link href={`/messages/new?to=${encodeURIComponent(OWNER_EMAIL)}&item_id=${encodeURIComponent(painId || "")}&signal_id=${encodeURIComponent(signalId || "")}`} style={ghost}>Message Owner</Link>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
