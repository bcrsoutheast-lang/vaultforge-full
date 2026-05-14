"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Row = Record<string, any>;
type Folder = "active" | "saved" | "archived";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const PAYLOAD_START = "VF_PAIN_PAYLOAD_START";
const PAYLOAD_END = "VF_PAIN_PAYLOAD_END";

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
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

function stripPayload(value: unknown) {
  let text = clean(value);

  const start = text.indexOf(PAYLOAD_START);
  if (start !== -1) text = text.slice(0, start).trim();

  const jsonStart = text.indexOf('{"pain_id"');
  if (jsonStart !== -1) text = text.slice(0, jsonStart).trim();

  return text;
}

function extractEmbeddedPayload(row: Row) {
  const sources = [
    row.summary,
    row.description,
    row.notes,
    row.ai_summary,
    row.route_summary,
    row.routing_summary,
    row.metadata?.summary,
    row.metadata?.description,
    row.metadata?.notes,
  ].map(clean);

  for (const source of sources) {
    const start = source.indexOf(PAYLOAD_START);
    const end = source.indexOf(PAYLOAD_END);

    if (start === -1 || end === -1 || end <= start) continue;

    const raw = source.slice(start + PAYLOAD_START.length, end).trim();

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as Row;
    } catch {
      // Try next.
    }
  }

  return {};
}

function merged(row: Row) {
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  const embedded = extractEmbeddedPayload(row);
  return { ...row, ...metadata, ...embedded };
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

function readSet(key: string) {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(clean).filter(Boolean) : []);
  } catch {
    return new Set<string>();
  }
}

function writeSet(key: string, value: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(Array.from(value)));
}

function idOf(row: Row) {
  const r = merged(row);
  return first(r.id, r.pain_id, r.item_id, r.request_id, r.signal_id);
}

function keyOf(row: Row) {
  const r = merged(row);
  return first(r.canonical_event_id, r.signal_id, r.pain_id, r.item_id, r.id, r.title);
}

function signalIdOf(row: Row) {
  const r = merged(row);
  return first(r.signal_id, r.canonical_event_id, r.id, r.pain_id, r.item_id);
}

function ownerOf(row: Row) {
  const r = merged(row);
  return cleanEmail(first(r.owner_email, r.member_email, r.user_email, r.email, r.submitted_by_email));
}

function titleOf(row: Row) {
  const r = merged(row);
  return first(r.title, r.pain_title, r.problem_title, r.headline, "Pain Request");
}

function marketOf(row: Row) {
  const r = merged(row);
  return [first(r.city), first(r.state, r.operating_state)]
    .filter(Boolean)
    .join(", ") || first(r.market, r.location, "Market not listed");
}

function problemType(row: Row) {
  const r = merged(row);
  return first(r.problem_type, r.pain_type, r.asset_type, r.property_type, "Problem");
}

function assetClass(row: Row) {
  const r = merged(row);
  return first(r.asset_class, r.asset_type, r.property_type, "Asset");
}

function urgencyOf(row: Row) {
  const r = merged(row);
  return first(r.urgency, r.urgency_level, r.priority, "Open");
}

function photoOf(row: Row) {
  const r = merged(row);

  const urls = [
    r.main_photo_url,
    r.image_url,
    r.photo_url,
    Array.isArray(r.photo_urls) ? r.photo_urls[0] : "",
    Array.isArray(r.photos) ? (typeof r.photos[0] === "string" ? r.photos[0] : r.photos[0]?.url) : "",
  ];

  return first(...urls);
}

function money(value: unknown) {
  const text = clean(value);
  if (!text) return "Not listed";

  const number = Number(text.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(number)) return text;

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function asking(row: Row) {
  const r = merged(row);
  return money(first(r.asking_price, r.price, r.target_price));
}

function arv(row: Row) {
  const r = merged(row);
  return money(first(r.arv, r.arv_value, r.estimated_value, r.property_value));
}

function repairs(row: Row) {
  const r = merged(row);
  return money(first(r.repair_estimate, r.repairs_needed, r.repair_scope, r.repair_budget));
}

function capital(row: Row) {
  const r = merged(row);
  return money(first(r.capital_needed, r.funding_needed, r.gap_amount));
}

function bottleneck(row: Row) {
  const r = merged(row);
  return first(r.primary_bottleneck, "Owner Review Needed");
}

function fastestMove(row: Row) {
  const r = merged(row);
  return first(r.fastest_path, "Clarify the missing details, then route to the best operator.");
}

function whoShouldSee(row: Row) {
  const r = merged(row);
  const raw = r.who_should_see || r.suggested_resolution_stack;

  if (Array.isArray(raw)) return raw.map(clean).filter(Boolean).join(", ");
  return first(raw, "Owner Review, Operator, Buyer");
}

function cleanSummary(row: Row) {
  const r = merged(row);

  const direct = first(
    r.problem_description,
    r.pain_description,
    r.notes,
    r.note,
    r.message,
    r.description,
    r.summary,
    r.ai_summary
  );

  const text = stripPayload(direct);

  if (!text || text === "No summary yet.") {
    return "This pain room needs more owner context before routing.";
  }

  const parts = text
    .split("|")
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith(PAYLOAD_START) && !part.startsWith("{"));

  if (!parts.length) return text;

  return parts.slice(0, 7).join(" • ");
}

