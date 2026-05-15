"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Insight = Record<string, any>;

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(181,92,255,.18), transparent 28%), radial-gradient(circle at top right, rgba(232,196,107,.12), transparent 26%), radial-gradient(circle at bottom left, rgba(157,243,191,.10), transparent 22%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "24px 16px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1480,
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.20)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.10), rgba(255,255,255,.03), rgba(157,243,191,.05))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 35px 120px rgba(0,0,0,.42)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))",
  gap: 18,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.08), rgba(255,255,255,.03), rgba(157,243,191,.04))",
  borderRadius: 28,
  overflow: "hidden",
  boxShadow: "0 24px 80px rgba(0,0,0,.34)",
};

const button: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "14px 18px",
  borderRadius: 999,
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
  fontWeight: 900,
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#111",
  marginRight: 10,
  marginBottom: 10,
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  color: "white",
  border: "1px solid rgba(255,255,255,.12)",
};

function clean(v: unknown) {
  return String(v || "").trim();
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

function currentEmail() {
  if (typeof window === "undefined") return "";
  return String(
    localStorage.getItem("vf_email") ||
      sessionStorage.getItem("vf_email") ||
      readCookie("vf_email") ||
      readCookie("vf_member_email") ||
      readCookie("vf_admin_email") ||
      ""
  )
    .trim()
    .toLowerCase();
}

function numberValue(value: unknown) {
  const raw = clean(value).replace(/[^0-9.-]/g, "");
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function ask(item: Insight) {
  return numberValue(item.asking_price || item.price || item.ask);
}

function arv(item: Insight) {
  return numberValue(item.arv || item.value || item.after_repair_value);
}

function repairs(item: Insight) {
  return numberValue(item.repairs || item.repair_estimate);
}

function spread(item: Insight) {
  const a = ask(item);
  const v = arv(item);
  const r = repairs(item);
  if (!a || !v) return 0;
  return v - a - r;
}

function margin(item: Insight) {
  const v = arv(item);
  if (!v) return 0;
  return Math.round((spread(item) / v) * 100);
}

function text(item: Insight) {
  return [
    item.title,
    item.summary,
    Array.isArray(item.reasoning) ? item.reasoning.join(" ") : item.reasoning,
    item.market,
    item.priority,
    item.best_move,
    item.kind,
  ]
    .join(" ")
    .toLowerCase();
}

function severity(item: Insight) {
  const t = text(item);
  let score = 34;
  if (t.includes("urgent")) score += 24;
  if (t.includes("foreclosure")) score += 28;
  if (t.includes("deadline")) score += 20;
  if (t.includes("capital")) score += 12;
  if (t.includes("stalled")) score += 10;
  return Math.max(0, Math.min(100, score));
}

function opportunity(item: Insight) {
  let score = 40;
  if (spread(item) > 0) score += 18;
  if (margin(item) >= 25) score += 22;
  if (margin(item) >= 15 && margin(item) < 25) score += 10;
  if (item.photo) score += 8;
  return Math.max(0, Math.min(100, score));
}

function classification(item: Insight) {
  const opp = opportunity(item);
  const sev = severity(item);

  if (item.kind === "pain") {
    if (sev >= 80) return "Critical Pressure";
    if (sev >= 60) return "Fixable Pressure";
    return "Monitor Pressure";
  }

  if (opp >= 75) return "A Opportunity";
  if (opp >= 58) return "B Opportunity";
  if (opp >= 42) return "Rewrite Needed";
  return "Trap Risk";
}

function strategy(item: Insight) {
  const t = text(item);

  if (item.kind === "pain") {
    if (t.includes("capital")) return "Bridge capital + operator stabilization";
    if (t.includes("contractor")) return "Contractor-led execution rescue";
    if (t.includes("foreclosure")) return "Fast close rescue path";
    return "Pressure triage + controlled routing";
  }

  if (t.includes("seller finance")) return "Creative finance structure";
  if (t.includes("land")) return "Builder / developer route";
  if (margin(item) >= 25) return "Fix-flip or private investor route";
  if (margin(item) > 0) return "Buyer-specific route";
  return "Rewrite pricing or terms";
}

function bestMove(item: Insight) {
  if (item.kind === "pain") return "Identify bottleneck, stabilize pressure, then route operators.";
  if (margin(item) >= 25) return "Verify numbers and privately route qualified buyers.";
  return "Rewrite structure before broad exposure.";
}

function worstMove(item: Insight) {
  if (item.kind === "pain") return "Treating this like a normal lead instead of a pressure event.";
  return "Publicly blasting weak or unverified opportunity data.";
}

function aiRead(item: Insight) {
  return `VaultForge Surgeon AI classifies this as ${classification(item)}. Strategy path: ${strategy(item)}. Best move: ${bestMove(item)}.`;
}

function trashKey(email: string) {
  return `vf_smart_ai_deleted_${email || "guest"}`;
}

function loadTrash(email: string) {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(trashKey(email));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTrash(email: string, ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(trashKey(email), JSON.stringify(ids));
}

function itemKey(item: Insight) {
  return [item.kind || "", item.id || "", item.title || "", item.market || ""].join("|");
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 12 }}>
        <span>{label}</span>
        <span>{safe}%</span>
      </div>

      <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden", marginTop: 7 }}>
        <div
          style={{
            width: `${safe}%`,
            height: "100%",
            borderRadius: 999,
            background: "linear-gradient(90deg,#ff6b6b,#f8e7b0,#56d8ff)",
          }}
        />
      </div>
    </div>
  );
}

