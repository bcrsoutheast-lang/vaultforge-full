"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../../components/VaultForgeMemberNav";
import {
  VaultForgePulseStrip,
  VaultForgeCommandFooter,
} from "../../components/VaultForgeVisualLayer";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type AnyRow = Record<string, any>;

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
  const urlEmail = cleanEmail(url.searchParams.get("from") || url.searchParams.get("email"));
  if (urlEmail.includes("@")) return urlEmail;

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const value = cleanEmail(window.localStorage.getItem(key) || window.sessionStorage.getItem(key));
    if (value.includes("@")) return value;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

function isOwnerSession(email: string) {
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

function ownerEmailOf(row: AnyRow | null | undefined) {
  const metadata = typeof row?.metadata === "object" && row?.metadata ? row.metadata : {};

  return cleanEmail(
    first(
      row?.owner_email,
      row?.submitted_by,
      row?.created_by_email,
      row?.creator_email,
      row?.user_email,
      row?.member_email,
      row?.email,
      row?.from_email,
      metadata.owner_email,
      metadata.submitted_by,
      metadata.created_by_email,
      metadata.creator_email,
      metadata.user_email,
      metadata.member_email,
      metadata.email
    )
  );
}

function titleOf(row: AnyRow | null | undefined, fallback: string) {
  return first(row?.title, row?.signal_title, row?.headline, row?.pain_label, row?.name, fallback);
}

function noteOf(row: AnyRow | null | undefined) {
  return first(row?.note, row?.notes, row?.summary, row?.description, row?.message, row?.route_summary);
}

function buildThreadId(signalId: string, itemId: string, fromEmail: string, toEmail: string) {
  const basis = first(signalId, itemId, "general");
  const safeBasis = basis.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  const safeFrom = fromEmail.replace(/[^a-zA-Z0-9]/g, "").slice(0, 18);
  const safeTo = toEmail.replace(/[^a-zA-Z0-9]/g, "").slice(0, 18);
  return `thread_${safeBasis}_${safeFrom}_${safeTo}`;
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
  width: "min(1120px,100%)",
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 30,
  padding: 24,
  background:
    "linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.026))",
  boxShadow: "0 28px 90px rgba(0,0,0,.38)",
  marginBottom: 16,
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 26,
  padding: 22,
  background:
    "linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.026))",
  boxShadow: "0 20px 70px rgba(0,0,0,.25)",
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

const subtitle: React.CSSProperties = {
  color: "#cbd5e1",
  fontSize: 18,
  lineHeight: 1.55,
  maxWidth: 780,
  margin: "16px 0 0",
};

const chip: React.CSSProperties = {
  color: "#e5e7eb",
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.055)",
  borderRadius: 999,
  padding: "8px 10px",
  fontSize: 12,
  fontWeight: 850,
  display: "inline-flex",
  margin: "0 8px 8px 0",
};

const goldChip: React.CSSProperties = {
  ...chip,
  color: "#101010",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  border: "1px solid rgba(232,196,107,.7)",
  fontWeight: 950,
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 56,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.07)",
  color: "white",
  padding: "0 16px",
  fontSize: 16,
  outline: "none",
};

const textarea: React.CSSProperties = {
  ...input,
  minHeight: 170,
  padding: 16,
  resize: "vertical",
};

const primaryAction: React.CSSProperties = {
  color: "#101010",
  textDecoration: "none",
  borderRadius: 15,
  padding: "12px 15px",
  minHeight: 46,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 950,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  border: "1px solid rgba(232,196,107,.7)",
  cursor: "pointer",
};

const secondaryAction: React.CSSProperties = {
  color: "#fff",
  textDecoration: "none",
  borderRadius: 15,
  padding: "12px 15px",
  minHeight: 46,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 850,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.055)",
  cursor: "pointer",
};

const dangerAction: React.CSSProperties = {
  ...secondaryAction,
  color: "#fecaca",
  border: "1px solid rgba(239,68,68,.34)",
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
};

