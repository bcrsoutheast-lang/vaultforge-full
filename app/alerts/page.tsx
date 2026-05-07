"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type AlertRow = Record<string, any>;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(181,92,255,.24), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.18), transparent 24%), radial-gradient(circle at bottom right, rgba(232,196,107,.16), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 45%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.22)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.18), rgba(157,243,191,.08), rgba(255,255,255,.03))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
};

const engine: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.30)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.03))",
  borderRadius: 30,
  padding: 24,
  marginBottom: 22,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.26)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.16), rgba(157,243,191,.08), rgba(255,255,255,.03))",
  borderRadius: 30,
  padding: 24,
  marginBottom: 22,
};

const statGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
  gap: 14,
  marginBottom: 22,
};

const statCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background: "linear-gradient(135deg, rgba(181,92,255,.18), rgba(255,255,255,.05))",
  borderRadius: 24,
  padding: 20,
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#9df3bf,#b55cff)",
  color: "#061120",
  border: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
  margin: "7px 7px 0 0",
};

const goldBtn: React.CSSProperties = {
  ...btn,
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
  background: "linear-gradient(135deg, rgba(181,92,255,.18), rgba(255,255,255,.05))",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  textDecoration: "none",
  cursor: "pointer",
  margin: "7px 7px 0 0",
};

const danger: React.CSSProperties = {
  ...ghost,
  color: "#ffd0d0",
  border: "1px solid rgba(255,120,120,.38)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const greenEyebrow: React.CSSProperties = {
  ...eyebrow,
  color: "#9df3bf",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  lineHeight: 1.55,
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.25)",
  color: "#9df3bf",
  background: "linear-gradient(145deg, rgba(157,243,191,.14), rgba(181,92,255,.08))",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 800,
  fontSize: 13,
  margin: "0 7px 7px 0",
};

function getEmail() {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    ""
  )
    .trim()
    .toLowerCase();
}

function asText(value: unknown) {
  return String(value || "").trim();
}

function first(...values: unknown[]) {
  for (const value of values) {
    const cleaned = asText(value);
    if (cleaned) return cleaned;
  }
  return "";
}

function lower(value: unknown) {
  return asText(value).toLowerCase();
}