function InsightCard({
  item,
  onDelete,
  onRestore,
  deletedMode,
}: {
  item: Insight;
  onDelete: (item: Insight) => void;
  onRestore: (item: Insight) => void;
  deletedMode: boolean;
}) {
  const cls = classification(item);

  return (
    <article style={card}>
      {item.photo && (
        <img
          src={item.photo}
          alt={item.title || "VaultForge intelligence"}
          style={{ width: "100%", height: 240, objectFit: "cover", display: "block" }}
        />
      )}

      <div style={{ padding: 22 }}>
        <div style={{ color: "#e8c46b", letterSpacing: 3, fontWeight: 900, fontSize: 12, marginBottom: 10, textTransform: "uppercase" }}>
          {item.kind === "pain" ? "Pressure Intelligence" : "Opportunity Intelligence"}
        </div>

        <h2 style={{ fontSize: 44, lineHeight: 0.92, margin: "0 0 16px" }}>{item.title || "Untitled"}</h2>

        <div style={{ marginBottom: 14 }}>
          <span style={{ display: "inline-flex", border: "1px solid rgba(157,243,191,.30)", borderRadius: 999, padding: "7px 10px", color: "#9df3bf", background: "rgba(157,243,191,.08)", fontWeight: 900, marginRight: 8, marginBottom: 8 }}>
            {cls}
          </span>

          <span style={{ display: "inline-flex", border: "1px solid rgba(232,196,107,.30)", borderRadius: 999, padding: "7px 10px", color: "#f5d978", background: "rgba(232,196,107,.08)", fontWeight: 900, marginRight: 8, marginBottom: 8 }}>
            Strategy: {strategy(item)}
          </span>
        </div>

        <ScoreBar label={item.kind === "pain" ? "Pressure Severity" : "Opportunity Strength"} value={item.kind === "pain" ? severity(item) : opportunity(item)} />

        <p style={{ color: "rgba(255,255,255,.82)", lineHeight: 1.6, fontSize: 17, marginTop: 18 }}>{aiRead(item)}</p>

        <div style={{ marginTop: 18, border: "1px solid rgba(255,255,255,.10)", borderRadius: 18, padding: 14, background: "rgba(255,255,255,.03)" }}>
          <div style={{ color: "#9df3bf", fontWeight: 900, marginBottom: 8 }}>Best Move</div>
          <div style={{ color: "rgba(255,255,255,.78)", lineHeight: 1.5 }}>{bestMove(item)}</div>
          <div style={{ color: "#fecaca", fontWeight: 900, marginTop: 14, marginBottom: 8 }}>Worst Move</div>
          <div style={{ color: "rgba(255,255,255,.78)", lineHeight: 1.5 }}>{worstMove(item)}</div>
        </div>

        <div style={{ marginTop: 22 }}>
          {item.href && <Link href={item.href} style={button}>Open Intelligence Room</Link>}

          {!deletedMode ? (
            <button type="button" style={ghost} onClick={() => onDelete(item)}>Remove From Desk</button>
          ) : (
            <button type="button" style={ghost} onClick={() => onRestore(item)}>Restore</button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function SmartAIPage() {
  const [items, setItems] = useState<Insight[]>([]);
  const [status, setStatus] = useState("Loading Surgeon AI...");
  const [mode, setMode] = useState("active");
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const viewer = currentEmail();
        setEmail(viewer);

        const res = await fetch(`/api/smart-ai?email=${encodeURIComponent(viewer)}`, {
          cache: "no-store",
          headers: { "x-vf-email": viewer },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data?.ok === false) throw new Error(data?.error || "Could not load Surgeon AI.");

        setItems(Array.isArray(data?.insights) ? data.insights : []);
        setStatus("");
      } catch {
        setStatus("Surgeon AI could not load.");
      }
    }

    load();
  }, []);

  const deletedIds = useMemo(() => loadTrash(email), [email]);

  const activeItems = useMemo(() => {
    return items.filter((item) => !deletedIds.includes(itemKey(item)));
  }, [items, deletedIds]);

  const deletedItems = useMemo(() => {
    return items.filter((item) => deletedIds.includes(itemKey(item)));
  }, [items, deletedIds]);

  function deleteItem(item: Insight) {
    const next = Array.from(new Set([...deletedIds, itemKey(item)]));
    saveTrash(email, next);
    setMode("active");
  }

  function restoreItem(item: Insight) {
    const next = deletedIds.filter((id) => id !== itemKey(item));
    saveTrash(email, next);
    setMode("deleted");
  }

  const visible = mode === "deleted" ? deletedItems : activeItems;
  const pressureCount = activeItems.filter((x) => x.kind === "pain").length;
  const opportunityCount = activeItems.filter((x) => x.kind !== "pain").length;

  return (
    <main style={pageStyle}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 720px) {
          .vf-smart-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .vf-smart-actions > * {
            width: 100%;
            box-sizing: border-box;
            margin-right: 0 !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={{ color: "#e8c46b", letterSpacing: 5, fontWeight: 900, marginBottom: 12, textTransform: "uppercase" }}>
            VaultForge Surgeon AI
          </div>

          <h1 style={{ fontSize: "clamp(64px,12vw,140px)", lineHeight: 0.88, margin: "0 0 18px", letterSpacing: -5 }}>
            Intelligence.
          </h1>

          <p style={{ color: "rgba(255,255,255,.78)", fontSize: 22, lineHeight: 1.6, maxWidth: 1100 }}>
            This is not a listings feed. Surgeon AI classifies pressure, rewrites opportunities, diagnoses weak structures, identifies execution paths, scores risk, and routes operator intelligence into one institutional desk.
          </p>

          <div style={{ marginTop: 22 }}>
            <span style={{ marginRight: 18, color: "#9df3bf", fontWeight: 900 }}>Pressure Signals: {pressureCount}</span>
            <span style={{ color: "#f5d978", fontWeight: 900 }}>Opportunity Signals: {opportunityCount}</span>
          </div>

          <div className="vf-smart-actions" style={{ marginTop: 24 }}>
            <button type="button" style={mode === "active" ? button : ghost} onClick={() => setMode("active")}>
              Active Desk ({activeItems.length})
            </button>

            <button type="button" style={mode === "deleted" ? button : ghost} onClick={() => setMode("deleted")}>
              Removed ({deletedItems.length})
            </button>

            <Link href="/dashboard" style={ghost}>Command</Link>
            <Link href="/submit" style={ghost}>Opportunity Intake</Link>
            <Link href="/pain" style={ghost}>Pressure Intake</Link>
          </div>
        </section>

        {status && (
          <section style={hero}>
            <strong>{status}</strong>
          </section>
        )}

        {!status && visible.length === 0 && (
          <section style={hero}>
            <strong>No intelligence records visible.</strong>
            <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.5 }}>
              Add Opportunity or Pressure records, then return here to classify, triage, and route them.
            </p>
          </section>
        )}

        <section style={grid}>
          {visible.map((item, index) => (
            <InsightCard
              key={`${itemKey(item)}-${index}`}
              item={item}
              deletedMode={mode === "deleted"}
              onDelete={deleteItem}
              onRestore={restoreItem}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
