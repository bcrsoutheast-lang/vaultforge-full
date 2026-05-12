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

function projectIdOf(row: Row, fallback = "") {
  const m = meta(row);
  return first(row.id, row.project_id, row.item_id, row.itemId, m.id, m.project_id, m.item_id, fallback);
}

function signalIdOf(row: Row) {
  const m = meta(row);
  return first(row.signal_id, row.signalId, m.signal_id);
}

function titleOf(row: Row) {
  const m = meta(row);
  return first(row.title, row.project_title, row.name, row.address, m.title, m.project_title, m.name, m.address, "VaultForge Project Room");
}

function noteOf(row: Row) {
  const m = meta(row);
  return first(row.summary, row.description, row.notes, row.note, row.strategy_notes, row.message, m.summary, m.description, m.notes, m.note, m.strategy_notes, "Project room ready for review.");
}

function statusOf(row: Row) {
  const m = meta(row);
  return first(row.status, row.project_status, row.stage, m.status, m.project_status, m.stage, "Open");
}

function assetOf(row: Row) {
  const m = meta(row);
  return first(row.asset_type, row.property_type, m.asset_type, m.property_type, "Asset");
}

function marketOf(row: Row) {
  const m = meta(row);
  const city = first(row.city, m.city);
  const state = first(row.state, row.market, row.operating_state, m.state, m.market, m.operating_state);
  return [city, state].filter(Boolean).join(", ") || state || first(row.location, m.location, "Market not listed");
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

export default function ProjectRoomPage({ params }: { params: { projectId: string } }) {
  const projectId = decodeURIComponent(params.projectId || "");
  const [email, setEmail] = useState("");
  const [row, setRow] = useState<Row | null>(null);
  const [status, setStatus] = useState("Loading project room...");

  async function load() {
    const viewer = getEmail();
    setEmail(viewer);
    setStatus("Loading project room...");

    try {
      const urls = [
        `/api/projects?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/pain/feed?email=${encodeURIComponent(viewer)}&owner=0`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            cache: "no-store",
            headers: { "x-vf-email": viewer || "", "x-vf-admin": "0" },
          });

          const data = await safeJson(res);
          const list = [
            ...(Array.isArray(data.projects) ? data.projects : []),
            ...(Array.isArray(data.items) ? data.items : []),
            ...(Array.isArray(data.pains) ? data.pains : []),
            ...(Array.isArray(data.data) ? data.data : []),
          ];

          const match = list.find((item: Row) => projectIdOf(item) === projectId || signalIdOf(item) === projectId);

          if (match) {
            setRow(match);
            setStatus("");
            return;
          }
        } catch {
          // Try next source.
        }
      }

      setRow({ id: projectId, title: "Project Room", status: "Open", metadata: {} });
      setStatus("Project source not found yet. Safe room is open.");
    } catch (error: any) {
      setRow({ id: projectId, title: "Project Room", status: "Open", metadata: {} });
      setStatus(error?.message || "Could not load project room.");
    }
  }

  useEffect(() => {
    load();
  }, [projectId]);

  const data = row || { id: projectId };
  const signalId = signalIdOf(data);
  const owner = ownerOf(data);
  const photos = photosOf(data);

  const messageHref = signalId
    ? `/connect/${encodeURIComponent(signalId)}?email=${encodeURIComponent(email)}&item_id=${encodeURIComponent(projectIdOf(data, projectId))}${owner ? `&to=${encodeURIComponent(owner)}` : ""}&source=project`
    : `/messages/new?email=${encodeURIComponent(email)}&item_id=${encodeURIComponent(projectIdOf(data, projectId))}&source=project`;

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
          title="Project Room"
          subtitle="Safe project/workstation bridge with owner contact and signal context."
          active="projects"
        />

        <section style={card}>
          <div style={eyebrow}>VaultForge Project Workstation</div>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            {titleOf(data)}
          </h1>
          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>{noteOf(data)}</p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Project: {projectIdOf(data, projectId)}</span>
            {signalId ? <span style={chip}>Signal: {signalId}</span> : null}
            <span style={chip}>Status: {statusOf(data)}</span>
            <span style={chip}>Market: {marketOf(data)}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/projects" style={ghost}>All Projects</Link>
            {signalId ? <Link href={`/signals/${encodeURIComponent(signalId)}`} style={ghost}>Open Signal</Link> : null}
            {signalId ? <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={ghost}>Routing Room</Link> : null}
            <Link href={messageHref} style={button}>Message Owner</Link>
            <button type="button" onClick={load} style={ghost}>Refresh</button>
          </div>
        </section>

        <section className="vf-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Project Details</h2>
            <Info label="Asset Type" value={assetOf(data)} />
            <Info label="Market" value={marketOf(data)} />
            <Info label="Owner" value={owner || "Owner fallback"} />
            <Info label="Status" value={statusOf(data)} />
            <Info label="Signal ID" value={signalId || "Not linked"} />
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Execution Notes</h2>
            <div style={glass}>
              <p style={{ ...muted, margin: 0 }}>
                Keep the project tied to its signal, routing room, messages, and activity.
                This room is a safe bridge so project cards never open into a blank or broken route.
              </p>
            </div>
          </section>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Photos / Context</h2>
          {photos.length ? (
            <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
              {photos.map((url, index) => (
                <div key={`${url}-${index}`} style={{ borderRadius: 22, overflow: "hidden", border: "1px solid rgba(232,196,107,.22)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Project asset ${index + 1}`} style={{ width: "100%", height: 260, objectFit: "cover", display: "block" }} />
                </div>
              ))}
            </div>
          ) : (
            <p style={muted}>No valid project photos connected yet.</p>
          )}
        </section>

        {status ? <section style={card}>{status}</section> : null}
      </div>
    </main>
  );
}
