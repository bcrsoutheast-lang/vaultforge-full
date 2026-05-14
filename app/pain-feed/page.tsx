"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Row = Record<string, any>;
type Folder = "active" | "saved" | "archived";
type PressureLane = "urgent" | "capital" | "execution" | "buyer" | "review";

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
      // Try next source.
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
  return [first(r.city), first(r.state, r.operating_state)].filter(Boolean).join(", ") || first(r.market, r.location, "Market not listed");
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

function rawMoney(row: Row, ...keys: string[]) {
  const r = merged(row);
  return first(...keys.map((key) => r[key]));
}

function asking(row: Row) {
  return money(rawMoney(row, "asking_price", "price", "target_price"));
}

function arv(row: Row) {
  return money(rawMoney(row, "arv", "arv_value", "estimated_value", "property_value"));
}

function repairs(row: Row) {
  return money(rawMoney(row, "repair_estimate", "repairs_needed", "repair_scope", "repair_budget"));
}

function capital(row: Row) {
  return money(rawMoney(row, "capital_needed", "funding_needed", "gap_amount"));
}

function bottleneck(row: Row) {
  const r = merged(row);
  return first(r.primary_bottleneck, inferBottleneck(row));
}

function fastestMove(row: Row) {
  const r = merged(row);
  const inferred = inferFastestMove(row);
  return first(r.fastest_path, inferred);
}

function whoShouldSeeList(row: Row) {
  const r = merged(row);
  const raw = r.who_should_see || r.suggested_resolution_stack;

  if (Array.isArray(raw)) return raw.map(clean).filter(Boolean);

  const text = `${clean(raw)} ${cleanSummary(row)} ${problemType(row)} ${bottleneck(row)}`.toLowerCase();
  const stack: string[] = [];

  if (text.includes("buyer") || text.includes("sell") || text.includes("exit") || text.includes("disposition")) stack.push("Buyer");
  if (text.includes("fund") || text.includes("capital") || text.includes("lender") || text.includes("gap")) stack.push("Lender");
  if (text.includes("contractor") || text.includes("repair") || text.includes("construction")) stack.push("Contractor");
  if (text.includes("jv") || text.includes("partner") || text.includes("operator")) stack.push("Operator");
  if (text.includes("permit") || text.includes("city") || text.includes("tenant") || text.includes("code")) stack.push("Local Operator");
  if (text.includes("title") || text.includes("probate") || text.includes("attorney")) stack.push("Title / Legal");

  if (!stack.length) stack.push("Owner Review", "Operator", "Buyer");

  return Array.from(new Set(stack));
}

function whoShouldSee(row: Row) {
  return whoShouldSeeList(row).join(", ");
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

  return parts.slice(0, 5).join(" • ");
}

function inferBottleneck(row: Row) {
  const text = `${problemType(row)} ${cleanSummary(row)} ${capital(row)} ${repairs(row)}`.toLowerCase();

  if (text.includes("fund") || text.includes("capital") || text.includes("lender") || text.includes("gap")) return "Capital / Funding Gap";
  if (text.includes("contractor") || text.includes("repair") || text.includes("construction")) return "Contractor / Execution Gap";
  if (text.includes("buyer") || text.includes("sell") || text.includes("exit")) return "Buyer / Exit Gap";
  if (text.includes("permit") || text.includes("city") || text.includes("code")) return "Permit / City Issue";
  if (text.includes("tenant") || text.includes("occupancy")) return "Occupancy / Tenant Issue";

  return "Owner Review Needed";
}

function inferFastestMove(row: Row) {
  const blocker = inferBottleneck(row);

  if (blocker.includes("Capital")) return "Verify numbers and funding gap, then route to lender or JV capital.";
  if (blocker.includes("Contractor")) return "Confirm scope/photos and route to contractor/operator for pricing.";
  if (blocker.includes("Buyer")) return "Package the asset facts and route to qualified buyers first.";
  if (blocker.includes("Permit")) return "Identify the city issue and route to a local operator before exposure.";
  if (blocker.includes("Tenant")) return "Clarify occupancy and access before routing to buyers or operators.";

  return "Review the case, confirm the missing context, then route to the strongest operator fit.";
}

function bestFitSummary(row: Row) {
  const type = problemType(row);
  const asset = assetClass(row);
  const market = marketOf(row);
  const blocker = bottleneck(row);
  const path = fastestMove(row);
  const viewers = whoShouldSee(row);

  return `Best fit: ${viewers}. ${asset} ${type.toLowerCase()} in ${market}. Main blocker: ${blocker}. Best next move: ${path}`;
}

