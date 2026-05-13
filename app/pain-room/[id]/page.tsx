"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Row = Record<string, any>;
type FolderMode = "active" | "saved" | "archived";

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

function meta(row: Row | null) {
  return row && typeof row.metadata === "object" && row.metadata ? row.metadata : {};
}

function field(row: Row | null, ...keys: string[]) {
  if (!row) return "";

  const m = meta(row);
  const values: unknown[] = [];

  for (const key of keys) {
    values.push(row[key]);
    values.push(m[key]);
  }

  return first(...values);
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

function idOf(row: Row | null) {
  return field(row, "id", "pain_id", "request_id", "item_id", "signal_id", "alert_id");
}

function signalIdOf(row: Row | null) {
  return field(row, "signal_id", "signalId", "alert_id", "routing_id");
}

function titleOf(row: Row | null) {
  return field(row, "title", "pain_title", "problem_title", "headline", "name", "address") || "Pain Room";
}

function ownerOf(row: Row | null) {
  return cleanEmail(
    field(
      row,
      "owner_email",
      "member_email",
      "user_email",
      "submitted_by_email",
      "created_by_email",
      "email"
    )
  );
}

function marketOf(row: Row | null) {
  const city = field(row, "city");
  const state = field(row, "state", "market", "operating_state");

  return [city, state].filter(Boolean).join(", ") || field(row, "location", "address") || "Market not listed";
}

function assetOf(row: Row | null) {
  return field(row, "asset_type", "property_type", "deal_type", "pain_type", "problem_type") || "Problem";
}

function urgencyOf(row: Row | null) {
  return field(row, "urgency", "urgency_level", "priority", "timeline_pressure") || "Not listed";
}

function statusOf(row: Row | null) {
  return field(row, "status", "pain_status", "routing_status", "stage") || "Open";
}

function problemText(row: Row | null) {
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
    ) || "Problem details are pending."
  );
}

