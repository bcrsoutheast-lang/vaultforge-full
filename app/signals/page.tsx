"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../../components/VaultForgeMemberNav";

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

function splitList(value: unknown) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  if (typeof value === "string") return value.split(/[,\n|;]/).map(clean).filter(Boolean);
  return [];
}

function signalIdOf(row: Row, fallback = "") {
  const m = meta(row);
  return first(row.signal_id, row.signalId, row.id, m.signal_id, fallback);
}

function itemIdOf(row: Row) {
  const m = meta(row);
  return first(row.item_id, row.itemId, row.pain_id, row.deal_id, row.project_id, m.item_id, m.pain_id, m.deal_id, m.project_id);
}

function titleOf(row: Row) {
  const m = meta(row);
  return first(row.title, row.signal_title, row.pain_title, row.alert_title, row.subject, m.title, m.signal_title, m.pain_title, "VaultForge Signal");
}

function noteOf(row: Row) {
  const m = meta(row);
  return first(row.ai_summary, row.summary, row.note, row.notes, row.description, row.message, row.route_summary, m.ai_summary, m.summary, m.note, m.notes, m.description, m.message, m.route_summary, "Signal room consolidates this opportunity into one operating view.");
}

function urgencyOf(row: Row) {
  const m = meta(row);
  return first(row.urgency, row.urgency_level, row.priority, m.urgency, m.urgency_level, m.priority, "Normal");
}

function statusOf(row: Row) {
  const m = meta(row);
  return first(row.status, row.signal_status, row.routing_status, m.status, m.signal_status, m.routing_status, "New");
}

function marketOf(row: Row) {
  const m = meta(row);
  const city = first(row.city, m.city);
  const state = first(row.state, row.operating_state, row.market, m.state, m.operating_state, m.market);
  return [city, state].filter(Boolean).join(", ") || state || first(row.location, m.location, "Market not listed");
}

function assetOf(row: Row) {
  const m = meta(row);
  return first(row.asset_type, row.property_type, m.asset_type, m.property_type, "Asset");
}

function ownerOf(row: Row) {
  const m = meta(row);
  return cleanEmail(first(row.owner_email, row.member_email, row.user_email, row.submitted_by_email, row.created_by_email, m.owner_email, m.member_email, m.user_email, m.submitted_by_email, m.created_by_email));
}

function photosOf(row: Row) {
  const m = meta(row);
  const values = [
    row.image_url,
    row.photo_url,
    row.primary_photo_url,
    m.image_url,
    m.photo_url,
    ...(Array.isArray(row.photo_urls) ? row.photo_urls : []),
    ...(Array.isArray(row.photos) ? row.photos : []),
    ...(Array.isArray(m.photo_urls) ? m.photo_urls : []),
    ...(Array.isArray(m.photos) ? m.photos : []),
  ];

  return Array.from(
    new Set(
      values
        .map((item: any) => {
          if (typeof item === "string") return clean(item);
          if (item && typeof item === "object") return clean(item.url || item.publicUrl || item.photo_url || item.image_url);
          return "";
        })
        .filter((url) => url.startsWith("http"))
    )
  );
}

function scoreOf(row: Row) {
  const m = meta(row);
  let score = Number(row.signal_score || row.priority_score || row.confidence_score || row.match_score || m.signal_score || m.priority_score || m.confidence_score || m.match_score || 0);

  if (!Number.isFinite(score) || score <= 0) score = 58;

  const urgency = urgencyOf(row).toLowerCase();
  if (urgency.includes("emergency")) score += 22;
  else if (urgency.includes("urgent") || urgency.includes("high")) score += 14;

  if (photosOf(row).length) score += 5;
  if (ownerOf(row)) score += 5;
  if (marketOf(row) !== "Market not listed") score += 5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

function capitalOf(row: Row) {
  const m = meta(row);
  return first(row.capital_needed, row.funding_needed, row.asking_price, row.price, m.capital_needed, m.funding_needed, m.asking_price, m.price, "Not listed");
}

function classificationOf(row: Row) {
  const text = `${titleOf(row)} ${noteOf(row)} ${assetOf(row)} ${urgencyOf(row)}`.toLowerCase();

  if (text.includes("commercial")) return "Commercial Opportunity";
  if (text.includes("land")) return "Land Opportunity";
  if (text.includes("fund") || text.includes("capital") || text.includes("lender")) return "Capital Gap";
  if (text.includes("buyer")) return "Buyer Match";
  if (text.includes("operator") || text.includes("contractor")) return "Operator Needed";
  if (text.includes("permit") || text.includes("city")) return "Permit / City Issue";
  if (text.includes("stalled")) return "Stalled Project";
  if (text.includes("emergency")) return "Emergency Exit";
  return "Distressed / Opportunity Signal";
}

function tagsOf(row: Row) {
  const m = meta(row);
  const raw = [
    ...splitList(row.tags),
    ...splitList(row.ai_tags),
    ...splitList(row.execution_tags),
    ...splitList(m.tags),
    ...splitList(m.ai_tags),
    ...splitList(m.execution_tags),
  ];

  const text = `${titleOf(row)} ${noteOf(row)} ${assetOf(row)} ${urgencyOf(row)}`.toLowerCase();

  if (text.includes("urgent") || text.includes("high") || text.includes("emergency")) raw.push("High Pressure");
  if (text.includes("buyer")) raw.push("Needs Buyer");
  if (text.includes("capital") || text.includes("fund")) raw.push("Capital Gap");
  if (text.includes("operator") || text.includes("contractor")) raw.push("Needs Operator");
  if (text.includes("off-market")) raw.push("Off Market");
  if (text.includes("confidential")) raw.push("Confidential");

  return Array.from(new Set(raw.map(clean).filter(Boolean))).slice(0, 10);
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

function Info({ label, value }: { label: string; value: unknown }) {
  const text = clean(value);
  if (!text) return null;

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,.08)", padding: "11px 0" }}>
      <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 900 }}>
        {label}
      </div>
      <div style={{ marginTop: 5, fontSize: 18, fontWeight: 850, overflowWrap: "anywhere" }}>
        {text}
      </div>
    </div>
  );
}

