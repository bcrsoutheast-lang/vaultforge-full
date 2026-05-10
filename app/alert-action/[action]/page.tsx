"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../../components/VaultForgeMemberNav";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(181,92,255,.18), transparent 24%), radial-gradient(circle at bottom right, rgba(157,243,191,.13), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1000, margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.30)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.035))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 26px 80px rgba(0,0,0,.34)",
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#06100a",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  border: "none",
  margin: "7px 7px 0 0",
  minHeight: 46,
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.06)",
  margin: "7px 7px 0 0",
  minHeight: 46,
  cursor: "pointer",
};

const danger: React.CSSProperties = {
  ...ghost,
  border: "1px solid rgba(255,120,120,.38)",
  color: "#ffd0d0",
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

const label: React.CSSProperties = {
  display: "block",
  fontWeight: 950,
  margin: "0 0 8px",
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

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function getLocalEmail() {
  if (typeof window === "undefined") return "";

  try {
    return cleanEmail(
      localStorage.getItem("vf_email") ||
        sessionStorage.getItem("vf_email") ||
        ""
    );
  } catch {
    return "";
  }
}

function getParam(params: URLSearchParams, names: string[]) {
  for (const name of names) {
    const value = clean(params.get(name));
    if (value) return value;
  }

  return "";
}

function normalizedAction(action: string) {
  return clean(action).replace(/-/g, "_").toLowerCase();
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    save: "Save Alert",
    interested: "Interested",
    need_more_info: "Need More Info",
    request_intro: "Request Intro",
    archive: "Archive Alert",
    dismiss: "Dismiss Alert",
    resolve: "Mark Resolved",
    delete: "Delete Alert",
  };

  return map[normalizedAction(action)] || action.replace(/[-_]/g, " ");
}

function defaultMessage(action: string) {
  const a = normalizedAction(action);

  if (a === "need_more_info") {
    return "I need more information about this opportunity. Please provide details on price, address/location, timeline, photos, contact release, access notes, and next steps.";
  }

  if (a === "interested") {
    return "I am interested in this opportunity. Please route me into the next step and let me know what is needed to move forward.";
  }

  if (a === "request_intro") {
    return "Please request a controlled introduction for this opportunity. I understand contact details should stay gated until approved.";
  }

  if (a === "save") {
    return "Save this alert to my VaultForge activity and keep it visible for follow-up.";
  }

  if (a === "archive") return "Archive this alert from my active view.";
  if (a === "dismiss") return "Dismiss this alert from my active view.";
  if (a === "resolve") return "Mark this alert resolved.";
  if (a === "delete") return "Delete or remove this alert from the owner/admin view.";

  return "Record this alert action.";
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function AlertActionPage({ params }: { params: { action: string } }) {
  const action = normalizedAction(params.action || "");
  const [email, setEmail] = useState("");
  const [signalId, setSignalId] = useState("");
  const [itemId, setItemId] = useState("");
  const [title, setTitle] = useState("VaultForge Alert");
  const [message, setMessage] = useState(defaultMessage(action));
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const currentEmail = getLocalEmail();

    setEmail(currentEmail);
    setSignalId(getParam(search, ["signal_id", "alert_id"]));
    setItemId(getParam(search, ["item_id", "deal_id", "project_id", "pain_id"]));
    setTitle(getParam(search, ["title", "alert_title", "signal_title"]) || "VaultForge Alert");

    const providedMessage = getParam(search, ["message", "note", "summary"]);
    if (providedMessage) setMessage(providedMessage);
  }, [action]);

  const owner = email === OWNER_EMAIL;
  const ownerOnly = ["delete", "resolve"].includes(action);

  const canSubmit = useMemo(() => {
    if (!email.includes("@")) return false;
    if (ownerOnly && !owner) return false;
    if (!message.trim()) return false;
    return true;
  }, [email, owner, ownerOnly, message]);

  async function submit() {
    if (busy) return;

    setBusy(true);
    setStatus("");

    try {
      if (!email.includes("@")) throw new Error("Login email missing. Please log in again.");
      if (ownerOnly && !owner) throw new Error("Owner access required for this action.");

      const res = await fetch("/api/alerts/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
          "x-vf-admin": owner ? "1" : "0",
        },
        body: JSON.stringify({
          action,
          email,
          owner: owner ? "1" : "0",
          signal_id: signalId,
          item_id: itemId,
          title,
          message,
          priority: "medium",
          alert_type: "routing",
          source: "alert_action_page",
          owner_email: OWNER_EMAIL,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Alert action failed.");
      }

      setSaved(true);
      setStatus(data?.message || "Alert action saved.");
    } catch (error: any) {
      setStatus(error?.message || "Alert action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        textarea::placeholder,
        input::placeholder {
          color: rgba(255,255,255,.48);
        }

        @media (max-width: 760px) {
          a,
          button {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav title="Alert Action" subtitle="Controlled alert workflow" />

        <section style={card}>
          <div style={eyebrow}>VaultForge Alert Workflow</div>
          <h1 style={{ fontSize: "clamp(54px,12vw,98px)", lineHeight: 0.9, margin: "0 0 18px" }}>
            {actionLabel(action)}.
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            Use this form to record what you need, request the next step, or control the alert without exposing private contact information.
          </p>

          <div>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            {signalId && <span style={chip}>Signal: {signalId}</span>}
            {itemId && <span style={chip}>Item: {itemId}</span>}
            <span style={chip}>{owner ? "Owner View" : "Member View"}</span>
            {ownerOnly && <span style={chip}>Owner-only action</span>}
          </div>

          <Link href="/alerts" style={ghost}>Back to Alerts</Link>
          {signalId && <Link href={`/signals/${encodeURIComponent(signalId)}`} style={ghost}>Open Signal</Link>}
          {signalId && <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={ghost}>Routing Room</Link>}
          {itemId && <Link href={`/deal-room/${encodeURIComponent(itemId)}`} style={ghost}>Work Area</Link>}
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/logout" style={danger}>Logout</Link>
        </section>

        {status && (
          <section
            style={{
              ...card,
              color:
                status.toLowerCase().includes("failed") ||
                status.toLowerCase().includes("missing") ||
                status.toLowerCase().includes("required")
                  ? "#ffd0d0"
                  : "#9df3bf",
            }}
          >
            <strong>{status}</strong>
          </section>
        )}

        <section style={card}>
          <div style={eyebrow}>Action Details</div>

          <div style={{ marginBottom: 18 }}>
            <label style={label}>Alert / Opportunity Title</label>
            <input value={title} onChange={(event) => setTitle(event.target.value)} style={input} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
            <div>
              <label style={label}>Signal ID</label>
              <input value={signalId} onChange={(event) => setSignalId(event.target.value)} placeholder="signal id" style={input} />
            </div>
            <div>
              <label style={label}>Work / Deal / Pain ID</label>
              <input value={itemId} onChange={(event) => setItemId(event.target.value)} placeholder="item id" style={input} />
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={label}>
              {action === "need_more_info"
                ? "What information do you need?"
                : action === "request_intro"
                ? "Who/what do you want routed into?"
                : "Notes / Next Step"}
            </label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write the exact information needed..."
              style={{ ...input, minHeight: 220, lineHeight: 1.5 }}
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || busy || saved}
            style={{
              ...btn,
              width: "100%",
              marginTop: 18,
              opacity: !canSubmit || busy || saved ? 0.58 : 1,
            }}
          >
            {saved ? "Action Saved" : busy ? "Saving..." : `Submit ${actionLabel(action)}`}
          </button>
        </section>

        <section style={{ ...card, borderColor: "rgba(157,243,191,.22)" }}>
          <div style={eyebrow}>Current Safety Mode</div>
          <p style={muted}>
            This workflow records alert action intent and keeps private contact release controlled. Owner-only actions remain blocked for regular members.
          </p>
        </section>
      </div>
    </main>
  );
}