function bestFitSummary(row: Row) {
  const type = problemType(row);
  const asset = assetClass(row);
  const market = marketOf(row);
  const blocker = bottleneck(row);
  const path = fastestMove(row);
  const viewers = whoShouldSee(row);

  return `Best fit: ${viewers}. VaultForge read: ${asset} ${type.toLowerCase()} in ${market}. Main blocker is ${blocker.toLowerCase()}. Best next move: ${path}`;
}

const navBtn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 999,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "white",
  textDecoration: "none",
  fontWeight: 800,
};

const mainBtn: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 48,
  padding: "12px 18px",
  borderRadius: 999,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#08120d",
  textDecoration: "none",
  fontWeight: 950,
  border: 0,
  cursor: "pointer",
};

const ghostBtn: React.CSSProperties = {
  ...mainBtn,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "white",
};

const dangerBtn: React.CSSProperties = {
  ...ghostBtn,
  color: "#fecaca",
  border: "1px solid rgba(248,113,113,.35)",
  background: "rgba(248,113,113,.08)",
};

const chip: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.22)",
  background: "rgba(157,243,191,.08)",
  color: "#9df3bf",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 900,
};

export default function PainFeedPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading Pain Feed...");
  const [email, setEmail] = useState("");
  const [folder, setFolder] = useState<Folder>("active");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  function persistSaved(next: Set<string>) {
    setSavedIds(new Set(next));
    writeSet("vf_pain_saved_ids", next);
  }

  function persistArchived(next: Set<string>) {
    setArchivedIds(new Set(next));
    writeSet("vf_pain_archived_ids", next);
  }

  function persistDeleted(next: Set<string>) {
    setDeletedIds(new Set(next));
    writeSet("vf_pain_deleted_ids", next);
  }

  async function load() {
    const viewer = getEmail();
    const finalEmail = viewer || OWNER_EMAIL;
    const ownerFlag = finalEmail === OWNER_EMAIL ? "1" : "0";

    setEmail(finalEmail);
    setStatus("Loading Pain Feed...");

    try {
      const res = await fetch(
        `/api/pain/feed?email=${encodeURIComponent(finalEmail)}&owner=${ownerFlag}`,
        {
          cache: "no-store",
          credentials: "include",
          headers: {
            "x-vf-email": finalEmail,
            "x-vf-admin": ownerFlag,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Pain Feed API did not return records.");
      }

      const rows = [
        ...(Array.isArray(data.pains) ? data.pains : []),
        ...(Array.isArray(data.items) ? data.items : []),
        ...(Array.isArray(data.signals) ? data.signals : []),
        ...(Array.isArray(data.data) ? data.data : []),
      ];

      const seen = new Set<string>();
      const unique = rows.filter((row) => {
        const key = keyOf(row);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setItems(unique);
      setStatus(unique.length ? "" : "No pain records found. Submit a new Pain Room or refresh after deploy.");
    } catch (error: any) {
      setItems([]);
      setStatus(error?.message || "Could not load Pain Feed.");
    }
  }

  useEffect(() => {
    setSavedIds(readSet("vf_pain_saved_ids"));
    setArchivedIds(readSet("vf_pain_archived_ids"));
    setDeletedIds(readSet("vf_pain_deleted_ids"));
    load();
  }, []);

  function savePain(row: Row) {
    const key = keyOf(row);
    if (!key) return;

    const next = new Set(savedIds);
    next.add(key);
    persistSaved(next);
  }

  function removeSaved(row: Row) {
    const key = keyOf(row);
    if (!key) return;

    const next = new Set(savedIds);
    next.delete(key);
    persistSaved(next);
  }

  function archivePain(row: Row) {
    const key = keyOf(row);
    if (!key) return;

    const nextArchived = new Set(archivedIds);
    nextArchived.add(key);
    persistArchived(nextArchived);

    const nextSaved = new Set(savedIds);
    nextSaved.delete(key);
    persistSaved(nextSaved);
  }

  function restorePain(row: Row) {
    const key = keyOf(row);
    if (!key) return;

    const next = new Set(archivedIds);
    next.delete(key);
    persistArchived(next);
  }

  function deletePain(row: Row) {
    const key = keyOf(row);
    if (!key) return;

    const nextDeleted = new Set(deletedIds);
    nextDeleted.add(key);
    persistDeleted(nextDeleted);

    const nextSaved = new Set(savedIds);
    nextSaved.delete(key);
    persistSaved(nextSaved);

    const nextArchived = new Set(archivedIds);
    nextArchived.delete(key);
    persistArchived(nextArchived);
  }

  const visibleItems = useMemo(() => {
    return items.filter((row) => {
      const key = keyOf(row);
      if (!key) return false;
      if (deletedIds.has(key)) return false;

      const saved = savedIds.has(key);
      const archived = archivedIds.has(key);

      if (folder === "saved") return saved && !archived;
      if (folder === "archived") return archived;
      return !archived;
    });
  }, [items, savedIds, archivedIds, deletedIds, folder]);

  const counts = useMemo(() => {
    const live = items.filter((row) => {
      const key = keyOf(row);
      return key && !deletedIds.has(key);
    });

    return {
      active: live.filter((row) => !archivedIds.has(keyOf(row))).length,
      saved: live.filter((row) => savedIds.has(keyOf(row)) && !archivedIds.has(keyOf(row))).length,
      archived: live.filter((row) => archivedIds.has(keyOf(row))).length,
      showing: visibleItems.length,
    };
  }, [items, visibleItems, savedIds, archivedIds, deletedIds]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
        color: "white",
        padding: "20px 16px 120px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <style>{`
        @media (max-width: 760px) {
          .pain-grid { grid-template-columns: 1fr !important; }
          .pain-actions { display: grid !important; grid-template-columns: 1fr !important; }
          .pain-actions > * { width: 100%; box-sizing: border-box; }
        }
      `}</style>

      <div style={{ width: "min(1350px,100%)", margin: "0 auto" }}>
        <section
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            paddingBottom: 14,
            backdropFilter: "blur(16px)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              background: "rgba(5,10,20,.88)",
              border: "1px solid rgba(232,196,107,.18)",
              borderRadius: 20,
              padding: 12,
            }}
          >
            <Link href="/dashboard" style={navBtn}>Dashboard</Link>
            <Link href="/projects" style={navBtn}>Projects</Link>
            <Link href="/pain" style={navBtn}>Submit Pain</Link>
            <Link href="/messages" style={navBtn}>Messages</Link>
            <button type="button" onClick={load} style={{ ...navBtn, cursor: "pointer" }}>Refresh</button>
          </div>
        </section>

        <section style={{ margin: "18px 0 28px" }}>
          <div
            style={{
              color: "#e8c46b",
              fontWeight: 950,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontSize: 12,
            }}
          >
            VaultForge Problem Solver Intelligence
          </div>

          <h1
            style={{
              fontSize: "clamp(52px,10vw,92px)",
              lineHeight: 0.9,
              margin: "10px 0 16px",
              letterSpacing: "-.07em",
            }}
          >
            Pain Feed
          </h1>

          <p style={{ color: "#cbd5e1", maxWidth: 980, fontSize: 18, lineHeight: 1.5 }}>
            Operational problem rooms for distressed situations, funding gaps,
            contractor issues, stalled projects, exits, tenant issues, and execution bottlenecks.
          </p>

          <div style={{ marginTop: 12, color: "#94a3b8", fontWeight: 800 }}>
            Signed in: {email || "unknown"} · Showing: {counts.showing} · Active: {counts.active} · Saved: {counts.saved} · Archived: {counts.archived}
          </div>

          <div className="pain-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <button type="button" onClick={() => setFolder("active")} style={folder === "active" ? mainBtn : ghostBtn}>Active</button>
            <button type="button" onClick={() => setFolder("saved")} style={folder === "saved" ? mainBtn : ghostBtn}>Saved</button>
            <button type="button" onClick={() => setFolder("archived")} style={folder === "archived" ? mainBtn : ghostBtn}>Archived</button>
          </div>

          {status ? (
            <div
              style={{
                marginTop: 16,
                border: "1px solid rgba(232,196,107,.20)",
                borderRadius: 18,
                padding: 16,
                color: "#f8e7b0",
                background: "rgba(232,196,107,.06)",
              }}
            >
              {status}
            </div>
          ) : null}
        </section>

        <section className="pain-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))", gap: 18 }}>
          {visibleItems.map((row, index) => {
            const id = idOf(row);
            const key = keyOf(row);
            const image = photoOf(row);
            const saved = savedIds.has(key);
            const archived = archivedIds.has(key);

            const contactHref = signalIdOf(row)
              ? `/connect/${encodeURIComponent(signalIdOf(row))}?to=${encodeURIComponent(ownerOf(row))}&source=pain&type=pain&folder=pain&folder_key=pain&item_id=${encodeURIComponent(id)}&title=${encodeURIComponent(titleOf(row))}&subject=${encodeURIComponent(titleOf(row))}`
              : `/messages/new?to=${encodeURIComponent(ownerOf(row))}&source=pain&type=pain&folder=pain&folder_key=pain&item_id=${encodeURIComponent(id)}&title=${encodeURIComponent(titleOf(row))}&subject=${encodeURIComponent(titleOf(row))}`;

            return (
              <article
                key={`${key}-${index}`}
                style={{
                  border: "1px solid rgba(232,196,107,.18)",
                  borderRadius: 28,
                  overflow: "hidden",
                  background: "rgba(255,255,255,.04)",
                  boxShadow: "0 22px 70px rgba(0,0,0,.26)",
                }}
              >
                {image ? (
                  <img
                    src={image}
                    alt={titleOf(row)}
                    style={{ width: "100%", height: 240, objectFit: "cover", display: "block" }}
                  />
                ) : null}

                <div style={{ padding: 22 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    <span style={chip}>{problemType(row)}</span>
                    <span style={chip}>{marketOf(row)}</span>
                    <span style={chip}>{urgencyOf(row)}</span>
                    {saved ? <span style={{ ...chip, color: "#f8e7b0", borderColor: "rgba(232,196,107,.35)", background: "rgba(232,196,107,.10)" }}>Saved</span> : null}
                    {archived ? <span style={{ ...chip, color: "#cbd5e1", borderColor: "rgba(148,163,184,.28)", background: "rgba(148,163,184,.08)" }}>Archived</span> : null}
                  </div>

                  <h2 style={{ fontSize: 32, lineHeight: 1, margin: "0 0 12px" }}>{titleOf(row)}</h2>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                    <Mini label="Asking / Target" value={asking(row)} />
                    <Mini label="Capital Needed" value={capital(row)} />
                    <Mini label="ARV / Value" value={arv(row)} />
                    <Mini label="Repairs / Scope" value={repairs(row)} />
                  </div>

                  <section
                    style={{
                      border: "1px solid rgba(232,196,107,.20)",
                      borderRadius: 18,
                      padding: 14,
                      background: "rgba(232,196,107,.055)",
                      marginBottom: 14,
                    }}
                  >
                    <div style={{ color: "#e8c46b", fontWeight: 950, letterSpacing: ".14em", textTransform: "uppercase", fontSize: 11 }}>
                      AI Best-Fit Summary
                    </div>
                    <p style={{ color: "#dbe4ee", lineHeight: 1.6, margin: "8px 0 0" }}>
                      {bestFitSummary(row)}
                    </p>
                  </section>

                  <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: 18 }}>
                    {cleanSummary(row)}
                  </p>

                  <div className="pain-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link href={contactHref} style={mainBtn}>Contact Owner</Link>
                    <Link href={`/pain-room/${encodeURIComponent(id)}`} style={ghostBtn}>Open Room</Link>

                    {!saved ? (
                      <button type="button" onClick={() => savePain(row)} style={ghostBtn}>Save</button>
                    ) : (
                      <button type="button" onClick={() => removeSaved(row)} style={ghostBtn}>Remove Saved</button>
                    )}

                    {!archived ? (
                      <button type="button" onClick={() => archivePain(row)} style={ghostBtn}>Archive</button>
                    ) : (
                      <button type="button" onClick={() => restorePain(row)} style={ghostBtn}>Restore</button>
                    )}

                    {(saved || archived) ? (
                      <button type="button" onClick={() => deletePain(row)} style={dangerBtn}>Delete</button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.10)",
        borderRadius: 14,
        padding: 10,
        background: "rgba(0,0,0,.15)",
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em" }}>
        {label}
      </div>
      <div style={{ fontWeight: 950, marginTop: 4 }}>{value}</div>
    </div>
  );
}
