"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Signal = Record<string, any>;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

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

  const url = new URL(window.location.href);
  const urlEmail = cleanEmail(url.searchParams.get("email"));
  if (urlEmail.includes("@")) return urlEmail;

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const value = cleanEmail(window.localStorage.getItem(key) || window.sessionStorage.getItem(key));
    if (value.includes("@")) return value;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

function isOwner(email: string) {
  return email === OWNER_EMAIL || readCookie("vf_admin") === "1" || readCookie("isAdmin") === "true";
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

function titleOf(signal: Signal) {
  return first(signal.title, signal.signal_title, signal.headline, signal.name, signal.pain_label, "VaultForge Signal");
}

function noteOf(signal: Signal) {
  return first(
    signal.note,
    signal.notes,
    signal.summary,
    signal.description,
    signal.message,
    signal.route_summary,
    signal.help_requested,
    "Signal context pending."
  );
}

function idOf(signal: Signal) {
  return first(signal.signal_id, signal.id, signal.item_id, signal.pain_id, signal.alert_id);
}

function ownerOf(signal: Signal) {
  return cleanEmail(
    first(
      signal.owner_email,
      signal.created_by_email,
      signal.submitted_by_email,
      signal.creator_email,
      signal.submitted_by,
      signal.user_email,
      signal.member_email,
      signal.email,
      OWNER_EMAIL
    )
  );
}

function priorityOf(signal: Signal) {
  return first(signal.priority, signal.urgency, signal.urgency_level, "medium").toLowerCase();
}

function marketOf(signal: Signal) {
  return first(signal.market, [signal.city, signal.state].filter(Boolean).join(", "), signal.location, signal.address, "Market pending");
}

function scoreOf(signal: Signal) {
  const raw = Number(first(signal.score, signal.signal_score, signal.confidence_score));
  if (Number.isFinite(raw) && raw > 0) return Math.max(0, Math.min(100, Math.round(raw)));

  let score = 52;
  const priority = priorityOf(signal);
  if (priority.includes("urgent")) score += 25;
  if (priority.includes("high")) score += 15;
  if (marketOf(signal) !== "Market pending") score += 6;
  if (ownerOf(signal) && ownerOf(signal) !== OWNER_EMAIL) score += 8;
  if (first(signal.image_url, signal.photo_url)) score += 5;

  return Math.max(0, Math.min(100, score));
}

function priorityColor(priority: string) {
  if (priority.includes("urgent") || priority.includes("critical")) return "#ef4444";
  if (priority.includes("high")) return "#e8c46b";
  return "#cbd5e1";
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 30%), radial-gradient(circle at bottom right, rgba(148,163,184,.10), transparent 32%), linear-gradient(180deg,#020303,#07090d 50%,#020303)",
  color: "white",
  padding: "22px 16px 82px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shell: React.CSSProperties = {
  width: "min(1240px,100%)",
  margin: "0 auto",
};

const nav: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 26,
  padding: 18,
  background: "linear-gradient(135deg,rgba(255,255,255,.07),rgba(255,255,255,.025))",
  marginBottom: 16,
};

const navGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
  gap: 10,
  marginTop: 14,
};

const navLink: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.055)",
  borderRadius: 15,
  padding: "13px 14px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 30,
  background:
    "linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.026))",
  boxShadow: "0 28px 90px rgba(0,0,0,.38)",
  padding: 24,
  marginBottom: 16,
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  fontSize: 12,
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  margin: "0 0 10px",
};

const title: React.CSSProperties = {
  fontSize: "clamp(44px,8vw,92px)",
  lineHeight: 0.88,
  margin: 0,
  letterSpacing: "-.06em",
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
};

const action: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 46,
  padding: "0 16px",
  borderRadius: 15,
  border: "1px solid rgba(255,255,255,.14)",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  background: "rgba(255,255,255,.055)",
  cursor: "pointer",
};

const goldAction: React.CSSProperties = {
  ...action,
  color: "#101010",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  border: "1px solid rgba(232,196,107,.7)",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 54,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.07)",
  color: "white",
  padding: "0 16px",
  fontSize: 16,
  outline: "none",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 24,
  background: "linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.026))",
  boxShadow: "0 20px 70px rgba(0,0,0,.25)",
  padding: 20,
  color: "white",
  textDecoration: "none",
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(255,255,255,.14)",
  color: "#e5e7eb",
  background: "rgba(255,255,255,.055)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  fontSize: 12,
  margin: "0 7px 7px 0",
};