function photosOf(row: Row | null) {
  if (!row) return [];

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

function normalized(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function canonicalKey(row: Row | null) {
  return (
    field(row, "canonical_event_id") ||
    field(row, "pain_id") ||
    field(row, "request_id") ||
    field(row, "item_id") ||
    field(row, "signal_id") ||
    field(row, "id") ||
    `${normalized(titleOf(row))}-${normalized(marketOf(row))}-${normalized(ownerOf(row))}`
  );
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function pressureScore(row: Row | null) {
  const text = `${problemText(row)} ${urgencyOf(row)} ${field(row, "distress_signals", "pressure_signals", "seller_situation")}`.toLowerCase();
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

function resolutionScore(row: Row | null) {
  let score = 38;

  if (field(row, "city", "state", "market")) score += 10;
  if (field(row, "asset_type", "property_type", "pain_type", "problem_type")) score += 10;
  if (field(row, "requested_help", "help_requested", "routing_needs", "needs")) score += 14;
  if (photosOf(row).length) score += 12;
  if (problemText(row) && problemText(row) !== "Problem details are pending.") score += 14;

  return clamp(score);
}

function timelineRisk(row: Row | null) {
  const text = `${problemText(row)} ${urgencyOf(row)} ${field(row, "timeline", "deadline", "desired_timeline")}`.toLowerCase();
  let score = 30;

  if (text.includes("today") || text.includes("asap")) score += 35;
  if (text.includes("week")) score += 20;
  if (text.includes("deadline")) score += 25;
  if (text.includes("urgent")) score += 20;
  if (text.includes("normal")) score -= 10;

  return clamp(score);
}

function primaryBottleneck(row: Row | null) {
  const text = `${problemText(row)} ${field(row, "requested_help", "help_requested", "routing_needs", "needs")} ${field(row, "distress_signals")}`.toLowerCase();

  if (text.includes("funding") || text.includes("capital") || text.includes("lender")) return "Capital / Funding Gap";
  if (text.includes("contractor") || text.includes("repair") || text.includes("construction")) return "Contractor / Execution Gap";
  if (text.includes("buyer") || text.includes("sell") || text.includes("disposition")) return "Buyer / Exit Gap";
  if (text.includes("tenant") || text.includes("occupancy")) return "Tenant / Occupancy Issue";
  if (text.includes("permit") || text.includes("city") || text.includes("code")) return "Permit / City Issue";
  if (text.includes("partner") || text.includes("jv")) return "Partner / Operator Gap";

  return "Owner Review Needed";
}

function fastestPath(row: Row | null) {
  const bottleneck = primaryBottleneck(row);

  if (bottleneck.includes("Capital")) return "Verify numbers, confirm capital need, route to private lender or JV capital.";
  if (bottleneck.includes("Contractor")) return "Collect photos/scope, estimate repairs, route to contractor/operator.";
  if (bottleneck.includes("Buyer")) return "Package asset facts, confirm price/timeline, route to qualified buyer.";
  if (bottleneck.includes("Tenant")) return "Clarify occupancy, lease status, access, and legal constraints before routing.";
  if (bottleneck.includes("Permit")) return "Identify municipality, violation/permit status, and route to local operator.";
  if (bottleneck.includes("Partner")) return "Define role, capital, control, and profit split before introduction.";

  return "Clarify missing details, then route to the best operator type.";
}

function suggestedStack(row: Row | null) {
  const text = `${problemText(row)} ${field(row, "requested_help", "help_requested", "routing_needs", "needs")} ${field(row, "distress_signals")}`.toLowerCase();
  const stack: string[] = [];

  if (text.includes("buyer") || text.includes("sell") || text.includes("fast close")) stack.push("Buyer");
  if (text.includes("funding") || text.includes("capital") || text.includes("lender")) stack.push("Lender");
  if (text.includes("contractor") || text.includes("repair") || text.includes("construction")) stack.push("Contractor");
  if (text.includes("jv") || text.includes("partner") || text.includes("operator")) stack.push("Operator / JV");
  if (text.includes("tenant") || text.includes("permit") || text.includes("city") || text.includes("code")) stack.push("Local Operator");
  if (text.includes("attorney") || text.includes("probate") || text.includes("title")) stack.push("Attorney / Title");

  if (!stack.length) stack.push("Owner Review", "Buyer", "Operator");

  return Array.from(new Set(stack)).slice(0, 6);
}

function missingInfo(row: Row | null) {
  const missing: string[] = [];

  if (!field(row, "requested_help", "help_requested", "routing_needs", "needs")) missing.push("specific help needed");
  if (!field(row, "urgency", "urgency_level", "timeline", "deadline")) missing.push("timeline/deadline");
  if (!field(row, "city", "state", "market")) missing.push("market");
  if (!field(row, "asset_type", "property_type", "pain_type", "problem_type")) missing.push("asset/problem type");
  if (!photosOf(row).length) missing.push("photos/files");
  if (!field(row, "contact_phone", "phone", "owner_phone")) missing.push("best phone/contact method");

  return missing;
}

function aiProblemSummary(row: Row | null) {
  return [
    `Primary bottleneck: ${primaryBottleneck(row)}`,
    `Fastest path: ${fastestPath(row)}`,
    `Resolution stack: ${suggestedStack(row).join(", ")}`,
    missingInfo(row).length ? `Missing: ${missingInfo(row).join(", ")}` : "Record has enough detail for first-pass routing",
  ].join(" • ");
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
  lineHeight: 1.6,
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

function ScoreBar({ labelText, value, caption }: { labelText: string; value: number; caption: string }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 18, padding: 14, background: "rgba(0,0,0,.16)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, fontWeight: 950 }}>
        <span>{labelText}</span>
        <span>{value}%</span>
      </div>

      <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden", marginTop: 10 }}>
        <div style={{ width: `${value}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#ff6b6b,#f8e7b0,#56d8ff)" }} />
      </div>

      <p style={{ ...muted, margin: "8px 0 0", fontSize: 13 }}>{caption}</p>
    </div>
  );
}

function Info({ labelText, value }: { labelText: string; value: unknown }) {
  return (
    <div style={glass}>
      <div style={label}>{labelText}</div>
      <div style={{ fontSize: 22, fontWeight: 950, marginTop: 8 }}>{clean(value) || "Not listed"}</div>
    </div>
  );
}

export default function PainRoomPage() {
  const [email, setEmail] = useState("");
  const [pain, setPain] = useState<Row | null>(null);
  const [status, setStatus] = useState("Loading Pain Room...");
  const [saved, setSaved] = useState(false);
  const [archived, setArchived] = useState(false);

  async function load() {
    const viewer = getEmail();
    setEmail(viewer);

    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const id = decodeURIComponent(pathParts[pathParts.length - 1] || "");

    if (!id) {
      setStatus("Missing Pain Room ID.");
      return;
    }

    try {
      const owner = viewer === "bcrsoutheast@gmail.com";
      const ownerFlag = owner ? "1" : "0";

      const response = await fetch(`/api/pain/feed?email=${encodeURIComponent(viewer)}&owner=${ownerFlag}`, {
        cache: "no-store",
        credentials: "include",
        headers: {
          "x-vf-email": viewer,
          "x-vf-admin": ownerFlag,
        },
      });

      const data = await response.json().catch(() => ({}));
      const rows = [
        ...(Array.isArray(data.pains) ? data.pains : []),
        ...(Array.isArray(data.signals) ? data.signals : []),
        ...(Array.isArray(data.items) ? data.items : []),
        ...(Array.isArray(data.data) ? data.data : []),
      ];

      const found =
        rows.find((row) =>
          [
            idOf(row),
            signalIdOf(row),
            field(row, "pain_id"),
            field(row, "request_id"),
            field(row, "item_id"),
            field(row, "id"),
          ]
            .map(clean)
            .includes(id)
        ) || rows[0] || null;

      if (!found) {
        setStatus("Pain record not found.");
        return;
      }

      setPain(found);
      setStatus("");

      const key = canonicalKey(found);
      const savedSet = readLocalSet("vf_pain_saved_ids");
      const archivedSet = readLocalSet("vf_pain_archived_ids");
      setSaved(savedSet.has(key));
      setArchived(archivedSet.has(key));
    } catch (error: any) {
      setStatus(error?.message || "Could not load Pain Room.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function readLocalSet(key: string) {
    if (typeof window === "undefined") return new Set<string>();

    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed.map(clean).filter(Boolean) : []);
    } catch {
      return new Set<string>();
    }
  }

  function writeLocalSet(key: string, value: Set<string>) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(Array.from(value)));
  }

  function savePain() {
    if (!pain) return;
    const key = canonicalKey(pain);
    const next = readLocalSet("vf_pain_saved_ids");
    next.add(key);
    writeLocalSet("vf_pain_saved_ids", next);
    setSaved(true);
  }

  function removeSaved() {
    if (!pain) return;
    const key = canonicalKey(pain);
    const next = readLocalSet("vf_pain_saved_ids");
    next.delete(key);
    writeLocalSet("vf_pain_saved_ids", next);
    setSaved(false);
  }

  function archivePain() {
    if (!pain) return;
    const key = canonicalKey(pain);
    const next = readLocalSet("vf_pain_archived_ids");
    next.add(key);
    writeLocalSet("vf_pain_archived_ids", next);
    setArchived(true);
    removeSaved();
  }

  function restorePain() {
    if (!pain) return;
    const key = canonicalKey(pain);
    const next = readLocalSet("vf_pain_archived_ids");
    next.delete(key);
    writeLocalSet("vf_pain_archived_ids", next);
    setArchived(false);
  }

  const photos = useMemo(() => photosOf(pain), [pain]);
  const signalId = signalIdOf(pain);
  const owner = ownerOf(pain);
  const contactHref = signalId
    ? `/connect/${encodeURIComponent(signalId)}?email=${encodeURIComponent(email)}${owner ? `&to=${encodeURIComponent(owner)}` : ""}&source=pain&type=pain&folder=pain&folder_key=pain&title=${encodeURIComponent(titleOf(pain))}&subject=${encodeURIComponent(titleOf(pain))}`
    : `/messages/new?email=${encodeURIComponent(email)}${owner ? `&to=${encodeURIComponent(owner)}` : ""}&source=pain&type=pain&folder=pain&folder_key=pain&title=${encodeURIComponent(titleOf(pain))}&subject=${encodeURIComponent(titleOf(pain))}`;

  return (
    <main style={page}>
      <style>{`
        @media (max-width: 820px) {
          .vf-grid,
          .vf-actions,
          .vf-photo-grid {
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
        <section style={card}>
          <div style={label}>VaultForge Problem Solver Intelligence</div>

          <h1 style={{ fontSize: "clamp(48px,10vw,92px)", lineHeight: 0.9, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            {pain ? titleOf(pain) : "Pain Room"}
          </h1>

          {status ? <p style={{ ...muted, fontSize: 20 }}>{status}</p> : null}

          {pain ? (
            <>
              <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>
                {problemText(pain)}
              </p>

              <div style={{ marginTop: 14 }}>
                <span style={chip}>Status: {statusOf(pain)}</span>
                <span style={chip}>Urgency: {urgencyOf(pain)}</span>
                <span style={chip}>Problem: {assetOf(pain)}</span>
                <span style={chip}>Market: {marketOf(pain)}</span>
                {saved ? <span style={{ ...chip, color: "#f8e7b0", borderColor: "rgba(232,196,107,.34)", background: "rgba(232,196,107,.10)" }}>Saved</span> : null}
                {archived ? <span style={{ ...chip, color: "#cbd5e1", borderColor: "rgba(148,163,184,.24)", background: "rgba(148,163,184,.07)" }}>Archived</span> : null}
              </div>

              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                <Link href={contactHref} style={button}>Contact Owner</Link>
                <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
                <Link href="/projects" style={ghost}>Projects</Link>
              </div>
            </>
          ) : null}
        </section>

        {pain ? (
          <>
            <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginBottom: 18 }}>
              <ScoreBar labelText="Pressure" value={pressureScore(pain)} caption="Urgency, distress, timeline, and problem severity." />
              <ScoreBar labelText="Resolution Readiness" value={resolutionScore(pain)} caption="How much info exists to route the problem." />
              <ScoreBar labelText="Timeline Risk" value={timelineRisk(pain)} caption={urgencyOf(pain)} />
              <ScoreBar labelText="Asset Context" value={photos.length ? 76 : 42} caption={`${photos.length} photo${photos.length === 1 ? "" : "s"} connected.`} />
            </section>

            {photos.length ? (
              <section style={card}>
                <div style={label}>Photos / Problem Context</div>

                <div className="vf-photo-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 14 }}>
                  {photos.map((url) => (
                    <img key={url} src={url} alt="Pain context" style={{ width: "100%", height: 230, objectFit: "cover", borderRadius: 20, border: "1px solid rgba(232,196,107,.20)" }} />
                  ))}
                </div>
              </section>
            ) : null}

            <section style={card}>
              <div style={label}>AI Problem Solver Summary</div>
              <p style={{ ...muted, fontSize: 18 }}>{aiProblemSummary(pain)}</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginTop: 16 }}>
                <Info labelText="Primary Bottleneck" value={primaryBottleneck(pain)} />
                <Info labelText="Fastest Resolution Path" value={fastestPath(pain)} />
                <Info labelText="Owner / Contact" value={owner || "Not listed"} />
              </div>
            </section>

            <section style={card}>
              <div style={label}>Resolution Stack</div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                {suggestedStack(pain).map((item) => (
                  <span key={item} style={chip}>{item}</span>
                ))}
              </div>
            </section>

            <section style={card}>
              <div style={label}>What The Owner Needs Next</div>

              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                <div style={glass}>
                  <strong>48-Hour Move:</strong>
                  <p style={{ ...muted, marginBottom: 0 }}>{fastestPath(pain)}</p>
                </div>

                <div style={glass}>
                  <strong>Missing Intelligence:</strong>
                  <p style={{ ...muted, marginBottom: 0 }}>
                    {missingInfo(pain).length ? missingInfo(pain).join(", ") : "No major missing fields for first-pass routing."}
                  </p>
                </div>

                <div style={glass}>
                  <strong>VaultForge Role:</strong>
                  <p style={{ ...muted, marginBottom: 0 }}>
                    Stabilize the situation, identify the right operator/member type, protect private info, and move the problem toward a controlled resolution.
                  </p>
                </div>
              </div>
            </section>

            <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14, marginBottom: 18 }}>
              <Info labelText="Pain ID" value={idOf(pain)} />
              <Info labelText="Signal ID" value={signalId || "Not linked"} />
              <Info labelText="Submitted By" value={owner || email || "Not listed"} />
            </section>

            <section style={card}>
              <div style={label}>Room Controls</div>

              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                {!saved ? (
                  <button type="button" onClick={savePain} style={ghost}>Save Pain Room</button>
                ) : (
                  <button type="button" onClick={removeSaved} style={ghost}>Remove Saved</button>
                )}

                {!archived ? (
                  <button type="button" onClick={archivePain} style={ghost}>Archive / Clean Up</button>
                ) : (
                  <button type="button" onClick={restorePain} style={ghost}>Restore Active</button>
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