export default function NewMessagePage() {
  const [fromEmail, setFromEmail] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [resolvedOwnerEmail, setResolvedOwnerEmail] = useState("");
  const [fallbackRecipient, setFallbackRecipient] = useState("");
  const [subject, setSubject] = useState("VaultForge signal follow-up");
  const [body, setBody] = useState("I need more information about this VaultForge signal/opportunity.");
  const [signalId, setSignalId] = useState("");
  const [itemId, setItemId] = useState("");
  const [status, setStatus] = useState("Draft");
  const [contextTitle, setContextTitle] = useState("VaultForge signal/opportunity");
  const [contextNote, setContextNote] = useState("");
  const [loadingContext, setLoadingContext] = useState(true);
  const [sending, setSending] = useState(false);

  async function resolveContext() {
    setLoadingContext(true);

    const activeEmail = getEmail();
    const url = new URL(window.location.href);

    const urlSignalId = clean(url.searchParams.get("signal_id") || url.searchParams.get("signalId"));
    const urlItemId = clean(url.searchParams.get("item_id") || url.searchParams.get("itemId") || url.searchParams.get("deal_id") || url.searchParams.get("project_id"));
    const urlRecipient = cleanEmail(
      url.searchParams.get("recipient") ||
        url.searchParams.get("to") ||
        url.searchParams.get("owner_email") ||
        url.searchParams.get("member_email")
    );

    const urlSubject = clean(url.searchParams.get("subject"));
    const urlBody = clean(url.searchParams.get("body") || url.searchParams.get("message"));

    setFromEmail(activeEmail);
    setSignalId(urlSignalId);
    setItemId(urlItemId);
    setFallbackRecipient(urlRecipient);

    if (urlSubject) setSubject(urlSubject);
    if (urlBody) setBody(urlBody);

    let detectedOwner = "";
    let detectedTitle = "";
    let detectedNote = "";

    try {
      if (urlSignalId) {
        const query = new URLSearchParams();
        if (activeEmail) query.set("email", activeEmail);
        if (isOwnerSession(activeEmail)) query.set("owner", "1");

        const res = await fetch(`/api/signals/${encodeURIComponent(urlSignalId)}?${query.toString()}`, {
          cache: "no-store",
          headers: {
            "x-vf-email": activeEmail,
            "x-vf-admin": isOwnerSession(activeEmail) ? "1" : "0",
          },
        });

        const json = await safeJson(res);
        const signal = json?.signal || json?.item || null;

        detectedOwner = ownerEmailOf(signal);
        detectedTitle = titleOf(signal, detectedTitle);
        detectedNote = noteOf(signal);
      }
    } catch {
      // Context lookup is best effort. URL fields and fallback recipient still work.
    }

    const finalRecipient =
      detectedOwner ||
      (urlRecipient && urlRecipient !== OWNER_EMAIL ? urlRecipient : "") ||
      urlRecipient ||
      OWNER_EMAIL;

    setResolvedOwnerEmail(detectedOwner);
    setRecipientEmail(finalRecipient);
    setContextTitle(detectedTitle || urlSubject || "VaultForge signal/opportunity");
    setContextNote(detectedNote);
    setLoadingContext(false);
  }

  useEffect(() => {
    resolveContext();
  }, []);

  const isSelfMessage = useMemo(() => {
    return fromEmail && recipientEmail && cleanEmail(fromEmail) === cleanEmail(recipientEmail);
  }, [fromEmail, recipientEmail]);

  const recipientSource = useMemo(() => {
    if (resolvedOwnerEmail) return "Actual signal/item owner";
    if (fallbackRecipient && fallbackRecipient !== OWNER_EMAIL) return "URL-provided recipient";
    if (fallbackRecipient === OWNER_EMAIL) return "Admin fallback from old link";
    return "Admin fallback";
  }, [resolvedOwnerEmail, fallbackRecipient]);

  async function sendMessage() {
    const from = cleanEmail(fromEmail);
    const to = cleanEmail(recipientEmail);
    const text = clean(body);

    if (!from) {
      setStatus("Login email not detected. Please log in again.");
      return;
    }

    if (!to) {
      setStatus("Recipient missing. Open this from a signal, pain, project, or owner card.");
      return;
    }

    if (!text) {
      setStatus("Write a message first.");
      return;
    }

    setSending(true);
    setStatus("Saving message request...");

    try {
      const threadId = buildThreadId(signalId, itemId, from, to);

      const res = await fetch("/api/messages/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": from,
          "x-vf-admin": isOwnerSession(from) ? "1" : "0",
        },
        body: JSON.stringify({
          from_email: from,
          sender_email: from,
          to_email: to,
          recipient_email: to,
          subject,
          body: text,
          message: text,
          signal_id: signalId,
          item_id: itemId,
          thread_id: threadId,
          source: "message_owner_request",
          context_title: contextTitle,
          context_note: contextNote,
          recipient_source: recipientSource,
        }),
      });

      const json = await safeJson(res);

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || json?.details || "Message request could not be saved.");
      }

      const nextThread = clean(json.thread_id || json.threadId || threadId);
      setStatus("Message request saved.");
      if (nextThread && typeof window !== "undefined") {
        window.location.href = `/messages/${encodeURIComponent(nextThread)}`;
      }
    } catch (error: any) {
      setStatus(error?.message || "Message request could not be saved.");
    } finally {
      setSending(false);
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

        input::placeholder,
        textarea::placeholder {
          color: rgba(255,255,255,.42);
        }

        @media (max-width: 820px) {
          .vf-two-grid,
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
            margin: 0 !important;
          }
        }
      `}</style>

      <section style={shell}>
        <VaultForgeMemberNav title="Message Owner" subtitle="Controlled owner/member communication before private contact is released." />

        <VaultForgePulseStrip
          items={[
            { label: "MESSAGE", value: "CONTROLLED", tone: "gold" },
            { label: "OWNER", value: recipientSource, tone: resolvedOwnerEmail ? "green" : "silver" },
            { label: "SIGNAL", value: signalId || "GENERAL", tone: "blue" },
            { label: "PRIVACY", value: "GATED", tone: "gold" },
          ]}
        />

        <section style={hero}>
          <p style={eyebrow}>VAULTFORGE CONTROLLED CONNECTION</p>
          <h1 style={title}>Request connection.</h1>
          <p style={subtitle}>
            Message the actual signal, pain, or project owner when ownership is detected. Admin/BCR is fallback only when no owner is available.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>From: {fromEmail || "not detected"}</span>
            <span style={resolvedOwnerEmail ? goldChip : chip}>To: {recipientEmail || "resolving..."}</span>
            {signalId ? <span style={chip}>Signal: {signalId}</span> : null}
            {itemId ? <span style={chip}>Item: {itemId}</span> : null}
            <span style={chip}>{loadingContext ? "Resolving owner..." : recipientSource}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            <Link href="/signals" style={secondaryAction}>Signals</Link>
            <Link href="/messages" style={secondaryAction}>All Messages</Link>
            <Link href="/dashboard" style={secondaryAction}>Dashboard</Link>
            <Link href="/alerts" style={secondaryAction}>Alerts</Link>
            <Link href="/logout" style={dangerAction}>Logout</Link>
          </div>
        </section>

        {isSelfMessage ? (
          <section
            style={{
              ...panel,
              borderColor: "rgba(232,196,107,.5)",
              background: "linear-gradient(135deg,rgba(232,196,107,.11),rgba(255,255,255,.03))",
            }}
          >
            <p style={eyebrow}>OWNER DETECTED</p>
            <h2 style={{ margin: "0 0 10px", fontSize: 28 }}>You appear to own this signal.</h2>
            <p style={muted}>
              The recipient now matches the actual submitter/owner instead of defaulting to BCR. If another member opens this same signal, their request should route to this owner.
            </p>
          </section>
        ) : null}

        <section style={panel}>
          <p style={eyebrow}>Connection Details</p>

          <div className="vf-two-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16 }}>
            <label>
              <strong>Your Email</strong>
              <input value={fromEmail} onChange={(event) => setFromEmail(event.target.value)} style={{ ...input, marginTop: 8 }} />
            </label>

            <label>
              <strong>Recipient Email</strong>
              <input value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} style={{ ...input, marginTop: 8 }} />
            </label>
          </div>

          <label style={{ display: "block", marginTop: 16 }}>
            <strong>Subject</strong>
            <input value={subject} onChange={(event) => setSubject(event.target.value)} style={{ ...input, marginTop: 8 }} />
          </label>

          <label style={{ display: "block", marginTop: 16 }}>
            <strong>What information do you need?</strong>
            <textarea value={body} onChange={(event) => setBody(event.target.value)} style={{ ...textarea, marginTop: 8 }} />
          </label>

          <button type="button" onClick={sendMessage} disabled={sending || loadingContext} style={{ ...primaryAction, width: "100%", marginTop: 18 }}>
            {sending ? "Saving..." : isSelfMessage ? "Save Owner Message / Note" : "Send Connection Request"}
          </button>

          {status ? <p style={{ ...muted, marginTop: 14 }}>{status}</p> : null}
        </section>

        <section style={panel}>
          <p style={eyebrow}>Context</p>
          <h2 style={{ margin: "0 0 10px", fontSize: 28 }}>{contextTitle}</h2>
          <p style={muted}>{contextNote || "Context is resolved from the signal/item when available. Links created before owner standardization may still pass BCR as fallback."}</p>

          <div style={{ marginTop: 14 }}>
            <span style={chip}>Resolved owner: {resolvedOwnerEmail || "not found"}</span>
            <span style={chip}>Fallback recipient: {fallbackRecipient || "none"}</span>
            <span style={chip}>Final recipient: {recipientEmail || "none"}</span>
          </div>
        </section>

        <section style={panel}>
          <p style={eyebrow}>Current Safety Mode</p>
          <p style={muted}>
            This page records a controlled message request. It does not automatically release private phone numbers, emails, addresses, or direct contact details outside VaultForge.
          </p>
        </section>

        <VaultForgeCommandFooter />
      </section>
    </main>
  );
}