function pressureScore(row: Row) {
  const urgency = urgencyOf(row).toLowerCase();
  const text = `${problemType(row)} ${cleanSummary(row)} ${urgency} ${bottleneck(row)}`.toLowerCase();
  let score = 36;

  if (urgency.includes("emergency")) score += 35;
  if (urgency.includes("high")) score += 24;
  if (text.includes("foreclosure")) score += 22;
  if (text.includes("fast close") || text.includes("deadline")) score += 18;
  if (text.includes("funding gap")) score += 18;
  if (text.includes("stalled")) score += 16;
  if (text.includes("contractor")) score += 10;
  if (photoOf(row)) score += 6;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function readinessScore(row: Row) {
  let score = 30;

  if (marketOf(row) !== "Market not listed") score += 12;
  if (problemType(row) !== "Problem") score += 10;
  if (assetClass(row) !== "Asset") score += 10;
  if (asking(row) !== "Not listed") score += 8;
  if (arv(row) !== "Not listed") score += 8;
  if (repairs(row) !== "Not listed") score += 8;
  if (cleanSummary(row) !== "This pain room needs more owner context before routing.") score += 10;
  if (photoOf(row)) score += 14;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function laneOf(row: Row): PressureLane {
  const text = `${urgencyOf(row)} ${problemType(row)} ${bottleneck(row)} ${cleanSummary(row)}`.toLowerCase();

  if (text.includes("emergency") || text.includes("urgent") || text.includes("foreclosure") || text.includes("deadline")) return "urgent";
  if (text.includes("capital") || text.includes("fund") || text.includes("lender") || text.includes("gap")) return "capital";
  if (text.includes("contractor") || text.includes("repair") || text.includes("stalled") || text.includes("execution")) return "execution";
  if (text.includes("buyer") || text.includes("exit") || text.includes("sell")) return "buyer";

  return "review";
}

function laneLabel(lane: PressureLane) {
  if (lane === "urgent") return "Urgent Pressure";
  if (lane === "capital") return "Capital Gap";
  if (lane === "execution") return "Execution Blocker";
  if (lane === "buyer") return "Buyer / Exit";
  return "Owner Review";
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
  minHeight: 46,
  padding: "11px 16px",
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
      const res = await fetch(`/api/pain/feed?email=${encodeURIComponent(finalEmail)}&owner=${ownerFlag}`, {
        cache: "no-store",
        credentials: "include",
        headers: {
          "x-vf-email": finalEmail,
          "x-vf-admin": ownerFlag,
        },
      });

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
      urgent: live.filter((row) => laneOf(row) === "urgent").length,
      capital: live.filter((row) => laneOf(row) === "capital").length,
      execution: live.filter((row) => laneOf(row) === "execution").length,
      buyer: live.filter((row) => laneOf(row) === "buyer").length,
    };
  }, [items, visibleItems, savedIds, archivedIds, deletedIds]);

  const topPressure = useMemo(() => {
    return [...visibleItems].sort((a, b) => pressureScore(b) - pressureScore(a)).slice(0, 3);
  }, [visibleItems]);

  const lanes = useMemo(() => {
    return ["urgent", "capital", "execution", "buyer", "review"].map((lane) => ({
      lane: lane as PressureLane,
      items: visibleItems.filter((row) => laneOf(row) === lane),
    }));
  }, [visibleItems]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(232,196,107,.15), transparent 30%), radial-gradient(circle at 90% 8%, rgba(248,113,113,.11), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
        color: "white",
        padding: "18px 14px 120px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <style>{`
        @media (max-width: 860px) {
          .pain-board { grid-template-columns: 1fr !important; }
          .pain-summary-grid { grid-template-columns: 1fr 1fr !important; }
          .pain-actions { display: grid !important; grid-template-columns: 1fr !important; }
          .pain-actions > * { width: 100%; box-sizing: border-box; }
        }
        @media (max-width: 520px) {
          .pain-summary-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ width: "min(1420px,100%)", margin: "0 auto" }}>
        <section
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            paddingBottom: 12,
            backdropFilter: "blur(16px)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              background: "rgba(5,10,20,.90)",
              border: "1px solid rgba(232,196,107,.18)",
              borderRadius: 20,
              padding: 10,
            }}
          >
            <Link href="/dashboard" style={navBtn}>Dashboard</Link>
            <Link href="/projects" style={navBtn}>Projects</Link>
            <Link href="/pain" style={navBtn}>Submit Pain</Link>
            <Link href="/messages" style={navBtn}>Messages</Link>
            <button type="button" onClick={load} style={{ ...navBtn, cursor: "pointer" }}>Refresh</button>
          </div>
        </section>

        <section
          style={{
            border: "1px solid rgba(232,196,107,.20)",
            borderRadius: 30,
            padding: 24,
            background: "linear-gradient(145deg,rgba(232,196,107,.10),rgba(255,255,255,.035))",
            boxShadow: "0 26px 80px rgba(0,0,0,.32)",
            margin: "12px 0 18px",
          }}
        >
          <div style={{ color: "#e8c46b", fontWeight: 950, letterSpacing: ".18em", textTransform: "uppercase", fontSize: 12 }}>
            VaultForge Live Pressure Board
          </div>

          <h1 style={{ fontSize: "clamp(50px,10vw,96px)", lineHeight: 0.88, margin: "10px 0 12px", letterSpacing: "-.07em" }}>
            Pain Command Feed
          </h1>

          <p style={{ color: "#cbd5e1", maxWidth: 1020, fontSize: 18, lineHeight: 1.5, margin: 0 }}>
            Live operating board for seller pressure, capital gaps, stalled execution, buyer demand, and owner-review problem rooms.
          </p>

          <div className="pain-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 10, marginTop: 18 }}>
            <Stat label="Showing" value={counts.showing} />
            <Stat label="Active" value={counts.active} />
            <Stat label="Urgent" value={counts.urgent} />
            <Stat label="Capital" value={counts.capital} />
            <Stat label="Execution" value={counts.execution} />
            <Stat label="Saved" value={counts.saved} />
          </div>

          <div style={{ marginTop: 12, color: "#94a3b8", fontWeight: 800 }}>
            Signed in: {email || "unknown"} · Archived: {counts.archived}
          </div>

          <div className="pain-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <button type="button" onClick={() => setFolder("active")} style={folder === "active" ? mainBtn : ghostBtn}>Active Board</button>
            <button type="button" onClick={() => setFolder("saved")} style={folder === "saved" ? mainBtn : ghostBtn}>Saved Cases</button>
            <button type="button" onClick={() => setFolder("archived")} style={folder === "archived" ? mainBtn : ghostBtn}>Archived</button>
          </div>

          {status ? (
            <div style={{ marginTop: 16, border: "1px solid rgba(232,196,107,.20)", borderRadius: 18, padding: 16, color: "#f8e7b0", background: "rgba(232,196,107,.06)" }}>
              {status}
            </div>
          ) : null}
        </section>

        {topPressure.length ? (
          <section style={{ marginBottom: 18 }}>
            <div style={{ color: "#e8c46b", fontWeight: 950, letterSpacing: ".16em", textTransform: "uppercase", fontSize: 12, marginBottom: 10 }}>
              Highest Pressure Cases
            </div>
            <div className="pain-board" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
              {topPressure.map((row) => (
                <PressureStrip key={`top-${keyOf(row)}`} row={row} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="pain-board" style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(240px,1fr))", gap: 12, alignItems: "start" }}>
          {lanes.map(({ lane, items: laneItems }) => (
            <section
              key={lane}
              style={{
                border: "1px solid rgba(255,255,255,.10)",
                borderRadius: 24,
                background: "rgba(255,255,255,.035)",
                minHeight: 220,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid rgba(255,255,255,.08)", background: "rgba(0,0,0,.16)" }}>
                <div style={{ color: "#e8c46b", fontWeight: 950, letterSpacing: ".14em", textTransform: "uppercase", fontSize: 11 }}>
                  {laneLabel(lane)}
                </div>
                <div style={{ color: "#94a3b8", fontSize: 13, fontWeight: 800, marginTop: 5 }}>{laneItems.length} case{laneItems.length === 1 ? "" : "s"}</div>
              </div>

              <div style={{ padding: 12, display: "grid", gap: 12 }}>
                {laneItems.length ? laneItems.map((row, index) => (
                  <CaseCard
                    key={`${lane}-${keyOf(row)}-${index}`}
                    row={row}
                    saved={savedIds.has(keyOf(row))}
                    archived={archivedIds.has(keyOf(row))}
                    onSave={() => savePain(row)}
                    onUnsave={() => removeSaved(row)}
                    onArchive={() => archivePain(row)}
                    onRestore={() => restorePain(row)}
                    onDelete={() => deletePain(row)}
                  />
                )) : (
                  <div style={{ color: "#64748b", fontWeight: 800, lineHeight: 1.4, padding: 12 }}>
                    No active cases in this lane.
                  </div>
                )}
              </div>
            </section>
          ))}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 18, padding: 12, background: "rgba(0,0,0,.16)" }}>
      <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 950, textTransform: "uppercase", letterSpacing: ".10em" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function PressureStrip({ row }: { row: Row }) {
  return (
    <Link
      href={`/pain-room/${encodeURIComponent(idOf(row))}`}
      style={{
        display: "block",
        color: "white",
        textDecoration: "none",
        border: "1px solid rgba(232,196,107,.20)",
        borderRadius: 20,
        padding: 14,
        background: "linear-gradient(145deg,rgba(248,113,113,.10),rgba(232,196,107,.06))",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <span style={chip}>{laneLabel(laneOf(row))}</span>
        <strong style={{ color: "#f8e7b0" }}>{pressureScore(row)}%</strong>
      </div>
      <h3 style={{ fontSize: 21, lineHeight: 1.05, margin: "10px 0 6px" }}>{titleOf(row)}</h3>
      <p style={{ color: "#cbd5e1", lineHeight: 1.45, margin: 0, fontSize: 14 }}>{marketOf(row)} · {bottleneck(row)}</p>
    </Link>
  );
}

function CaseCard({
  row,
  saved,
  archived,
  onSave,
  onUnsave,
  onArchive,
  onRestore,
  onDelete,
}: {
  row: Row;
  saved: boolean;
  archived: boolean;
  onSave: () => void;
  onUnsave: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const id = idOf(row);
  const image = photoOf(row);
  const contactHref = signalIdOf(row)
    ? `/connect/${encodeURIComponent(signalIdOf(row))}?to=${encodeURIComponent(ownerOf(row))}&source=pain&type=pain&folder=pain&folder_key=pain&item_id=${encodeURIComponent(id)}&title=${encodeURIComponent(titleOf(row))}&subject=${encodeURIComponent(titleOf(row))}`
    : `/messages/new?to=${encodeURIComponent(ownerOf(row))}&source=pain&type=pain&folder=pain&folder_key=pain&item_id=${encodeURIComponent(id)}&title=${encodeURIComponent(titleOf(row))}&subject=${encodeURIComponent(titleOf(row))}`;

  return (
    <article
      style={{
        border: "1px solid rgba(232,196,107,.16)",
        borderRadius: 20,
        overflow: "hidden",
        background: "rgba(2,6,12,.68)",
        boxShadow: "0 18px 50px rgba(0,0,0,.24)",
      }}
    >
      {image ? <img src={image} alt={titleOf(row)} style={{ width: "100%", height: 138, objectFit: "cover", display: "block" }} /> : null}

      <div style={{ padding: 14 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 9 }}>
          <span style={chip}>{problemType(row)}</span>
          <span style={chip}>{urgencyOf(row)}</span>
          {saved ? <span style={{ ...chip, color: "#f8e7b0", borderColor: "rgba(232,196,107,.35)", background: "rgba(232,196,107,.10)" }}>Saved</span> : null}
          {archived ? <span style={{ ...chip, color: "#cbd5e1", borderColor: "rgba(148,163,184,.28)", background: "rgba(148,163,184,.08)" }}>Archived</span> : null}
        </div>

        <h2 style={{ fontSize: 24, lineHeight: 1.03, margin: "0 0 7px" }}>{titleOf(row)}</h2>
        <p style={{ color: "#94a3b8", lineHeight: 1.35, margin: "0 0 12px", fontSize: 13 }}>
          {marketOf(row)} · {assetClass(row)}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 12 }}>
          <Mini label="Pressure" value={`${pressureScore(row)}%`} />
          <Mini label="Ready" value={`${readinessScore(row)}%`} />
          <Mini label="Ask" value={asking(row)} />
          <Mini label="Capital" value={capital(row)} />
        </div>

        <section style={{ border: "1px solid rgba(232,196,107,.18)", borderRadius: 16, padding: 11, background: "rgba(232,196,107,.055)", marginBottom: 11 }}>
          <div style={{ color: "#e8c46b", fontWeight: 950, letterSpacing: ".13em", textTransform: "uppercase", fontSize: 10 }}>
            Best-Fit Read
          </div>
          <p style={{ color: "#dbe4ee", lineHeight: 1.45, margin: "7px 0 0", fontSize: 13 }}>
            {bestFitSummary(row)}
          </p>
        </section>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {whoShouldSeeList(row).slice(0, 4).map((item) => (
            <span key={item} style={chip}>{item}</span>
          ))}
        </div>

        <div className="pain-actions" style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          <Link href={`/pain-room/${encodeURIComponent(id)}`} style={mainBtn}>Open Room</Link>
          <Link href={contactHref} style={ghostBtn}>Contact</Link>

          {!saved ? (
            <button type="button" onClick={onSave} style={ghostBtn}>Save</button>
          ) : (
            <button type="button" onClick={onUnsave} style={ghostBtn}>Unsave</button>
          )}

          {!archived ? (
            <button type="button" onClick={onArchive} style={ghostBtn}>Archive</button>
          ) : (
            <button type="button" onClick={onRestore} style={ghostBtn}>Restore</button>
          )}

          {(saved || archived) ? <button type="button" onClick={onDelete} style={dangerBtn}>Delete</button> : null}
        </div>
      </div>
    </article>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 12, padding: 8, background: "rgba(255,255,255,.035)" }}>
      <div style={{ color: "#94a3b8", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div>
      <div style={{ fontWeight: 950, marginTop: 3, fontSize: 13 }}>{value}</div>
    </div>
  );
}