export default function SignalsPage() {
  const [email, setEmail] = useState("");
  const [signals, setSignals] = useState<Signal[]>([]);
  const [status, setStatus] = useState("Loading signals...");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadSignals() {
    setLoading(true);
    setStatus("Loading signals...");

    const activeEmail = getEmail();
    const owner = isOwner(activeEmail);
    setEmail(activeEmail);

    if (!activeEmail) {
      setSignals([]);
      setStatus("Login email not detected. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const candidates = [
        `/api/pain/feed?email=${encodeURIComponent(activeEmail)}&owner=${owner ? "1" : "0"}`,
        `/api/routing/actions?email=${encodeURIComponent(activeEmail)}&owner=${owner ? "1" : "0"}`,
      ];

      const collected: Signal[] = [];

      for (const url of candidates) {
        try {
          const res = await fetch(url, {
            cache: "no-store",
            headers: {
              "x-vf-email": activeEmail,
              "x-vf-admin": owner ? "1" : "0",
            },
          });

          const json = await safeJson(res);
          const rows = Array.isArray(json.pains)
            ? json.pains
            : Array.isArray(json.signals)
            ? json.signals
            : Array.isArray(json.actions)
            ? json.actions
            : Array.isArray(json.data)
            ? json.data
            : [];

          collected.push(...rows);
        } catch {
          // Keep trying available APIs.
        }
      }

      const seen = new Set<string>();
      const unique = collected
        .filter((signal) => {
          const id = idOf(signal);
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        })
        .sort((a, b) => scoreOf(b) - scoreOf(a));

      setSignals(unique);
      setStatus(unique.length ? "" : "No signals found yet. Submit Pain or Create a project first.");
    } catch (error: any) {
      setSignals([]);
      setStatus(error?.message || "Could not load signals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSignals();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return signals;

    return signals.filter((signal) =>
      [
        titleOf(signal),
        noteOf(signal),
        idOf(signal),
        ownerOf(signal),
        priorityOf(signal),
        marketOf(signal),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [signals, search]);

  const urgent = signals.filter((signal) => priorityOf(signal).includes("urgent")).length;
  const high = signals.filter((signal) => priorityOf(signal).includes("high")).length;
  const normal = Math.max(0, signals.length - urgent - high);

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        input::placeholder {
          color: rgba(255,255,255,.42);
        }

        @media (max-width: 760px) {
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

      <div style={shell}>
        <section style={nav}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <p style={eyebrow}>VAULTFORGE SIGNALS</p>
              <strong style={{ fontSize: 24 }}>Signals</strong>
              <p style={{ ...muted, margin: "6px 0 0" }}>
                Signal-first operating feed. Opens exact Signal Rooms.
              </p>
            </div>
            <span style={goldAction}>Signed in: {email || "not detected"}</span>
          </div>

          <div style={navGrid}>
            <Link href="/dashboard" style={navLink}>Dashboard <span>→</span></Link>
            <Link href="/intelligence" style={navLink}>Intelligence <span>→</span></Link>
            <Link href="/pain-feed" style={navLink}>Pain Feed <span>→</span></Link>
            <Link href="/routing-inbox" style={navLink}>Routing <span>→</span></Link>
            <Link href="/alerts" style={navLink}>Alerts <span>→</span></Link>
            <Link href="/messages" style={navLink}>Messages <span>→</span></Link>
            <Link href="/members" style={navLink}>Members <span>→</span></Link>
            <Link href="/logout" style={{ ...navLink, color: "#fecaca", border: "1px solid rgba(239,68,68,.34)" }}>Logout <span>→</span></Link>
          </div>
        </section>

        <section style={hero}>
          <p style={eyebrow}>SIGNAL COMMAND FEED</p>
          <h1 style={title}>Open the room. Move the deal.</h1>
          <p style={{ ...muted, maxWidth: 820, fontSize: 18, marginTop: 16 }}>
            Signals pull from Pain and routing records. Every card opens an exact Signal Room with owner, photos, AI notes, routing, messages, activity, and alerts.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signals: {signals.length}</span>
            <span style={chip}>Urgent: {urgent}</span>
            <span style={chip}>High: {high}</span>
            <span style={chip}>Normal: {normal}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            <button type="button" onClick={loadSignals} style={goldAction}>
              {loading ? "Refreshing..." : "Refresh Signals"}
            </button>
            <Link href="/pain" style={goldAction}>Submit Pain</Link>
            <Link href="/intelligence" style={action}>Intelligence</Link>
            <Link href="/dashboard" style={action}>Dashboard</Link>
          </div>
        </section>

        <section style={hero}>
          <p style={eyebrow}>SEARCH SIGNALS</p>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search signal, owner, market, priority, or context..."
            style={input}
          />
        </section>

        {status ? (
          <section style={hero}>
            <p style={{ ...muted, margin: 0 }}>{status}</p>
          </section>
        ) : null}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>
          {filtered.map((signal, index) => {
            const id = idOf(signal);
            const priority = priorityOf(signal);
            const accent = priorityColor(priority);
            const owner = ownerOf(signal);
            const score = scoreOf(signal);

            return (
              <Link key={`${id}-${index}`} href={`/signals/${encodeURIComponent(id)}`} style={{ ...card, borderColor: `${accent}66` }}>
                <p style={{ ...eyebrow, color: accent }}>{priority} · score {score}</p>
                <h2 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 10px" }}>{titleOf(signal)}</h2>
                <p style={{ ...muted, fontSize: 16 }}>{noteOf(signal)}</p>

                <div style={{ marginTop: 12 }}>
                  <span style={chip}>Signal: {id}</span>
                  <span style={chip}>Owner: {owner}</span>
                  <span style={chip}>Market: {marketOf(signal)}</span>
                </div>

                <span style={{ ...goldAction, marginTop: 12 }}>Open Signal Room →</span>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