function ActionBox({ title, body }: { title: string; body: string }) {
  return (
    <div style={glass}>
      <div style={{ color: "#f8e7b0", fontWeight: 950 }}>{title}</div>
      <p style={{ ...muted, marginBottom: 0 }}>{body}</p>
    </div>
  );
}

export default function SignalRoomPage({ params }: { params: { signalId: string } }) {
  const signalId = decodeURIComponent(params.signalId || "");
  const [email, setEmail] = useState("");
  const [row, setRow] = useState<Row | null>(null);
  const [status, setStatus] = useState("Loading signal room...");

  async function load() {
    const viewer = getEmail();
    setEmail(viewer);
    setStatus("Loading signal room...");

    try {
      const urls = [
        `/api/pain/feed?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/routing/actions?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/intelligence/feed?email=${encodeURIComponent(viewer)}&owner=0`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            cache: "no-store",
            headers: { "x-vf-email": viewer || "", "x-vf-admin": "0" },
          });

          const data = await safeJson(res);
          const list = [
            ...(Array.isArray(data.signals) ? data.signals : []),
            ...(Array.isArray(data.pains) ? data.pains : []),
            ...(Array.isArray(data.actions) ? data.actions : []),
            ...(Array.isArray(data.items) ? data.items : []),
            ...(Array.isArray(data.data) ? data.data : []),
          ];

          const match = list.find((item: Row) => signalIdOf(item) === signalId || itemIdOf(item) === signalId || clean(item.id) === signalId);

          if (match) {
            setRow(match);
            setStatus("");
            return;
          }
        } catch {
          // Try next source.
        }
      }

      setRow({ signal_id: signalId, title: "Signal Room", status: "Open", metadata: {} });
      setStatus("Signal source not found yet. Safe room is open.");
    } catch (error: any) {
      setRow({ signal_id: signalId, title: "Signal Room", status: "Open", metadata: {} });
      setStatus(error?.message || "Could not load signal room.");
    }
  }

  useEffect(() => {
    load();
  }, [signalId]);

  const data = row || { signal_id: signalId };
  const actualSignalId = signalIdOf(data, signalId);
  const itemId = itemIdOf(data);
  const owner = ownerOf(data);
  const photos = photosOf(data);
  const score = scoreOf(data);
  const tags = tagsOf(data);

  const messageHref = `/connect/${encodeURIComponent(actualSignalId || signalId)}?email=${encodeURIComponent(email)}${itemId ? `&item_id=${encodeURIComponent(itemId)}` : ""}${owner ? `&to=${encodeURIComponent(owner)}` : ""}&source=signal`;

  const bestAction = owner
    ? "Message the owner first, confirm missing details, then route only to members who match state, asset type, need, and capability."
    : "Confirm owner/submitted-by email, then route the signal through controlled messaging before exposing private contact details.";

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 820px) {
          .vf-grid,
          .vf-two,
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
          title="Signal Room"
          subtitle="One operating room for signal context, photos, actions, routing, and messages."
          active="signals"
        />

        <section style={card}>
          <div className="vf-two" style={{ display: "grid", gridTemplateColumns: "1.25fr .75fr", gap: 20, alignItems: "start" }}>
            <div>
              <div style={eyebrow}>VaultForge Signal Room</div>
              <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
                {titleOf(data)}
              </h1>
              <p style={{ ...muted, fontSize: 20, maxWidth: 860 }}>{noteOf(data)}</p>

              <div style={{ marginTop: 16 }}>
                <span style={chip}>Signal: {actualSignalId || signalId}</span>
                {itemId ? <span style={chip}>Item: {itemId}</span> : null}
                <span style={chip}>Class: {classificationOf(data)}</span>
                <span style={chip}>Market: {marketOf(data)}</span>
              </div>
            </div>

            <div style={{ ...glass, background: "rgba(0,0,0,.20)" }}>
              <div style={eyebrow}>Signal Score</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 14 }}>
                <div style={{ fontSize: 72, lineHeight: 1, fontWeight: 1000, color: "#f8e7b0" }}>{score}</div>
                <div style={{ color: "#cbd5e1", marginBottom: 10, fontWeight: 850 }}>/ 100</div>
              </div>
              <div style={{ height: 14, borderRadius: 999, background: "rgba(255,255,255,.14)", overflow: "hidden", border: "1px solid rgba(255,255,255,.10)" }}>
                <div style={{ width: `${score}%`, height: "100%", background: "linear-gradient(90deg,#ff4d4d,#f8e7b0,#9df3bf,#38bdf8)" }} />
              </div>
              <p style={{ ...muted, marginBottom: 0 }}>Score is inferred from urgency, owner connection, market, photos, and record completeness.</p>
            </div>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/signals" style={ghost}>All Signals</Link>
            <Link href={`/routing-room/${encodeURIComponent(actualSignalId || signalId)}`} style={ghost}>Routing Room</Link>
            <Link href={messageHref} style={button}>Message Owner</Link>
            <button type="button" onClick={load} style={ghost}>Refresh</button>
          </div>
        </section>

        <section className="vf-three" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 18 }}>
          <section style={card}>
            <div style={eyebrow}>Best Next Action</div>
            <p style={{ ...muted, fontSize: 18 }}>{bestAction}</p>
          </section>

          <section style={card}>
            <div style={eyebrow}>Suggested Member Type</div>
            <div style={{ marginTop: 12 }}>
              {[
                classificationOf(data).includes("Capital") ? "Lender / Capital" : "",
                classificationOf(data).includes("Buyer") ? "Buyer" : "",
                classificationOf(data).includes("Operator") ? "Operator / Contractor" : "",
                classificationOf(data).includes("Land") ? "Builder / Land Buyer" : "",
                classificationOf(data).includes("Commercial") ? "Commercial Buyer / Operator" : "",
                "Owner Review",
              ].filter(Boolean).map((item) => <span key={item} style={chip}>{item}</span>)}
            </div>
          </section>

          <section style={card}>
            <div style={eyebrow}>Risk / Pressure Tags</div>
            <div style={{ marginTop: 12 }}>
              {(tags.length ? tags : ["Needs Review", "Controlled Contact", "Route Carefully"]).map((tag) => <span key={tag} style={chip}>{tag}</span>)}
            </div>
          </section>
        </section>

        <section className="vf-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Signal Overview</h2>
            <Info label="Classification" value={classificationOf(data)} />
            <Info label="Asset" value={assetOf(data)} />
            <Info label="Market" value={marketOf(data)} />
            <Info label="Urgency" value={urgencyOf(data)} />
            <Info label="Status" value={statusOf(data)} />
            <Info label="Capital / Price" value={capitalOf(data)} />
            <Info label="Owner" value={owner || "Owner fallback"} />
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Execution Path</h2>
            <div style={{ display: "grid", gap: 12 }}>
              <ActionBox title="1. Verify" body="Confirm title, market, asset type, owner/submitted-by email, and any missing critical details." />
              <ActionBox title="2. Message" body="Use Message Owner to keep communication controlled and tied to this signal." />
              <ActionBox title="3. Route" body="Open Routing Room and match only to members with correct state, role, capital, or operator fit." />
              <ActionBox title="4. Execute" body="Move accepted responses into introductions, messages, activity, and project workstations." />
            </div>
          </section>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Photos / Asset Context</h2>
          {photos.length ? (
            <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
              {photos.map((url, index) => (
                <div key={`${url}-${index}`} style={{ borderRadius: 22, overflow: "hidden", border: "1px solid rgba(232,196,107,.22)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`VaultForge signal asset ${index + 1}`}
                    style={{ width: "100%", height: 260, objectFit: "cover", display: "block" }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div style={glass}>
              <p style={{ ...muted, margin: 0 }}>
                No valid photos connected yet. This room will not show broken image boxes. Once Pain/Profile/Project upload saves public URLs, they appear here automatically.
              </p>
            </div>
          )}
        </section>

        <section className="vf-three" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 18 }}>
          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Routing Actions</h2>
            <p style={muted}>Use Routing Room to generate or review member-fit routing for this signal.</p>
            <Link href={`/routing-room/${encodeURIComponent(actualSignalId || signalId)}`} style={button}>Open Routing Room</Link>
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Messages</h2>
            <p style={muted}>Use Message Owner to create the first controlled message thread for this signal.</p>
            <Link href={messageHref} style={button}>Message Owner</Link>
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Activity</h2>
            <p style={muted}>Activity will show movement when messages, routing, introductions, or project actions connect.</p>
            <Link href="/activity" style={button}>Open Activity</Link>
          </section>
        </section>

        {status ? <section style={card}>{status}</section> : null}
      </div>
    </main>
  );
}