function asNumber(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function alertId(item: AlertRow) {
  return first(item.id, item.alert_id, item.match_alert_id);
}

function dealId(item: AlertRow) {
  return first(
    item.deal_id,
    item.project_id,
    item.property_id,
    item.target_deal_id,
    item.deal?.id,
    item.project?.id
  );
}

function memberEmail(item: AlertRow) {
  return first(
    item.member_email,
    item.buyer_email,
    item.recipient_email,
    item.matched_member_email,
    item.email
  );
}

function alertTitle(item: AlertRow) {
  return first(
    item.alert_title,
    item.title,
    item.match_title,
    item.deal_title,
    item.project_title,
    item.deal?.title,
    item.project?.title,
    "VaultForge Match Alert"
  );
}

function alertBody(item: AlertRow) {
  return first(
    item.alert_body,
    item.body,
    item.message,
    item.description,
    item.summary,
    item.ai_summary,
    item.reason,
    item.why_matched,
    "VaultForge found a member/deal routing signal."
  );
}

function alertType(item: AlertRow) {
  return first(item.alert_type, item.type, item.category, "smart_match");
}

function confidence(item: AlertRow) {
  return asNumber(first(item.confidence_score, item.score, item.match_score, item.ai_score));
}

function isRead(item: AlertRow) {
  return (
    item.read === true ||
    item.is_read === true ||
    lower(item.status) === "read" ||
    lower(item.alert_status) === "read"
  );
}

function isDismissed(item: AlertRow) {
  return (
    item.dismissed === true ||
    item.is_dismissed === true ||
    lower(item.status) === "dismissed" ||
    lower(item.alert_status) === "dismissed"
  );
}

function reasonList(item: AlertRow) {
  const raw = first(item.why_matched, item.reasons, item.match_reasons, item.reason);

  if (!raw) return [];

  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // fall through
  }

  return raw
    .split("·")
    .join(",")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 8);
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={statCard}>
      <div style={greenEyebrow}>{label}</div>
      <div style={{ fontSize: 50, fontWeight: 950, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [status, setStatus] = useState("Loading alerts...");
  const [toast, setToast] = useState("");
  const [engineResult, setEngineResult] = useState<Record<string, any> | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadAlerts() {
    setStatus("Loading alerts...");
    setToast("");

    try {
      const email = getEmail();

      const res = await fetch(`/api/alerts/list?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": email,
        },
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load alerts.");
      }

      const list = Array.isArray(data?.alerts)
        ? data.alerts
        : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];

      setAlerts(list);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load alerts.");
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  async function generateSmartAlerts() {
    if (busy) return;

    setBusy(true);
    setToast("Generating smart alerts...");
    setEngineResult(null);

    try {
      const email = getEmail();

      const res = await fetch("/api/alerts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({ email }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Generation failed.");
      }

      setEngineResult(data);
      setToast(data?.message || "Smart alerts generated.");
      await loadAlerts();
    } catch (error: any) {
      setToast(error?.message || "Could not generate alerts.");
    } finally {
      setBusy(false);
    }
  }

  async function saveToBucket(item: AlertRow) {
    const id = dealId(item);
    const email = getEmail();

    if (!id) {
      setToast("Cannot save: this alert does not include a deal id.");
      return;
    }

    if (!email) {
      setToast("Cannot save: log in again so VaultForge knows your email.");
      return;
    }

    setToast("Saving to Buy Bucket...");

    try {
      const res = await fetch("/api/deal/save-to-bucket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({
          deal_id: id,
          id,
          buyer_email: email,
          member_email: email,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not save to Buy Bucket.");
      }

      setToast(data?.message || "Saved to Buy Bucket.");
    } catch (error: any) {
      setToast(error?.message || "Could not save to Buy Bucket.");
    }
  }

  async function alertAction(item: AlertRow, action: "read" | "dismissed") {
    const id = alertId(item);
    const email = getEmail();

    if (!id) {
      setToast(`Cannot ${action === "read" ? "mark read" : "dismiss"}: this alert does not include an alert id.`);
      return;
    }

    setToast(action === "read" ? "Marking alert read..." : "Dismissing alert...");

    try {
      const res = await fetch("/api/alerts/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({
          id,
          alert_id: id,
          action,
          email,
          member_email: email,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not update alert.");
      }

      setToast(data?.message || "Alert updated.");
      await loadAlerts();
    } catch (error: any) {
      setToast(error?.message || "Could not update alert.");
    }
  }

  const visibleAlerts = useMemo(
    () => alerts.filter((item) => !isDismissed(item)),
    [alerts]
  );

  const unreadCount = visibleAlerts.filter((item) => !isRead(item)).length;
  const readCount = visibleAlerts.filter(isRead).length;
  const capitalCount = visibleAlerts.filter((item) => lower(alertType(item)).includes("capital") || lower(alertBody(item)).includes("lender")).length;
  const buyerCount = visibleAlerts.filter((item) => lower(alertType(item)).includes("buyer") || lower(alertBody(item)).includes("buyer")).length;

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          a,
          button {
            box-sizing: border-box;
          }
        }
      `}</style>
      <style>{`
        @media (max-width: 760px) {
          .vf-alert-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-alert-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>VaultForge Alerts</div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                border: "1px solid rgba(181,92,255,.36)",
                color: "#dcb8ff",
                borderRadius: 999,
                padding: "9px 13px",
                fontWeight: 900,
                background: "rgba(181,92,255,.12)",
              }}
            >
              Routing Intelligence
            </span>

            <span
              style={{
                border: "1px solid rgba(157,243,191,.36)",
                color: "#9df3bf",
                borderRadius: 999,
                padding: "9px 13px",
                fontWeight: 900,
                background: "rgba(157,243,191,.10)",
              }}
            >
              Match Signal Feed
            </span>

            <span
              style={{
                border: "1px solid rgba(245,217,120,.36)",
                color: "#f5d978",
                borderRadius: 999,
                padding: "9px 13px",
                fontWeight: 900,
                background: "rgba(245,217,120,.10)",
              }}
            >
              Bloomberg-Style Alerts
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(56px,12vw,104px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            Routing Signal Feed
          </h1>

          <p style={{ ...muted, fontSize: 21 }}>
            Match alerts, network signals, buy-side opportunities, routing notices, and member activity inside your VaultForge command center.
          </p>

          <div className="vf-alert-actions" style={{ marginTop: 18 }}>
            <button type="button" style={btn} onClick={loadAlerts}>Refresh Alerts</button>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/buy-bucket" style={ghost}>Buy Bucket</Link>
            <Link href="/submit" style={ghost}>Create Deal</Link>
          </div>
        </section>

        <section style={engine}>
          <div style={eyebrow}>Owner Smart Engine</div>
          <h2 style={{ fontSize: 38, margin: "0 0 10px" }}>Generate intelligent routing alerts</h2>
          <p style={{ ...muted, fontSize: 19 }}>
            Scans live deals and active members, scores market fit, role fit, buy-box fit, asset fit, strategy fit, deal needs, photos, AI summaries, and margin signals.
          </p>
          <button type="button" onClick={generateSmartAlerts} style={goldBtn} disabled={busy}>
            {busy ? "Generating..." : "Generate Smart Alerts"}
          </button>
        </section>

        {engineResult && (
          <section style={hero}>
            <div style={greenEyebrow}>Smart Engine Complete</div>
            <h2 style={{ fontSize: 36, margin: "0 0 10px" }}>
              {asNumber(engineResult.created || engineResult.created_count || engineResult.alerts_created)} alerts created
            </h2>
            <p style={{ ...muted, fontSize: 19 }}>
              Done. VaultForge scanned live deals and active member profiles.
            </p>
          </section>
        )}

        {toast && (
          <section
            style={{
              ...hero,
              color:
                toast.toLowerCase().includes("could not") ||
                toast.toLowerCase().includes("cannot") ||
                toast.toLowerCase().includes("failed") ||
                toast.toLowerCase().includes("error")
                  ? "#ffd0d0"
                  : "#9df3bf",
            }}
          >
            <strong>{toast}</strong>
          </section>
        )}

        <section style={statGrid}>
          <StatCard label="Total Alerts" value={visibleAlerts.length} />
          <StatCard label="Unread" value={unreadCount} />
          <StatCard label="Read/Dismissed" value={readCount} />
          <StatCard label="Capital Match" value={capitalCount} />
          <StatCard label="Buyer Match" value={buyerCount} />
        </section>

        {status && (
          <section style={hero}>
            <strong>{status}</strong>
          </section>
        )}

        {!status && visibleAlerts.length === 0 && (
          <section style={hero}>
            <strong>No alerts yet.</strong>
          </section>
        )}

        {visibleAlerts.map((item, index) => {
          const id = alertId(item);
          const dId = dealId(item);
          const score = confidence(item);
          const type = alertType(item);
          const read = isRead(item);
          const reasons = reasonList(item);
          const dealHref = dId ? `/deal/${encodeURIComponent(dId)}` : "/projects";

          return (
            <section key={`${id || index}-${dId || "alert"}`} style={card}>
              <div style={chip}>
                {type} · {score >= 100 ? "High-Confidence Match" : "Smart Match"} · {score || 0}
              </div>

              <div style={{ ...eyebrow, marginTop: 14 }}>{type}</div>

              <h2 style={{ fontSize: "clamp(32px,7vw,52px)", lineHeight: 1, margin: "0 0 16px" }}>
                {alertTitle(item)}
              </h2>

              <p style={{ ...muted, fontSize: 21 }}>
                {alertBody(item)}
              </p>

              {score > 0 && (
                <div
                  style={{
                    border: "1px solid rgba(255,255,255,.12)",
                    borderRadius: 18,
                    background: "linear-gradient(145deg, rgba(0,0,0,.28), rgba(181,92,255,.08))",
                    padding: 16,
                    marginTop: 18,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                    <strong style={{ color: "#9df3bf", letterSpacing: 4 }}>CONFIDENCE</strong>
                    <strong style={{ color: "#f5d978" }}>{score >= 100 ? "High" : "Active"} · {score}</strong>
                  </div>
                  <div style={{ height: 13, borderRadius: 999, background: "rgba(255,255,255,.10)", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, Math.max(5, score))}%`,
                        background: "linear-gradient(90deg,#9df3bf,#f5d978)",
                      }}
                    />
                  </div>
                </div>
              )}

              {reasons.length > 0 && (
                <div
                  style={{
                    border: "1px solid rgba(232,196,107,.25)",
                    borderRadius: 20,
                    background: "linear-gradient(145deg, rgba(232,196,107,.14), rgba(181,92,255,.08))",
                    padding: 16,
                    marginTop: 18,
                  }}
                >
                  <div style={eyebrow}>Why This Matched</div>
                  {reasons.map((reason) => (
                    <span key={reason} style={chip}>{reason}</span>
                  ))}
                </div>
              )}

              <p style={{ ...muted, marginTop: 18 }}>
                {first(item.created_at, item.inserted_at) ? new Date(first(item.created_at, item.inserted_at)).toLocaleString() : ""}
              </p>

              <div className="vf-alert-actions" style={{ marginTop: 16 }}>
                <Link href={dealHref} style={btn}>Open Deal Room</Link>

                <button type="button" style={goldBtn} onClick={() => saveToBucket(item)}>
                  Save to Buy Bucket
                </button>

                {memberEmail(item) && (
                  <a href={`mailto:${memberEmail(item)}`} style={ghost}>
                    Message Member
                  </a>
                )}

                {!read && (
                  <button type="button" style={ghost} onClick={() => alertAction(item, "read")}>
                    Mark Read
                  </button>
                )}

                <button type="button" style={danger} onClick={() => alertAction(item, "dismissed")}>
                  Dismiss
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}