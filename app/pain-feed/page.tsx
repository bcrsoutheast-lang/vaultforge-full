"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Row = Record<string, any>;
type FolderMode = "active" | "saved" | "archived";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

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

function meta(row: Row) {
  return typeof row?.metadata === "object" && row.metadata ? row.metadata : {};
}

function field(row: Row, ...keys: string[]) {
  const m = meta(row);
  const values: unknown[] = [];

  for (const key of keys) {
    values.push(row[key]);
    values.push(m[key]);
  }

  return first(...values);
}

function parseArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(clean).filter(Boolean);
  } catch {
    // Continue.
  }

  return text
    .split(/[,\n|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function photosOf(row: Row) {
  const m = meta(row);

  const values = [
    row.main_photo_url,
    row.image_url,
    row.photo_url,
    row.primary_photo_url,
    m.main_photo_url,
    m.image_url,
    m.photo_url,
    m.primary_photo_url,
    ...parseArray(row.photo_urls),
    ...parseArray(row.photos),
    ...parseArray(m.photo_urls),
    ...parseArray(m.photos),
  ];

  return Array.from(
    new Set(
      values
        .map((item: any) => {
          if (typeof item === "string") return clean(item);
          if (item && typeof item === "object") {
            return clean(item.url || item.publicUrl || item.public_url || item.photo_url || item.image_url);
          }
          return "";
        })
        .filter((url) => url.startsWith("http"))
    )
  );
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
  return field(row, "pain_id", "request_id", "item_id", "id", "signal_id", "alert_id");
}

function signalIdOf(row: Row) {
  return field(row, "signal_id", "signalId", "alert_id", "routing_id");
}

function canonicalKey(row: Row) {
  return (
    field(row, "canonical_event_id") ||
    field(row, "pain_id") ||
    field(row, "request_id") ||
    field(row, "item_id") ||
    field(row, "signal_id") ||
    field(row, "id") ||
    `${titleOf(row)}-${marketOf(row)}-${ownerOf(row)}`
  );
}

function titleOf(row: Row) {
  return field(row, "title", "pain_title", "problem_title", "headline", "name", "address") || "Pain Request";
}

function ownerOf(row: Row) {
  return cleanEmail(field(row, "owner_email", "member_email", "user_email", "submitted_by_email", "created_by_email", "email"));
}

function marketOf(row: Row) {
  const city = field(row, "city");
  const state = field(row, "state", "market", "operating_state");

  return [city, state].filter(Boolean).join(", ") || field(row, "location", "address") || "Market not listed";
}

function problemType(row: Row) {
  return field(row, "pain_type", "problem_type", "asset_type", "property_type", "deal_type") || "Problem";
}

function urgencyOf(row: Row) {
  return field(row, "urgency", "urgency_level", "priority", "timeline_pressure") || "Not listed";
}

function statusOf(row: Row) {
  return field(row, "status", "pain_status", "routing_status", "stage") || "Open";
}

function summaryOf(row: Row) {
  return (
    field(
      row,
      "problem_description",
      "pain_description",
      "description",
      "summary",
      "note",
      "notes",
      "message",
      "help_requested",
      "requested_help",
      "route_summary",
      "ai_route_summary",
      "routing_summary"
    ) || "Pain details are pending."
  );
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function pressureScore(row: Row) {
  const text = `${summaryOf(row)} ${urgencyOf(row)} ${field(row, "distress_signals", "pressure_signals", "seller_situation")}`.toLowerCase();
  let score = 34;

  if (text.includes("urgent")) score += 25;
  if (text.includes("foreclosure")) score += 28;
  if (text.includes("funding gap")) score += 22;
  if (text.includes("stalled")) score += 18;
  if (text.includes("contractor")) score += 12;
  if (text.includes("tenant")) score += 12;
  if (text.includes("permit") || text.includes("city") || text.includes("code")) score += 15;
  if (text.includes("fast close") || text.includes("deadline")) score += 20;

  return clamp(score);
}

function bottleneck(row: Row) {
  const text = `${summaryOf(row)} ${field(row, "requested_help", "help_requested", "routing_needs", "needs")} ${field(row, "distress_signals")}`.toLowerCase();

  if (text.includes("funding") || text.includes("capital") || text.includes("lender")) return "Capital / Funding Gap";
  if (text.includes("contractor") || text.includes("repair") || text.includes("construction")) return "Contractor / Execution Gap";
  if (text.includes("buyer") || text.includes("sell") || text.includes("disposition")) return "Buyer / Exit Gap";
  if (text.includes("tenant") || text.includes("occupancy")) return "Tenant / Occupancy Issue";
  if (text.includes("permit") || text.includes("city") || text.includes("code")) return "Permit / City Issue";
  if (text.includes("partner") || text.includes("jv")) return "Partner / Operator Gap";

  return "Owner Review Needed";
}

function fastestMove(row: Row) {
  const b = bottleneck(row);

  if (b.includes("Capital")) return "Confirm numbers and route to private lender or JV capital.";
  if (b.includes("Contractor")) return "Collect scope/photos and route to contractor/operator.";
  if (b.includes("Buyer")) return "Package the asset and route to qualified buyer.";
  if (b.includes("Tenant")) return "Clarify occupancy, access, and legal constraints.";
  if (b.includes("Permit")) return "Identify municipality and route to local operator.";
  if (b.includes("Partner")) return "Define role, capital, control, and split.";

  return "Clarify missing details, then route to the best operator type.";
}

function missingInfo(row: Row) {
  const missing: string[] = [];

  if (!field(row, "requested_help", "help_requested", "routing_needs", "needs")) missing.push("specific help needed");
  if (!field(row, "urgency", "urgency_level", "timeline", "deadline")) missing.push("timeline");
  if (!field(row, "city", "state", "market")) missing.push("market");
  if (!field(row, "asset_type", "property_type", "pain_type", "problem_type")) missing.push("problem type");
  if (!photosOf(row).length) missing.push("photos/files");

  return missing;
}

function completenessScore(row: Row) {
  let score = 0;

  const keys = [
    "pain_id",
    "request_id",
    "item_id",
    "title",
    "pain_title",
    "problem_description",
    "pain_description",
    "description",
    "summary",
    "requested_help",
    "help_requested",
    "urgency",
    "urgency_level",
    "city",
    "state",
    "asset_type",
    "property_type",
    "pain_type",
    "problem_type",
  ];

  for (const key of keys) {
    if (field(row, key)) score += 1;
  }

  if (photosOf(row).length) score += 5;
  if ((field(row, "source_table") || row._source_table || "").toLowerCase().includes("pain")) score += 20;

  return score;
}

function mergeRows(primary: Row, secondary: Row) {
  const primaryMeta = meta(primary);
  const secondaryMeta = meta(secondary);

  const merged: Row = {
    ...secondary,
    ...primary,
    metadata: {
      ...secondaryMeta,
      ...primaryMeta,
    },
  };

  const photos = Array.from(
    new Set([
      ...photosOf(secondary),
      ...photosOf(primary),
      ...parseArray(secondary.photo_urls),
      ...parseArray(primary.photo_urls),
      ...parseArray(secondaryMeta.photo_urls),
      ...parseArray(primaryMeta.photo_urls),
    ].map(clean).filter(Boolean))
  );

  if (photos.length) {
    merged.photo_urls = photos;
    merged.photos = photos.map((url) => ({ url }));
    merged.main_photo_url = first(primary.main_photo_url, secondary.main_photo_url, photos[0]);
    merged.image_url = first(primary.image_url, secondary.image_url, merged.main_photo_url);
    merged.photo_url = first(primary.photo_url, secondary.photo_url, merged.main_photo_url);
  }

  return merged;
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.13), transparent 28%), radial-gradient(circle at 92% 12%, rgba(248,113,113,.12), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
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
  background: "linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const glass: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 22,
  padding: 18,
  background: "rgba(255,255,255,.045)",
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

const danger: React.CSSProperties = {
  ...ghost,
  borderColor: "rgba(248,113,113,.35)",
  color: "#fecaca",
  background: "rgba(248,113,113,.08)",
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

function Metric({ labelText, value }: { labelText: string; value: string }) {
  return (
    <section style={glass}>
      <div style={label}>{labelText}</div>
      <div style={{ fontSize: 48, fontWeight: 1000, lineHeight: 1, marginTop: 12 }}>{value}</div>
    </section>
  );
}

function PainCard({
  row,
  saved,
  archived,
  onSave,
  onRemoveSaved,
  onArchive,
  onRestore,
  onDelete,
}: {
  row: Row;
  saved: boolean;
  archived: boolean;
  onSave: () => void;
  onRemoveSaved: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const id = idOf(row);
  const photos = photosOf(row);
  const score = pressureScore(row);
  const roomHref = id ? `/pain-room/${encodeURIComponent(id)}` : "/pain-feed";

  return (
    <article style={glass}>
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 18 }}>
        <div
          style={{
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid rgba(232,196,107,.18)",
            background: "rgba(0,0,0,.20)",
            minHeight: 160,
          }}
        >
          {photos[0] ? (
            <img src={photos[0]} alt="Pain" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ height: 160, display: "grid", placeItems: "center", color: "#94a3b8", fontWeight: 850 }}>No photo</div>
          )}
        </div>

        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={chip}>{problemType(row)}</span>
            <span style={{ ...chip, color: "#fecaca", borderColor: "rgba(248,113,113,.28)", background: "rgba(248,113,113,.08)" }}>{urgencyOf(row)}</span>
            <span style={chip}>Score {score}</span>
            <span style={chip}>{statusOf(row)}</span>
            {saved ? <span style={{ ...chip, color: "#f8e7b0", borderColor: "rgba(232,196,107,.34)", background: "rgba(232,196,107,.10)" }}>Saved</span> : null}
            {archived ? <span style={{ ...chip, color: "#cbd5e1", borderColor: "rgba(148,163,184,.24)", background: "rgba(148,163,184,.07)" }}>Archived</span> : null}
          </div>

          <h3 style={{ fontSize: 28, lineHeight: 1.05, margin: "14px 0 10px", letterSpacing: "-.02em" }}>{titleOf(row)}</h3>
          <p style={{ ...muted, fontSize: 15 }}>{summaryOf(row)}</p>

          <section style={{ marginTop: 14, border: "1px solid rgba(232,196,107,.16)", borderRadius: 18, padding: 14, background: "rgba(232,196,107,.055)" }}>
            <div style={{ ...label, fontSize: 11 }}>Problem Solver Intelligence</div>
            <p style={{ ...muted, margin: "8px 0 0", fontSize: 14 }}>
              <strong>Primary bottleneck:</strong> {bottleneck(row)} • <strong>Fastest move:</strong> {fastestMove(row)}
            </p>
            <p style={{ color: "#f8e7b0", margin: "10px 0 0", fontWeight: 850 }}>
              {missingInfo(row).length ? `Missing: ${missingInfo(row).join(", ")}.` : "Ready for first-pass routing."}
            </p>
          </section>

          <div style={{ marginTop: 12 }}>
            {id ? <span style={chip}>Pain: {id}</span> : null}
            {signalIdOf(row) ? <span style={chip}>Signal: {signalIdOf(row)}</span> : null}
            <span style={chip}>Market: {marketOf(row)}</span>
            {ownerOf(row) ? <span style={chip}>Owner: {ownerOf(row)}</span> : null}
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link href={roomHref} style={button}>Enter Pain Room</Link>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, opacity: .88 }}>
            {!saved ? (
              <button type="button" onClick={onSave} style={ghost}>Save</button>
            ) : (
              <button type="button" onClick={onRemoveSaved} style={ghost}>Remove Saved</button>
            )}

            {!archived ? (
              <button type="button" onClick={onArchive} style={ghost}>Archive</button>
            ) : (
              <button type="button" onClick={onRestore} style={ghost}>Restore</button>
            )}

            {(saved || archived) ? (
              <button type="button" onClick={onDelete} style={danger}>Delete</button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function PainFeedPage() {
  const [email, setEmail] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading pain feed...");
  const [folder, setFolder] = useState<FolderMode>("active");
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
    const owner = viewer === OWNER_EMAIL;
    const ownerFlag = owner ? "1" : "0";

    setEmail(viewer);
    setStatus("Loading pain feed...");

    try {
      const res = await fetch(`/api/pain/feed?email=${encodeURIComponent(viewer)}&owner=${ownerFlag}`, {
        cache: "no-store",
        credentials: "include",
        headers: {
          "x-vf-email": viewer,
          "x-vf-admin": ownerFlag,
        },
      });

      const data = await res.json().catch(() => ({}));
      const collected = [
        ...(Array.isArray(data.pains) ? data.pains : []),
        ...(Array.isArray(data.signals) ? data.signals : []),
        ...(Array.isArray(data.items) ? data.items : []),
        ...(Array.isArray(data.data) ? data.data : []),
      ];

      const byKey = new Map<string, Row>();

      for (const item of collected) {
        const key = canonicalKey(item);
        if (!key) continue;

        const existing = byKey.get(key);

        if (!existing) {
          byKey.set(key, item);
          continue;
        }

        const itemScore = completenessScore(item);
        const existingScore = completenessScore(existing);

        const primary = itemScore >= existingScore ? item : existing;
        const secondary = itemScore >= existingScore ? existing : item;

        byKey.set(key, mergeRows(primary, secondary));
      }

      const unique = Array.from(byKey.values());

      setItems(unique);
      setStatus(unique.length ? "" : "No pain records found yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load pain feed.");
    }
  }

  useEffect(() => {
    setSavedIds(readSet("vf_pain_saved_ids"));
    setArchivedIds(readSet("vf_pain_archived_ids"));
    setDeletedIds(readSet("vf_pain_deleted_ids"));
    load();
  }, []);

  function savePain(row: Row) {
    const key = canonicalKey(row);
    if (!key) return;

    const next = new Set(savedIds);
    next.add(key);
    persistSaved(next);
  }

  function removeSaved(row: Row) {
    const key = canonicalKey(row);
    if (!key) return;

    const next = new Set(savedIds);
    next.delete(key);
    persistSaved(next);
  }

  function archivePain(row: Row) {
    const key = canonicalKey(row);
    if (!key) return;

    const nextArchived = new Set(archivedIds);
    nextArchived.add(key);
    persistArchived(nextArchived);

    const nextSaved = new Set(savedIds);
    nextSaved.delete(key);
    persistSaved(nextSaved);
  }

  function restorePain(row: Row) {
    const key = canonicalKey(row);
    if (!key) return;

    const next = new Set(archivedIds);
    next.delete(key);
    persistArchived(next);
  }

  function deletePain(row: Row) {
    const key = canonicalKey(row);
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
    return items.filter((item) => {
      const key = canonicalKey(item);
      const saved = savedIds.has(key);
      const archived = archivedIds.has(key);
      const deleted = deletedIds.has(key);

      if (deleted) return false;
      if (folder === "saved") return saved && !archived;
      if (folder === "archived") return archived;
      return !archived;
    });
  }, [items, savedIds, archivedIds, deletedIds, folder]);

  const counts = useMemo(() => {
    const allLiveItems = items.filter((item) => {
      const key = canonicalKey(item);
      return key && !deletedIds.has(key);
    });

    const activeSavedItems = allLiveItems.filter((item) => {
      const key = canonicalKey(item);
      return savedIds.has(key) && !archivedIds.has(key);
    });

    const archivedItems = allLiveItems.filter((item) => {
      const key = canonicalKey(item);
      return archivedIds.has(key);
    });

    return {
      showing: visibleItems.length,
      active: allLiveItems.filter((item) => !archivedIds.has(canonicalKey(item))).length,
      saved: activeSavedItems.length,
      archived: archivedItems.length,
    };
  }, [items, visibleItems, savedIds, archivedIds, deletedIds]);

  return (
    <main style={page}>
      <style>{`
        @media (max-width: 820px) {
          .vf-grid,
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

          article > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={card}>
          <div style={label}>VaultForge Pain Feed</div>

          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Problem Solver Queue.
          </h1>

          <p style={{ ...muted, fontSize: 20 }}>
            Pain Feed is triage only. Enter the Pain Room for full intelligence, owner context, and resolution workflow.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>{email === OWNER_EMAIL ? "Owner View" : "Member View"}</span>
            <span style={chip}>Showing: {counts.showing}</span>
            <span style={chip}>Saved: {counts.saved}</span>
            <span style={chip}>Archived: {counts.archived}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <button type="button" onClick={() => setFolder("active")} style={folder === "active" ? button : ghost}>Active</button>
            <button type="button" onClick={() => setFolder("saved")} style={folder === "saved" ? button : ghost}>Saved</button>
            <button type="button" onClick={() => setFolder("archived")} style={folder === "archived" ? button : ghost}>Archive</button>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link href="/pain" style={ghost}>Submit Pain</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <button type="button" onClick={load} style={ghost}>Refresh</button>
          </div>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 18 }}>
          <Metric labelText="Showing" value={String(counts.showing)} />
          <Metric labelText="Active" value={String(counts.active)} />
          <Metric labelText="Saved" value={String(counts.saved)} />
          <Metric labelText="Archived" value={String(counts.archived)} />
        </section>

        <section style={card}>
          <div style={label}>Triage Cards</div>

          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "10px 0 18px" }}>
            Enter the room to solve.
          </h2>

          {visibleItems.length ? (
            <div style={{ display: "grid", gap: 14 }}>
              {visibleItems.map((item, index) => {
                const key = canonicalKey(item);

                return (
                  <PainCard
                    key={first(key, String(index))}
                    row={item}
                    saved={savedIds.has(key)}
                    archived={archivedIds.has(key)}
                    onSave={() => savePain(item)}
                    onRemoveSaved={() => removeSaved(item)}
                    onArchive={() => archivePain(item)}
                    onRestore={() => restorePain(item)}
                    onDelete={() => deletePain(item)}
                  />
                );
              })}
            </div>
          ) : (
            <div style={glass}>
              <h3 style={{ marginTop: 0 }}>
                {folder === "saved"
                  ? "No saved pain rooms yet."
                  : folder === "archived"
                  ? "No archived pain rooms yet."
                  : "No pain records connected yet."}
              </h3>

              <p style={muted}>{status}</p>

              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <Link href="/pain" style={button}>Submit Pain</Link>
                <Link href="/dashboard" style={ghost}>Dashboard</Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
